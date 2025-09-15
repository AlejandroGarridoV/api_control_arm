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
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadDevices());
    }

    async loadDevices() {
        try {
            const devices = await this.api.getDevices();
            this.renderDevicesTable(devices);
        } catch (error) {
            console.error('Error cargando dispositivos:', error);
            this.showError('Error al cargar los dispositivos. Mostrando datos de ejemplo.');
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
                    <button class="btn btn-sm btn-primary btn-action edit-device" data-id="${device.id}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-action delete-device" data-id="${device.id}">Eliminar</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Agregar eventos a los botones
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
            const device = await this.api.getDevice(id);
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
            await this.api.deleteDevice(id);
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
            if (this.currentEditingId) {
                await this.api.updateDevice(this.currentEditingId, deviceData);
                this.showSuccess('Dispositivo actualizado correctamente.');
            } else {
                await this.api.createDevice(deviceData);
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

    showSuccess(message) {
        // Crear y mostrar un mensaje de éxito
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
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
    const adminManager = new AdminManager(deviceAPI);
    window.adminManager = adminManager;
});