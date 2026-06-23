// ============================================================
// Whack-a-Ed - Whack-a-mole with Ed heads
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;
    const HIGH_SCORE_KEY = 'whack-a-ed-high';

    // Constants
    const GRID_COLS = 3;
    const GRID_ROWS = 3;
    const GAME_DURATION = 30000;
    const MOLE_MIN_SHOW = 600;
    const MOLE_MAX_SHOW = 1500;
    const MOLE_MIN_DELAY = 300;
    const MOLE_MAX_DELAY = 1000;
    const SPEED_INCREASE_INTERVAL = 5000;
    const COMBO_TIMEOUT = 1500;

    // State
    let els = {};
    let gameState = 'idle';
    let animationId = null;
    let score = 0;
    let highScore = 0;
    let timeRemaining = GAME_DURATION;
    let lastTimestamp = 0;
    let W = 0, H = 0;

    // Holes
    let holes = [];
    let moles = [];

    // Timing
    let nextMoleTime = 0;
    let currentMinShow = MOLE_MAX_SHOW;
    let currentMaxShow = MOLE_MAX_SHOW;
    let currentMinDelay = MOLE_MAX_DELAY;
    let currentMaxDelay = MOLE_MAX_DELAY;
    let speedLevel = 0;

    // Combo
    let combo = 0;
    let lastHitTime = 0;

    // Hit effects
    let hitEffects = [];

    // Hammer
    let hammer = { x: 0, y: 0, striking: false, strikeTime: 0 };

    // Miss tracking
    let misses = 0;

    // Handlers
    let handlers = {};

    function colors() {
        return {
            bg: GU.getColor('--bg-card'),
            hole: GU.getColor('--bg-secondary'),
            holeShadow: GU.getColor('--border'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            shirt: GU.getColor('--accent-light'),
            hit: '#e53e3e',
            bomb: '#1a1a1a',
            bombFuse: '#ff6b6b',
            text: GU.getColor('--text-secondary'),
            combo: '#feca57',
            timer: GU.getColor('--accent-green'),
            hammer: '#8b4513',
            hammerHead: '#888888'
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        highScore = GU.getHighScore(HIGH_SCORE_KEY);

        GU.setWrapperClass(els, 'square-small');

        handlers = {
            click: onClick,
            mousemove: onMouseMove,
            touchstart: onTouchStart,
            keydown: onKeyDown,
            resize: resize
        };

        els.canvas.addEventListener('click', handlers.click);
        els.canvas.addEventListener('mousemove', handlers.mousemove);
        els.canvas.addEventListener('touchstart', handlers.touchstart, { passive: false });
        els.canvas.addEventListener('keydown', handlers.keydown);
        window.addEventListener('resize', handlers.resize);

        els.canvas.style.cursor = 'none';
        GU.focusCanvas(els);
        resize();
        calculateHoles();
        GU.showOverlay(els, 'Whack-a-Ed', 'Whack the Ed heads! 30 seconds on the clock.', 'Press Space or Tap to Start', false);
        els.highScoreEl.textContent = `HI ${highScore}`;
        draw();
    }

    function destroy() {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        gameState = 'idle';

        els.canvas.removeEventListener('click', handlers.click);
        els.canvas.removeEventListener('mousemove', handlers.mousemove);
        els.canvas.removeEventListener('touchstart', handlers.touchstart);
        els.canvas.removeEventListener('keydown', handlers.keydown);
        window.removeEventListener('resize', handlers.resize);

        els.canvas.style.cursor = '';
        GU.setWrapperClass(els, null);
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;
        calculateHoles();
        if (gameState !== 'playing') draw();
    }

    function calculateHoles() {
        holes = [];
        const marginX = W * 0.1;
        const marginY = H * 0.15;
        const availW = W - marginX * 2;
        const availH = H - marginY * 2;
        const cellW = availW / GRID_COLS;
        const cellH = availH / GRID_ROWS;

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                holes.push({
                    x: marginX + col * cellW + cellW / 2,
                    y: marginY + row * cellH + cellH / 2 + 10,
                    width: Math.min(cellW * 0.65, 60),
                    height: Math.min(cellH * 0.3, 24)
                });
            }
        }
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0;
        timeRemaining = GAME_DURATION;
        moles = [];
        hitEffects = [];
        combo = 0;
        lastHitTime = 0;
        misses = 0;
        speedLevel = 0;
        currentMinShow = MOLE_MAX_SHOW;
        currentMaxShow = MOLE_MAX_SHOW;
        currentMinDelay = MOLE_MAX_DELAY;
        currentMaxDelay = MOLE_MAX_DELAY;
        nextMoleTime = 500;
        lastTimestamp = 0;
        hammer.striking = false;
    }

    function startGame() {
        if (gameState === 'playing') return;
        resetGame();
        gameState = 'playing';
        GU.hideOverlay(els);
        els.hud.classList.add('visible');
        els.canvas.focus();
        lastTimestamp = performance.now();
        loop(lastTimestamp);
    }

    function endGame() {
        gameState = 'dead';
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

        const finalScore = score;
        if (finalScore > highScore) { highScore = finalScore; GU.setHighScore(HIGH_SCORE_KEY, highScore); }
        els.highScoreEl.textContent = `HI ${highScore}`;
        els.scoreEl.textContent = finalScore;

        const hits = moles.filter(m => m.state === 'hit').length;
        const totalClicks = finalScore > 0 ? Math.round(finalScore / 10) : 0;
        const totalAttempts = totalClicks + misses;
        const accuracy = totalAttempts > 0 ? Math.round((totalClicks / totalAttempts) * 100) : 0;

        setTimeout(() => {
            GU.showOverlay(els, "Time's Up!", `Score: ${finalScore} | Accuracy: ${accuracy}%`, 'Press Space or Tap to Restart', true);
        }, 500);
    }

    // ============================================================
    // Game Loop
    // ============================================================
    function loop(timestamp) {
        if (gameState !== 'playing') return;

        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        update(delta);
        draw();

        animationId = requestAnimationFrame(loop);
    }

    function update(delta) {
        timeRemaining -= delta;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            endGame();
            return;
        }

        // Speed increase
        const newSpeedLevel = Math.floor((GAME_DURATION - timeRemaining) / SPEED_INCREASE_INTERVAL);
        if (newSpeedLevel > speedLevel) {
            speedLevel = newSpeedLevel;
            currentMinShow = Math.max(400, MOLE_MIN_SHOW - speedLevel * 50);
            currentMaxShow = Math.max(700, MOLE_MAX_SHOW - speedLevel * 150);
            currentMinDelay = Math.max(150, MOLE_MIN_DELAY - speedLevel * 30);
            currentMaxDelay = Math.max(400, MOLE_MAX_DELAY - speedLevel * 100);
        }

        // Spawn moles
        nextMoleTime -= delta;
        if (nextMoleTime <= 0) {
            spawnMole();
            nextMoleTime = currentMinDelay + Math.random() * (currentMaxDelay - currentMinDelay);
        }

        // Update moles
        for (let i = moles.length - 1; i >= 0; i--) {
            const mole = moles[i];

            if (mole.state === 'rising') {
                mole.progress += delta / 250;
                if (mole.progress >= 1) {
                    mole.progress = 1;
                    mole.state = 'up';
                    mole.upTime = 0;
                }
            } else if (mole.state === 'up') {
                mole.upTime += delta;
                if (mole.upTime >= mole.showDuration) {
                    mole.state = 'falling';
                    mole.progress = 1;
                }
            } else if (mole.state === 'falling') {
                mole.progress -= delta / 200;
                if (mole.progress <= 0) {
                    moles.splice(i, 1);
                    continue;
                }
            } else if (mole.state === 'hit') {
                mole.hitTimer -= delta;
                if (mole.hitTimer <= 0) {
                    moles.splice(i, 1);
                    continue;
                }
            }
        }

        // Update hit effects
        for (let i = hitEffects.length - 1; i >= 0; i--) {
            hitEffects[i].life -= delta / 600;
            hitEffects[i].y -= delta * 0.05;
            if (hitEffects[i].life <= 0) hitEffects.splice(i, 1);
        }

        // Update hammer
        if (hammer.striking) {
            hammer.strikeTime -= delta;
            if (hammer.strikeTime <= 0) hammer.striking = false;
        }

        els.scoreEl.textContent = score;
    }

    function spawnMole() {
        const occupiedHoles = moles.map(m => m.holeIndex);
        const available = [];
        for (let i = 0; i < holes.length; i++) {
            if (!occupiedHoles.includes(i)) available.push(i);
        }

        if (available.length === 0) return;

        const holeIndex = available[Math.floor(Math.random() * available.length)];
        const showDuration = currentMinShow + Math.random() * (currentMaxShow - currentMinShow);

        const roll = Math.random();
        const isGolden = roll < 0.1;
        const isBomb = !isGolden && roll < 0.25;

        moles.push({
            holeIndex: holeIndex,
            state: 'rising',
            progress: 0,
            showDuration: showDuration,
            upTime: 0,
            isGolden: isGolden,
            isBomb: isBomb,
            hitTimer: 0
        });
    }

    // ============================================================
    // Hit Logic
    // ============================================================
    function handleHit(mx, my) {
        let hitSomething = false;

        // First pass - check near mole head
        for (let i = moles.length - 1; i >= 0; i--) {
            const mole = moles[i];
            if (mole.state === 'hit') continue;
            if (mole.progress < 0.2) continue;

            const hole = holes[mole.holeIndex];
            const headSize = hole.width * 0.6;
            const maxRise = headSize * 0.8;
            const riseAmount = maxRise * mole.progress;
            const headX = hole.x;
            const headY = hole.y - riseAmount;
            const hitRadius = hole.width * 0.5;

            const dist = Math.sqrt((mx - headX) ** 2 + (my - headY) ** 2);

            if (dist < hitRadius) {
                hitMole(mole, headX, headY);
                hitSomething = true;
                break;
            }
        }

        // Second pass - check near hole (generous fallback)
        if (!hitSomething) {
            for (let i = moles.length - 1; i >= 0; i--) {
                const mole = moles[i];
                if (mole.state === 'hit') continue;
                if (mole.progress < 0.2) continue;

                const hole = holes[mole.holeIndex];
                const holeRadius = hole.width * 0.6;
                const dist = Math.sqrt((mx - hole.x) ** 2 + (my - hole.y) ** 2);

                if (dist < holeRadius) {
                    const headSize = hole.width * 0.6;
                    const maxRise = headSize * 0.8;
                    const headY = hole.y - maxRise * mole.progress;
                    hitMole(mole, hole.x, headY);
                    hitSomething = true;
                    break;
                }
            }
        }

        if (!hitSomething) {
            misses++;
            combo = 0;
        }
    }

    function hitMole(mole, headX, headY) {
        mole.state = 'hit';
        mole.hitTimer = 300;

        if (mole.isBomb) {
            const penalty = 30;
            score = Math.max(0, score - penalty);
            combo = 0;
            els.scoreEl.textContent = score;

            hitEffects.push({
                x: headX,
                y: headY - 15,
                text: `-${penalty} 💥`,
                color: '#e53e3e',
                size: 15,
                life: 1
            });
            return;
        }

        const now = performance.now();
        if (now - lastHitTime < COMBO_TIMEOUT) {
            combo++;
        } else {
            combo = 1;
        }
        lastHitTime = now;

        let points = 10;
        if (mole.isGolden) points = 50;
        points *= Math.min(combo, 5);

        score += points;
        els.scoreEl.textContent = score;

        hitEffects.push({
            x: headX,
            y: headY - 15,
            text: mole.isGolden ? `+${points} ★` : `+${points}`,
            color: mole.isGolden ? '#ffd700' : combo > 1 ? '#feca57' : '#ffffff',
            size: combo > 2 ? 15 : 13,
            life: 1
        });
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;

        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // Timer bar
        if (gameState === 'playing') {
            const barWidth = W - 40;
            const barX = 20;
            const barY = 8;
            const barH = 6;
            const timePercent = timeRemaining / GAME_DURATION;

            ctx.fillStyle = c.holeShadow;
            ctx.fillRect(barX, barY, barWidth, barH);

            const timerColor = timePercent > 0.3 ? c.timer : timePercent > 0.1 ? '#feca57' : '#e53e3e';
            ctx.fillStyle = timerColor;
            ctx.fillRect(barX, barY, barWidth * timePercent, barH);

            ctx.fillStyle = c.text;
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(timeRemaining / 1000)}s`, W / 2, barY + barH + 12);
            ctx.textAlign = 'left';
        }

        // Combo - bottom right
        if (combo > 1 && gameState === 'playing') {
            ctx.fillStyle = c.combo;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${combo}x COMBO!`, W - 10, H - 10);
            ctx.textAlign = 'left';
        }

        // Holes and moles
        for (let i = 0; i < holes.length; i++) {
            drawHole(ctx, i, c);
        }

        // Hit effects
        for (const effect of hitEffects) {
            ctx.globalAlpha = effect.life;
            ctx.fillStyle = effect.color;
            ctx.font = `bold ${effect.size}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);
            ctx.textAlign = 'left';
        }
        ctx.globalAlpha = 1;

        // Hammer
        if (gameState === 'playing') {
            drawHammer(ctx, c);
        }
    }

    function drawHole(ctx, index, c) {
        const hole = holes[index];
        const x = hole.x;
        const y = hole.y;
        const hw = hole.width;
        const hh = hole.height;

        // Hole shadow
        ctx.fillStyle = c.holeShadow;
        ctx.beginPath();
        ctx.ellipse(x, y, hw / 2, hh / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hole dark center
        ctx.fillStyle = c.hole;
        ctx.beginPath();
        ctx.ellipse(x, y, hw / 2 - 2, hh / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mole
        const mole = moles.find(m => m.holeIndex === index);
        if (mole) {
            drawMole(ctx, hole, mole, c);
        }
    }

    function drawMole(ctx, hole, mole, c) {
        const x = hole.x;
        const y = hole.y;
        const hw = hole.width;

        const headSize = hw * 0.6;
        const maxRise = headSize * 0.8;
        let riseAmount;

        if (mole.state === 'hit') {
            riseAmount = maxRise * 0.2;
        } else {
            riseAmount = maxRise * mole.progress;
        }

        // Clip
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - hw / 2 - 5, y - maxRise - headSize, hw + 10, maxRise + headSize);
        ctx.clip();

        const headX = x;
        const headY = y - riseAmount;
        const hs = headSize / 2;

        if (mole.state === 'hit') {
            // Hit state
            ctx.fillStyle = mole.isBomb ? '#333333' : c.hit;
            ctx.beginPath();
            ctx.arc(headX, headY, hs, 0, Math.PI * 2);
            ctx.fill();

            // X eyes
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            const eyeOff = hs * 0.3;
            ctx.beginPath();
            ctx.moveTo(headX - eyeOff - 3, headY - 2); ctx.lineTo(headX - eyeOff + 3, headY + 4);
            ctx.moveTo(headX - eyeOff + 3, headY - 2); ctx.lineTo(headX - eyeOff - 3, headY + 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headX + eyeOff - 3, headY - 2); ctx.lineTo(headX + eyeOff + 3, headY + 4);
            ctx.moveTo(headX + eyeOff + 3, headY - 2); ctx.lineTo(headX + eyeOff - 3, headY + 4);
            ctx.stroke();

            // Explosion effect for bombs
            if (mole.isBomb) {
                ctx.fillStyle = '#ff6b6b';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(headX, headY, hs * 1.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        } else if (mole.isBomb) {
            // Bomb Ed
            ctx.fillStyle = c.bomb;
            ctx.beginPath();
            ctx.arc(headX, headY, hs, 0, Math.PI * 2);
            ctx.fill();

            // Fuse
            ctx.strokeStyle = c.bombFuse;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(headX + hs * 0.3, headY - hs * 0.7);
            ctx.quadraticCurveTo(headX + hs * 0.6, headY - hs * 1.1, headX + hs * 0.2, headY - hs * 1.0);
            ctx.stroke();

            // Spark
            const sparkle = Math.sin(performance.now() * 0.01) > 0;
            if (sparkle) {
                ctx.fillStyle = '#feca57';
                ctx.beginPath();
                ctx.arc(headX + hs * 0.2, headY - hs * 1.0, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Angry eyes
            ctx.fillStyle = '#ff0000';
            const eyeOff = hs * 0.3;
            ctx.fillRect(headX - eyeOff - 3, headY - 2, 6, 5);
            ctx.fillRect(headX + eyeOff - 3, headY - 2, 6, 5);

            // Angry mouth
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(headX - hs * 0.25, headY + hs * 0.4);
            ctx.lineTo(headX - hs * 0.1, headY + hs * 0.3);
            ctx.lineTo(headX + hs * 0.1, headY + hs * 0.4);
            ctx.lineTo(headX + hs * 0.25, headY + hs * 0.3);
            ctx.stroke();

            // Skull hint
            ctx.fillStyle = '#ffffff';
            ctx.font = `${hs * 0.4}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('☠', headX, headY + hs * 0.15);
            ctx.textAlign = 'left';
        } else {
            // Normal or golden Ed
            const golden = mole.isGolden;

            ctx.fillStyle = golden ? '#ffd700' : c.skin;
            ctx.beginPath();
            ctx.arc(headX, headY, hs, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = golden ? '#b8860b' : c.hair;
            ctx.beginPath();
            ctx.arc(headX, headY - hs * 0.15, hs, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(headX - hs, headY - hs * 0.6, hs * 2, hs * 0.35);

            ctx.fillStyle = golden ? '#ffd700' : c.skin;
            ctx.beginPath();
            ctx.arc(headX, headY + hs * 0.1, hs * 0.82, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = c.glasses;
            const glassW = hs * 0.38;
            const glassH = hs * 0.3;
            const glassY = headY - glassH / 2 + hs * 0.05;
            const gap = hs * 0.08;

            ctx.strokeStyle = c.glasses;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(headX - gap / 2 - glassW, glassY, glassW, glassH);
            ctx.strokeRect(headX + gap / 2, glassY, glassW, glassH);
            ctx.beginPath();
            ctx.moveTo(headX - gap / 2, glassY + glassH / 2);
            ctx.lineTo(headX + gap / 2, glassY + glassH / 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            const es = hs * 0.1;
            ctx.fillRect(headX - gap / 2 - glassW / 2 - es / 2, glassY + glassH * 0.3, es, es);
            ctx.fillRect(headX + gap / 2 + glassW / 2 - es / 2, glassY + glassH * 0.3, es, es);

            ctx.fillStyle = '#1a1a1a';
            const ps = es * 0.6;
            ctx.fillRect(headX - gap / 2 - glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);
            ctx.fillRect(headX + gap / 2 + glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);

            ctx.strokeStyle = c.glasses;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(headX, headY + hs * 0.4, hs * 0.18, 0, Math.PI);
            ctx.stroke();

            if (golden) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.008) * 0.3;
                ctx.beginPath();
                ctx.arc(headX + hs * 0.5, headY - hs * 0.5, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        ctx.restore();

        // Redraw hole front edge
        ctx.fillStyle = c.holeShadow;
        ctx.beginPath();
        ctx.ellipse(hole.x, hole.y, hw / 2, hole.height / 2, 0, 0, Math.PI);
        ctx.fill();
    }

    function drawHammer(ctx, c) {
        const x = hammer.x;
        const y = hammer.y;
        const angle = hammer.striking ? -0.5 : -0.2;
        const scale = hammer.striking ? 1.1 : 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        // Handle
        ctx.fillStyle = c.hammer;
        ctx.fillRect(-2, -2, 4, 28);

        // Head
        ctx.fillStyle = c.hammerHead;
        ctx.fillRect(-10, -12, 20, 12);

        // Head highlight
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(-10, -12, 20, 3);

        // Head sides
        ctx.fillStyle = '#666666';
        ctx.fillRect(-10, -12, 2, 12);
        ctx.fillRect(8, -12, 2, 12);

        ctx.restore();
    }

    // ============================================================
    // Input
    // ============================================================
    function onMouseMove(e) {
        const rect = els.canvas.getBoundingClientRect();
        hammer.x = e.clientX - rect.left;
        hammer.y = e.clientY - rect.top;
    }

    function onClick(e) {
        if (gameState === 'idle' || gameState === 'dead') {
            startGame();
            return;
        }
        if (gameState !== 'playing') return;

        const rect = els.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        hammer.x = mx;
        hammer.y = my;
        hammer.striking = true;
        hammer.strikeTime = 150;

        handleHit(mx, my);
    }

    function onTouchStart(e) {
        e.preventDefault();

        if (gameState === 'idle' || gameState === 'dead') {
            startGame();
            return;
        }
        if (gameState !== 'playing') return;

        const rect = els.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mx = touch.clientX - rect.left;
        const my = touch.clientY - rect.top;

        hammer.x = mx;
        hammer.y = my;
        hammer.striking = true;
        hammer.strikeTime = 150;

        handleHit(mx, my);
    }

    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;
            if (gameState === 'idle' || gameState === 'dead') startGame();
        }
    }

    // ============================================================
    // Public API
    // ============================================================
    window.WhackAEd = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); }
    };
})();