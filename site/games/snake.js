// ============================================================
// SnakEd - Snake game with pixel art Ed
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;
    const HIGH_SCORE_KEY = 'snaked-high';

    const GRID_SIZE = 20;
    const TICK_INITIAL = 150;
    const TICK_MIN = 70;
    const TICK_DECREASE = 2;
    const DEATH_LOCKOUT_MS = 600;

    let els = {};
    let gameState = 'idle';
    let tickInterval = null;
    let tickRate = TICK_INITIAL;
    let score = 0;
    let highScore = 0;
    let wallDeath = false;
    let cols = 0, rows = 0, cellSize = 0, W = 0, H = 0;
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let deathTimestamp = 0;
    let touchStartX = 0, touchStartY = 0;
    let handlers = {};

    function colors() {
        return {
            bg: GU.getColor('--bg-card'), grid: GU.getColor('--border'),
            skin: '#f5deb3', hair: '#6b4c2a', glasses: '#333333',
            shirt: GU.getColor('--accent-light'), body: GU.getColor('--accent'),
            food: GU.getColor('--accent-green')
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        highScore = GU.getHighScore(HIGH_SCORE_KEY);

        GU.setWrapperClass(els, 'square');

        handlers = {
            keydown: onKeyDown,
            touchstart: onTouchStart,
            touchmove: (e) => e.preventDefault(),
            touchend: onTouchEnd,
            resize: resize
        };

        els.canvas.addEventListener('keydown', handlers.keydown);
        els.canvas.addEventListener('touchstart', handlers.touchstart, { passive: false });
        els.canvas.addEventListener('touchmove', handlers.touchmove, { passive: false });
        els.canvas.addEventListener('touchend', handlers.touchend, { passive: false });
        window.addEventListener('resize', handlers.resize);

        // Mobile D-pad
        const upBtn = document.getElementById('mobile-up-btn');
        const downBtn = document.getElementById('mobile-down-btn');
        const leftBtn = document.getElementById('mobile-left2-btn');
        const rightBtn = document.getElementById('mobile-right2-btn');

        handlers.mobileUp = (e) => { e.preventDefault(); if (gameState === 'idle' || gameState === 'dead') { startGame(); } else if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; };
        handlers.mobileDown = (e) => { e.preventDefault(); if (gameState === 'idle' || gameState === 'dead') { startGame(); } else if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; };
        handlers.mobileLeft = (e) => { e.preventDefault(); if (gameState === 'idle' || gameState === 'dead') { startGame(); } else if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; };
        handlers.mobileRight = (e) => { e.preventDefault(); if (gameState === 'idle' || gameState === 'dead') { startGame(); } else if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; };

        if (upBtn) upBtn.addEventListener('touchstart', handlers.mobileUp, { passive: false });
        if (downBtn) downBtn.addEventListener('touchstart', handlers.mobileDown, { passive: false });
        if (leftBtn) leftBtn.addEventListener('touchstart', handlers.mobileLeft, { passive: false });
        if (rightBtn) rightBtn.addEventListener('touchstart', handlers.mobileRight, { passive: false });

        GU.focusCanvas(els);
        resize();
        resetGame();
        GU.showOverlay(els, 'SnakEd', "Eat food to grow. Don't hit yourself!", 'Press Space or Tap to Start', false);
        els.highScoreEl.textContent = `HI ${highScore}`;
        draw();
    }

    function destroy() {
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        gameState = 'idle';

        els.canvas.removeEventListener('keydown', handlers.keydown);
        els.canvas.removeEventListener('touchstart', handlers.touchstart);
        els.canvas.removeEventListener('touchmove', handlers.touchmove);
        els.canvas.removeEventListener('touchend', handlers.touchend);
        window.removeEventListener('resize', handlers.resize);

        const upBtn = document.getElementById('mobile-up-btn');
        const downBtn = document.getElementById('mobile-down-btn');
        const leftBtn = document.getElementById('mobile-left2-btn');
        const rightBtn = document.getElementById('mobile-right2-btn');
        if (upBtn) upBtn.removeEventListener('touchstart', handlers.mobileUp);
        if (downBtn) downBtn.removeEventListener('touchstart', handlers.mobileDown);
        if (leftBtn) leftBtn.removeEventListener('touchstart', handlers.mobileLeft);
        if (rightBtn) rightBtn.removeEventListener('touchstart', handlers.mobileRight);

        GU.setWrapperClass(els, null);
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;
        cellSize = Math.floor(Math.min(W, H) / GRID_SIZE);
        cols = Math.floor(W / cellSize); rows = Math.floor(H / cellSize);
        if (gameState !== 'playing') draw();
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0; tickRate = TICK_INITIAL;
        const sx = Math.floor(cols / 2), sy = Math.floor(rows / 2);
        snake = [{ x: sx, y: sy }, { x: sx - 1, y: sy }, { x: sx - 2, y: sy }];
        direction = { x: 1, y: 0 }; nextDirection = { x: 1, y: 0 };
        spawnFood();
    }

    function startGame() {
        if (gameState === 'playing') return;
        if (Date.now() - deathTimestamp < DEATH_LOCKOUT_MS) return;
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        resetGame(); gameState = 'playing';
        GU.hideOverlay(els); els.hud.classList.add('visible'); els.canvas.focus();
        tickInterval = setInterval(tick, tickRate);
    }

    function die() {
        gameState = 'dead'; deathTimestamp = Date.now();
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        if (score > highScore) { highScore = score; GU.setHighScore(HIGH_SCORE_KEY, highScore); }
        els.highScoreEl.textContent = `HI ${highScore}`;
        els.scoreEl.textContent = score;
        draw();
        setTimeout(() => { GU.showOverlay(els, 'Game Over', `Score: ${score}`, 'Press Space or Tap to Restart', true); }, 400);
    }

    // ============================================================
    // Tick
    // ============================================================
    function tick() {
        if (gameState !== 'playing') return;
        direction = { ...nextDirection };
        const head = snake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (wallDeath) {
            if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) { die(); return; }
        } else {
            if (newHead.x < 0) newHead.x = cols - 1; if (newHead.x >= cols) newHead.x = 0;
            if (newHead.y < 0) newHead.y = rows - 1; if (newHead.y >= rows) newHead.y = 0;
        }

        for (const seg of snake) { if (seg.x === newHead.x && seg.y === newHead.y) { die(); return; } }
        snake.unshift(newHead);

        if (newHead.x === food.x && newHead.y === food.y) {
            score++; els.scoreEl.textContent = score; spawnFood();
            tickRate = Math.max(TICK_MIN, tickRate - TICK_DECREASE);
            clearInterval(tickInterval); tickInterval = setInterval(tick, tickRate);
        } else { snake.pop(); }
        draw();
    }

    function spawnFood() {
        let pos;
        do { pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
        while (snake.some(s => s.x === pos.x && s.y === pos.y));
        food = pos;
    }

    // ============================================================
    // Direction Helpers
    // ============================================================
    function getDirectionToward(index) {
        if (index <= 0) return { x: 0, y: 0 };
        const prev = snake[index - 1], curr = snake[index];
        let dx = prev.x - curr.x, dy = prev.y - curr.y;
        if (dx > 1) dx = -1; if (dx < -1) dx = 1;
        if (dy > 1) dy = -1; if (dy < -1) dy = 1;
        return { x: dx, y: dy };
    }

    function getDirectionAway(index) {
        if (index <= 0) return { x: 0, y: 1 };
        const prev = snake[index - 1], curr = snake[index];
        let dx = curr.x - prev.x, dy = curr.y - prev.y;
        if (dx > 1) dx = -1; if (dx < -1) dx = 1;
        if (dy > 1) dy = -1; if (dy < -1) dy = 1;
        return { x: dx, y: dy };
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;
        ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = c.grid; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.3;
        for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, rows * cellSize); ctx.stroke(); }
        for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(cols * cellSize, y * cellSize); ctx.stroke(); }
        ctx.globalAlpha = 1;

        if (wallDeath) { ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, cols * cellSize - 3, rows * cellSize - 3); }

        // Food
        const fx = food.x * cellSize, fy = food.y * cellSize;
        ctx.fillStyle = c.food;
        ctx.beginPath(); ctx.arc(fx + cellSize / 2, fy + cellSize / 2, (cellSize - 6) / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.hair; ctx.fillRect(fx + cellSize / 2 - 1, fy + 1, 2, 4);

        // Snake
        for (let i = 0; i < snake.length; i++) {
            const seg = snake[i], x = seg.x * cellSize, y = seg.y * cellSize, p = 1;
            if (i === 0) drawHead(ctx, x, y, c);
            else if (i === 1) drawNeck(ctx, x, y, i, c);
            else if (i === snake.length - 1) drawTrousers(ctx, x, y, i, c);
            else { ctx.fillStyle = i % 2 === 0 ? c.shirt : c.body; ctx.fillRect(x + p, y + p, cellSize - p * 2, cellSize - p * 2); }
        }
    }

    function drawHead(ctx, x, y, c) {
        const s = cellSize, p = 1;
        ctx.fillStyle = c.skin; ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);
        ctx.fillStyle = c.hair; ctx.fillRect(x + p, y + p, s - p * 2, s * 0.25);
        ctx.fillStyle = c.glasses;
        const glassY = y + s * 0.4, gs = s * 0.22, gap = s * 0.08;
        ctx.fillRect(x + s * 0.15, glassY, gs, gs);
        ctx.fillRect(x + s * 0.15 + gs + gap, glassY, gs, gs);
        ctx.fillRect(x + s * 0.15 + gs, glassY + gs * 0.3, gap, gs * 0.4);
        ctx.fillStyle = '#ffffff'; const es = s * 0.1;
        ctx.fillRect(x + s * 0.22, glassY + gs * 0.25, es, es);
        ctx.fillRect(x + s * 0.22 + gs + gap, glassY + gs * 0.25, es, es);
        ctx.fillStyle = '#1a1a1a'; const po = s * 0.04, px = direction.x * po, py = direction.y * po;
        ctx.fillRect(x + s * 0.22 + px, glassY + gs * 0.25 + py, es * 0.7, es * 0.7);
        ctx.fillRect(x + s * 0.22 + gs + gap + px, glassY + gs * 0.25 + py, es * 0.7, es * 0.7);
        ctx.fillStyle = c.glasses; ctx.fillRect(x + s * 0.35, y + s * 0.72, s * 0.3, s * 0.06);
    }

    function drawNeck(ctx, x, y, index, c) {
        const s = cellSize, p = 1, dir = getDirectionToward(index);
        ctx.fillStyle = c.shirt; ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);
        ctx.fillStyle = c.skin;
        if (dir.x === 1) ctx.fillRect(x + s * 0.6, y + s * 0.3, s * 0.4, s * 0.4);
        else if (dir.x === -1) ctx.fillRect(x, y + s * 0.3, s * 0.4, s * 0.4);
        else if (dir.y === -1) ctx.fillRect(x + s * 0.3, y, s * 0.4, s * 0.4);
        else ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.4);
    }

    function drawTrousers(ctx, x, y, index, c) {
        const s = cellSize, p = 1, dir = getDirectionAway(index);
        const trouser = '#3d3d5c', belt = '#2a2a40', buckle = '#888888', shoe = '#1a1a1a', bg = c.bg;

        if (dir.y === 1 || (dir.x === 0 && dir.y === 0)) {
            ctx.fillStyle = trouser; ctx.fillRect(x + p, y + p, s * 0.4 - p, s - p * 2); ctx.fillRect(x + s * 0.6, y + p, s * 0.4 - p, s - p * 2);
            ctx.fillStyle = belt; ctx.fillRect(x + p, y + p, s - p * 2, s * 0.2);
            ctx.fillStyle = buckle; ctx.fillRect(x + s * 0.4, y + p + 1, s * 0.2, s * 0.15);
            ctx.fillStyle = bg; ctx.fillRect(x + s * 0.4, y + s * 0.35, s * 0.2, s * 0.65 - p);
            ctx.fillStyle = shoe; ctx.fillRect(x + p, y + s - s * 0.2 - p, s * 0.4 - p, s * 0.2); ctx.fillRect(x + s * 0.6, y + s - s * 0.2 - p, s * 0.4 - p, s * 0.2);
        } else if (dir.y === -1) {
            ctx.fillStyle = trouser; ctx.fillRect(x + p, y + p, s * 0.4 - p, s - p * 2); ctx.fillRect(x + s * 0.6, y + p, s * 0.4 - p, s - p * 2);
            ctx.fillStyle = belt; ctx.fillRect(x + p, y + s - s * 0.2 - p, s - p * 2, s * 0.2);
            ctx.fillStyle = buckle; ctx.fillRect(x + s * 0.4, y + s - s * 0.2 - p, s * 0.2, s * 0.15);
            ctx.fillStyle = bg; ctx.fillRect(x + s * 0.4, y + p, s * 0.2, s * 0.65 - p);
            ctx.fillStyle = shoe; ctx.fillRect(x + p, y + p, s * 0.4 - p, s * 0.2); ctx.fillRect(x + s * 0.6, y + p, s * 0.4 - p, s * 0.2);
        } else if (dir.x === 1) {
            ctx.fillStyle = trouser; ctx.fillRect(x + p, y + p, s - p * 2, s * 0.4 - p); ctx.fillRect(x + p, y + s * 0.6, s - p * 2, s * 0.4 - p);
            ctx.fillStyle = belt; ctx.fillRect(x + p, y + p, s * 0.2, s - p * 2);
            ctx.fillStyle = buckle; ctx.fillRect(x + p + 1, y + s * 0.4, s * 0.15, s * 0.2);
            ctx.fillStyle = bg; ctx.fillRect(x + s * 0.35, y + s * 0.4, s * 0.65 - p, s * 0.2);
            ctx.fillStyle = shoe; ctx.fillRect(x + s - s * 0.2 - p, y + p, s * 0.2, s * 0.4 - p); ctx.fillRect(x + s - s * 0.2 - p, y + s * 0.6, s * 0.2, s * 0.4 - p);
        } else if (dir.x === -1) {
            ctx.fillStyle = trouser; ctx.fillRect(x + p, y + p, s - p * 2, s * 0.4 - p); ctx.fillRect(x + p, y + s * 0.6, s - p * 2, s * 0.4 - p);
            ctx.fillStyle = belt; ctx.fillRect(x + s - s * 0.2 - p, y + p, s * 0.2, s - p * 2);
            ctx.fillStyle = buckle; ctx.fillRect(x + s - s * 0.2 - p, y + s * 0.4, s * 0.15, s * 0.2);
            ctx.fillStyle = bg; ctx.fillRect(x + p, y + s * 0.4, s * 0.65 - p, s * 0.2);
            ctx.fillStyle = shoe; ctx.fillRect(x + p, y + p, s * 0.2, s * 0.4 - p); ctx.fillRect(x + p, y + s * 0.6, s * 0.2, s * 0.4 - p);
        }
    }

    // ============================================================
    // Input
    // ============================================================
    function onKeyDown(e) {
        if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && (gameState === 'dead' || gameState === 'idle')) startGame(); return; }
        if (gameState !== 'playing') return;
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': e.preventDefault(); if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
            case 'ArrowDown': case 'KeyS': e.preventDefault(); if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
            case 'ArrowLeft': case 'KeyA': e.preventDefault(); if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
            case 'ArrowRight': case 'KeyD': e.preventDefault(); if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
        }
    }

    function onTouchStart(e) {
        e.preventDefault();
        if (gameState === 'dead' || gameState === 'idle') { startGame(); return; }
        const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
    }

    function onTouchEnd(e) {
        e.preventDefault();
        if (gameState !== 'playing') return;
        const t = e.changedTouches[0], dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
            else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        } else {
            if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
            else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        }
    }

    // ============================================================
    // Public API
    // ============================================================
    window.SnakEd = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); },
        setWallDeath: function (v) { wallDeath = v; }
    };
})();