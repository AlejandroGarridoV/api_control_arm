class MonitoringManager {
    constructor(api) {
        this.api = api;
        this.initializeMonitoring();
    }

    async initializeMonitoring() {
        await this.loadDevicesStatus();
        this.startAutoRefresh();
    }

    async loadDevicesStatus() {
        try {
            const devices = await this.api.getDevices();
            this.renderStatusCards(devices);
            
            // Cargar historial para cada dispositivo
            for (const device of devices) {
                await this.loadDeviceHistory(device);
            }
        } catch (error) {
            console.error('Error cargando estado de dispositivos:', error);
        }
    }

    renderStatusCards(devices) {
        const container = document.getElementById('devices-status-cards');
        container.innerHTML = '';
        
        const statusMap = {
            'off': { text: 'Apagado', class: 'status-off' },
            'on': { text: 'Encendido', class: 'status-on' },
            'idle': { text: 'En espera', class: 'status-idle' },
            'moving': { text: 'Moviéndose', class: 'status-warning' },
            'welding': { text: 'Soldando', class: 'status-warning' },
            'emergency': { text: 'Emergencia', class: 'status-off' }
        };
        
        const typeIcons = {
            'robot_arm': '🤖',
            'fan': '💨',
            'conveyor': '📦'
        };
        
        const typeNames = {
            'robot_arm': 'Brazo Robot',
            'fan': 'Ventilador',
            'conveyor': 'Banda Transportadora'
        };

        devices.forEach(device => {
            const statusInfo = statusMap[device.status] || { text: device.status, class: 'status-off' };
            const icon = typeIcons[device.type] || '📱';
            const typeName = typeNames[device.type] || device.type;
            
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-3';
            card.innerHTML = `
                <div class="card status-card ${statusInfo.class} text-white">
                    <div class="card-body text-center">
                        <h3>${icon}</h3>
                        <h5 class="card-title">${device.name}</h5>
                        <p class="card-text">${typeName}</p>
                        <div class="status-badge">${statusInfo.text}</div>
                        <p class="mt-2 small">Actualizado: ${new Date(device.last_update).toLocaleTimeString()}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    async loadDeviceHistory(device) {
        try {
            const history = await this.api.getStatusHistory(device.id, 10);
            this.renderDeviceHistory(device, history);
        } catch (error) {
            console.error(`Error cargando historial para ${device.name}:`, error);
        }
    }

    renderDeviceHistory(device, history) {
        const container = document.getElementById('status-tables');
        
        const tableSection = document.createElement('div');
        tableSection.className = 'mb-4';
        tableSection.innerHTML = `
            <h4>${device.name} - Últimos 10 estados</h4>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Timestamp</th>
                            <th>Estado</th>
                            <th>Datos Adicionales</th>
                        </tr>
                    </thead>
                    <tbody id="history-${device.id}">
                        <!-- Los registros se cargarán aquí -->
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(tableSection);
        
        const tbody = document.getElementById(`history-${device.id}`);
        tbody.innerHTML = '';
        
        const statusMap = {
            'off': { text: 'Apagado', class: 'badge bg-secondary' },
            'on': { text: 'Encendido', class: 'badge bg-success' },
            'idle': { text: 'En espera', class: 'badge bg-info' },
            'moving': { text: 'Moviéndose', class: 'badge bg-warning' },
            'welding': { text: 'Soldando', class: 'badge bg-orange' },
            'emergency': { text: 'Emergencia', class: 'badge bg-danger' }
        };
        
        history.forEach(record => {
            const statusInfo = statusMap[record.status] || { text: record.status, class: 'badge bg-secondary' };
            const dataText = record.data ? JSON.stringify(record.data) : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td><span class="${statusInfo.class}">${statusInfo.text}</span></td>
                <td><small>${dataText}</small></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    startAutoRefresh() {
        // Actualizar cada 2 segundos
        setInterval(() => {
            this.loadDevicesStatus();
        }, 2000);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const monitoringManager = new MonitoringManager(iotAPI);
    window.monitoringManager = monitoringManager;
});