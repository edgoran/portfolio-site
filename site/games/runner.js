// ============================================================
// Dino Runner Game
// A T-Rex style endless runner that integrates with the portfolio
// ============================================================
(function () {
    'use strict';

    const GROUND_HEIGHT_RATIO = 0.75;
    const GRAVITY = 0.55;
    const JUMP_FORCE = -11;
    const INITIAL_SPEED = 3;
    const MAX_SPEED = 11;
    const SPEED_INCREMENT = 0.0005;
    const OBSTACLE_MIN_GAP = 200;
    const OBSTACLE_MAX_GAP = 500;
    const DEATH_LOCKOUT_MS = 600;

    // Dino dimensions
    const DINO_WIDTH = 40;
    const DINO_HEIGHT = 44;
    const DINO_DUCK_HEIGHT = 26;
    const DINO_DUCK_WIDTH = 55;

    // Obstacle dimensions
    const CACTUS_SMALL_W = 16;
    const CACTUS_SMALL_H = 34;
    const CACTUS_LARGE_W = 24;
    const CACTUS_LARGE_H = 46;
    const BIRD_W = 40;
    const BIRD_H = 38;

    let canvas, ctx;
    let gameState = 'idle'; // idle, playing, dead
    let animationId = null;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('dino-runner-high') || '0');
    let speed = INITIAL_SPEED;
    let frameCount = 0;
    let deathTimestamp = 0;

    // Game objects
    let dino = {};
    let obstacles = [];
    let particles = [];
    let groundOffset = 0;

    // Rendering dimensions (actual pixel sizes)
    let W = 0, H = 0, groundY = 0;

    // Input state
    let jumpPressed = false;
    let duckPressed = false;

    // DOM elements
    let overlay, overlayTitle, overlayText, startBtn, hud, scoreEl, highScoreEl;

    // Colour helpers that read CSS variables
    function getColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function colors() {
        return {
            ground: getColor('--border'),
            dino: getColor('--accent-light'),
            obstacle: getColor('--accent-green'),
            bird: '#e53e3e',
            text: getColor('--text-primary'),
            particle: getColor('--accent'),
            bg: getColor('--bg-card'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            shirt: getColor('--accent-light')
        };
    }

    // ============================================================
    // Initialisation
    // ============================================================
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');

        overlay = document.getElementById('game-overlay');
        overlayTitle = document.getElementById('game-overlay-title');
        overlayText = document.getElementById('game-overlay-text');
        startBtn = document.getElementById('game-start-btn');
        hud = document.getElementById('game-hud');
        scoreEl = document.getElementById('game-score');
        highScoreEl = document.getElementById('game-high-score');

        const wrapper = document.getElementById('game-wrapper');
        wrapper.addEventListener('contextmenu', onContextMenu);
        wrapper.addEventListener('mousedown', onMouseDown);
        wrapper.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseup', onMouseUp);

        resize();
        resetGame();
        showOverlay('Ed Runner', 'Jump over obstacles to survive', 'Press Space or Tap to Start');
        updateHighScoreDisplay();

        // Bind events
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        canvas.addEventListener('touchstart', onTouchStart, { passive: false });        
        canvas.addEventListener('contextmenu', onContextMenu);
        canvas.addEventListener('mouseup', onMouseUp);        

        document.addEventListener('mouseup', onMouseUpGlobal);

        startBtn.addEventListener('click', startGame);

        // Draw initial frame
        draw();
    }

    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        gameState = 'idle';

        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mouseup', onMouseUpGlobal);

        if (canvas) {
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('contextmenu', onContextMenu);
            canvas.removeEventListener('mouseup', onMouseUp);
        }
        if (startBtn) {
            startBtn.removeEventListener('click', startGame);
        }
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        const wrapper = document.getElementById('game-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        W = rect.width;
        H = rect.height;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        groundY = H * GROUND_HEIGHT_RATIO;

        // Reposition dino
        dino.x = W * 0.08;
        dino.groundY = groundY - DINO_HEIGHT;

        if (gameState !== 'playing') {
            draw();
        }
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0;
        speed = INITIAL_SPEED;
        frameCount = 0;
        obstacles = [];
        particles = [];
        groundOffset = 0;
        jumpPressed = false;
        duckPressed = false;

        dino = {
            x: W * 0.08,
            y: groundY - DINO_HEIGHT,
            groundY: groundY - DINO_HEIGHT,
            vy: 0,
            width: DINO_WIDTH,
            height: DINO_HEIGHT,
            ducking: false,
            grounded: true,
            blinkTimer: 0,
            legFrame: 0,
            legTimer: 0
        };
    }

function startGame() {
    if (gameState === 'playing') return;

    // Prevent immediate restart after death
    if (Date.now() - deathTimestamp < DEATH_LOCKOUT_MS) return;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    resetGame();
    gameState = 'playing';
    hideOverlay();
    hud.classList.add('visible');
    loop();
}

    function die() {
        gameState = 'dead';
        deathTimestamp = Date.now();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('dino-runner-high', highScore.toString());
        }
        updateHighScoreDisplay();
        scoreEl.textContent = score;

        // Spawn death particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: dino.x + dino.width / 2,
                y: dino.y + dino.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 1) * 5,
                life: 1
            });
        }

        // Stop the loop
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Draw final frame with particles, then show overlay
        let particleFrames = 0;
        function deathAnimation() {
            updateParticles();
            draw();
            particleFrames++;
            if (particleFrames < 20) {
                requestAnimationFrame(deathAnimation);
            } else {
                showOverlay('Game Over', `Score: ${score}`, 'Press Space or Tap to Restart');
            }
        }
        deathAnimation();
    }

    // ============================================================
    // Game Loop
    // ============================================================
    function loop() {
        if (gameState !== 'playing' && gameState !== 'dead') return;

        if (gameState === 'playing') {
            update();
        }
        updateParticles();
        draw();

        animationId = requestAnimationFrame(loop);
    }

    function update() {
        frameCount++;
        speed = Math.min(MAX_SPEED, INITIAL_SPEED + frameCount * SPEED_INCREMENT);
        score = Math.floor(frameCount / 3);
        scoreEl.textContent = score;

        // Ground scroll
        groundOffset = (groundOffset + speed) % 20;

        // Dino physics
        if (jumpPressed && dino.grounded) {
            dino.vy = JUMP_FORCE;
            dino.grounded = false;
        }

        // Ducking
        dino.ducking = duckPressed && dino.grounded;
        if (dino.ducking) {
            dino.width = DINO_DUCK_WIDTH;
            dino.height = DINO_DUCK_HEIGHT;
            dino.groundY = groundY - DINO_DUCK_HEIGHT;
        } else {
            dino.width = DINO_WIDTH;
            dino.height = DINO_HEIGHT;
            dino.groundY = groundY - DINO_HEIGHT;
        }

        // Fast fall when ducking in air
        if (duckPressed && !dino.grounded) {
            dino.vy += GRAVITY * 0.5;
        }

        dino.vy += GRAVITY;
        dino.y += dino.vy;

        if (dino.y >= dino.groundY) {
            dino.y = dino.groundY;
            dino.vy = 0;
            dino.grounded = true;
        }

        // Animation timers
        dino.legTimer++;
        if (dino.legTimer > 6) {
            dino.legTimer = 0;
            dino.legFrame = (dino.legFrame + 1) % 2;
        }
        dino.blinkTimer++;

        // Obstacles
        spawnObstacles();
        updateObstacles();

        // Collision
        checkCollision();
    }

    // ============================================================
    // Obstacles
    // ============================================================
    function spawnObstacles() {
        const lastObs = obstacles[obstacles.length - 1];

        // Don't spawn anything for the first 60 frames
        if (frameCount < 60) return;

        // Calculate a random gap for this spawn cycle
        const gap = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);

        // Don't spawn if the last obstacle hasn't cleared enough distance
        if (lastObs && lastObs.x > W - gap) {
            return;
        }

        const type = getObstacleType();
        let obs;

        if (type === 'cactus-small') {
            obs = {
                type: 'cactus',
                x: W + 20 + Math.random() * 60,
                y: groundY - CACTUS_SMALL_H,
                width: CACTUS_SMALL_W,
                height: CACTUS_SMALL_H
            };
        } else if (type === 'cactus-large') {
            obs = {
                type: 'cactus',
                x: W + 20 + Math.random() * 60,
                y: groundY - CACTUS_LARGE_H,
                width: CACTUS_LARGE_W,
                height: CACTUS_LARGE_H
            };
        } else if (type === 'cactus-group') {
            obs = {
                type: 'cactus',
                x: W + 20 + Math.random() * 60,
                y: groundY - CACTUS_SMALL_H,
                width: CACTUS_SMALL_W * 2.5,
                height: CACTUS_SMALL_H
            };
        } else {
            // Bird hovers at head height - must duck to avoid
            const birdY = groundY - BIRD_H - (Math.random() > 0.5 ? 20 : 2);
            obs = {
                type: 'bird',
                x: W + 20 + Math.random() * 60,
                y: birdY,
                width: BIRD_W,
                height: BIRD_H,
                wingFrame: 0,
                wingTimer: 0
            };
        }

        obstacles.push(obs);
    }

    function getObstacleType() {
        // Birds only appear after score 100
        const rand = Math.random();
        if (score > 100 && rand < 0.2) return 'bird';
        if (rand < 0.5) return 'cactus-small';
        if (rand < 0.8) return 'cactus-large';
        return 'cactus-group';
    }

    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speed;

            if (obs.type === 'bird') {
                obs.wingTimer++;
                if (obs.wingTimer > 12) {
                    obs.wingTimer = 0;
                    obs.wingFrame = (obs.wingFrame + 1) % 2;
                }
            }

            // Remove off-screen
            if (obs.x + obs.width < -20) {
                obstacles.splice(i, 1);
            }
        }
    }

    // ============================================================
    // Collision
    // ============================================================
    function checkCollision() {
        const padding = 6; // Forgiving hitbox
        const dx = dino.x + padding;
        const dy = dino.y + padding;
        const dw = dino.width - padding * 2;
        const dh = dino.height - padding * 2;

        for (const obs of obstacles) {
            const ox = obs.x + 2;
            const oy = obs.y + 2;
            const ow = obs.width - 4;
            const oh = obs.height - 4;

            if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) {
                die();
                return;
            }
        }
    }

    // ============================================================
    // Particles
    // ============================================================
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.025;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();

        // Clear
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // Ground
        drawGround(c);

        // Obstacles
        for (const obs of obstacles) {
            if (obs.type === 'cactus') {
                drawCactus(obs, c);
            } else {
                drawBird(obs, c);
            }
        }

        // Dino
        drawDino(c);

        // Particles
        drawParticles(c);
    }

    function drawGround(c) {
        ctx.strokeStyle = c.ground;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();

        // Ground texture dots
        ctx.fillStyle = c.ground;
        for (let x = -groundOffset; x < W; x += 20) {
            const dotY = groundY + 8 + Math.sin(x * 0.1) * 3;
            ctx.fillRect(x, dotY, 2, 1);
        }
    }

    function drawDino(c) {
        if (dino.ducking) {
            const x = dino.x;
            const y = dino.y;

            // Ducking Ed - sliding pose
            // Body/shirt
            ctx.fillStyle = c.shirt;
            ctx.fillRect(x, y + 8, DINO_DUCK_WIDTH - 10, 14);

            // Head
            ctx.fillStyle = c.skin;
            ctx.fillRect(x + DINO_DUCK_WIDTH - 22, y, 18, 14);

            // Hair
            ctx.fillStyle = c.hair;
            ctx.fillRect(x + DINO_DUCK_WIDTH - 22, y - 2, 18, 5);

            // Glasses
            ctx.fillStyle = c.glasses;
            ctx.fillRect(x + DINO_DUCK_WIDTH - 18, y + 5, 6, 4);
            ctx.fillRect(x + DINO_DUCK_WIDTH - 10, y + 5, 6, 4);
            ctx.fillRect(x + DINO_DUCK_WIDTH - 12, y + 6, 2, 2);

            // Legs
            ctx.fillStyle = '#3d3d5c';
            if (dino.legFrame === 0) {
                ctx.fillRect(x + 6, y + DINO_DUCK_HEIGHT - 6, 6, 6);
                ctx.fillRect(x + 20, y + DINO_DUCK_HEIGHT - 4, 6, 4);
            } else {
                ctx.fillRect(x + 6, y + DINO_DUCK_HEIGHT - 4, 6, 4);
                ctx.fillRect(x + 20, y + DINO_DUCK_HEIGHT - 6, 6, 6);
            }
        } else {
            // Standing/running Ed
            const x = dino.x;
            const y = dino.y;

            // Hair
            ctx.fillStyle = c.hair;
            ctx.fillRect(x + 10, y, 22, 6);
            ctx.fillRect(x + 8, y + 3, 3, 4);

            // Head
            ctx.fillStyle = c.skin;
            ctx.fillRect(x + 10, y + 5, 22, 16);

            // Glasses
            ctx.fillStyle = c.glasses;
            // Left lens
            ctx.fillRect(x + 12, y + 9, 7, 5);
            // Right lens
            ctx.fillRect(x + 21, y + 9, 7, 5);
            // Bridge
            ctx.fillRect(x + 19, y + 10, 2, 3);
            // Arms (temple of glasses extends)
            ctx.fillRect(x + 9, y + 10, 3, 2);
            ctx.fillRect(x + 28, y + 10, 3, 2);

            // Eyes behind glasses
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 14, y + 10, 3, 3);
            ctx.fillRect(x + 23, y + 10, 3, 3);
            // Pupils
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x + 15, y + 11, 2, 2);
            ctx.fillRect(x + 24, y + 11, 2, 2);

            // Mouth (small)
            if (dino.blinkTimer % 120 >= 110) {
                // Blink - eyes shut
                ctx.fillStyle = c.glasses;
                ctx.fillRect(x + 14, y + 11, 3, 1);
                ctx.fillRect(x + 23, y + 11, 3, 1);
            }

            // Neck
            ctx.fillStyle = c.skin;
            ctx.fillRect(x + 17, y + 21, 8, 3);

            // Shirt/body
            ctx.fillStyle = c.shirt;
            ctx.fillRect(x + 10, y + 23, 22, 12);

            // Arms
            ctx.fillStyle = c.skin;
            if (!dino.grounded) {
                // Arms up when jumping
                ctx.fillRect(x + 6, y + 20, 5, 10);
                ctx.fillRect(x + 31, y + 20, 5, 10);
            } else if (dino.legFrame === 0) {
                ctx.fillRect(x + 6, y + 24, 5, 10);
                ctx.fillRect(x + 31, y + 26, 5, 8);
            } else {
                ctx.fillRect(x + 6, y + 26, 5, 8);
                ctx.fillRect(x + 31, y + 24, 5, 10);
            }

            // Trousers
            ctx.fillStyle = '#3d3d5c';
            ctx.fillRect(x + 12, y + 35, 8, 4);
            ctx.fillRect(x + 22, y + 35, 8, 4);

            // Legs/shoes
            if (!dino.grounded) {
                // Legs together when airborne
                ctx.fillRect(x + 13, y + 39, 6, 5);
                ctx.fillRect(x + 23, y + 39, 6, 5);
            } else if (dino.legFrame === 0) {
                ctx.fillRect(x + 11, y + 39, 7, 5);
                ctx.fillRect(x + 24, y + 37, 7, 5);
            } else {
                ctx.fillRect(x + 11, y + 37, 7, 5);
                ctx.fillRect(x + 24, y + 39, 7, 5);
            }
        }
    }

    function drawCactus(obs, c) {
        ctx.fillStyle = c.obstacle;

        if (obs.width > 30) {
            // Cactus group - draw multiple small ones
            const count = 3;
            const spacing = obs.width / count;
            for (let i = 0; i < count; i++) {
                const cx = obs.x + i * spacing;
                ctx.fillRect(cx + 4, obs.y, 8, obs.height);
                // Arms
                ctx.fillRect(cx, obs.y + 8, 5, 4);
                ctx.fillRect(cx + 11, obs.y + 14, 5, 4);
            }
        } else {
            // Single cactus
            ctx.fillRect(obs.x + obs.width * 0.25, obs.y, obs.width * 0.5, obs.height);
            // Trunk
            ctx.fillRect(obs.x, obs.y + obs.height * 0.2, obs.width * 0.3, 5);
            ctx.fillRect(obs.x + obs.width * 0.7, obs.y + obs.height * 0.4, obs.width * 0.3, 5);
            // Top
            ctx.fillRect(obs.x + obs.width * 0.15, obs.y, obs.width * 0.7, 4);
        }
    }

    function drawBird(obs, c) {
        const x = obs.x;
        const y = obs.y;

        // Body - red
        ctx.fillStyle = c.bird;
        ctx.fillRect(x + 8, y + 8, 24, 14);

        // Head
        ctx.fillRect(x + 28, y + 5, 12, 14);

        // Angry eyebrows
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 30, y + 6, 8, 2);
        // Angled brows (pixel art angry look)
        ctx.fillRect(x + 29, y + 5, 3, 2);
        ctx.fillRect(x + 37, y + 5, 3, 2);

        // Eyes - white with dark pupil
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 31, y + 9, 4, 4);
        ctx.fillRect(x + 36, y + 9, 4, 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 32, y + 10, 2, 2);
        ctx.fillRect(x + 37, y + 10, 2, 2);

        // Beak - orange/yellow
        ctx.fillStyle = '#f6a623';
        ctx.fillRect(x + 40, y + 12, 6, 3);
        ctx.fillRect(x + 40, y + 15, 4, 2);

        // Wings - darker red
        ctx.fillStyle = '#c53030';
        if (obs.wingFrame === 0) {
            ctx.fillRect(x + 12, y, 16, 8);
            ctx.fillRect(x + 14, y - 3, 10, 4);
        } else {
            ctx.fillRect(x + 12, y + 20, 16, 8);
            ctx.fillRect(x + 14, y + 26, 10, 4);
        }

        // Tail feathers
        ctx.fillStyle = c.bird;
        ctx.fillRect(x, y + 10, 10, 4);
        ctx.fillRect(x - 2, y + 8, 6, 3);
        ctx.fillRect(x - 2, y + 14, 6, 3);
    }

    function drawParticles(c) {
        for (const p of particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = c.particle;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
        ctx.globalAlpha = 1;
    }

    // ============================================================
    // UI Helpers
    // ============================================================
    function showOverlay(title, text, btnText) {
        overlayTitle.textContent = title;
        overlayText.textContent = text;
        startBtn.textContent = btnText;
        overlay.classList.remove('hidden');
        if (title === 'Game Over') {
            overlay.classList.add('game-over');
        } else {
            overlay.classList.remove('game-over');
        }
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    function updateHighScoreDisplay() {
        highScoreEl.textContent = `HI ${highScore}`;
    }

    // ============================================================
    // Input Handlers
    // ============================================================
    function onKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            if (e.repeat) return;

            if (gameState === 'dead' || gameState === 'idle') {
                startGame();
            } else if (gameState === 'playing' && dino.grounded) {
                jumpPressed = true;
            }
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            duckPressed = true;
        }
    }

    function onKeyUp(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            jumpPressed = false;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            duckPressed = false;
        }
    }

function onTouchStart(e) {
    e.preventDefault();
    if (gameState === 'dead' || gameState === 'idle') {
        startGame();
    } else if (gameState === 'playing' && dino.grounded) {
        jumpPressed = true;
        setTimeout(() => { jumpPressed = false; }, 50);
    }
}

function onContextMenu(e) {
    e.preventDefault();
}

function onMouseDown(e) {
    if (e.button === 2) {
        // Right click - duck
        if (gameState === 'playing') {
            duckPressed = true;
        }
        return;
    }

    // Left click - jump or start
    if (gameState === 'dead' || gameState === 'idle') {
        startGame();
    } else if (gameState === 'playing' && dino.grounded) {
        jumpPressed = true;
        setTimeout(() => { jumpPressed = false; }, 50);
    }
}

function onMouseUp(e) {
    if (e.button === 2) {
        duckPressed = false;
    }
}

function onMouseUpGlobal(e) {
    if (e.button === 2) {
        duckPressed = false;
    }
}

function onMouseLeave(e) {
    duckPressed = false;
}

    // ============================================================
    // Public API
    // ============================================================
    window.DinoRunner = {
        init: init,
        destroy: destroy
    };

})();