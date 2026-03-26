const AudioSynth = {
    ctx: null,
    ambientNode: null,
    staticNode: null,

    init: function() {
        if (!AudioSynth.ctx) {
            AudioSynth.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (AudioSynth.ctx.state === 'suspended') {
            AudioSynth.ctx.resume();
        }
    },

    // Generador de Ruido (White, Pink, Brown)
    createNoiseBuffer: function(type = 'white') {
        const bufferSize = AudioSynth.ctx.sampleRate * 2;
        const buffer = AudioSynth.ctx.createBuffer(1, bufferSize, AudioSynth.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
            if (type === 'white') {
                output[i] = Math.random() * 2 - 1;
            } else if (type === 'brown') {
                let white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // boost volume
            }
        }
        return buffer;
    },

    playAmbient: function() {
        AudioSynth.init();
        if (AudioSynth.ambientNode) return; // Ya está sonando

        const ctx = AudioSynth.ctx;
        // Hum base (60Hz)
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(55, ctx.currentTime);
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();

        // Ruido Marrón (Ambiente pesado)
        const noise = ctx.createBufferSource();
        noise.buffer = AudioSynth.createNoiseBuffer('brown');
        noise.loop = true;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.03, ctx.currentTime);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();

        AudioSynth.ambientNode = { osc: o, noise: noise };
    },

    playStatic: function(active = true) {
        AudioSynth.init();
        if (!active) {
            if (AudioSynth.staticNode) {
                AudioSynth.staticNode.stop();
                AudioSynth.staticNode = null;
            }
            return;
        }
        if (AudioSynth.staticNode) return;

        const ctx = AudioSynth.ctx;
        const noise = ctx.createBufferSource();
        noise.buffer = AudioSynth.createNoiseBuffer('white');
        noise.loop = true;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        noise.connect(g);
        g.connect(ctx.destination);
        noise.start();
        AudioSynth.staticNode = noise;
    },

    playJumpscare: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;

        // Grito sintetizado (Frecuencia alta + Ruido)
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(100, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
        o.frequency.linearRampToValueAtTime(80, ctx.currentTime + 1.5);
        
        g.gain.setValueAtTime(1.0, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        const noise = ctx.createBufferSource();
        noise.buffer = AudioSynth.createNoiseBuffer('white');
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        o.connect(g);
        g.connect(ctx.destination);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        o.start();
        noise.start();
        o.stop(ctx.currentTime + 1.5);
        noise.stop(ctx.currentTime + 1.5);
    },

    playStep: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(80, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.8, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.3);
    },

    playBeep: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1000, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.1);
    },

    playDoor: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const noise = ctx.createBufferSource();
        noise.buffer = AudioSynth.createNoiseBuffer('white');
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        noise.connect(g);
        g.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + 0.5);
    }
};
