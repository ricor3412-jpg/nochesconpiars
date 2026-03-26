document.addEventListener('DOMContentLoaded', () => {
    // UI Refs
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

    // --- Panning Logic ---
    document.addEventListener('mousemove', (e) => {
        if (!GameState.gameStarted || GameState.isMonitorUp || GameState.isMaskOn || GameState.gameOver) return;
        
        // Dynamic Pan Math: office-view is 125% of container width so 25% scrollable space.
        // E.g. 1280 container -> 1600 office-view. maxScroll = 1600 - 1280 = 320.
        // We calculate maxScroll directly off DOM
        const maxScroll = GameState.ui.officeView.offsetWidth - document.getElementById('game-container').offsetWidth;
        if(maxScroll <= 0) return;
        
        const ratio = e.clientX / window.innerWidth;
        const scrollX = -(ratio * maxScroll);
        
        GameState.ui.officeView.style.transform = `translateX(${scrollX}px)`;
    });

    // --- Menus ---
    document.getElementById('btn-play')?.addEventListener('click', startGame);
    document.getElementById('btn-quit-hitbox')?.addEventListener('click', () => { 
        if(confirm("¿Seguro que quieres salir?")) window.close(); 
    });

    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if(confirm('¿Estás seguro de que quieres borrar todos tus datos y volver a la Noche 1?')) {
            localStorage.setItem('cnp_night', 1);
            location.reload();
        }
    });
    document.getElementById('btn-instructions').addEventListener('click', () => {
        document.getElementById('instructions-screen').classList.remove('hidden');
    });
    document.getElementById('btn-close-instructions').addEventListener('click', () => {
        document.getElementById('instructions-screen').classList.add('hidden');
    });
    document.getElementById('btn-quit').addEventListener('click', () => { window.close() });
    document.getElementById('btn-restart').addEventListener('click', () => location.reload());

    // --- Door & Light Panels ---
    function toggleDoor(side) {
        if (GameState.power <= 0 || GameState.gameOver) return;
        const isLeft = side === 'left';
        if(isLeft) GameState.leftDoorClosed = !GameState.leftDoorClosed;
        else GameState.rightDoorClosed = !GameState.rightDoorClosed;

        const door = isLeft ? GameState.ui.leftDoor : GameState.ui.rightDoor;
        const btn = document.getElementById(`btn-door-${side}`);
        
        const isClosed = isLeft ? GameState.leftDoorClosed : GameState.rightDoorClosed;
        door.classList.toggle('open', !isClosed);
        door.classList.toggle('closed', isClosed);
        btn.classList.toggle('active', isClosed);
        
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals(); // hide char if door closed
    }
    
    document.getElementById('btn-door-left').addEventListener('click', () => toggleDoor('left'));
    document.getElementById('btn-door-right').addEventListener('click', () => toggleDoor('right'));
    
    // Lights reveal the characters!
    function toggleLight(side) {
        if (GameState.power <= 0 || GameState.gameOver) return;
        const isLeft = side === 'left';
        if(isLeft) GameState.leftLightOn = true;
        else GameState.rightLightOn = true;
        document.getElementById(`btn-light-${side}`).classList.add('active');
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals();
    }
    function offLight(side) {
        const isLeft = side === 'left';
        if(isLeft) GameState.leftLightOn = false;
        else GameState.rightLightOn = false;
        document.getElementById(`btn-light-${side}`).classList.remove('active');
        updateUsage();
        if(typeof updateOfficeVisuals === 'function') updateOfficeVisuals();
    }
    
    document.getElementById('btn-light-left').addEventListener('mousedown', () => toggleLight('left'));
    document.getElementById('btn-light-left').addEventListener('mouseup', () => offLight('left'));
    document.getElementById('btn-light-left').addEventListener('mouseleave', () => offLight('left'));
    
    document.getElementById('btn-light-right').addEventListener('mousedown', () => toggleLight('right'));
    document.getElementById('btn-light-right').addEventListener('mouseup', () => offLight('right'));
    document.getElementById('btn-light-right').addEventListener('mouseleave', () => offLight('right'));

    // --- Mask & Cameras ---
    document.getElementById('btn-mask').addEventListener('click', () => {
        if(GameState.gameOver || GameState.power <= 0) return;
        GameState.isMaskOn = !GameState.isMaskOn;
        if (GameState.isMaskOn) {
            GameState.ui.maskOverlay.classList.remove('hidden');
            // lock center
            const maxScroll = GameState.ui.officeView.offsetWidth - document.getElementById('game-container').offsetWidth;
            GameState.ui.officeView.style.transform = `translateX(-${maxScroll/2}px)`; 
            
            if(GameState.isMonitorUp) {
                GameState.isMonitorUp = false;
                GameState.ui.cameraSystem.classList.add('hidden');
                updateUsage();
            }
        } else {
            GameState.ui.maskOverlay.classList.add('hidden');
            // Check immediately if we were killed while mask was requested off
            if(typeof checkOfficeDefense === 'function') checkOfficeDefense();
        }
    });

    let lastToggle = 0;
    function toggleCamera() {
        const now = Date.now();
        if (now - lastToggle < 300) return; // Debounce 300ms
        lastToggle = now;

        if (GameState.power <= 0 || GameState.isMaskOn || GameState.gameOver) return;
        GameState.isMonitorUp = !GameState.isMonitorUp;
        if (GameState.isMonitorUp) {
            GameState.ui.cameraSystem.classList.remove('hidden');
            if(typeof updateCameraView === 'function') updateCameraView();
        } else {
            GameState.ui.cameraSystem.classList.add('hidden');
        }
        updateUsage();
    }


    // --- Extras & Stars Initialization ---
    const night = GameState.night;
    const starsDiv = document.getElementById('menu-stars');
    
    let stars = "";
    if (night >= 6) stars += "⭐";
    if (night >= 7) stars += "⭐";
    starsDiv.innerText = stars;

    // Extras is now always unlocked by user request
    document.getElementById('btn-extras-hitbox')?.addEventListener('click', () => {
        document.getElementById('extras-screen').classList.remove('hidden');
        renderExtras();
    });

    document.getElementById('btn-quit-hitbox')?.addEventListener('click', () => {
        if(confirm("¿Seguro que quieres salir?")) window.close();
    });

    document.getElementById('btn-instructions-hitbox')?.addEventListener('click', () => {
        document.getElementById('instructions-screen').classList.remove('hidden');
    });





    document.getElementById('btn-extras')?.addEventListener('click', () => {
        document.getElementById('extras-screen').classList.remove('hidden');
        renderExtras();
    });

    document.getElementById('btn-close-extras')?.addEventListener('click', () => {
        document.getElementById('extras-screen').classList.add('hidden');
    });

    document.getElementById('btn-night-6')?.addEventListener('click', () => {
        GameState.night = 6;
        startGame();
    });

    document.getElementById('btn-custom-night')?.addEventListener('click', () => {
        document.getElementById('custom-night-screen').classList.remove('hidden');
        renderCustomNight();
    });

    document.getElementById('btn-close-custom')?.addEventListener('click', () => {
        document.getElementById('custom-night-screen').classList.add('hidden');
    });


    window.CustomAI = { andre: 0, gabo: 0, cardo: 0, gian: 0, piar: 0, alfaro: 0, picock: 0, peñones: 0 };

    function renderCustomNight() {
        const container = document.getElementById('ai-selectors');
        container.innerHTML = '';
        characters.forEach(char => {
            const row = document.createElement('div');
            row.innerHTML = `
                <label>${char.toUpperCase()}: <span id="val-${char}">0</span></label>
                <input type="range" min="0" max="20" value="0" oninput="updateCustomAI('${char}', this.value)">
            `;
            container.appendChild(row);
        });
    }

    window.updateCustomAI = (char, val) => {
        window.CustomAI[char] = parseInt(val);
        document.getElementById(`val-${char}`).innerText = val;
    };

    window.setChallenge = (name) => {
        if(name === '4/20') {
            ['andre', 'gabo', 'cardo', 'gian'].forEach(c => updateCustomAI(c, 20));
        } else if(name === 'SOLO DUCTOS') {
            ['piar', 'alfaro', 'picock'].forEach(c => updateCustomAI(c, 20));
        }
        renderCustomNight(); // refresh sliders
    };

    const characters = ['andre', 'gabo', 'cardo', 'gian', 'piar', 'alfaro', 'picock', 'peñones'];
    
    function renderExtras() {
        const container = document.getElementById('extras-content');
        container.innerHTML = '';
        characters.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'menu-text-link';
            btn.innerText = char.toUpperCase();
            btn.onclick = () => {
                document.getElementById('extras-main-img').src = `assets/img/${char}.png`;
                document.getElementById('extras-char-name').innerText = char.toUpperCase();
                document.getElementById('btn-preview-jumpscare').onclick = () => {
                    let scareSrc = `assets/img/${char}.png`;
                    if(char === 'piar' || char === 'alfaro') scareSrc = 'assets/img/jumscare piars.png';
                    triggerJumpscare(scareSrc);
                    // Hide the jumpscare screen after preview
                    setTimeout(() => {
                        document.getElementById('jumpscare-screen').classList.add('hidden');
                        document.getElementById('game-over-screen').classList.add('hidden');
                    }, 2000);
                };
            };
            container.appendChild(btn);
        });

        // Audio Test Section
        const audioTitle = document.createElement('h3');
        audioTitle.innerText = "PRUEBAS DE SONIDO (MATH-SYNTH)";
        audioTitle.style.width = "100%";
        audioTitle.style.textAlign = "center";
        container.appendChild(audioTitle);

        const btnSqueak = document.createElement('button');
        btnSqueak.className = 'menu-btn-text';
        btnSqueak.innerText = "PITO PELUCHE";
        btnSqueak.onclick = () => AudioSynth.playSqueak();
        container.appendChild(btnSqueak);

        const btnAmbient = document.createElement('button');
        btnAmbient.className = 'menu-btn-text';
        btnAmbient.innerText = "ZUMBIDO AMBIENTE";
        btnAmbient.onclick = () => AudioSynth.playAmbient();
        container.appendChild(btnAmbient);

        const btnPower = document.createElement('button');
        btnPower.className = 'menu-btn-text';
        btnPower.innerText = "CANCIÓN APAGÓN";
        btnPower.onclick = () => AudioSynth.playPowerOut();
        container.appendChild(btnPower);
    }

    document.getElementById('btn-camera').addEventListener('click', toggleCamera);

    document.getElementById('btn-camera-close').addEventListener('click', toggleCamera);

    // --- Picock Duct Interaction ---
    document.getElementById('duct-character').addEventListener('click', (e) => {
        if (e.target.src.includes('picock.png')) {
            retreatEnemy("picock");
        }
    });

    // --- Core View Update Functions ---
    window.updateCameraView = function() {
        if(!GameState.isMonitorUp) return;
        
        // PEÑONES CAM_ALL PHANTOM (Special Mechanic)
        if (AIManager.positions['peñones'] === 'cam_all') {
            document.getElementById('camera-room').style.backgroundImage = `url('assets/img/peñones.png')`;
            document.getElementById('camera-room').style.backgroundSize = 'contain';
            document.getElementById('camera-room').style.backgroundPosition = 'center';
            document.getElementById('camera-room').style.backgroundRepeat = 'no-repeat';
            document.getElementById('camera-room').innerHTML = ''; // Hide normal markers
            return;
        }

        // Normal Camera View
        document.getElementById('camera-room').style.backgroundImage = `url('assets/img/${GameState.currentCamera}.png')`;
        document.getElementById('camera-room').style.backgroundSize = 'cover';
        document.getElementById('camera-room').innerHTML = ''; // Clear chars

        // Render enemies in this room without overlapping
        let enemiesInRoom = Object.keys(AIManager.positions).filter(e => AIManager.positions[e] === GameState.currentCamera);
        
        enemiesInRoom.forEach((enemy, index) => {
            const img = document.createElement('img');
            img.src = `assets/img/${enemy}.png`;
            img.className = 'cam-enemy-render';
            
            // Offset logic to avoid stacking
            const offsetWidth = 100 / (enemiesInRoom.length + 1);
            img.style.left = `${(index + 1) * offsetWidth}%`;
            img.style.width = `${60 / enemiesInRoom.length}%`; // Scale down if many
            img.style.height = 'auto';
            img.style.bottom = '5%';
            
            document.getElementById('camera-room').appendChild(img);
        });
    }

    window.updateOfficeVisuals = function() {
        // Logic for hallway light revealing enemies
        const leftScare = (GameState.leftLightOn && AIManager.doorLeftState);
        const rightScare = (GameState.rightLightOn && AIManager.doorRightState);
        
        const leftEl = document.getElementById('door-left-character');
        const rightEl = document.getElementById('door-right-character');

        if (leftScare) {
            leftEl.src = `assets/img/${AIManager.doorLeftState}.png`;
            leftEl.classList.remove('hidden');
        } else {
            leftEl.classList.add('hidden');
        }

        if (rightScare) {
            rightEl.src = `assets/img/${AIManager.doorRightState}.png`;
            rightEl.classList.remove('hidden');
        } else {
            rightEl.classList.add('hidden');
        }
    }

    window.checkOfficeDefense = function() {
        // If there's an enemy in office when taking mask off...
        if (!GameState.isMaskOn && AIManager.officeState.length > 0) {
            triggerJumpscare(`assets/img/${AIManager.officeState[0]}.png`);
        }
    }

    window.retreatEnemy = function(enemy) {
        // Reset enemy to start
        AIManager.positions[enemy] = EnemyStarts[enemy];
        if (AIManager.ductState === enemy) {
            AIManager.ductState = null;
            document.getElementById('duct-character').classList.add('hidden');
        }
    }

    window.startAI = function() {
        AIManager.init();
    }

    window.escalateAI = function() {
        // Optional: Increase difficulty slightly every hour logic can go here
    }

    // --- Plushie Squeak ---
    document.getElementById('office-plushie').addEventListener('click', () => {
        AudioSynth.playSqueak();
    });

    // --- Camera Minimap Navigation ---

    GameState.currentCamera = 'cam1';
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            GameState.currentCamera = btn.dataset.cam;
            updateCameraView();
        });
    });
});
