class RobotControls {
    constructor(api) {
        this.api = api;
        this.devices = {}; // Almacenar información de todos los dispositivos
        this.initializeEvents();
        this.loadAllDevices();
        
        // Hacer referencia global para depuración
        window.robotControls = this;
    }

    async loadAllDevices() {
        try {
            const devices = await this.api.getDevices();
            this.devices = {}; // Reiniciar el objeto
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
                // Recargar estados después de un breve delay
                setTimeout(() => this.loadAllDevices(), 500);
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
                // Recargar estados después de un breve delay
                setTimeout(() => this.loadAllDevices(), 500);
            }
        } catch (error) {
            this.api.logEvent('Error apagando dispositivo: ' + error.message, 'error');
        }
    }

    async emergencyStopAll() {
        if (!confirm('¿Está seguro de activar la parada de emergencia? Esto apagará todos los dispositivos.')) {
            return;
        }
        
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
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
        } catch (error) {
            this.api.logEvent('Error activando emergencia: ' + error.message, 'error');
        }
    }

    async resetEmergencyAll() {
        if (!confirm('¿Está seguro de resetear la emergencia? Esto reactivará todos los dispositivos.')) {
            return;
        }
        
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
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
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
            alert('Por favor, ingrese coordenadas válidas para X, Y y Z.');
            return;
        }

        try {
            const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
            if (!robotArm) {
                throw new Error('No se encontró el brazo robot');
            }
            
            await this.api.updateDevice(robotArm.id, {
                ...robotArm,
                status: 'moving',
                position_x: x,
                position_y: y,
                position_z: z,
                welding_active: false,
                last_update: new Date().toISOString()
            });
            
            this.api.logEvent(`Movimiento a posición: X=${x}, Y=${y}, Z=${z}`);
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
        } catch (error) {
            this.api.logEvent('Error moviendo robot: ' + error.message, 'error');
            alert('Error al mover el brazo robot: ' + error.message);
        }
    }

    async goHome() {
        try {
            const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
            if (!robotArm) {
                throw new Error('No se encontró el brazo robot');
            }
            
            await this.api.updateDevice(robotArm.id, {
                ...robotArm,
                status: 'moving',
                position_x: 0,
                position_y: 0,
                position_z: 0,
                welding_active: false,
                last_update: new Date().toISOString()
            });
            
            // Resetear inputs a 0
            document.getElementById('coord-x').value = 0;
            document.getElementById('coord-y').value = 0;
            document.getElementById('coord-z').value = 0;
            
            this.api.logEvent('Volviendo a posición home (0,0,0)');
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
        } catch (error) {
            this.api.logEvent('Error yendo a home: ' + error.message, 'error');
            alert('Error al mover a posición inicial: ' + error.message);
        }
    }

    async startWelding() {
        const pointsText = document.getElementById('weld-points').value;
        
        if (!pointsText.trim()) {
            this.api.logEvent('No se han proporcionado puntos de soldadura', 'error');
            alert('Por favor, ingrese los puntos de trayectoria para la soldadura.');
            return;
        }
        
        try {
            const points = JSON.parse(pointsText);
            if (!Array.isArray(points)) throw new Error('Formato inválido. Debe ser un array de puntos.');
            
            const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
            if (!robotArm) {
                throw new Error('No se encontró el brazo robot');
            }
            
            await this.api.updateDevice(robotArm.id, {
                ...robotArm,
                status: 'welding',
                welding_active: true,
                weld_points: points,
                last_update: new Date().toISOString()
            });
            
            this.api.logEvent(`Soldadura iniciada con ${points.length} puntos`, 'weld');
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
        } catch (error) {
            this.api.logEvent('Error en puntos de soldadura: ' + error.message, 'error');
            alert('Error en el formato de puntos: ' + error.message + '\n\nFormato esperado: [[x1,y1,z1], [x2,y2,z2], ...]');
        }
    }

    async moveToPosition() {
    const x = parseInt(document.getElementById('coord-x').value);
    const y = parseInt(document.getElementById('coord-y').value);
    const z = parseInt(document.getElementById('coord-z').value);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
        this.api.logEvent('Coordenadas inválidas', 'error');
        alert('Por favor, ingrese coordenadas válidas para X, Y y Z.');
        return;
    }

    try {
        const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
        if (!robotArm) {
            throw new Error('No se encontró el brazo robot');
        }
        
        await this.api.updateDevice(robotArm.id, {
            ...robotArm,
            status: 'moving',
            position_x: x,
            position_y: y,
            position_z: z,
            welding_active: false,
            last_update: new Date().toISOString()
        });
        
        this.api.logEvent(`Movimiento a posición: X=${x}, Y=${y}, Z=${z}`);
        
        // Actualizar la posición actual en la interfaz inmediatamente
        document.getElementById('current-x').textContent = x;
        document.getElementById('current-y').textContent = y;
        document.getElementById('current-z').textContent = z;
        
        // Recargar estados después de un breve delay
        setTimeout(() => this.loadAllDevices(), 500);
    } catch (error) {
        this.api.logEvent('Error moviendo robot: ' + error.message, 'error');
        alert('Error al mover el brazo robot: ' + error.message);
    }
}

async goHome() {
    try {
        const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
        if (!robotArm) {
            throw new Error('No se encontró el brazo robot');
        }
        
        await this.api.updateDevice(robotArm.id, {
            ...robotArm,
            status: 'moving',
            position_x: 0,
            position_y: 0,
            position_z: 0,
            welding_active: false,
            last_update: new Date().toISOString()
        });
        
        // Resetear inputs a 0
        document.getElementById('coord-x').value = 0;
        document.getElementById('coord-y').value = 0;
        document.getElementById('coord-z').value = 0;
        
        // Actualizar la posición actual en la interfaz inmediatamente
        document.getElementById('current-x').textContent = 0;
        document.getElementById('current-y').textContent = 0;
        document.getElementById('current-z').textContent = 0;
        
        this.api.logEvent('Volviendo a posición home (0,0,0)');
        // Recargar estados después de un breve delay
        setTimeout(() => this.loadAllDevices(), 500);
    } catch (error) {
        this.api.logEvent('Error yendo a home: ' + error.message, 'error');
        alert('Error al mover a posición inicial: ' + error.message);
    }
}

    async stopWelding() {
        try {
            const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
            if (!robotArm) {
                throw new Error('No se encontró el brazo robot');
            }
            
            await this.api.updateDevice(robotArm.id, {
                ...robotArm,
                status: 'idle',
                welding_active: false,
                last_update: new Date().toISOString()
            });
            
            this.api.logEvent('Soldadura detenida');
            // Recargar estados después de un breve delay
            setTimeout(() => this.loadAllDevices(), 500);
        } catch (error) {
            this.api.logEvent('Error deteniendo soldadura: ' + error.message, 'error');
            alert('Error al detener la soldadura: ' + error.message);
        }
    }

    updateDeviceStatusDisplay() {
        // Actualizar display con el estado de todos los dispositivos
        const robotArm = Object.values(this.devices).find(d => d.type === 'robot_arm');
        if (robotArm) {
            document.getElementById('arm-state').textContent = 
                `Estado: ${this.translateStatus(robotArm.status)}`;
            
            // Actualizar indicadores visuales
            this.updateDeviceCard('arm', robotArm.status, robotArm.welding_active);
        }
        
        const fan = Object.values(this.devices).find(d => d.type === 'fan');
        if (fan) {
            document.getElementById('fan-state').textContent = 
                `Estado: ${this.translateStatus(fan.status)}`;
            
            // Actualizar indicadores visuales
            this.updateDeviceCard('fan', fan.status);
        }
        
        const conveyor = Object.values(this.devices).find(d => d.type === 'conveyor');
        if (conveyor) {
            document.getElementById('conveyor-state').textContent = 
                `Estado: ${this.translateStatus(conveyor.status)}`;
            
            // Actualizar indicadores visuales
            this.updateDeviceCard('conveyor', conveyor.status);
        }

        // Verificar si hay emergencia en algún dispositivo
        const emergencyActive = Object.values(this.devices).some(device => device.emergency_stop);
        document.getElementById('emergency-state').textContent = 
            `Emergencia: ${emergencyActive ? 'Activada' : 'No activa'}`;
            
        // Actualizar timestamp
        document.getElementById('last-update').textContent = 
            `Última actualización: ${new Date().toLocaleTimeString()}`;
    }
    
    updateDeviceCard(deviceType, status, weldingActive = false) {
        const card = document.getElementById(`${deviceType}-status-card`);
        const indicator = card.querySelector('.status-indicator');
        
        // Reset classes
        card.className = 'device-status-card';
        indicator.className = 'status-indicator';
        
        // Apply appropriate classes based on status
        if (status === 'emergency') {
            card.classList.add('emergency');
            indicator.classList.add('status-emergency');
        } else if (status === 'off') {
            card.classList.add('off');
            indicator.classList.add('status-off');
        } else if (status === 'idle' || status === 'on') {
            card.classList.add('on');
            indicator.classList.add('status-on');
        } else if (status === 'moving') {
            card.classList.add('moving');
            indicator.classList.add('status-moving');
        } else if (status === 'welding') {
            card.classList.add('welding');
            indicator.classList.add('status-welding');
        }
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