class AdminManager {
    constructor(api) {
        this.api = api;
        this.currentEditingId = null;
        this.initializeEvents();
        this.loadDevices();
    }

    initializeEvents() {
        document.getElementById('save-device').addEventListener('click', () => this.saveDevice());
        document.getElementById('deviceModal').addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });
        
        // Agregar evento al botón de actualizar si existe
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDevices());
        }
    }

    async loadDevices() {
        try {
            // Mostrar mensaje de carga
            this.showLoading(true);
            
            // Usar la API disponible (deviceAPI o robotAPI)
            const api = window.deviceAPI || window.robotAPI;
            if (!api) {
                throw new Error('No se encontró la API');
            }
            
            const devices = await api.getDevices();
            this.renderDevicesTable(devices);
            
            // Ocultar mensaje de carga
            this.showLoading(false);
        } catch (error) {
            console.error('Error cargando dispositivos:', error);
            this.showLoading(false);
            this.showError('Error al cargar los dispositivos. Verifica la conexión.');
            
            // Mostrar datos de ejemplo en caso de error
            const exampleData = [
                {id: "1", name: "Brazo Soldador Principal", type: "robot_arm", status: "off", last_update: new Date().toISOString()},
                {id: "2", name: "Ventilador de Extracción", type: "fan", status: "idle", last_update: new Date().toISOString()},
                {id: "3", name: "Banda Transportadora", type: "conveyor", status: "off", last_update: new Date().toISOString()}
            ];
            this.renderDevicesTable(exampleData);
        }
    }

    renderDevicesTable(devices) {
        const tableBody = document.getElementById('devices-table');
        
        if (!devices || devices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay dispositivos registrados</td></tr>';
            return;
        }
        
        tableBody.innerHTML = '';
        
        const statusMap = {
            'off': { text: 'Apagado', class: 'badge bg-secondary' },
            'idle': { text: 'En espera', class: 'badge bg-info' }
        };
        
        const typeMap = {
            'robot_arm': 'Brazo Robot',
            'fan': 'Ventilador',
            'conveyor': 'Banda Transportadora',
            'sensor': 'Sensor de Temperatura'
        };

        devices.forEach(device => {
            const statusInfo = statusMap[device.status] || { text: device.status, class: 'badge bg-secondary' };
            const typeText = typeMap[device.type] || device.type;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${device.id}</td>
                <td>${device.name}</td>
                <td>${typeText}</td>
                <td><span class="${statusInfo.class}">${statusInfo.text}</span></td>
                <td>${new Date(device.last_update).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-device" data-id="${device.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-device" data-id="${device.id}">Eliminar</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Agregar eventos a los botones de editar y eliminar
        document.querySelectorAll('.edit-device').forEach(button => {
            button.addEventListener('click', (e) => {
                const deviceId = e.target.getAttribute('data-id');
                this.editDevice(deviceId);
            });
        });
        
        document.querySelectorAll('.delete-device').forEach(button => {
            button.addEventListener('click', (e) => {
                const deviceId = e.target.getAttribute('data-id');
                this.deleteDevice(deviceId);
            });
        });
    }

    async editDevice(id) {
        try {
            // Usar la API disponible (deviceAPI o robotAPI)
            const api = window.deviceAPI || window.robotAPI;
            if (!api) {
                throw new Error('No se encontró la API');
            }
            
            const device = await api.getDevice(id);
            this.currentEditingId = id;
            
            document.getElementById('device-id').value = device.id;
            document.getElementById('device-name').value = device.name;
            document.getElementById('device-type').value = device.type;
            document.getElementById('device-status').value = device.status;
            
            document.getElementById('modalTitle').textContent = 'Editar Dispositivo';
            
            const modal = new bootstrap.Modal(document.getElementById('deviceModal'));
            modal.show();
        } catch (error) {
            console.error('Error editando dispositivo:', error);
            this.showError('Error al cargar el dispositivo para editar.');
        }
    }

    async deleteDevice(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este dispositivo?')) {
            return;
        }
        
        try {
            // Usar la API disponible (deviceAPI o robotAPI)
            const api = window.deviceAPI || window.robotAPI;
            if (!api) {
                throw new Error('No se encontró la API');
            }
            
            await api.deleteDevice(id);
            this.showSuccess('Dispositivo eliminado correctamente.');
            this.loadDevices();
        } catch (error) {
            console.error('Error eliminando dispositivo:', error);
            this.showError('Error al eliminar el dispositivo.');
        }
    }

    async saveDevice() {
        const form = document.getElementById('device-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const deviceData = {
            name: document.getElementById('device-name').value,
            type: document.getElementById('device-type').value,
            status: document.getElementById('device-status').value,
            last_update: new Date().toISOString()
        };
        
        try {
            // Usar la API disponible (deviceAPI o robotAPI)
            const api = window.deviceAPI || window.robotAPI;
            if (!api) {
                throw new Error('No se encontró la API');
            }
            
            if (this.currentEditingId) {
                await api.updateDevice(this.currentEditingId, deviceData);
                this.showSuccess('Dispositivo actualizado correctamente.');
            } else {
                await api.createDevice(deviceData);
                this.showSuccess('Dispositivo creado correctamente.');
            }
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('deviceModal'));
            modal.hide();
            
            this.loadDevices();
        } catch (error) {
            console.error('Error guardando dispositivo:', error);
            this.showError('Error al guardar el dispositivo.');
        }
    }

    resetForm() {
        document.getElementById('device-form').reset();
        document.getElementById('device-id').value = '';
        this.currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'Agregar Dispositivo';
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            if (show) {
                loadingElement.classList.remove('d-none');
            } else {
                loadingElement.classList.add('d-none');
            }
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
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            // Auto-eliminar después de 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }
    }

    showSuccess(message) {
        // Crear y mostrar un mensaje de éxito
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            // Auto-eliminar después de 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si alguna API está disponible
    const api = window.deviceAPI || window.robotAPI;
    
    if (api) {
        const adminManager = new AdminManager(api);
        window.adminManager = adminManager;
    } else {
        console.error('No se encontró ninguna API disponible');
        // Mostrar mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'Error: No se pudo conectar con el sistema. Por favor, recarga la página.';
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
});