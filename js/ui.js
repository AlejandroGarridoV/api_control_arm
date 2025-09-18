class RobotUI {
    constructor(api, controls) {
        this.api = api;
        this.controls = controls;
        this.isUserTyping = false; // Bandera para saber si el usuario está escribiendo
        this.initializeUI();
    }

    async initializeUI() {
        // Inicializar la API primero
        await this.api.initialize();
        
        // Agregar event listeners para detectar cuando el usuario está escribiendo
        this.addCoordinateInputListeners();
        
        this.startStatusPolling();
    }

    addCoordinateInputListeners() {
        // Obtener los campos de entrada de coordenadas
        const coordX = document.getElementById('coord-x');
        const coordY = document.getElementById('coord-y');
        const coordZ = document.getElementById('coord-z');
        
        // Agregar event listeners para detectar cuando el usuario está interactuando
        [coordX, coordY, coordZ].forEach(input => {
            input.addEventListener('focus', () => {
                this.isUserTyping = true;
            });
            
            input.addEventListener('blur', () => {
                this.isUserTyping = false;
            });
            
            input.addEventListener('input', () => {
                this.isUserTyping = true;
            });
        });
    }

    async updateUI() {
        try {
            // Obtener el estado actual del robot
            const status = await this.api.getRobotStatus();
            
            // Actualizar la posición actual del brazo (solo si el usuario no está escribiendo)
            if (!this.isUserTyping) {
                this.updateArmPosition(status);
            }
            
            // Usar el método de controls para mantener consistencia
            await this.controls.loadAllDevices();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    updateArmPosition(status) {
        // Actualizar la posición actual del brazo en la interfaz
        document.getElementById('current-x').textContent = status.position_x || 0;
        document.getElementById('current-y').textContent = status.position_y || 0;
        document.getElementById('current-z').textContent = status.position_z || 0;
        
        // Solo actualizar los campos de entrada si el usuario no está escribiendo
        if (!this.isUserTyping) {
            document.getElementById('coord-x').value = status.position_x || 0;
            document.getElementById('coord-y').value = status.position_y || 0;
            document.getElementById('coord-z').value = status.position_z || 0;
        }
    }

    startStatusPolling() {
        // Actualizar UI cada 2 segundos
        setInterval(() => {
            this.updateUI();
        }, 2000);
    }
}