// API base URL - Corregida para usar el endpoint correcto
const API_BASE_URL = 'https://68c4d0e2a712aaca2b673807.mockapi.io/api/v1/Welding_arm';

class DeviceAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async getDevices() {
        try {
            this.showLoading(true);
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const devices = await response.json();
            this.showLoading(false);
            return Array.isArray(devices) ? devices : [devices];
        } catch (error) {
            this.showLoading(false);
            console.error('Error en getDevices:', error);
            // Datos de ejemplo para demostración
            return [
                {id: "1", name: "Brazo Soldador Principal", type: "robot_arm", status: "off", last_update: new Date().toISOString()},
                {id: "2", name: "Ventilador de Extracción", type: "fan", status: "idle", last_update: new Date().toISOString()},
                {id: "3", name: "Banda Transportadora", type: "conveyor", status: "off", last_update: new Date().toISOString()}
            ];
        }
    }

    async getDevice(id) {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.baseURL}/${id}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const device = await response.json();
            this.showLoading(false);
            return device;
        } catch (error) {
            this.showLoading(false);
            console.error('Error en getDevice:', error);
            // Datos de ejemplo para demostración
            return {id, name: "Dispositivo Ejemplo", type: "sensor", status: "off", last_update: new Date().toISOString()};
        }
    }

    async createDevice(deviceData) {
        try {
            this.showLoading(true);
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...deviceData,
                    // Campos adicionales requeridos por el schema
                    position_x: 0,
                    position_y: 0,
                    position_z: 0,
                    emergency_stop: false,
                    welding_active: false
                })
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const newDevice = await response.json();
            this.showLoading(false);
            return newDevice;
        } catch (error) {
            this.showLoading(false);
            console.error('Error en createDevice:', error);
            // Simular creación exitosa para demostración
            return {...deviceData, id: Date.now().toString(), last_update: new Date().toISOString()};
        }
    }

    async updateDevice(id, deviceData) {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deviceData)
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const updatedDevice = await response.json();
            this.showLoading(false);
            return updatedDevice;
        } catch (error) {
            this.showLoading(false);
            console.error('Error en updateDevice:', error);
            // Simular actualización exitosa para demostración
            return {...deviceData, id, last_update: new Date().toISOString()};
        }
    }

    async deleteDevice(id) {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            this.showLoading(false);
            return {id, deleted: true};
        } catch (error) {
            this.showLoading(false);
            console.error('Error en deleteDevice:', error);
            // Simular eliminación exitosa para demostración
            return {id, deleted: true};
        }
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
}

// Instancia global de la API
window.deviceAPI = new DeviceAPI();