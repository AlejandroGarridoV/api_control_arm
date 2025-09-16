// API base URL - Usando la API real proporcionada
const API_BASE_URL = 'https://68c4d0e2a712aaca2b673807.mockapi.io/api/v1/Welding_arm';

class DeviceAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.history = []; // Almacenar el historial real
    }

    async getDevices() {
        try {
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const devices = await response.json();
            
            // Si la API devuelve un solo objeto, lo convertimos en array
            return Array.isArray(devices) ? devices : [devices];
        } catch (error) {
            console.error('Error en getDevices:', error);
            throw error;
        }
    }

    async getDeviceHistory() {
        try {
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const devices = await response.json();
            
            // Convertir a array si es necesario
            const devicesArray = Array.isArray(devices) ? devices : [devices];
            
            // Ordenar por última actualización (más reciente primero)
            const sortedDevices = devicesArray.sort((a, b) => {
                return new Date(b.last_update) - new Date(a.last_update);
            });
            
            // Tomar los últimos 10 registros
            const last10Records = sortedDevices.slice(0, 10);
            
            // Guardar en el historial
            this.history = last10Records;
            
            return last10Records;
        } catch (error) {
            console.error('Error en getDeviceHistory:', error);
            throw error;
        }
    }

    async getDevice(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Error en getDevice:', error);
            throw error;
        }
    }
}

// Clase MonitoringManager
class MonitoringManager {
    constructor(api) {
        this.api = api;
        this.intervalId = null;
        this.initializeMonitoring();
    }

    async initializeMonitoring() {
        await this.loadDevicesStatus();
        await this.loadDeviceHistory();
        this.startAutoRefresh();
    }

    async loadDevicesStatus() {
        try {
            const devices = await this.api.getDevices();
            this.renderStatusCards(devices);
            
            // Actualizar la marca de tiempo de la última actualización
            document.getElementById('last-update').textContent = 
                `Última actualización: ${new Date().toLocaleTimeString()}`;
        } catch (error) {
            console.error('Error cargando estado de dispositivos:', error);
            this.showError('Error al cargar los dispositivos. Verifica la conexión.');
        }
    }

    async loadDeviceHistory() {
        try {
            const history = await this.api.getDeviceHistory();
            this.renderDeviceHistory(history);
        } catch (error) {
            console.error('Error cargando historial:', error);
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
            'conveyor': '📦',
            'sensor': '📡'
        };
        
        const typeNames = {
            'robot_arm': 'Brazo Robot',
            'fan': 'Ventilador',
            'conveyor': 'Banda Transportadora',
            'sensor': 'Sensor'
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
                        <div class="status-badge">${statusInfo.text}</span></div>
                        <p class="mt-2 small">Actualizado: ${new Date(device.last_update).toLocaleTimeString()}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    renderDeviceHistory(history) {
        const container = document.getElementById('status-tables');
        
        // Limpiar el indicador de carga
        container.innerHTML = '';
        
        // Crear tabla de historial
        const tableSection = document.createElement('div');
        tableSection.className = 'table-responsive';
        tableSection.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Posición (X,Y,Z)</th>
                        <th>Paro Emergencia</th>
                        <th>Soldando</th>
                        <th>Última Actualización</th>
                    </tr>
                </thead>
                <tbody id="history-body">
                    <!-- Los registros se cargarán aquí -->
                </tbody>
            </table>
        `;
        
        container.appendChild(tableSection);
        
        const tbody = document.getElementById('history-body');
        tbody.innerHTML = '';
        
        const statusMap = {
            'off': { text: 'Apagado', class: 'badge bg-secondary' },
            'on': { text: 'Encendido', class: 'badge bg-success' },
            'idle': { text: 'En espera', class: 'badge bg-info' },
            'moving': { text: 'Moviéndose', class: 'badge bg-warning' },
            'welding': { text: 'Soldando', class: 'badge bg-orange' },
            'emergency': { text: 'Emergencia', class: 'badge bg-danger' }
        };
        
        const typeNames = {
            'robot_arm': 'Brazo Robot',
            'fan': 'Ventilador',
            'conveyor': 'Banda Transportadora',
            'sensor': 'Sensor'
        };

        history.forEach(record => {
            const statusInfo = statusMap[record.status] || { text: record.status, class: 'badge bg-secondary' };
            const typeName = typeNames[record.type] || record.type;
            const position = `${record.position_x || 0}, ${record.position_y || 0}, ${record.position_z || 0}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${typeName}</td>
                <td><span class="${statusInfo.class}">${statusInfo.text}</span></td>
                <td>${position}</td>
                <td>${record.emergency_stop ? 'Sí' : 'No'}</td>
                <td>${record.welding_active ? 'Sí' : 'No'}</td>
                <td>${new Date(record.last_update).toLocaleString()}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Si no hay registros
        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No hay registros de historial disponibles</td>
                </tr>
            `;
        }
    }

    startAutoRefresh() {
        // Detener cualquier intervalo previo
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Actualizar cada 2 segundos
        this.intervalId = setInterval(async () => {
            await this.loadDevicesStatus();
            await this.loadDeviceHistory();
        }, 2000);
    }
    
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    showError(message) {
        // Crear y mostrar un mensaje de error
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const deviceAPI = new DeviceAPI();
    const monitoringManager = new MonitoringManager(deviceAPI);
    window.monitoringManager = monitoringManager;
    
    // Opcional: agregar control para detener/iniciar la actualización automática
    const updateIndicator = document.getElementById('last-update');
    updateIndicator.style.cursor = 'pointer';
    updateIndicator.title = 'Click para pausar/reanudar actualización automática';
    
    let autoRefreshPaused = false;
    updateIndicator.addEventListener('click', () => {
        autoRefreshPaused = !autoRefreshPaused;
        if (autoRefreshPaused) {
            monitoringManager.stopAutoRefresh();
            updateIndicator.innerHTML = '<i class="bi bi-pause-circle"></i> Actualización pausada';
        } else {
            monitoringManager.startAutoRefresh();
            updateIndicator.innerHTML = 'Actualizando...';
        }
    });
});