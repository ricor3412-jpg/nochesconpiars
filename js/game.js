const GameState = {
    time: 12, power: 100, usage: 1, 
    night: parseInt(localStorage.getItem('cnp_night')) || 1,
    isMaskOn: false, isMonitorUp: false,
    leftDoorClosed: false, rightDoorClosed: false,
    leftLightOn: false, rightLightOn: false,
    gameOver: false, gameStarted: false,
    ui: {}
};

const SubtitleText = {
    1: [
        {time: 2000, text: "*Timbre de teléfono...*"},
        {time: 5000, text: "Ah, hola, hola. Bienvenido a tu nuevo trabajo de verano en la pizzería de los Piar."},
        {time: 10000, text: "No te preocupes por los rumores, estarás bien."},
        {time: 14000, text: "Solo revisa las cámaras, y si ves a alguien cerca en la puerta, ciérrala con el botón DOOR."},
        {time: 20000, text: "Ah, y si bajan por el techo frente a ti, ponte la máscara rápido."},
        {time: 25000, text: "Recuerda cuidar tu energía, las puertas y monitor gastan mucho. Buena suerte."},
        {time: 31000, text: ""}
    ],
    2: [
        {time: 2000, text: "*Timbre de teléfono...*"},
        {time: 5000, text: "Hola, llegaste a la noche 2."},
        {time: 8000, text: "Hoy estarán mucho más activos, recuerda que algunos atacan muy rápido."},
        {time: 14000, text: "No pierdas de vista la cámara 1 y las puertas. Adiós."},
        {time: 18000, text: ""}
    ]
};

function startPhoneCall() {
    let script = SubtitleText[GameState.night];
    const audio = document.getElementById(`audio-phone${GameState.night}`);
    if(audio) audio.play().catch(e => console.log('Audio autoplay blocked', e));

    if(!script) return;
    
    const subBox = document.getElementById('subtitle-box');
    subBox.classList.remove('hidden');
    
    script.forEach(line => {
        setTimeout(() => {
            if(!GameState.gameOver) {
                if(line.text === "") subBox.classList.add('hidden');
                else subBox.innerHTML = line.text;
            } else {
                subBox.classList.add('hidden');
            }
        }, line.time);
    });
}

function updateUsage() {
    let usage = 1;
    if (GameState.leftDoorClosed) usage++;
    if (GameState.rightDoorClosed) usage++;
    if (GameState.isMonitorUp) usage++;
    if (GameState.leftLightOn) usage++;
    if (GameState.rightLightOn) usage++;
    GameState.usage = usage;
    
    let blocks = '';
    for(let i=0; i<usage; i++) blocks += '🟩';
    GameState.ui.usageDisplay.innerHTML = `Uso: ${blocks}`;
}

function updatePower() {
    if (GameState.power <= 0 || GameState.gameOver || !GameState.gameStarted) return;
    
    // Scaling drain rates
    const drainRates = [0, 8000, 4500, 2500, 1500, 800];
    const rate = drainRates[GameState.usage] || 8000;
    
    setTimeout(() => {
        if (!GameState.gameOver && GameState.power > 0) {
            GameState.power -= 1;
            GameState.ui.powerDisplay.innerText = `Energía: ${GameState.power}%`;
            
            if (GameState.power <= 0) {
                powerOutage();
            } else {
                updatePower();
            }
        }
    }, rate);
}

function powerOutage() {
    GameState.leftDoorClosed = false;
    GameState.rightDoorClosed = false;
    GameState.leftLightOn = false;
    GameState.rightLightOn = false;
    GameState.isMonitorUp = false;
    
    GameState.ui.leftDoor.classList.replace('closed', 'open');
    GameState.ui.rightDoor.classList.replace('closed', 'open');
    document.querySelectorAll('.panel-btn').forEach(b => b.classList.remove('active'));
    
    GameState.ui.cameraSystem.classList.add('hidden');
    document.getElementById('office-bg').style.filter = 'brightness(0.05)'; 
    
    // Iniciar secuencia de ojos brillantes
    setTimeout(() => {
        if (GameState.gameOver) return;
        AudioSynth.playPowerOut(); // "Toreador March" Math-style
        const eyes = document.createElement('div');
        eyes.style.position = 'absolute';
        eyes.style.left = '10%'; eyes.style.top = '40%';
        eyes.style.width = '100px'; eyes.style.height = '40px';
        eyes.style.background = 'radial-gradient(circle, #fff 10%, #000 80%)';
        eyes.style.filter = 'blur(5px) drop-shadow(0 0 10px white)';
        eyes.style.zIndex = '100';
        eyes.id = 'power-out-eyes';
        document.getElementById('office-view').appendChild(eyes);
        
        setTimeout(() => {
            if(!GameState.gameOver) {
                document.getElementById('power-out-eyes')?.remove();
                triggerJumpscare('assets/img/peñones.png');
            }
        }, 5000); // 5 segundos de tensión
    }, 2000);
}

function updateTime() {
    if(GameState.gameOver || !GameState.gameStarted) return;
    setTimeout(() => {
        if (!GameState.gameOver) {
            GameState.time += 1;
            if (GameState.time === 13) GameState.time = 1;
            GameState.ui.timeDisplay.innerText = `${GameState.time} AM`;
            
            // Progressive AI escalation intra-night
            if(window.escalateAI) window.escalateAI();
            
            if (GameState.time === 6) {
                winNight();
            } else {
                updateTime();
            }
        }
    }, 55000); // 55s = 1 in-game hour
}

function triggerJumpscare(imageSrc) {
    if(GameState.gameOver) return;
    GameState.gameOver = true;
    
    // Especial Piar/Alfaro check
    if(imageSrc.includes('piar.png') || imageSrc.includes('alfaro.png')) {
        imageSrc = 'assets/img/jumscare piars.png';
    }

    const audio = document.getElementById('audio-jumpscare');
    if(audio) { 
        audio.src = 'assets/audio/jumpscare.wav'; // Fix missing audio6.wav
        audio.currentTime = 0; 
        audio.volume = 1.0; 
        audio.play().catch(e=>console.log(e)); 
    }

    const scareScreen = document.getElementById('jumpscare-screen');
    document.getElementById('jumpscare-img').src = imageSrc;
    scareScreen.classList.remove('hidden');
    
    setTimeout(() => {
        scareScreen.classList.add('hidden');
        if (Math.random() < 0.2) { // 20% de probabilidad de minijuego
            Minigame.init();
        } else {
            document.getElementById('game-over-screen').classList.remove('hidden');
        }
    }, 2000);
}

function winNight() {
    GameState.gameOver = true;
    const nightWon = GameState.night;
    GameState.night += 1;
    localStorage.setItem('cnp_night', GameState.night);
    
    // Mensaje de victoria tematizado
    if (nightWon === 5) {
        showEnding("Has sobrevivido a la semana reglamentaria. ¡Felicidades por tu cheque de pago!");
    } else if (nightWon === 6) {
        alert("¡Increíble! Has sobrevivido a la NOCHE 6 EXTRA.");
        location.reload();
    } else if (nightWon === 7) {
        showEnding("HAS SUPERADO EL DESAFÍO DEFINITIVO. Eres una leyenda de Los Piar.");
    } else {
        alert(`¡6 AM! Avanzas a la Noche ${GameState.night}.`);
        location.reload();
    }
}

function showEnding(msg) {
    document.getElementById('office-scene').classList.add('hidden');
    document.getElementById('ending-screen').classList.remove('hidden');
    document.getElementById('ending-msg').innerText = msg;
}


function startGame() {
    const night = GameState.night;
    
    // 1. Mostrar Periódico con Lore
    document.getElementById('main-menu').classList.add('hidden');
    const newsScreen = document.getElementById('newspaper-screen');
    newsScreen.classList.remove('hidden');
    
    // Personalizar texto según la noche (Opcional)
    if (night === 1) {
        document.getElementById('news-title').innerText = "GRAN APERTURA DE LOS PIAR";
        document.getElementById('news-body').innerText = "La pizzería local abre sus puertas con tecnología de punta. Los animatrónicos prometen diversión segura... o eso dicen los rumores del personal nocturno anterior.";
    } else if (night === 6) {
        document.getElementById('news-title').innerText = "¡NOCHE FINAL!";
        document.getElementById('news-body').innerText = "Algo anda muy mal. Los sistemas están al límite y la empresa no se hace responsable de desapariciones. Sobrevive una última vez.";
    } else {
        document.getElementById('news-title').innerText = `NOCHE ${night}`;
        document.getElementById('news-body').innerText = "El turno nocturno continúa. Los incidentes aislados no han detenido la operación. Mantén la calma.";
    }

    // Al hacer clic en el periódico -> Pantalla de Carga
    newsScreen.onclick = () => {
        newsScreen.classList.add('hidden');
        const loadScreen = document.getElementById('loading-screen');
        loadScreen.classList.remove('hidden');
        
        setTimeout(() => {
            loadScreen.classList.add('hidden');
            GameState.gameStarted = true;
            GameState.gameOver = false;
            GameState.power = 100;
            GameState.time = 12;
            document.getElementById('night-display').innerText = `Noche ${GameState.night}`;
            updateUsage();
            
            document.getElementById('office-scene').classList.remove('hidden');
            
            startPhoneCall();
            updatePower();
            updateTime();
            AudioSynth.playAmbient();
            
            if (typeof startAI === "function") startAI();
        }, 3000); // 3 Segundos de carga
    };
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-night-display').innerText = GameState.night;
    document.getElementById('btn-mute')?.addEventListener('click', () => {
        const p1 = document.getElementById('audio-phone1');
        const p2 = document.getElementById('audio-phone2');
        if(p1) { p1.pause(); p1.currentTime = 0; }
        if(p2) { p2.pause(); p2.currentTime = 0; }
        document.getElementById('btn-mute').style.display = 'none';
    });
});
