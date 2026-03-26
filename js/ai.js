const NightProgression = {
    1: { andre: 1, gabo: 1, cardo: 0, gian: 0, piar: 0, alfaro: 0, peñones: 0, picock: 0 }, // Very slow
    2: { andre: 3, gabo: 3, cardo: 2, gian: 2, piar: 0, alfaro: 0, peñones: 0, picock: 0 },
    3: { andre: 5, gabo: 4, cardo: 4, gian: 4, piar: 3, alfaro: 0, peñones: 0, picock: 0 },
    4: { andre: 7, gabo: 7, cardo: 6, gian: 6, piar: 5, alfaro: 4, peñones: 0, picock: 2 },
    5: { andre: 9, gabo: 9, cardo: 8, gian: 8, piar: 7, alfaro: 6, peñones: 4, picock: 5 },
    6: { andre: 12, gabo: 12, cardo: 12, gian: 12, piar: 10, alfaro: 10, peñones: 9, picock: 10 }
};

const EnemyPaths = {
    // Escuadron Ventana Izquierda
    andre: ['cam1', 'cam3', 'cam5', 'door_left'],
    gabo: ['cam1', 'cam5', 'door_left'],
    // Escuadron Ventana Derecha
    cardo: ['cam2', 'cam4', 'cam6', 'door_right'],
    gian: ['cam2', 'cam6', 'door_right'],
    // Escuadron Ducto Superior
    piar: ['cam8', 'cam5', 'duct'],
    alfaro: ['cam8', 'cam6', 'duct'],
    picock: ['cam8', 'cam7', 'duct'],
    // Phantom Office
    peñones: ['hidden', 'cam_all', 'office'] 
};

const EnemyStarts = {
    // Escuadrón de la Cámara 8 (Lejos)
    andre: 'cam8', gabo: 'cam8', piar: 'cam8', 
    // Escuadrón de la Cámara 6 (Medio)
    cardo: 'cam6', gian: 'cam6', alfaro: 'cam6', picock: 'cam6',
    // Inactivo
    peñones: 'cam1'
};

const AIManager = {
    positions: {},
    officeState: [],
    doorLeftState: null,
    doorRightState: null,
    ductState: null,
    interval: null,
    init: function() {
        let diffs;
        if (GameState.night === 7) {
            diffs = window.CustomAI || NightProgression[6];
        } else {
            let n = GameState.night > 6 ? 6 : GameState.night;
            diffs = NightProgression[n];
        }
        
        Object.keys(diffs).forEach(enemy => {
            AIManager.positions[enemy] = EnemyStarts[enemy];
        });
        
        AIManager.officeState = [];
        AIManager.doorLeftState = null;
        AIManager.doorRightState = null;
        AIManager.ductState = null;
        
        if (AIManager.interval) clearInterval(AIManager.interval);
        // Ticks más lentos para dar tiempo a moverse por cámaras (6 segundos entre intentos)
        AIManager.interval = setInterval(AIManager.tick, 6000);
    },
    tick: function() {
        if (GameState.gameOver) return;
        
        let night = GameState.night > 6 ? 6 : GameState.night;
        let diffs = NightProgression[night];
        
        Object.keys(diffs).forEach(enemy => {
            let level = diffs[enemy];
            if (level === 0) return; // Fuera de servicio esta noche
            
            // Calculo probabilidad / 20 puntos
            let rand = Math.floor(Math.random() * 20) + 1;
            if (rand <= level) {
                moveEnemy(enemy);
            }
        });
    }
};

function moveEnemy(enemy) {
    let currentPos = AIManager.positions[enemy];
    let path = EnemyPaths[enemy];
    let currentIndex = path.indexOf(currentPos);
    
    if (currentIndex === path.length - 1) {
        checkDefense(enemy, currentPos);
    } else {
        let nextPos = path[currentIndex + 1];
        
        // Traffic Control - Evitar ataques triplicados al mismo punto ciego
        if (nextPos === 'door_left' && AIManager.doorLeftState) return;
        if (nextPos === 'door_right' && AIManager.doorRightState) return;
        if (nextPos === 'duct' && AIManager.ductState) return;
        if (nextPos === 'office' && AIManager.officeState.length > 0) return;

        if (nextPos === 'door_left' || nextPos === 'door_right' || nextPos === 'duct' || nextPos === 'office') {
            AIManager.positions[enemy] = nextPos;
            attackOffice(enemy, nextPos);
        } else {
            AIManager.positions[enemy] = nextPos;
            if(GameState.isMonitorUp) updateCameraView(); 
        }
    }
}

function attackOffice(enemy, from) {
    if(from === 'office' || from === 'duct') {
        AIManager.officeState.push(enemy);
        if (from === 'duct') AIManager.ductState = enemy;

        let el = from === 'duct' ? document.getElementById('duct-character') : document.getElementById('office-character');
        el.src = `assets/img/${enemy}.png`;
        el.classList.remove('hidden');
        
        // Tiempo de reacción: 5 segundos para poner máscara
        setTimeout(() => { checkDefense(enemy, from); }, 5000); 

    } else if (from === 'door_left') {
        AIManager.doorLeftState = enemy;
        document.getElementById('door-left-character').src = `assets/img/${enemy}.png`;
        document.getElementById('door-left-character').classList.remove('hidden');
        // El jugador tiene 5 SEGUNDOS para cerrar su puerta
        setTimeout(() => { checkDoorDefense(enemy, 'left'); }, 5000); 

    } else if (from === 'door_right') {
        AIManager.doorRightState = enemy;
        document.getElementById('door-right-character').src = `assets/img/${enemy}.png`;
        document.getElementById('door-right-character').classList.remove('hidden');
        setTimeout(() => { checkDoorDefense(enemy, 'right'); }, 5000); 
    }
}

function checkDefense(enemy, from) {
    if (GameState.isMaskOn) {
        // Bloqueo exitoso: Se quedan 4.5 segundos observándote y luego se van
        setTimeout(() => {
            AIManager.officeState = AIManager.officeState.filter(e => e !== enemy);
            if(from === 'duct') {
                document.getElementById('duct-character').classList.add('hidden');
                AIManager.ductState = null;
            } else {
                document.getElementById('office-character').classList.add('hidden');
            }
            AIManager.positions[enemy] = EnemyStarts[enemy]; 
        }, 4500);
    } else {
        triggerJumpscare(`assets/img/${enemy}.png`);
    }
}

function checkDoorDefense(enemy, side) {
    if (GameState.gameOver) return;
    let closed = side === 'left' ? GameState.leftDoorClosed : GameState.rightDoorClosed;
    
    if (closed) {
        // Bloqueo exitoso: Se quedan intentando entrar y luego se van
        let stayTime = 0;
        const checkStillClosed = setInterval(() => {
            stayTime += 500;
            let currentClosed = side === 'left' ? GameState.leftDoorClosed : GameState.rightDoorClosed;
            
            // Si abren la puerta mientras el animatrónico sigue ahí -> MUERTE
            if (!currentClosed && !GameState.gameOver) {
                clearInterval(checkStillClosed);
                triggerJumpscare(`assets/img/${enemy}.png`);
            }
            
            if (stayTime >= 4000) { // Se van tras 4 segundos
                clearInterval(checkStillClosed);
                if (side === 'left') AIManager.doorLeftState = null;
                else AIManager.doorRightState = null;
                document.getElementById(`door-${side}-character`).classList.add('hidden');
                AIManager.positions[enemy] = EnemyStarts[enemy];
            }
        }, 500);
    } else {
        triggerJumpscare(`assets/img/${enemy}.png`);
    }
}

