const AudioSynth = {
    ctx: null,
    init: function() {
        if (!AudioSynth.ctx) {
            AudioSynth.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (AudioSynth.ctx.state === 'suspended') {
            AudioSynth.ctx.resume();
        }
    },
    
    playSqueak: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        
        o.type = 'triangle';
        o.frequency.setValueAtTime(800, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
        
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.2);
    },
    
    playAmbient: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        
        o.type = 'sine';
        o.frequency.setValueAtTime(60, ctx.currentTime); // 60Hz hum
        
        g.gain.setValueAtTime(0.05, ctx.currentTime); // Low volume
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        return o; // To stop it later
    },

    playPowerOut: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        
        o.type = 'sine';
        o.frequency.setValueAtTime(440, ctx.currentTime);
        // Toreador style tune (simplified)
        [440, 554, 659, 440].forEach((f, i) => {
            o.frequency.setValueAtTime(f, ctx.currentTime + (i * 0.5));
        });
        
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 2.5);
    },

    playStep: function() {
        AudioSynth.init();
        const ctx = AudioSynth.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        
        o.type = 'sine';
        o.frequency.setValueAtTime(80, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.3);
    }
};

