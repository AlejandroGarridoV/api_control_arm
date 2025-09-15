class RobotControls {
    constructor(api) {
        this.api = api;
        this.initializeEvents();
    }

    initializeEvents() {
        // Encendido/Apagado
        document.getElementById('power-on').addEventListener('click', () => this.powerOn());
        document.getElementById('power-off').addEventListener('click', () => this.powerOff());

        // Emergencia
        document.getElementById('emergency-stop').addEventListener('click', () => this.emergencyStop());
        document.getElementById('emergency-reset').addEventListener('click', () => this.resetEmergency());

        // Movimiento
        document.getElementById('move-to').addEventListener('click', () => this.moveToPosition());
        document.getElementById('go-home').addEventListener('click', () => this.goHome());

        // Soldadura
        document.getElementById('start-weld').addEventListener('click', () => this.startWelding());
        document.getElementById('stop-weld').addEventListener('click', () => this.stopWelding());
    }

    async powerOn() {
        try {
            await this.api.powerOn();
            this.api.logEvent('Robot encendido');
        } catch (error) {
            this.api.logEvent('Error encendiendo robot: ' + error.message, 'error');
        }
    }

    async powerOff() {
        try {
            await this.api.powerOff();
            this.api.logEvent('Robot apagado');
        } catch (error) {
            this.api.logEvent('Error apagando robot: ' + error.message, 'error');
        }
    }

    async emergencyStop() {
        try {
            await this.api.emergencyStop();
            this.api.logEvent('¡PARADA DE EMERGENCIA ACTIVADA!');
        } catch (error) {
            this.api.logEvent('Error activando emergencia: ' + error.message, 'error');
        }
    }

    async resetEmergency() {
        try {
            await this.api.resetEmergency();
            this.api.logEvent('Emergencia reseteda');
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
            await this.api.moveToPosition(x, y, z);
            this.api.logEvent(`Movimiento a posición: X=${x}, Y=${y}, Z=${z}`);
        } catch (error) {
            this.api.logEvent('Error moviendo robot: ' + error.message, 'error');
        }
    }

    async goHome() {
        try {
            await this.api.goHome();
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
            
            await this.api.startWelding(points);
            this.api.logEvent(`Soldadura iniciada con ${points.length} puntos`);
        } catch (error) {
            this.api.logEvent('Error en puntos de soldadura: ' + error.message, 'error');
        }
    }

    async stopWelding() {
        try {
            await this.api.stopWelding();
            this.api.logEvent('Soldadura detenida');
        } catch (error) {
            this.api.logEvent('Error deteniendo soldadura: ' + error.message, 'error');
        }
    }
}

window.RobotControls = RobotControls;