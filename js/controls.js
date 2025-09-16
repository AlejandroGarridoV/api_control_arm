class RobotControls {
    constructor(api) {
        this.api = api;
        this.devices = {}; // Almacenar información de todos los dispositivos
        this.initializeEvents();
        this.loadAllDevices();
    }

    async loadAllDevices() {
        try {
            const devices = await this.api.getDevices();
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
        document.getElementById('arm-power-on').addEventListener('click', () => this.powerOnDevice('robot_arm'));
        document.getElementById('arm-power-off').addEventListener('click', () => this.powerOffDevice('robot_arm'));

        // Encendido/Apagado Ventilador
        document.getElementById('fan-power-on').addEventListener('click', () => this.powerOnDevice('fan'));
        document.getElementById('fan-power-off').addEventListener('click', () => this.powerOffDevice('fan'));

        // Encendido/Apagado Banda Transportadora
        document.getElementById('conveyor-power-on').addEventListener('click', () => this.powerOnDevice('conveyor'));
        document.getElementById('conveyor-power-off').addEventListener('click', () => this.powerOffDevice('conveyor'));

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

    async powerOnDevice(deviceType) {
        try {
            const device = Object.values(this.devices).find(d => d.type === deviceType);
            if (device) {
                await this.api.updateDevice(device.id, {
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

    async powerOffDevice(deviceType) {
        try {
            const device = Object.values(this.devices).find(d => d.type === deviceType);
            if (device) {
                await this.api.updateDevice(device.id, {
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
                await this.api.updateDevice(deviceId, {
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
                await this.api.updateDevice(deviceId, {
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

    async moveToPosition() {
        const x = parseInt(document.getElementById('coord-x').value);
        const y = parseInt(document.getElementById('coord-y').value);
        const z = parseInt(document.getElementById('coord-z').value);

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            this.api.logEvent('Coordenadas inválidas', 'error');
            return;
        }

        try {
            await this.api.updateRobot({
                status: 'moving',
                position_x: x,
                position_y: y,
                position_z: z,
                welding_active: false
            });
            this.api.logEvent(`Movimiento a posición: X=${x}, Y=${y}, Z=${z}`);
        } catch (error) {
            this.api.logEvent('Error moviendo robot: ' + error.message, 'error');
        }
    }

    async goHome() {
        try {
            await this.api.updateRobot({
                status: 'moving',
                position_x: 0,
                position_y: 0,
                position_z: 0,
                welding_active: false
            });
            // Resetear inputs a 0
            document.getElementById('coord-x').value = 0;
            document.getElementById('coord-y').value = 0;
            document.getElementById('coord-z').value = 0;
            this.api.logEvent('Volviendo a posición home (0,0,0)');
        } catch (error) {
            this.api.logEvent('Error yendo a home: ' + error.message, 'error');
        }
    }

    async startWelding() {
        const pointsText = document.getElementById('weld-points').value;
        
        try {
            const points = JSON.parse(pointsText);
            if (!Array.isArray(points)) throw new Error('Formato inválido');
            
            await this.api.updateRobot({
                status: 'welding',
                welding_active: true
            });
            this.api.logEvent(`Soldadura iniciada con ${points.length} puntos`, 'weld');
        } catch (error) {
            this.api.logEvent('Error en puntos de soldadura: ' + error.message, 'error');
        }
    }

    async stopWelding() {
        try {
            await this.api.updateRobot({
                status: 'idle',
                welding_active: false
            });
            this.api.logEvent('Soldadura detenida');
        } catch (error) {
            this.api.logEvent('Error deteniendo soldadura: ' + error.message, 'error');
        }
    }

    updateDeviceStatusDisplay() {
        // Actualizar display con el estado de todos los dispositivos
        const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
        if (robotArm) {
            document.getElementById('arm-state').textContent = 
                `Brazo Robot: ${this.translateStatus(robotArm.status)}`;
        }
        
        const fan = Object.values(this.devices).find(d => d.type === 'fan');
        if (fan) {
            document.getElementById('fan-state').textContent = 
                `Ventilador: ${this.translateStatus(fan.status)}`;
        }
        
        const conveyor = Object.values(this.devices).find(d => d.type === 'conveyor');
        if (conveyor) {
            document.getElementById('conveyor-state').textContent = 
                `Banda Transportadora: ${this.translateStatus(conveyor.status)}`;
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