// ============================================================
// Ed Runner - Endless runner game
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;
    const HIGH_SCORE_KEY = 'dino-runner-high';

    // Constants
    const GROUND_HEIGHT_RATIO = 0.75;
    const GRAVITY = 0.55;
    const JUMP_FORCE = -11;
    const INITIAL_SPEED = 3;
    const MAX_SPEED = 11;
    const SPEED_INCREMENT = 0.0005;
    const OBSTACLE_MIN_GAP = 200;
    const OBSTACLE_MAX_GAP = 500;
    const DEATH_LOCKOUT_MS = 600;
    const DINO_WIDTH = 40;
    const DINO_HEIGHT = 44;
    const DINO_DUCK_HEIGHT = 26;
    const DINO_DUCK_WIDTH = 55;
    const CACTUS_SMALL_W = 16;
    const CACTUS_SMALL_H = 34;
    const CACTUS_LARGE_W = 24;
    const CACTUS_LARGE_H = 46;
    const BIRD_W = 40;
    const BIRD_H = 38;

    // State
    let els = {};
    let gameState = 'idle';
    let animationId = null;
    let score = 0;
    let highScore = 0;
    let speed = INITIAL_SPEED;
    let frameCount = 0;
    let deathTimestamp = 0;
    let dino = {};
    let obstacles = [];
    let particles = [];
    let groundOffset = 0;
    let W = 0, H = 0, groundY = 0;
    let jumpPressed = false;
    let duckPressed = false;
    let scaledJumpForce = JUMP_FORCE;
    let scaledGravity = GRAVITY;

    // Bound handlers
    let handlers = {};

    function colors() {
        return {
            ground: GU.getColor('--border'),
            obstacle: GU.getColor('--accent-green'),
            bird: '#e53e3e',
            particle: GU.getColor('--accent'),
            bg: GU.getColor('--bg-card'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            shirt: GU.getColor('--accent-light')
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        highScore = GU.getHighScore(HIGH_SCORE_KEY);

        handlers = {
            keydown: onKeyDown,
            keyup: onKeyUp,
            touchstart: onTouchStart,
            mousedown: onMouseDown,
            mouseup: onMouseUp,
            contextmenu: (e) => e.preventDefault(),
            resize: resize,
            mobileJump: onMobileJump,
            mobileJumpEnd: onMobileJumpEnd,
            mobileDuck: onMobileDuck,
            mobileDuckEnd: onMobileDuckEnd
        };

        els.canvas.addEventListener('keydown', handlers.keydown);
        els.canvas.addEventListener('keyup', handlers.keyup);
        els.canvas.addEventListener('touchstart', handlers.touchstart, { passive: false });
        els.wrapper.addEventListener('mousedown', handlers.mousedown);
        els.wrapper.addEventListener('mouseup', handlers.mouseup);
        els.wrapper.addEventListener('contextmenu', handlers.contextmenu);
        window.addEventListener('resize', handlers.resize);

        const jumpBtn = document.getElementById('mobile-jump-btn');
        const duckBtn = document.getElementById('mobile-duck-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', handlers.mobileJump, { passive: false });
            jumpBtn.addEventListener('touchend', handlers.mobileJumpEnd, { passive: false });
        }
        if (duckBtn) {
            duckBtn.addEventListener('touchstart', handlers.mobileDuck, { passive: false });
            duckBtn.addEventListener('touchend', handlers.mobileDuckEnd, { passive: false });
        }

        GU.focusCanvas(els);
        resize();
        resetGame();
        GU.showOverlay(els, 'Ed Runner', 'Jump over obstacles to survive', 'Press Space or Tap to Start', false);
        els.highScoreEl.textContent = `HI ${highScore}`;
        draw();
    }

    function destroy() {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        gameState = 'idle';

        els.canvas.removeEventListener('keydown', handlers.keydown);
        els.canvas.removeEventListener('keyup', handlers.keyup);
        els.canvas.removeEventListener('touchstart', handlers.touchstart);
        els.wrapper.removeEventListener('mousedown', handlers.mousedown);
        els.wrapper.removeEventListener('mouseup', handlers.mouseup);
        els.wrapper.removeEventListener('contextmenu', handlers.contextmenu);
        window.removeEventListener('resize', handlers.resize);

        const jumpBtn = document.getElementById('mobile-jump-btn');
        const duckBtn = document.getElementById('mobile-duck-btn');
        if (jumpBtn) {
            jumpBtn.removeEventListener('touchstart', handlers.mobileJump);
            jumpBtn.removeEventListener('touchend', handlers.mobileJumpEnd);
        }
        if (duckBtn) {
            duckBtn.removeEventListener('touchstart', handlers.mobileDuck);
            duckBtn.removeEventListener('touchend', handlers.mobileDuckEnd);
        }
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;
        groundY = H * GROUND_HEIGHT_RATIO;

        // Scale jump force to canvas height so jump arc stays proportional
        const heightScale = H / 180; // 180 is the reference height
        scaledJumpForce = JUMP_FORCE * Math.min(heightScale, 1.2);
        scaledGravity = GRAVITY * Math.min(heightScale, 1.2);

        dino.x = W * 0.08;
        dino.groundY = groundY - DINO_HEIGHT;
        if (gameState !== 'playing') draw();
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0; speed = INITIAL_SPEED; frameCount = 0;
        obstacles = []; particles = []; groundOffset = 0;
        jumpPressed = false; duckPressed = false;
        dino = {
            x: W * 0.08, y: groundY - DINO_HEIGHT, groundY: groundY - DINO_HEIGHT,
            vy: 0, width: DINO_WIDTH, height: DINO_HEIGHT,
            ducking: false, grounded: true, blinkTimer: 0, legFrame: 0, legTimer: 0
        };
    }

    function startGame() {
        if (gameState === 'playing') return;
        if (Date.now() - deathTimestamp < DEATH_LOCKOUT_MS) return;
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        resize(); // Ensure dimensions are correct before starting
        resetGame();
        gameState = 'playing';
        GU.hideOverlay(els);
        els.hud.classList.add('visible');
        els.canvas.focus();
        loop();
    }

    function die() {
        gameState = 'dead';
        deathTimestamp = Date.now();
        if (score > highScore) {
            highScore = score;
            GU.setHighScore(HIGH_SCORE_KEY, highScore);
        }
        els.highScoreEl.textContent = `HI ${highScore}`;
        els.scoreEl.textContent = score;

        for (let i = 0; i < 8; i++) {
            particles.push({
                x: dino.x + dino.width / 2, y: dino.y + dino.height / 2,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 1) * 5, life: 1
            });
        }
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

        let particleFrames = 0;
        function deathAnimation() {
            updateParticles(); draw(); particleFrames++;
            if (particleFrames < 20) requestAnimationFrame(deathAnimation);
            else GU.showOverlay(els, 'Game Over', `Score: ${score}`, 'Press Space or Tap to Restart', true);
        }
        deathAnimation();
    }

    // ============================================================
    // Game Loop
    // ============================================================
    function loop() {
        if (gameState !== 'playing') return;
        update(); updateParticles(); draw();
        animationId = requestAnimationFrame(loop);
    }

    function update() {
        frameCount++;
        speed = Math.min(MAX_SPEED, INITIAL_SPEED + frameCount * SPEED_INCREMENT);
        score = Math.floor(frameCount / 3);
        els.scoreEl.textContent = score;
        groundOffset = (groundOffset + speed) % 20;

        if (jumpPressed && dino.grounded) { dino.vy = scaledJumpForce; dino.grounded = false; }

        dino.ducking = duckPressed && dino.grounded;
        if (dino.ducking) {
            dino.width = DINO_DUCK_WIDTH; dino.height = DINO_DUCK_HEIGHT;
            dino.groundY = groundY - DINO_DUCK_HEIGHT;
        } else {
            dino.width = DINO_WIDTH; dino.height = DINO_HEIGHT;
            dino.groundY = groundY - DINO_HEIGHT;
        }

        if (duckPressed && !dino.grounded) dino.vy += scaledGravity * 0.5;
        dino.vy += scaledGravity; dino.y += dino.vy;
        if (dino.y >= dino.groundY) { dino.y = dino.groundY; dino.vy = 0; dino.grounded = true; }

        dino.legTimer++;
        if (dino.legTimer > 6) { dino.legTimer = 0; dino.legFrame = (dino.legFrame + 1) % 2; }
        dino.blinkTimer++;

        spawnObstacles(); updateObstacles(); checkCollision();
    }

    // ============================================================
    // Obstacles
    // ============================================================
    function spawnObstacles() {
        if (frameCount < 60) return;
        const lastObs = obstacles[obstacles.length - 1];
        const gap = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);
        if (lastObs && lastObs.x > W - gap) return;

        const type = getObstacleType();
        const extra = Math.random() * 60;

        if (type === 'cactus-small') {
            obstacles.push({ type: 'cactus', x: W + 20 + extra, y: groundY - CACTUS_SMALL_H, width: CACTUS_SMALL_W, height: CACTUS_SMALL_H });
        } else if (type === 'cactus-large') {
            obstacles.push({ type: 'cactus', x: W + 20 + extra, y: groundY - CACTUS_LARGE_H, width: CACTUS_LARGE_W, height: CACTUS_LARGE_H });
        } else if (type === 'cactus-group') {
            obstacles.push({ type: 'cactus', x: W + 20 + extra, y: groundY - CACTUS_SMALL_H, width: CACTUS_SMALL_W * 2.5, height: CACTUS_SMALL_H });
        } else {
            // Two distinct heights: high (must duck) or low (must jump)
            const highBird = groundY - BIRD_H - DINO_HEIGHT * 0.6; // Above standing Ed - duck under
            const lowBird = groundY - BIRD_H - 2; // Ground level - jump over
            const birdY = Math.random() > 0.5 ? highBird : lowBird;
            obstacles.push({ type: 'bird', x: W + 20 + extra, y: birdY, width: BIRD_W, height: BIRD_H, wingFrame: 0, wingTimer: 0 });
        }
    }

    function getObstacleType() {
        const rand = Math.random();
        if (score > 100 && rand < 0.2) return 'bird';
        if (rand < 0.5) return 'cactus-small';
        if (rand < 0.8) return 'cactus-large';
        return 'cactus-group';
    }

    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= speed;
            if (obstacles[i].type === 'bird') {
                obstacles[i].wingTimer++;
                if (obstacles[i].wingTimer > 12) { obstacles[i].wingTimer = 0; obstacles[i].wingFrame = (obstacles[i].wingFrame + 1) % 2; }
            }
            if (obstacles[i].x + obstacles[i].width < -20) obstacles.splice(i, 1);
        }
    }

    function checkCollision() {
        const pad = 6;
        const dx = dino.x + pad, dy = dino.y + pad, dw = dino.width - pad * 2, dh = dino.height - pad * 2;
        for (const obs of obstacles) {
            const ox = obs.x + 2, oy = obs.y + 2, ow = obs.width - 4, oh = obs.height - 4;
            if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) { die(); return; }
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.025;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;
        ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
        drawGround(ctx, c);
        for (const obs of obstacles) { obs.type === 'cactus' ? drawCactus(ctx, obs, c) : drawBird(ctx, obs, c); }
        drawDino(ctx, c);
        for (const p of particles) { ctx.globalAlpha = p.life; ctx.fillStyle = c.particle; ctx.fillRect(p.x, p.y, 4, 4); }
        ctx.globalAlpha = 1;
    }

    function drawGround(ctx, c) {
        ctx.strokeStyle = c.ground; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
        ctx.fillStyle = c.ground;
        for (let x = -groundOffset; x < W; x += 20) { ctx.fillRect(x, groundY + 8 + Math.sin(x * 0.1) * 3, 2, 1); }
    }

    function drawDino(ctx, c) {
        const x = dino.x, y = dino.y;
        if (dino.ducking) {
            ctx.fillStyle = c.shirt; ctx.fillRect(x, y + 8, DINO_DUCK_WIDTH - 10, 14);
            ctx.fillStyle = c.skin; ctx.fillRect(x + DINO_DUCK_WIDTH - 22, y, 18, 14);
            ctx.fillStyle = c.hair; ctx.fillRect(x + DINO_DUCK_WIDTH - 22, y - 2, 18, 5);
            ctx.fillStyle = c.glasses;
            ctx.fillRect(x + DINO_DUCK_WIDTH - 18, y + 5, 6, 4);
            ctx.fillRect(x + DINO_DUCK_WIDTH - 10, y + 5, 6, 4);
            ctx.fillRect(x + DINO_DUCK_WIDTH - 12, y + 6, 2, 2);
            ctx.fillStyle = '#3d3d5c';
            if (dino.legFrame === 0) { ctx.fillRect(x + 6, y + DINO_DUCK_HEIGHT - 6, 6, 6); ctx.fillRect(x + 20, y + DINO_DUCK_HEIGHT - 4, 6, 4); }
            else { ctx.fillRect(x + 6, y + DINO_DUCK_HEIGHT - 4, 6, 4); ctx.fillRect(x + 20, y + DINO_DUCK_HEIGHT - 6, 6, 6); }
        } else {
            ctx.fillStyle = c.hair; ctx.fillRect(x + 10, y, 22, 6); ctx.fillRect(x + 8, y + 3, 3, 4);
            ctx.fillStyle = c.skin; ctx.fillRect(x + 10, y + 5, 22, 16);
            ctx.fillStyle = c.glasses;
            ctx.fillRect(x + 12, y + 9, 7, 5); ctx.fillRect(x + 21, y + 9, 7, 5);
            ctx.fillRect(x + 19, y + 10, 2, 3); ctx.fillRect(x + 9, y + 10, 3, 2); ctx.fillRect(x + 28, y + 10, 3, 2);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 14, y + 10, 3, 3); ctx.fillRect(x + 23, y + 10, 3, 3);
            ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 15, y + 11, 2, 2); ctx.fillRect(x + 24, y + 11, 2, 2);
            if (dino.blinkTimer % 120 >= 110) { ctx.fillStyle = c.glasses; ctx.fillRect(x + 14, y + 11, 3, 1); ctx.fillRect(x + 23, y + 11, 3, 1); }
            ctx.fillStyle = c.skin; ctx.fillRect(x + 17, y + 21, 8, 3);
            ctx.fillStyle = c.shirt; ctx.fillRect(x + 10, y + 23, 22, 12);
            ctx.fillStyle = c.skin;
            if (!dino.grounded) { ctx.fillRect(x + 6, y + 20, 5, 10); ctx.fillRect(x + 31, y + 20, 5, 10); }
            else if (dino.legFrame === 0) { ctx.fillRect(x + 6, y + 24, 5, 10); ctx.fillRect(x + 31, y + 26, 5, 8); }
            else { ctx.fillRect(x + 6, y + 26, 5, 8); ctx.fillRect(x + 31, y + 24, 5, 10); }
            ctx.fillStyle = '#3d3d5c'; ctx.fillRect(x + 12, y + 35, 8, 4); ctx.fillRect(x + 22, y + 35, 8, 4);
            if (!dino.grounded) { ctx.fillRect(x + 13, y + 39, 6, 5); ctx.fillRect(x + 23, y + 39, 6, 5); }
            else if (dino.legFrame === 0) { ctx.fillRect(x + 11, y + 39, 7, 5); ctx.fillRect(x + 24, y + 37, 7, 5); }
            else { ctx.fillRect(x + 11, y + 37, 7, 5); ctx.fillRect(x + 24, y + 39, 7, 5); }
        }
    }

    function drawCactus(ctx, obs, c) {
        ctx.fillStyle = c.obstacle;
        if (obs.width > 30) {
            const spacing = obs.width / 3;
            for (let i = 0; i < 3; i++) { const cx = obs.x + i * spacing; ctx.fillRect(cx + 4, obs.y, 8, obs.height); ctx.fillRect(cx, obs.y + 8, 5, 4); ctx.fillRect(cx + 11, obs.y + 14, 5, 4); }
        } else {
            ctx.fillRect(obs.x + obs.width * 0.25, obs.y, obs.width * 0.5, obs.height);
            ctx.fillRect(obs.x, obs.y + obs.height * 0.2, obs.width * 0.3, 5);
            ctx.fillRect(obs.x + obs.width * 0.7, obs.y + obs.height * 0.4, obs.width * 0.3, 5);
            ctx.fillRect(obs.x + obs.width * 0.15, obs.y, obs.width * 0.7, 4);
        }
    }

    function drawBird(ctx, obs, c) {
        const x = obs.x, y = obs.y;
        ctx.fillStyle = c.bird; ctx.fillRect(x + 8, y + 8, 24, 14); ctx.fillRect(x + 28, y + 5, 12, 14);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 30, y + 6, 8, 2); ctx.fillRect(x + 29, y + 5, 3, 2); ctx.fillRect(x + 37, y + 5, 3, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 31, y + 9, 4, 4); ctx.fillRect(x + 36, y + 9, 4, 4);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 32, y + 10, 2, 2); ctx.fillRect(x + 37, y + 10, 2, 2);
        ctx.fillStyle = '#f6a623'; ctx.fillRect(x + 40, y + 12, 6, 3); ctx.fillRect(x + 40, y + 15, 4, 2);
        ctx.fillStyle = '#c53030';
        if (obs.wingFrame === 0) { ctx.fillRect(x + 12, y, 16, 8); ctx.fillRect(x + 14, y - 3, 10, 4); }
        else { ctx.fillRect(x + 12, y + 20, 16, 8); ctx.fillRect(x + 14, y + 26, 10, 4); }
        ctx.fillStyle = c.bird; ctx.fillRect(x, y + 10, 10, 4); ctx.fillRect(x - 2, y + 8, 6, 3); ctx.fillRect(x - 2, y + 14, 6, 3);
    }

    // ============================================================
    // Input
    // ============================================================
    function onKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault(); if (e.repeat) return;
            if (gameState === 'dead' || gameState === 'idle') startGame();
            else if (gameState === 'playing' && dino.grounded) jumpPressed = true;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); duckPressed = true; }
    }

    function onKeyUp(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jumpPressed = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') duckPressed = false;
    }

    function onMouseDown(e) {
        if (e.target.closest('.game-overlay, .game-start-btn, .game-select-btn')) return;
        if (e.button === 2) { if (gameState === 'playing') duckPressed = true; return; }
        if (gameState === 'dead' || gameState === 'idle') { startGame(); els.canvas.focus(); }
        else if (gameState === 'playing' && dino.grounded) { jumpPressed = true; setTimeout(() => { jumpPressed = false; }, 50); }
    }

    function onMouseUp(e) { if (e.button === 2) duckPressed = false; }

    function onTouchStart(e) {
        if (e.target.closest('.mobile-game-controls')) return;
        e.preventDefault();
        if (gameState === 'dead' || gameState === 'idle') { startGame(); els.canvas.focus(); }
        else if (gameState === 'playing' && dino.grounded) { jumpPressed = true; setTimeout(() => { jumpPressed = false; }, 50); }
    }

    function onMobileJump(e) {
        e.preventDefault();
        if (gameState === 'dead' || gameState === 'idle') { startGame(); els.canvas.focus(); }
        else if (gameState === 'playing' && dino.grounded) jumpPressed = true;
    }
    function onMobileJumpEnd(e) { e.preventDefault(); jumpPressed = false; }

    function onMobileDuck(e) {
        e.preventDefault();
        if (gameState === 'dead' || gameState === 'idle') { startGame(); els.canvas.focus(); }
        else if (gameState === 'playing') duckPressed = true;
    }
    function onMobileDuckEnd(e) { e.preventDefault(); duckPressed = false; }

    // ============================================================
    // Public API
    // ============================================================
    window.DinoRunner = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); }
    };
})();