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
            // Obtener el estado actual del robot
            const status = await this.api.getRobotStatus();
            
            // Actualizar la posición actual del brazo
            this.updateArmPosition(status);
            
            // Usar el método de controls para mantener consistencia
            await this.controls.loadAllDevices();
        } catch (error) {
            console.error('Error updating UI:', error);
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

    updateArmPosition(status) {
    const currentX = document.getElementById('current-x');
    const currentY = document.getElementById('current-y');
    const currentZ = document.getElementById('current-z');
    
    // Solo animar si los valores han cambiado
    if (currentX.textContent != status.position_x) {
        currentX.textContent = status.position_x || 0;
        currentX.parentElement.classList.add('position-update');
        setTimeout(() => currentX.parentElement.classList.remove('position-update'), 1000);
    }
    
    if (currentY.textContent != status.position_y) {
        currentY.textContent = status.position_y || 0;
        currentY.parentElement.classList.add('position-update');
        setTimeout(() => currentY.parentElement.classList.remove('position-update'), 1000);
    }
    
    if (currentZ.textContent != status.position_z) {
        currentZ.textContent = status.position_z || 0;
        currentZ.parentElement.classList.add('position-update');
        setTimeout(() => currentZ.parentElement.classList.remove('position-update'), 1000);
    }
    
    // También actualizar los campos de entrada de coordenadas para mantenerlos sincronizados
    document.getElementById('coord-x').value = status.position_x || 0;
    document.getElementById('coord-y').value = status.position_y || 0;
    document.getElementById('coord-z').value = status.position_z || 0;
}

    startStatusPolling() {
        // Actualizar UI cada 2 segundos
        setInterval(() => {
            this.updateUI();
        }, 2000);
    }
} 