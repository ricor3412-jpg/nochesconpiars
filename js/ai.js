const NightProgression = {
    1: { andre: 1, gabo: 1, cardo: 0, gian: 0, piar: 0, alfaro: 0, peñones: 0, picock: 0 }, 
    2: { andre: 3, gabo: 3, cardo: 2, gian: 2, piar: 0, alfaro: 0, peñones: 0, picock: 0 },
    3: { andre: 5, gabo: 4, cardo: 4, gian: 4, piar: 3, alfaro: 0, peñones: 0, picock: 0 },
    4: { andre: 7, gabo: 7, cardo: 6, gian: 6, piar: 5, alfaro: 4, peñones: 0, picock: 2 },
    5: { andre: 9, gabo: 9, cardo: 8, gian: 8, piar: 7, alfaro: 6, peñones: 4, picock: 5 },
    6: { andre: 12, gabo: 12, cardo: 12, gian: 12, piar: 10, alfaro: 10, peñones: 9, picock: 10 }
};

const EnemyPaths = {
    // Puertas (Lineal: 8/6 -> 7 -> 5 -> 4 -> 3 -> 2 -> 1 -> Puerta)
    andre: ['cam8', 'cam7', 'cam5', 'cam4', 'cam3', 'cam2', 'cam1', 'door_left'],
    gabo: ['cam8', 'cam7', 'cam5', 'cam4', 'cam3', 'cam2', 'cam1', 'door_left'],
    cardo: ['cam6', 'cam7', 'cam5', 'cam4', 'cam3', 'cam2', 'cam1', 'door_right'],
    gian: ['cam6', 'cam7', 'cam5', 'cam4', 'cam3', 'cam2', 'cam1', 'door_right'],
    
    // Ductos (Linear: 7 -> 4 -> 5 -> 1 -> Conducto/Puerta)
    piar: ['cam8', 'cam7', 'cam4', 'cam5', 'cam1', 'duct'],
    alfaro: ['cam6', 'cam7', 'cam4', 'cam5', 'cam1', 'duct'],
    picock: ['cam6', 'cam7', 'cam4', 'cam5', 'cam1', 'door_right'],
    
    // Peñones (Special: Cam 1 -> CAM_ALL)
    peñones: ['cam1', 'cam_all'] 
};

const EnemyStarts = {
    andre: 'cam8', gabo: 'cam8', piar: 'cam8', 
    cardo: 'cam6', gian: 'cam6', alfaro: 'cam6', picock: 'cam6',
    peñones: 'cam1'
};

const AIManager = {
    positions: {},
    officeState: [],
    doorLeftState: null,
    doorRightState: null,
    ductState: null,
    picockClicks: 0,
    interval: null,
    init: function() {
        let n = GameState.night > 6 ? 6 : GameState.night;
        let diffs = (GameState.night === 7 && window.CustomAI) ? window.CustomAI : NightProgression[n];
        
        Object.keys(diffs).forEach(enemy => {
            AIManager.positions[enemy] = EnemyStarts[enemy];
        });
        
        AIManager.officeState = [];
        AIManager.doorLeftState = null;
        AIManager.doorRightState = null;
        AIManager.ductState = null;
        AIManager.picockClicks = 0;
        
        if (AIManager.interval) clearInterval(AIManager.interval);
        AIManager.interval = setInterval(AIManager.tick, 5000); 
    },
    tick: function() {
        if (GameState.gameOver || !GameState.gameStarted) return;
        
        let n = GameState.night > 6 ? 6 : GameState.night;
        let diffs = (GameState.night === 7 && window.CustomAI) ? window.CustomAI : NightProgression[n];
        
        Object.keys(diffs).forEach(enemy => {
            let level = diffs[enemy];
            if (level === 0) return;
            
            let rand = Math.floor(Math.random() * 20) + 1;
            if (rand <= level) {
                moveEnemy(enemy);
            }
        });
    }
};

function moveEnemy(enemy) {
    if(typeof AudioSynth !== 'undefined') AudioSynth.playStep();
    let currentPos = AIManager.positions[enemy];
    let path = EnemyPaths[enemy];
    let currentIndex = path.indexOf(currentPos);
    
    // Peñones Special Activation
    if(enemy === 'peñones' && currentPos === 'cam1') {
        if(Math.random() > 0.3) return; 
    }

    if (currentIndex >= path.length - 1) return; 
    
    let nextPos = path[currentIndex + 1];
    
    // Traffic control
    if (nextPos === 'door_left' && AIManager.doorLeftState) return;
    if (nextPos === 'door_right' && AIManager.doorRightState) return;
    if (nextPos === 'duct' && AIManager.ductState) return;
    if (nextPos === 'office' && AIManager.officeState.includes(enemy)) return;

    AIManager.positions[enemy] = nextPos;
    
    if (nextPos === 'door_left' || nextPos === 'door_right' || nextPos === 'duct' || nextPos === 'office' || nextPos === 'cam_all') {
        attackOffice(enemy, nextPos);
    } else if(GameState.isMonitorUp) {
        updateCameraView(); 
    }
}

function attackOffice(enemy, from) {
    // FORCE UI REFRESH ON ARRIVAL
    setTimeout(() => { if(typeof window.updateOfficeVisuals === 'function') window.updateOfficeVisuals(); }, 50);

    if(from === 'office' || from === 'duct') {
        if (from === 'duct') {
            AIManager.ductState = enemy;
        } else {
            if(!AIManager.officeState.includes(enemy)) AIManager.officeState.push(enemy);
        }
        
        setTimeout(() => { 
            // Check if still there before trigger
            if(AIManager.officeState.includes(enemy) || AIManager.ductState === enemy) {
                checkDefense(enemy, from); 
            }
        }, 5000); 

    } else if (from === 'door_left' || from === 'door_right') {
        let side = from === 'door_left' ? 'left' : 'right';
        if(side === 'left') AIManager.doorLeftState = enemy;
        else AIManager.doorRightState = enemy;
        
        setTimeout(() => { checkDoorDefense(enemy, side); }, 5000); 
    } else if (from === 'cam_all') {
        if(GameState.isMonitorUp) updateCameraView();
        setTimeout(() => {
            if (AIManager.positions['peñones'] === 'cam_all' && GameState.isMonitorUp) {
                triggerJumpscare(`assets/img/peñones.png`);
            }
        }, 3000);
    }
}

function checkDefense(enemy, from) {
    if (GameState.gameOver) return;
    if (GameState.isMaskOn) {
        // SUCCESS: Centralized retreat via main.js function
        setTimeout(() => {
            if(!GameState.isMaskOn) { 
                triggerJumpscare(`assets/img/${enemy}.png`);
                return;
            }
            if(typeof window.retreatEnemy === 'function') window.retreatEnemy(enemy);
        }, 2000); // Super fast retreat
    } else {
        triggerJumpscare(`assets/img/${enemy}.png`);
    }
}

function checkDoorDefense(enemy, side) {
    if (GameState.gameOver) return;
    let closed = side === 'left' ? GameState.leftDoorClosed : GameState.rightDoorClosed;
    
    if (closed) {
        let stayCounter = 0;
        const persistenceTimer = setInterval(() => {
            stayCounter += 500;
            let currentClosed = side === 'left' ? GameState.leftDoorClosed : GameState.rightDoorClosed;
            
            if (!currentClosed && !GameState.gameOver) {
                clearInterval(persistenceTimer);
                triggerJumpscare(`assets/img/${enemy}.png`);
            }
            
            if (stayCounter >= 4000) {
                clearInterval(persistenceTimer);
                if(typeof window.retreatEnemy === 'function') window.retreatEnemy(enemy);
            }
        }, 500);
    } else {
        triggerJumpscare(`assets/img/${enemy}.png`);
    }
}
