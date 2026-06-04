// ============================================================
// Space InvEders - Space Invaders with Ed-head aliens
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;
    const HIGH_SCORE_KEY = 'invaders-high';

    // Constants
    const PLAYER_WIDTH = 32;
    const PLAYER_HEIGHT = 20;
    const PLAYER_SPEED = 4;
    const BULLET_SPEED = 6;
    const ALIEN_BULLET_SPEED = 1.5;
    const ALIEN_COLS = 8;
    const ALIEN_ROWS_START = 3;
    const ALIEN_ROWS_MAX = 6;
    const ALIEN_SIZE = 22;
    const ALIEN_PADDING = 10;
    const ALIEN_DROP = 10;
    const ALIEN_SHOOT_CHANCE = 0.002;
    const DEATH_LOCKOUT_MS = 800;
    const MAX_ALIEN_BULLETS = 2;
    const UFO_SPEED = 1.5;
    const UFO_WIDTH = 36;
    const UFO_HEIGHT = 16;
    const UFO_POINTS = 100;
    const UFO_SPAWN_CHANCE = 0.001;
    const POWERUP_DROP_CHANCE = 0.15;
    const POWERUP_FALL_SPEED = 1.5;
    const POWERUP_SIZE = 16;
    const POWERUP_DURATION = 5000;

    // Power-up types
    const POWERUPS = {
        TRIPLE: { id: 'triple', label: '3x', color: '#48dbfb' },
        LASER: { id: 'laser', label: '⚡', color: '#feca57' },
        SHIELD: { id: 'shield', label: '🛡', color: '#54a0ff' }
    };

    // State
    let els = {};
    let gameState = 'idle';
    let animationId = null;
    let score = 0;
    let highScore = 0;
    let wave = 1;
    let lives = 3;
    let W = 0, H = 0;
    let deathTimestamp = 0;

    // Player
    let player = {};

    // Aliens
    let aliens = [];
    let alienDirection = 1;
    let alienSpeed = 1;
    let alienMoveTimer = 0;
    let alienMoveInterval = 45;
    let alienAnimFrame = 0;

    // Projectiles
    let playerBullets = [];
    let alienBullets = [];

    // UFO
    let ufo = null;

    // Power-ups
    let fallingPowerups = [];
    let activePowerup = null;
    let powerupTimer = null;

    // Input
    let leftPressed = false;
    let rightPressed = false;
    let canFire = true;

    // Explosions
    let explosions = [];

    // Handlers
    let handlers = {};

    // Pickup notifications
    let pickupNotifications = [];

    function colors() {
        return {
            bg: GU.getColor('--bg-card'),
            player: GU.getColor('--accent-light'),
            playerGun: GU.getColor('--accent'),
            bullet: GU.getColor('--accent-green'),
            alienBullet: '#e53e3e',
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            explosion: '#feca57',
            text: GU.getColor('--text-secondary'),
            border: GU.getColor('--border'),
            ufo: '#ff9ff3',
            ufoLight: '#54a0ff'
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        highScore = GU.getHighScore(HIGH_SCORE_KEY);

        GU.setWrapperClass(els, 'tall');

        handlers = {
            keydown: onKeyDown,
            keyup: onKeyUp,
            resize: resize,
            mobileLeft: (e) => { e.preventDefault(); leftPressed = true; },
            mobileLeftEnd: (e) => { e.preventDefault(); leftPressed = false; },
            mobileRight: (e) => { e.preventDefault(); rightPressed = true; },
            mobileRightEnd: (e) => { e.preventDefault(); rightPressed = false; },
            mobileFire: (e) => { e.preventDefault(); handleFire(); },
            mobileFireEnd: (e) => { e.preventDefault(); }
        };

        els.canvas.addEventListener('keydown', handlers.keydown);
        els.canvas.addEventListener('keyup', handlers.keyup);
        window.addEventListener('resize', handlers.resize);

        const leftBtn = document.getElementById('mobile-left-btn');
        const rightBtn = document.getElementById('mobile-right-btn');
        const fireBtn = document.getElementById('mobile-fire-btn');
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', handlers.mobileLeft, { passive: false });
            leftBtn.addEventListener('touchend', handlers.mobileLeftEnd, { passive: false });
        }
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', handlers.mobileRight, { passive: false });
            rightBtn.addEventListener('touchend', handlers.mobileRightEnd, { passive: false });
        }
        if (fireBtn) {
            fireBtn.addEventListener('touchstart', handlers.mobileFire, { passive: false });
            fireBtn.addEventListener('touchend', handlers.mobileFireEnd, { passive: false });
        }

        GU.focusCanvas(els);
        resize();
        resetGame();
        GU.showOverlay(els, 'Space InvEders', 'Defeat the Ed-head alien invasion!', 'Press Space to Start', false);
        els.highScoreEl.textContent = `HI ${highScore}`;
        draw();
    }

    function destroy() {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        if (powerupTimer) { clearTimeout(powerupTimer); powerupTimer = null; }
        gameState = 'idle';

        els.canvas.removeEventListener('keydown', handlers.keydown);
        els.canvas.removeEventListener('keyup', handlers.keyup);
        window.removeEventListener('resize', handlers.resize);

        const leftBtn = document.getElementById('mobile-left-btn');
        const rightBtn = document.getElementById('mobile-right-btn');
        const fireBtn = document.getElementById('mobile-fire-btn');
        if (leftBtn) { leftBtn.removeEventListener('touchstart', handlers.mobileLeft); leftBtn.removeEventListener('touchend', handlers.mobileLeftEnd); }
        if (rightBtn) { rightBtn.removeEventListener('touchstart', handlers.mobileRight); rightBtn.removeEventListener('touchend', handlers.mobileRightEnd); }
        if (fireBtn) { fireBtn.removeEventListener('touchstart', handlers.mobileFire); fireBtn.removeEventListener('touchend', handlers.mobileFireEnd); }

        GU.setWrapperClass(els, null);
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;
        player.y = H - PLAYER_HEIGHT - 15;
        if (gameState !== 'playing') draw();
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0; wave = 1; lives = 3;
        player = { x: W / 2 - PLAYER_WIDTH / 2, y: H - PLAYER_HEIGHT - 15, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, hit: false };
        playerBullets = []; alienBullets = []; explosions = []; fallingPowerups = [];
        leftPressed = false; rightPressed = false; canFire = true;
        ufo = null;
        activePowerup = null;
        pickupNotifications = [];

        if (powerupTimer) { clearTimeout(powerupTimer); powerupTimer = null; }
        spawnWave();
    }

    function spawnWave() {
        aliens = [];
        alienDirection = 1;
        alienSpeed = 1 + wave * 0.25;
        alienMoveTimer = 0;
        alienMoveInterval = Math.max(12, 45 - wave * 4);
        alienAnimFrame = 0;

        const rows = Math.min(ALIEN_ROWS_MAX, ALIEN_ROWS_START + wave - 1);
        const totalWidth = ALIEN_COLS * (ALIEN_SIZE + ALIEN_PADDING) - ALIEN_PADDING;
        const startX = (W - totalWidth) / 2;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < ALIEN_COLS; col++) {
                aliens.push({
                    x: startX + col * (ALIEN_SIZE + ALIEN_PADDING),
                    y: startY + row * (ALIEN_SIZE + ALIEN_PADDING),
                    width: ALIEN_SIZE,
                    height: ALIEN_SIZE,
                    alive: true,
                    row: row
                });
            }
        }
    }

    function startGame() {
        if (gameState === 'playing') return;
        if (Date.now() - deathTimestamp < DEATH_LOCKOUT_MS) return;
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        resetGame();
        gameState = 'playing';
        GU.hideOverlay(els);
        els.hud.classList.add('visible');
        els.canvas.focus();
        loop();
    }

    function loseLife() {
        lives--;
        // Clear non-shield powerups on death
        if (activePowerup && activePowerup.id !== 'shield') {
            activePowerup = null;
            if (powerupTimer) { clearTimeout(powerupTimer); powerupTimer = null; }
        }
        if (lives <= 0) {
            gameOver();
        } else {
            player.hit = true;
            setTimeout(() => { player.hit = false; }, 1000);
        }
    }

    function gameOver() {
        gameState = 'dead';
        deathTimestamp = Date.now();
        if (score > highScore) { highScore = score; GU.setHighScore(HIGH_SCORE_KEY, highScore); }
        els.highScoreEl.textContent = `HI ${highScore}`;
        els.scoreEl.textContent = score;
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        setTimeout(() => {
            GU.showOverlay(els, 'Game Over', `Score: ${score} | Wave: ${wave}`, 'Press Space to Restart', true);
        }, 500);
    }

    function winWave() {
        wave++;
        playerBullets = []; alienBullets = []; fallingPowerups = [];
        ufo = null;
        spawnWave();
    }

    // ============================================================
    // Power-ups
    // ============================================================
    function spawnPowerup(x, y) {
        const types = Object.values(POWERUPS);
        const type = types[Math.floor(Math.random() * types.length)];
        fallingPowerups.push({ x: x - POWERUP_SIZE / 2, y: y, width: POWERUP_SIZE, height: POWERUP_SIZE, type: type });
    }

    function activatePowerup(type) {
        if (powerupTimer) { clearTimeout(powerupTimer); powerupTimer = null; }
        activePowerup = type;

        const labels = { triple: 'Triple Shot!', laser: 'Laser Beam!', shield: 'Shield!' };
        pickupNotifications.push({
            text: labels[type.id] || type.id,
            color: type.color,
            x: player.x + player.width / 2,
            y: player.y - 20,
            life: 1
        });

        powerupTimer = setTimeout(() => {
            activePowerup = null;
            powerupTimer = null;
        }, POWERUP_DURATION);
    }

    function getFireCooldown() {
        return 200;
    }

    function getMaxBullets() {
        return 3;
    }

    // ============================================================
    // Game Loop
    // ============================================================
    function loop() {
        if (gameState !== 'playing') return;
        update();
        draw();
        animationId = requestAnimationFrame(loop);
    }

    function update() {
        // Player movement
        if (leftPressed) player.x = Math.max(0, player.x - PLAYER_SPEED);
        if (rightPressed) player.x = Math.min(W - player.width, player.x + PLAYER_SPEED);

        // Player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            b.y -= BULLET_SPEED;
            if (b.vx) b.x += b.vx;
            if (b.y < -10 || b.x < -10 || b.x > W + 10) playerBullets.splice(i, 1);
        }

        // Alien bullets
        for (let i = alienBullets.length - 1; i >= 0; i--) {
            alienBullets[i].y += ALIEN_BULLET_SPEED;
            if (alienBullets[i].y > H + 10) alienBullets.splice(i, 1);
        }

        // Falling power-ups
        for (let i = fallingPowerups.length - 1; i >= 0; i--) {
            fallingPowerups[i].y += POWERUP_FALL_SPEED;
            if (fallingPowerups[i].y > H + 20) {
                fallingPowerups.splice(i, 1);
                continue;
            }
            // Collision with player
            const p = fallingPowerups[i];
            if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
                activatePowerup(p.type);
                fallingPowerups.splice(i, 1);
            }
        }

        // Alien movement
        alienMoveTimer++;
        if (alienMoveTimer >= alienMoveInterval) {
            alienMoveTimer = 0;
            alienAnimFrame = (alienAnimFrame + 1) % 2;
            moveAliens();
        }

        // Alien shooting
        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length > 0 && alienBullets.length < MAX_ALIEN_BULLETS) {
            const bottomAliens = getBottomAliens(aliveAliens);
            for (const alien of bottomAliens) {
                if (Math.random() < ALIEN_SHOOT_CHANCE) {
                    alienBullets.push({ x: alien.x + alien.width / 2 - 2, y: alien.y + alien.height, width: 4, height: 8 });
                    break;
                }
            }
        }

        // UFO spawning
        if (!ufo && Math.random() < UFO_SPAWN_CHANCE) {
            const fromLeft = Math.random() > 0.5;
            ufo = { x: fromLeft ? -UFO_WIDTH : W, y: 20, width: UFO_WIDTH, height: UFO_HEIGHT, direction: fromLeft ? 1 : -1 };
        }

        // UFO movement
        if (ufo) {
            ufo.x += UFO_SPEED * ufo.direction;
            if (ufo.x > W + UFO_WIDTH || ufo.x < -UFO_WIDTH * 2) ufo = null;
        }

        // Collision: player bullets vs aliens
        for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
            const b = playerBullets[bi];
            let hit = false;

            // Laser pierces through (doesn't get removed on hit)
            const isLaser = b.isLaser;

            for (const alien of aliens) {
                if (!alien.alive) continue;
                if (b.x < alien.x + alien.width && b.x + b.width > alien.x && b.y < alien.y + alien.height && b.y + b.height > alien.y) {
                    alien.alive = false;
                    score += 10 + (Math.min(ALIEN_ROWS_MAX, ALIEN_ROWS_START + wave - 1) - alien.row) * 5;
                    els.scoreEl.textContent = score;
                    explosions.push({ x: alien.x + alien.width / 2, y: alien.y + alien.height / 2, life: 1 });

                    // Chance to drop power-up
                    if (Math.random() < POWERUP_DROP_CHANCE) {
                        spawnPowerup(alien.x + alien.width / 2, alien.y + alien.height);
                    }

                    if (!isLaser) {
                        playerBullets.splice(bi, 1);
                        hit = true;
                    }
                    break;
                }
            }

            // Collision: player bullets vs UFO
            if (!hit && ufo && bi < playerBullets.length) {
                const bullet = playerBullets[bi];
                if (bullet && bullet.x < ufo.x + ufo.width && bullet.x + bullet.width > ufo.x && bullet.y < ufo.y + ufo.height && bullet.y + bullet.height > ufo.y) {
                    if (!isLaser) playerBullets.splice(bi, 1);
                    score += UFO_POINTS;
                    els.scoreEl.textContent = score;
                    explosions.push({ x: ufo.x + ufo.width / 2, y: ufo.y + ufo.height / 2, life: 1 });
                    ufo = null;
                }
            }
        }

        // Collision: alien bullets vs player
        if (!player.hit) {
            for (let i = alienBullets.length - 1; i >= 0; i--) {
                const b = alienBullets[i];
                if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
                    alienBullets.splice(i, 1);
                    if (activePowerup && activePowerup.id === 'shield') {
                        // Shield absorbs the hit
                        explosions.push({ x: player.x + player.width / 2, y: player.y, life: 0.6 });
                    } else {
                        loseLife();
                    }
                    break;
                }
            }
        }

        // Collision: aliens reach player level
        for (const alien of aliveAliens) {
            if (alien.y + alien.height >= player.y) {
                gameOver();
                return;
            }
        }

        // Check wave clear
        if (aliveAliens.length === 0) winWave();

        // Update explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            explosions[i].life -= 0.05;
            if (explosions[i].life <= 0) explosions.splice(i, 1);
        }

        // Update pickup notifications
        for (let i = pickupNotifications.length - 1; i >= 0; i--) {
            const n = pickupNotifications[i];
            n.y -= 0.5;
            n.life -= 0.02;
            if (n.life <= 0) pickupNotifications.splice(i, 1);
        }

        // Speed up as aliens die
        const remaining = aliveAliens.length;
        const total = ALIEN_COLS * Math.min(ALIEN_ROWS_MAX, ALIEN_ROWS_START + wave - 1);
        alienMoveInterval = Math.max(5, Math.floor((remaining / total) * (45 - wave * 4) + 5));
    }

    function getBottomAliens(aliveAliens) {
        const columns = {};
        for (const alien of aliveAliens) {
            const col = Math.round(alien.x);
            if (!columns[col] || alien.y > columns[col].y) columns[col] = alien;
        }
        return Object.values(columns);
    }

    function moveAliens() {
        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length === 0) return;

        let shouldDrop = false;
        const step = alienSpeed * alienDirection;

        for (const alien of aliveAliens) {
            if (alien.x + step < 5 || alien.x + alien.width + step > W - 5) {
                shouldDrop = true;
                break;
            }
        }

        if (shouldDrop) {
            alienDirection *= -1;
            for (const alien of aliveAliens) alien.y += ALIEN_DROP;
        } else {
            for (const alien of aliveAliens) alien.x += step;
        }
    }

    function handleFire() {
        if (gameState === 'dead' || gameState === 'idle') { startGame(); return; }
        if (gameState !== 'playing' || !canFire) return;

        const maxBullets = getMaxBullets();
        if (playerBullets.length >= maxBullets) return;

        const cx = player.x + player.width / 2;

        if (activePowerup && activePowerup.id === 'triple') {
            // Triple shot - three bullets in a spread
            playerBullets.push({ x: cx - 1.5, y: player.y - 10, width: 3, height: 10, isLaser: false });
            playerBullets.push({ x: cx - 8, y: player.y - 6, width: 3, height: 10, isLaser: false, vx: -0.5 });
            playerBullets.push({ x: cx + 5, y: player.y - 6, width: 3, height: 10, isLaser: false, vx: 0.5 });
        } else if (activePowerup && activePowerup.id === 'laser') {
            // Laser - tall thin beam that pierces
            playerBullets.push({ x: cx - 1, y: player.y - 20, width: 2, height: 20, isLaser: true });
        } else {
            // Normal shot
            playerBullets.push({ x: cx - 1.5, y: player.y - 10, width: 3, height: 10, isLaser: false });
        }

        canFire = false;
        setTimeout(() => { canFire = true; }, getFireCooldown());
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;

        ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

        // HUD - lives, wave, powerup
        ctx.fillStyle = c.text;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`Lives: ${'♥'.repeat(lives)}`, 10, 20);
        ctx.fillText(`Wave: ${wave}`, 10, 36);

        // Active powerup indicator
        if (activePowerup) {
            ctx.fillStyle = activePowerup.color;
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`⚡ ${activePowerup.id.toUpperCase()}`, W - 10, 20);
            ctx.textAlign = 'left';
            ctx.font = '12px Inter, sans-serif';
        }

        // Player
        drawPlayer(ctx, c);

        // Aliens
        for (const alien of aliens) {
            if (alien.alive) drawAlien(ctx, alien, c);
        }

        // UFO
        if (ufo) drawUFO(ctx, c);

        // Falling power-ups
        for (const p of fallingPowerups) drawPowerup(ctx, p);

        // Player bullets
        for (const b of playerBullets) {
            if (b.isLaser) {
                ctx.fillStyle = POWERUPS.LASER.color;
                ctx.globalAlpha = 0.8;
                ctx.fillRect(b.x - 1, b.y, b.width + 2, b.height);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(b.x, b.y, b.width, b.height);
            } else {
                ctx.fillStyle = c.bullet;
                ctx.fillRect(b.x, b.y, b.width, b.height);
            }
        }

        // Alien bullets
        ctx.fillStyle = c.alienBullet;
        for (const b of alienBullets) ctx.fillRect(b.x, b.y, b.width, b.height);

        // Explosions
        for (const exp of explosions) {
            ctx.globalAlpha = exp.life;
            ctx.fillStyle = c.explosion;
            const size = (1 - exp.life) * 16 + 4;
            ctx.fillRect(exp.x - size / 2, exp.y - size / 2, size, size);
            ctx.fillStyle = c.alienBullet;
            const size2 = (1 - exp.life) * 10 + 2;
            ctx.fillRect(exp.x - size2 / 2, exp.y - size2 / 2, size2, size2);
        }

        // Pickup notifications
        for (const n of pickupNotifications) {
            ctx.globalAlpha = n.life;
            ctx.fillStyle = n.color;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, n.x, n.y);
            ctx.textAlign = 'left';
        }

        ctx.globalAlpha = 1;
    }

    function drawPlayer(ctx, c) {
        const x = player.x, y = player.y;
        if (player.hit && Math.floor(Date.now() / 100) % 2 === 0) return;

        // Shield bubble
        if (activePowerup && activePowerup.id === 'shield') {
            const pulse = Math.sin(Date.now() * 0.006) * 0.1;
            ctx.globalAlpha = 0.25 + pulse;
            ctx.fillStyle = POWERUPS.SHIELD.color;
            ctx.beginPath();
            ctx.arc(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT / 2, PLAYER_WIDTH * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.6 + pulse;
            ctx.strokeStyle = POWERUPS.SHIELD.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT / 2, PLAYER_WIDTH * 0.75, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (activePowerup) {
            // Glow for other powerups
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = activePowerup.color;
            ctx.fillRect(x - 3, y - 3, PLAYER_WIDTH + 6, PLAYER_HEIGHT + 6);
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = c.player;
        ctx.fillRect(x + 4, y + 8, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 8);

        ctx.fillStyle = activePowerup ? activePowerup.color : c.playerGun;
        ctx.fillRect(x + PLAYER_WIDTH / 2 - 2, y, 4, 10);

        ctx.fillStyle = c.player;
        ctx.fillRect(x, y + 12, 6, PLAYER_HEIGHT - 12);
        ctx.fillRect(x + PLAYER_WIDTH - 6, y + 12, 6, PLAYER_HEIGHT - 12);

        ctx.fillStyle = activePowerup ? activePowerup.color : c.playerGun;
        ctx.fillRect(x + PLAYER_WIDTH / 2 - 4, y + 8, 8, 6);
    }

    function drawAlien(ctx, alien, c) {
        const x = alien.x, y = alien.y, s = alien.width;

        ctx.fillStyle = c.skin;
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);

        ctx.fillStyle = c.hair;
        ctx.fillRect(x + 2, y + 2, s - 4, s * 0.25);

        ctx.fillStyle = c.glasses;
        const glassY = y + s * 0.38;
        const glassW = s * 0.22, glassH = s * 0.2, gap = s * 0.06;
        ctx.fillRect(x + s * 0.18, glassY, glassW, glassH);
        ctx.fillRect(x + s * 0.18 + glassW + gap, glassY, glassW, glassH);
        ctx.fillRect(x + s * 0.18 + glassW, glassY + glassH * 0.3, gap, glassH * 0.4);

        ctx.fillStyle = '#ffffff';
        const es = s * 0.08;
        ctx.fillRect(x + s * 0.25, glassY + glassH * 0.3, es, es);
        ctx.fillRect(x + s * 0.25 + glassW + gap, glassY + glassH * 0.3, es, es);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + s * 0.27, glassY + glassH * 0.35, es * 0.6, es * 0.6);
        ctx.fillRect(x + s * 0.27 + glassW + gap, glassY + glassH * 0.35, es * 0.6, es * 0.6);

        ctx.fillStyle = c.glasses;
        if (alienAnimFrame === 0) {
            ctx.fillRect(x + s * 0.35, y + s * 0.7, s * 0.3, s * 0.06);
        } else {
            ctx.fillRect(x + s * 0.35, y + s * 0.68, s * 0.3, s * 0.12);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x + s * 0.38, y + s * 0.72, s * 0.24, s * 0.06);
        }

        ctx.fillStyle = c.skin;
        if (alienAnimFrame === 0) {
            ctx.fillRect(x + s * 0.2, y + s - 4, 3, 4);
            ctx.fillRect(x + s * 0.7, y + s - 4, 3, 4);
        } else {
            ctx.fillRect(x + s * 0.25, y + s - 5, 3, 5);
            ctx.fillRect(x + s * 0.65, y + s - 5, 3, 5);
        }
    }

    function drawUFO(ctx, c) {
        const x = ufo.x, y = ufo.y, w = ufo.width, h = ufo.height;

        ctx.fillStyle = c.ufo;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.6, w / 2, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.ufoLight;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.4, w * 0.25, h * 0.4, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.explosion;
        const blink = Math.floor(Date.now() / 200) % 2;
        const lightSpacing = w / 5;
        for (let i = 0; i < 4; i++) {
            if ((i + blink) % 2 === 0) ctx.fillRect(x + lightSpacing * (i + 1) - 2, y + h * 0.7, 4, 3);
        }

        ctx.fillStyle = c.text;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('100', x + w / 2, y - 3);
        ctx.textAlign = 'left';
    }

    function drawPowerup(ctx, p) {
        const x = p.x, y = p.y, s = p.width;

        // Glowing background
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
        ctx.fillStyle = p.type.color;
        ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
        ctx.globalAlpha = 1;

        // Box
        ctx.fillStyle = p.type.color;
        ctx.fillRect(x, y, s, s);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);

        // Label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type.label, x + s / 2, y + s / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    // ============================================================
    // Input
    // ============================================================
    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;
            handleFire();
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); leftPressed = true; }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); rightPressed = true; }
    }

    function onKeyUp(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = false;
    }

    // ============================================================
    // Public API
    // ============================================================
    window.SpaceInvEders = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); }
    };
})();