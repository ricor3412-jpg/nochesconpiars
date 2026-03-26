document.addEventListener('DOMContentLoaded', () => {
    // UI Refs - Populate once DOM is ready
    GameState.ui = {
        powerDisplay: document.getElementById('power-display'),
        timeDisplay: document.getElementById('time-display'),
        usageDisplay: document.getElementById('usage-display'),
        maskOverlay: document.getElementById('mask-overlay'),
        cameraSystem: document.getElementById('camera-system'),
        leftDoor: document.getElementById('door-left'),
        rightDoor: document.getElementById('door-right'),
        officeView: document.getElementById('office-view')
    };

    const characters = ['andre', 'gabo', 'cardo', 'gian', 'piar', 'alfaro', 'picock', 'peñones'];
    window.CustomAI = { andre: 0, gabo: 0, cardo: 0, gian: 0, piar: 0, alfaro: 0, picock: 0, peñones: 0 };

    // --- Panning Logic ---
    document.addEventListener('mousemove', (e) => {
        if (!GameState.gameStarted || GameState.isMonitorUp || GameState.isMaskOn || GameState.gameOver) return;
        
        const officeView = document.getElementById('office-view');
        const container = document.getElementById('game-container');
        if(!officeView || !container) return;

        const maxScroll = officeView.offsetWidth - container.offsetWidth;
        if(maxScroll <= 0) return;
        
        const ratio = e.clientX / window.innerWidth;
        const scrollX = -(ratio * maxScroll);
        
        officeView.style.transform = `translateX(${scrollX}px)`;
    });

    // --- Menus ---
    document.getElementById('btn-play')?.addEventListener('click', startGame);
    
    document.getElementById('btn-quit-hitbox')?.addEventListener('click', () => { 
        if(confirm("¿Seguro que quieres salir?")) window.close(); 
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
        if(confirm('¿Estás seguro de que quieres borrar todos tus datos y volver a la Noche 1?')) {
            localStorage.setItem('cnp_night', 1);
            location.reload();
        }
    });

    document.getElementById('btn-instructions-hitbox')?.addEventListener('click', () => {
        document.getElementById('instructions-screen').classList.remove('hidden');
    });

    document.getElementById('btn-close-instructions')?.addEventListener('click', () => {
        document.getElementById('instructions-screen').classList.add('hidden');
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => location.reload());

    // --- Door & Light Panels ---
    function toggleDoor(side) {
        if (GameState.power <= 0 || GameState.gameOver) return;
        const isLeft = side === 'left';
        if(isLeft) GameState.leftDoorClosed = !GameState.leftDoorClosed;
        else GameState.rightDoorClosed = !GameState.rightDoorClosed;

        const door = isLeft ? GameState.ui.leftDoor : GameState.ui.rightDoor;
        const btn = document.getElementById(`btn-door-${side}`);
        
        const isClosed = isLeft ? GameState.leftDoorClosed : GameState.rightDoorClosed;
        if(door) {
            door.classList.toggle('open', !isClosed);
            door.classList.toggle('closed', isClosed);
        }
        if(btn) btn.classList.toggle('active', isClosed);
        
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals(); 
    }
    
    document.getElementById('btn-door-left')?.addEventListener('click', () => toggleDoor('left'));
    document.getElementById('btn-door-right')?.addEventListener('click', () => toggleDoor('right'));
    
    function toggleLight(side) {
        if (GameState.power <= 0 || GameState.gameOver) return;
        const isLeft = side === 'left';
        if(isLeft) GameState.leftLightOn = true;
        else GameState.rightLightOn = true;
        document.getElementById(`btn-light-${side}`)?.classList.add('active');
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals();
    }
    function offLight(side) {
        const isLeft = side === 'left';
        if(isLeft) GameState.leftLightOn = false;
        else GameState.rightLightOn = false;
        document.getElementById(`btn-light-${side}`)?.classList.remove('active');
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals();
    }
    
    document.getElementById('btn-light-left')?.addEventListener('mousedown', () => toggleLight('left'));
    document.getElementById('btn-light-left')?.addEventListener('mouseup', () => offLight('left'));
    document.getElementById('btn-light-left')?.addEventListener('mouseleave', () => offLight('left'));
    
    document.getElementById('btn-light-right')?.addEventListener('mousedown', () => toggleLight('right'));
    document.getElementById('btn-light-right')?.addEventListener('mouseup', () => offLight('right'));
    document.getElementById('btn-light-right')?.addEventListener('mouseleave', () => offLight('right'));

    // --- Mask & Cameras ---
    document.getElementById('btn-mask')?.addEventListener('click', () => {
        if(GameState.gameOver || GameState.power <= 0) return;
        GameState.isMaskOn = !GameState.isMaskOn;
        if (GameState.isMaskOn) {
            GameState.ui.maskOverlay?.classList.remove('hidden');
            const maxScroll = GameState.ui.officeView.offsetWidth - document.getElementById('game-container').offsetWidth;
            GameState.ui.officeView.style.transform = `translateX(-${maxScroll/2}px)`; 
            
            if(GameState.isMonitorUp) {
                GameState.isMonitorUp = false;
                GameState.ui.cameraSystem.classList.add('hidden');
                updateUsage();
            }
        } else {
            GameState.ui.maskOverlay?.classList.add('hidden');
            if(typeof checkOfficeDefense === 'function') checkOfficeDefense();
        }
    });

    let lastToggle = 0;
    function toggleCamera() {
        const now = Date.now();
        if (now - lastToggle < 300) return; 
        lastToggle = now;

        if (GameState.power <= 0 || GameState.isMaskOn || GameState.gameOver) return;
        GameState.isMonitorUp = !GameState.isMonitorUp;
        if (GameState.isMonitorUp) {
            GameState.ui.cameraSystem?.classList.remove('hidden');
            if(typeof updateCameraView === 'function') updateCameraView();
        } else {
            GameState.ui.cameraSystem?.classList.add('hidden');
            // Reset Peñones if we close the monitor
            if(AIManager.positions['peñones'] === 'cam_all') {
                AIManager.positions['peñones'] = 'cam1';
            }
        }
        updateUsage();
    }


    document.getElementById('btn-camera')?.addEventListener('click', toggleCamera);
    document.getElementById('btn-camera-close')?.addEventListener('click', toggleCamera);

    // --- Extras ---
    document.getElementById('btn-extras-hitbox')?.addEventListener('click', () => {
        document.getElementById('extras-screen').classList.remove('hidden');
        renderExtras();
    });

    document.getElementById('btn-close-extras')?.addEventListener('click', () => {
        document.getElementById('extras-screen').classList.add('hidden');
    });

    window.updateCustomAI = (char, val) => {
        window.CustomAI[char] = parseInt(val);
        const display = document.getElementById(`val-${char}`);
        if(display) display.innerText = val;
    };

    window.setChallenge = (name) => {
        if(name === '4/20') {
            ['andre', 'gabo', 'cardo', 'gian'].forEach(c => updateCustomAI(c, 20));
        } else if(name === 'SOLO DUCTOS') {
            ['piar', 'alfaro', 'picock'].forEach(c => updateCustomAI(c, 20));
        }
        renderCustomNight();
    };

    function renderCustomNight() {
        const container = document.getElementById('ai-selectors');
        if(!container) return;
        container.innerHTML = '';
        characters.forEach(char => {
            const row = document.createElement('div');
            row.innerHTML = `
                <label>${char.toUpperCase()}: <span id="val-${char}">0</span></label>
                <input type="range" min="0" max="20" value="${window.CustomAI[char]}" oninput="updateCustomAI('${char}', this.value)">
            `;
            container.appendChild(row);
        });
    }

    function renderExtras() {
        const container = document.getElementById('extras-content');
        if(!container) return;
        container.innerHTML = '';
        characters.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'menu-text-link';
            btn.innerText = char.toUpperCase();
            btn.onclick = () => {
                const img = document.getElementById('extras-main-img');
                const name = document.getElementById('extras-char-name');
                if(img) img.src = `assets/img/${char}.png`;
                if(name) name.innerText = char.toUpperCase();
                
                const scareBtn = document.getElementById('btn-preview-jumpscare');
                if(scareBtn) {
                    scareBtn.onclick = () => {
                        let scareSrc = `assets/img/${char}.png`;
                        if(char === 'piar' || char === 'alfaro') scareSrc = 'assets/img/jumscare piars.png';
                        triggerJumpscare(scareSrc);
                        setTimeout(() => {
                            document.getElementById('jumpscare-screen').classList.add('hidden');
                            document.getElementById('game-over-screen').classList.add('hidden');
                        }, 2000);
                    };
                }
            };
            container.appendChild(btn);
        });
    }

    // --- Core View Update Functions ---
    window.updateCameraView = function() {
        if(!GameState.isMonitorUp) return;
        const camRoom = document.getElementById('camera-room');
        if(!camRoom) return;

        if (AIManager.positions['peñones'] === 'cam_all') {
            camRoom.style.backgroundImage = `url('assets/img/peñones.png')`;
            camRoom.style.backgroundSize = 'contain';
            camRoom.style.backgroundPosition = 'center';
            camRoom.style.backgroundRepeat = 'no-repeat';
            camRoom.innerHTML = ''; 
            return;
        }

        camRoom.style.backgroundImage = `url('assets/img/${GameState.currentCamera}.png')`;
        camRoom.style.backgroundSize = 'cover';
        camRoom.innerHTML = ''; 

        let enemiesInRoom = Object.keys(AIManager.positions).filter(e => AIManager.positions[e] === GameState.currentCamera);
        enemiesInRoom.forEach((enemy, index) => {
            const img = document.createElement('img');
            img.src = `assets/img/${enemy}.png`;
            img.className = 'cam-enemy-render';
            const offsetWidth = 100 / (enemiesInRoom.length + 1);
            img.style.left = `${(index + 1) * offsetWidth}%`;
            img.style.width = `${60 / enemiesInRoom.length}%`;
            img.style.bottom = '5%';
            camRoom.appendChild(img);
        });
    }

    window.updateOfficeVisuals = function() {
        const leftEl = document.getElementById('door-left-character');
        const rightEl = document.getElementById('door-right-character');
        if(!leftEl || !rightEl) return;

        if (GameState.leftLightOn && AIManager.doorLeftState) {
            leftEl.src = `assets/img/${AIManager.doorLeftState}.png`;
            leftEl.classList.remove('hidden');
        } else {
            leftEl.classList.add('hidden');
        }

        if (GameState.rightLightOn && AIManager.doorRightState) {
            rightEl.src = `assets/img/${AIManager.doorRightState}.png`;
            rightEl.classList.remove('hidden');
        } else {
            rightEl.classList.add('hidden');
        }
    }

    window.checkOfficeDefense = function() {
        if (!GameState.isMaskOn && AIManager.officeState.length > 0) {
            triggerJumpscare(`assets/img/${AIManager.officeState[0]}.png`);
        }
    }

    window.retreatEnemy = function(enemy) {
        AIManager.positions[enemy] = EnemyStarts[enemy];
        if (AIManager.ductState === enemy) {
            AIManager.ductState = null;
            document.getElementById('duct-character')?.classList.add('hidden');
        }
    }

    window.startAI = function() {
        if(typeof AIManager !== 'undefined' && AIManager.init) {
            AIManager.init();
        } else {
            console.error("AIManager not loaded yet!");
        }
    }

    document.getElementById('office-plushie')?.addEventListener('click', () => {
        AudioSynth.playSqueak();
    });

    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            GameState.currentCamera = btn.dataset.cam;
            // Reset Peñones if we switch cameras
            if(AIManager.positions['peñones'] === 'cam_all') {
                AIManager.positions['peñones'] = 'cam1';
            }
            updateCameraView();
        });
    });


    // Initialize stars
    const starsDiv = document.getElementById('menu-stars');
    if(starsDiv) {
        let stars = "";
        const savedNight = parseInt(localStorage.getItem('cnp_night')) || 1;
        if (savedNight >= 6) stars += "⭐";
        if (savedNight >= 7) stars += "⭐";
        starsDiv.innerText = stars;
    }
});
