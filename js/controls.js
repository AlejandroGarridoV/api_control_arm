class RobotControls {
    constructor(api) {
        this.api = api;
        this.devices = {}; // Almacenar información de todos los dispositivos
        this.initializeEvents();
        this.loadAllDevices();
    }

    async loadAllDevices() {
        try {
            const devices = await deviceAPI.getDevices();
            devices.forEach(device => {
                this.devices[device.id] = device;
            });
            this.updateDeviceStatusDisplay();
        } catch (error) {
            this.api.logEvent('Error cargando dispositivos: ' + error.message, 'error');
        }
    }

    initializeEvents() {
        // Encendido/Apagado Brazo
        document.getElementById('arm-power-on').addEventListener('click', () => this.powerOnDevice('1'));
        document.getElementById('arm-power-off').addEventListener('click', () => this.powerOffDevice('1'));

        // Encendido/Apagado Ventilador
        document.getElementById('fan-power-on').addEventListener('click', () => this.powerOnDevice('2'));
        document.getElementById('fan-power-off').addEventListener('click', () => this.powerOffDevice('2'));

        // Encendido/Apagado Banda Transportadora
        document.getElementById('conveyor-power-on').addEventListener('click', () => this.powerOnDevice('3'));
        document.getElementById('conveyor-power-off').addEventListener('click', () => this.powerOffDevice('3'));

        // Emergencia (afecta a todos los dispositivos)
        document.getElementById('emergency-stop').addEventListener('click', () => this.emergencyStopAll());
        document.getElementById('emergency-reset').addEventListener('click', () => this.resetEmergencyAll());

        // Movimiento (solo brazo robot)
        document.getElementById('move-to').addEventListener('click', () => this.moveToPosition());
        document.getElementById('go-home').addEventListener('click', () => this.goHome());

        // Soldadura (solo brazo robot)
        document.getElementById('start-weld').addEventListener('click', () => this.startWelding());
        document.getElementById('stop-weld').addEventListener('click', () => this.stopWelding());
    }

    async powerOnDevice(deviceId) {
        try {
            const device = this.devices[deviceId];
            if (device) {
                await deviceAPI.updateDevice(deviceId, {
                    ...device,
                    status: 'idle',
                    last_update: new Date().toISOString()
                });
                this.api.logEvent(`${device.name} encendido`);
                this.loadAllDevices(); // Recargar estados
            }
        } catch (error) {
            this.api.logEvent('Error encendiendo dispositivo: ' + error.message, 'error');
        }
    }

    async powerOffDevice(deviceId) {
        try {
            const device = this.devices[deviceId];
            if (device) {
                await deviceAPI.updateDevice(deviceId, {
                    ...device,
                    status: 'off',
                    last_update: new Date().toISOString()
                });
                this.api.logEvent(`${device.name} apagado`);
                this.loadAllDevices(); // Recargar estados
            }
        } catch (error) {
            this.api.logEvent('Error apagando dispositivo: ' + error.message, 'error');
        }
    }

    async emergencyStopAll() {
        try {
            // Apagar todos los dispositivos
            for (const deviceId in this.devices) {
                const device = this.devices[deviceId];
                await deviceAPI.updateDevice(deviceId, {
                    ...device,
                    status: 'off',
                    emergency_stop: true,
                    last_update: new Date().toISOString()
                });
            }
            this.api.logEvent('¡PARADA DE EMERGENCIA ACTIVADA!', 'error');
            this.loadAllDevices(); // Recargar estados
        } catch (error) {
            this.api.logEvent('Error activando emergencia: ' + error.message, 'error');
        }
    }

    async resetEmergencyAll() {
        try {
            // Reactivar todos los dispositivos
            for (const deviceId in this.devices) {
                const device = this.devices[deviceId];
                await deviceAPI.updateDevice(deviceId, {
                    ...device,
                    emergency_stop: false,
                    last_update: new Date().toISOString()
                });
            }
            this.api.logEvent('Emergencia reseteda en todos los dispositivos');
            this.loadAllDevices(); // Recargar estados
        } catch (error) {
            this.api.logEvent('Error reseteando emergencia: ' + error.message, 'error');
        }
    }

    // ... (resto de métodos para movimiento y soldadura del brazo robot)

    updateDeviceStatusDisplay() {
        // Actualizar display con el estado de todos los dispositivos
        if (this.devices['1']) {
            document.getElementById('arm-state').textContent = 
                `Brazo Robot: ${this.translateStatus(this.devices['1'].status)}`;
        }
        
        if (this.devices['2']) {
            document.getElementById('fan-state').textContent = 
                `Ventilador: ${this.translateStatus(this.devices['2'].status)}`;
        }
        
        if (this.devices['3']) {
            document.getElementById('conveyor-state').textContent = 
                `Banda Transportadora: ${this.translateStatus(this.devices['3'].status)}`;
        }

        // Verificar si hay emergencia en algún dispositivo
        const emergencyActive = Object.values(this.devices).some(device => device.emergency_stop);
        document.getElementById('emergency-state').textContent = 
            `Emergencia: ${emergencyActive ? 'Activada' : 'No activa'}`;
    }

    translateStatus(status) {
        const translations = {
            'off': 'Apagado',
            'idle': 'Encendido',
            'moving': 'Moviéndose',
            'welding': 'Soldando',
            'emergency': 'Emergencia'
        };
        return translations[status] || status;
    }
}

window.RobotControls = RobotControls;