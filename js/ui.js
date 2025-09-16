class RobotUI {
    constructor(api) {
        this.api = api;
        this.initializeUI();
    }

    async initializeUI() {
        // Inicializar la API primero
        await this.api.initialize();
        this.startStatusPolling();
    }

    async updateUI() {
        try {
            const status = await this.api.getRobotStatus();
            this.displayStatus(status);
            
            // También actualizar el estado de todos los dispositivos
            await this.updateAllDevicesStatus();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    async updateAllDevicesStatus() {
        try {
            const devices = await this.api.getDevices();
            this.updateDeviceVisuals(devices);
        } catch (error) {
            console.error('Error updating device status:', error);
        }
    }

    displayStatus(status) {
        // Actualizar texto de estado
        document.getElementById('status-text').textContent = this.translateStatus(status.status);
        
        // Actualizar posición actual
        document.getElementById('current-x').textContent = status.position_x || 0;
        document.getElementById('current-y').textContent = status.position_y || 0;
        document.getElementById('current-z').textContent = status.position_z || 0;

        // Actualizar estados
        document.getElementById('arm-state').textContent = 
            `Brazo: ${this.translateStatus(status.status)}`;
        
        document.getElementById('welding-state').textContent = 
            `Soldadura: ${status.welding_active ? 'Activa' : 'Inactiva'}`;
        
        document.getElementById('emergency-state').textContent = 
            `Emergencia: ${status.emergency_stop ? 'Activada' : 'No activa'}`;

        document.getElementById('last-update').textContent = 
            `Última actualización: ${new Date(status.last_update).toLocaleString()}`;

        // Actualizar indicador de estado
        this.updateStatusIndicator(status.status);
        
        // Actualizar estado visual del brazo
        this.updateDeviceVisualState('arm', status.status, status.welding_active);
    }

    updateDeviceVisuals(devices) {
        devices.forEach(device => {
            let visualState = device.status;
            
            // Determinar el tipo de dispositivo
            let deviceType = '';
            if (device.type === 'robot_arm') deviceType = 'arm';
            else if (device.type === 'fan') deviceType = 'fan';
            else if (device.type === 'conveyor') deviceType = 'conveyor';
            
            if (deviceType) {
                this.updateDeviceVisualState(deviceType, device.status, device.welding_active);
                
                // Actualizar indicadores visuales
                this.updateVisualIndicator(deviceType, device.status);
            }
        });
    }

    updateDeviceVisualState(deviceType, status, weldingActive = false) {
        const statusCard = document.getElementById(`${deviceType}-status-card`);
        const indicator = statusCard.querySelector('.status-indicator');
        const visualIndicator = document.getElementById(`${deviceType}-visual`);
        
        // Remover todas las clases de estado
        statusCard.className = 'device-status-card';
        indicator.className = 'status-indicator';
        if (visualIndicator) visualIndicator.className = 'visual-indicator';
        
        // Aplicar clases según el estado
        if (status === 'emergency') {
            statusCard.classList.add('emergency');
            indicator.classList.add('status-emergency');
            if (visualIndicator) visualIndicator.classList.add('inactive');
        } else if (status === 'off') {
            statusCard.classList.add('off');
            indicator.classList.add('status-off');
            if (visualIndicator) visualIndicator.classList.add('inactive');
        } else if (status === 'idle' || status === 'on') {
            statusCard.classList.add('on');
            indicator.classList.add('status-on');
            if (visualIndicator) visualIndicator.classList.add('active');
        } else if (status === 'moving' || status === 'welding') {
            statusCard.classList.add('moving');
            indicator.classList.add(status === 'welding' ? 'status-welding' : 'status-moving');
            if (visualIndicator) visualIndicator.classList.add('active');
        }
        
        // Actualizar texto del indicador visual si existe
        if (visualIndicator) {
            const valueElement = visualIndicator.querySelector('.indicator-value');
            if (valueElement) {
                let statusText = '';
                if (deviceType === 'arm') statusText = 'Brazo: ';
                else if (deviceType === 'fan') statusText = 'Ventilador: ';
                else if (deviceType === 'conveyor') statusText = 'Banda: ';
                
                statusText += this.translateStatus(status);
                if (deviceType === 'arm' && weldingActive) {
                    statusText += ' (Soldando)';
                }
                
                valueElement.textContent = statusText;
            }
        }
    }

    updateVisualIndicator(deviceType, status) {
        const visualIndicator = document.getElementById(`${deviceType}-visual`);
        if (!visualIndicator) return;
        
        // Remover clases anteriores
        visualIndicator.className = 'visual-indicator';
        
        // Aplicar clase según el estado
        if (status === 'off' || status === 'emergency') {
            visualIndicator.classList.add('inactive');
        } else {
            visualIndicator.classList.add('active');
        }
        
        // Actualizar texto
        const valueElement = visualIndicator.querySelector('.indicator-value');
        if (valueElement) {
            let statusText = '';
            if (deviceType === 'arm') statusText = 'Brazo: ';
            else if (deviceType === 'fan') statusText = 'Ventilador: ';
            else if (deviceType === 'conveyor') statusText = 'Banda: ';
            
            statusText += this.translateStatus(status);
            valueElement.textContent = statusText;
        }
    }

    translateStatus(status) {
        const translations = {
            'off': 'Apagado',
            'on': 'Encendido',
            'idle': 'En espera',
            'moving': 'Moviéndose',
            'welding': 'Soldando',
            'emergency': 'Emergencia'
        };
        return translations[status] || status;
    }

    updateStatusIndicator(status) {
        const indicator = document.querySelector('.status-indicator');
        if (!indicator) return;
        
        // Remover clases anteriores
        indicator.className = 'status-indicator';
        
        // Agregar clase según estado
        switch(status) {
            case 'welding':
                indicator.classList.add('status-warning');
                break;
            case 'emergency':
                indicator.classList.add('status-emergency');
                break;
            case 'moving':
                indicator.classList.add('status-warning');
                break;
            case 'idle':
            case 'on':
                indicator.classList.add('status-connected');
                break;
            default:
                indicator.classList.add('status-disconnected');
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
    const controls = new RobotControls(robotAPI);
    const ui = new RobotUI(robotAPI);
    
    // Hacer disponibles globalmente para debugging
    window.robotControls = controls;
    window.robotUI = ui;
});