class RobotUI {
    constructor(api) {
        this.api = api;
        this.initializeUI();
        this.startStatusPolling();
    }

    initializeUI() {
        this.updateUI();
    }

    async updateUI() {
        try {
            const status = await this.api.getRobotStatus();
            this.displayStatus(status);
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    displayStatus(status) {
        // Actualizar texto de estado
        document.getElementById('status-text').textContent = this.translateStatus(status.status);
        document.getElementById('status-text').className = `status-${status.status}`;

        // Actualizar posición actual
        document.getElementById('current-x').textContent = status.position.x;
        document.getElementById('current-y').textContent = status.position.y;
        document.getElementById('current-z').textContent = status.position.z;

        // Actualizar estados
        document.getElementById('welding-state').textContent = 
            `Soldadura: ${status.welding_active ? 'Activa' : 'Inactiva'}`;
        
        document.getElementById('emergency-state').textContent = 
            `Emergencia: ${status.emergency_stop ? 'Activada' : 'No activa'}`;

        document.getElementById('last-update').textContent = 
            `Última actualización: ${new Date(status.last_update).toLocaleString()}`;

        // Actualizar clases CSS para estado visual
        this.updateStatusVisuals(status);
    }

    translateStatus(status) {
        const translations = {
            'off': 'Apagado',
            'idle': 'En espera',
            'moving': 'Moviéndose',
            'welding': 'Soldando',
            'emergency': 'Emergencia'
        };
        return translations[status] || status;
    }

    updateStatusVisuals(status) {
        const body = document.body;
        
        // Remover clases anteriores
        body.className = '';
        
        // Agregar clase según estado
        switch(status.status) {
            case 'welding':
                body.classList.add('status-welding');
                break;
            case 'emergency':
                body.classList.add('status-emergency');
                break;
            case 'moving':
                body.classList.add('status-moving');
                break;
            case 'idle':
                body.classList.add('status-idle');
                break;
            default:
                body.classList.add('status-off');
        }
    }

    startStatusPolling() {
        // Actualizar UI cada 2 segundos
        setInterval(() => {
            this.updateUI();
        }, 2000);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const api = new RobotAPI();
    await api.initialize();
    
    const controls = new RobotControls(api);
    const ui = new RobotUI(api);
    
    // Hacer disponibles globalmente para debugging
    window.robotAPI = api;
    window.robotControls = controls;
    window.robotUI = ui;
});