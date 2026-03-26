const Minigame = {
    canvas: null,
    ctx: null,
    active: false,
    player: { x: 50, y: 50, speed: 2 },
    ghost: { x: 200, y: 200 },
    
    init: function() {
        Minigame.canvas = document.getElementById('minigame-canvas');
        Minigame.ctx = Minigame.canvas.getContext('2d');
        Minigame.active = true;
        
        document.getElementById('minigame-screen').classList.remove('hidden');
        
        // Loop
        requestAnimationFrame(Minigame.loop);
        
        // Basic movement
        window.onkeydown = (e) => {
            if (e.key === 'ArrowUp') Minigame.player.y -= 10;
            if (e.key === 'ArrowDown') Minigame.player.y += 10;
            if (e.key === 'ArrowLeft') Minigame.player.x -= 10;
            if (e.key === 'ArrowRight') Minigame.player.x += 10;
        };
    },
    
    loop: function() {
        if (!Minigame.active) return;
        
        const ctx = Minigame.ctx;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 400, 400);
        
        // Draw Player (Pixel Piar)
        ctx.fillStyle = 'blue';
        ctx.fillRect(Minigame.player.x, Minigame.player.y, 20, 20);
        
        // Draw Ghost
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(Minigame.ghost.x, Minigame.ghost.y, 20, 20);
        
        // Atari text
        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText("SIGUELO...", 20, 40);
        
        // Win condition
        if (Math.abs(Minigame.player.x - Minigame.ghost.x) < 20 && Math.abs(Minigame.player.y - Minigame.ghost.y) < 20) {
            Minigame.win();
        }
        
        requestAnimationFrame(Minigame.loop);
    },
    
    win: function() {
        Minigame.active = false;
        alert("HAS VISTO ALGO QUE NO DEBÍAS...");
        location.reload();
    }
};
