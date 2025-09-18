// API base URL
const API_BASE_URL = 'https://68c4d0e2a712aaca2b673807.mockapi.io/api/v1/Welding_arm';

class DeviceAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.robotId = null; // Lo determinaremos dinámicamente
    }

    async initialize() {
        try {
            // Primero intentamos obtener los dispositivos existentes
            const devices = await this.getDevices();
            
            // Buscamos un dispositivo de tipo robot_arm
            const robotArm = devices.find(device => device.type === 'robot_arm');
            
            if (robotArm) {
                this.robotId = robotArm.id;
                console.log('Robot arm encontrado con ID:', this.robotId);
            } else {
                // Si no existe, creamos uno
                console.log('Creando nuevo brazo robot...');
                const newRobot = await this.createDevice({
                    name: "Brazo Robot Principal",
                    type: "robot_arm",
                    status: "off",
                    position_x: 0,
                    position_y: 0,
                    position_z: 0,
                    emergency_stop: false,
                    welding_active: false
                });
                this.robotId = newRobot.id;
                console.log('Nuevo brazo robot creado con ID:', this.robotId);
            }
            
            return true;
        } catch (error) {
            console.error('Error inicializando API:', error);
            // Usar ID por defecto para desarrollo
            this.robotId = "1";
            return false;
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
        
        return last10Records;
    } catch (error) {
        console.error('Error en getDeviceHistory:', error);
        // Datos de ejemplo para demostración
        return [
            {id: "1", name: "Brazo Soldador Principal", type: "robot_arm", status: "off", position_x: 0, position_y: 0, position_z: 0, emergency_stop: false, welding_active: false, last_update: new Date().toISOString()},
            {id: "2", name: "Ventilador de Extracción", type: "fan", status: "idle", last_update: new Date().toISOString()},
            {id: "3", name: "Banda Transportadora", type: "conveyor", status: "off", last_update: new Date().toISOString()}
        ];
    }
}

    async getDevices() {
        try {
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const devices = await response.json();
            return Array.isArray(devices) ? devices : [devices];
        } catch (error) {
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
            const response = await fetch(`${this.baseURL}/${id}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Error en getDevice:', error);
            // Datos de ejemplo para demostración
            return {
                id: id,
                name: "Dispositivo Ejemplo",
                type: "robot_arm",
                status: "off",
                position_x: 0,
                position_y: 0,
                position_z: 0,
                emergency_stop: false,
                welding_active: false,
                last_update: new Date().toISOString()
            };
        }
    }

    async getRobotStatus() {
        try {
            if (!this.robotId) {
                await this.initialize();
            }
            
            const response = await fetch(`${this.baseURL}/${this.robotId}`);
            if (!response.ok) throw new Error('Error al obtener estado del robot');
            
            const robotData = await response.json();
            return robotData;
        } catch (error) {
            console.error('Error obteniendo estado del robot:', error);
            // Datos de ejemplo para demostración
            return {
                id: this.robotId || "1",
                name: "Brazo Robot Principal",
                type: "robot_arm",
                status: "off",
                position_x: 0,
                position_y: 0,
                position_z: 0,
                emergency_stop: false,
                welding_active: false,
                last_update: new Date().toISOString()
            };
        }
    }

    async updateRobot(updates) {
        try {
            if (!this.robotId) {
                await this.initialize();
            }
            
            // Primero obtenemos el estado actual
            const currentData = await this.getRobotStatus();
            
            const response = await fetch(`${this.baseURL}/${this.robotId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...currentData,
                    ...updates,
                    last_update: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Error al actualizar robot');

            const updatedData = await response.json();
            this.logEvent('Robot actualizado: ' + JSON.stringify(updates));
            return updatedData;
        } catch (error) {
            console.error('Error actualizando robot:', error);
            this.logEvent('Error actualizando robot: ' + error.message, 'error');
            
            // Simular actualización para demostración
            const currentData = await this.getRobotStatus();
            return {...currentData, ...updates, last_update: new Date().toISOString()};
        }
    }

    async createDevice(deviceData) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...deviceData,
                    last_update: new Date().toISOString()
                })
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Error en createDevice:', error);
            // Simular creación exitosa para demostración
            return {...deviceData, id: Date.now().toString(), last_update: new Date().toISOString()};
        }
    }

    async updateDevice(id, deviceData) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...deviceData,
                    last_update: new Date().toISOString()
                })
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Error en updateDevice:', error);
            // Simular actualización exitosa para demostración
            return {...deviceData, id, last_update: new Date().toISOString()};
        }
    }

    async deleteDevice(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return {id, deleted: true};
        } catch (error) {
            console.error('Error en deleteDevice:', error);
            // Simular eliminación exitosa para demostración
            return {id, deleted: true};
        }
    }

    logEvent(message, type = 'info') {
        const logElement = document.getElementById('event-log');
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-${type}">${message}</span>`;
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
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
window.robotAPI = new DeviceAPI();