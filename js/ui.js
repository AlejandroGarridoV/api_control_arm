class RobotUI {
    constructor(api, controls) {
        this.api = api;
        this.controls = controls;
        this.initializeUI();
    }

    async initializeUI() {
        // Inicializar la API primero
        await this.api.initialize();
        this.startStatusPolling();
    }

    async updateUI() {
        try {
            // Usar el método de controls para mantener consistencia
            await this.controls.loadAllDevices();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    startStatusPolling() {
        // Actualizar UI cada 2 segundos
        setInterval(() => {
            this.updateUI();
        }, 2000);
    }
}