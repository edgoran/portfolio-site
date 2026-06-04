// ============================================================
// SnakEd - Snake game with pixel art Ed
// ============================================================
(function () {
    'use strict';

    const GRID_SIZE = 20;
    const TICK_INITIAL = 150;
    const TICK_MIN = 70;
    const TICK_DECREASE = 2;
    const DEATH_LOCKOUT_MS = 600;

    let canvas, ctx, wrapper;
    let gameState = 'idle';
    let tickInterval = null;
    let tickRate = TICK_INITIAL;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snaked-high') || '0');
    let wallDeath = false;
    let cols = 0, rows = 0, cellSize = 0, W = 0, H = 0;
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let deathTimestamp = 0;
    let touchStartX = 0, touchStartY = 0;

    let overlay, overlayTitle, overlayText, startBtn, hud, scoreEl, highScoreEl;
    let boundKeyDown, boundTouchStart, boundTouchMove, boundTouchEnd, boundResize;

    function getColor(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
    function colors() {
        return {
            bg: getColor('--bg-card'), grid: getColor('--border'),
            skin: '#f5deb3', hair: '#6b4c2a', glasses: '#333333',
            shirt: getColor('--accent-light'), body: getColor('--accent'),
            food: getColor('--accent-green')
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        wrapper = document.getElementById('game-wrapper');
        overlay = document.getElementById('game-overlay');
        overlayTitle = document.getElementById('game-overlay-title');
        overlayText = document.getElementById('game-overlay-text');
        startBtn = document.getElementById('game-start-btn');
        hud = document.getElementById('game-hud');
        scoreEl = document.getElementById('game-score');
        highScoreEl = document.getElementById('game-high-score');

        wrapper.classList.add('square');

        boundKeyDown = onKeyDown.bind(this);
        boundTouchStart = onTouchStart.bind(this);
        boundTouchMove = function (e) { e.preventDefault(); };
        boundTouchEnd = onTouchEnd.bind(this);
        boundResize = resize.bind(this);

        canvas.addEventListener('keydown', boundKeyDown);
        canvas.addEventListener('touchstart', boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', boundTouchEnd, { passive: false });
        window.addEventListener('resize', boundResize);

        canvas.setAttribute('tabindex', '0');
        canvas.focus();

        resize();
        resetGame();
        showOverlay('SnakEd', "Eat food to grow. Don't hit yourself!", 'Press Space or Tap to Start');
        updateHighScoreDisplay();
        draw();
    }

    function destroy() {
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        gameState = 'idle';
        if (canvas) {
            canvas.removeEventListener('keydown', boundKeyDown);
            canvas.removeEventListener('touchstart', boundTouchStart);
            canvas.removeEventListener('touchmove', boundTouchMove);
            canvas.removeEventListener('touchend', boundTouchEnd);
        }
        window.removeEventListener('resize', boundResize);
        if (wrapper) wrapper.classList.remove('square');
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width; H = rect.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        hideOverlay(); hud.classList.add('visible'); canvas.focus();
        tickInterval = setInterval(tick, tickRate);
    }

    function die() {
        gameState = 'dead'; deathTimestamp = Date.now();
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        if (score > highScore) { highScore = score; localStorage.setItem('snaked-high', highScore.toString()); }
        updateHighScoreDisplay(); scoreEl.textContent = score;
        draw();
        setTimeout(() => { showOverlay('Game Over', `Score: ${score}`, 'Press Space or Tap to Restart'); }, 400);
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
            score++; scoreEl.textContent = score; spawnFood();
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
            if (i === 0) drawHead(x, y, c);
            else if (i === 1) drawNeck(x, y, i, c);
            else if (i === snake.length - 1) drawTrousers(x, y, i, c);
            else { ctx.fillStyle = i % 2 === 0 ? c.shirt : c.body; ctx.fillRect(x + p, y + p, cellSize - p * 2, cellSize - p * 2); }
        }
    }

    function drawHead(x, y, c) {
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

    function drawNeck(x, y, index, c) {
        const s = cellSize, p = 1, dir = getDirectionToward(index);
        ctx.fillStyle = c.shirt; ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);
        ctx.fillStyle = c.skin;
        if (dir.x === 1) ctx.fillRect(x + s * 0.6, y + s * 0.3, s * 0.4, s * 0.4);
        else if (dir.x === -1) ctx.fillRect(x, y + s * 0.3, s * 0.4, s * 0.4);
        else if (dir.y === -1) ctx.fillRect(x + s * 0.3, y, s * 0.4, s * 0.4);
        else ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.4);
    }

    function drawTrousers(x, y, index, c) {
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
    // UI
    // ============================================================
    function showOverlay(title, text, btnText) {
        overlayTitle.textContent = title; overlayText.textContent = text; startBtn.textContent = btnText;
        overlay.classList.remove('hidden'); overlay.classList.toggle('game-over', title === 'Game Over');
    }
    function hideOverlay() { overlay.classList.add('hidden'); }
    function updateHighScoreDisplay() { highScoreEl.textContent = `HI ${highScore}`; }

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
        start: function () { startGame(); canvas.focus(); },
        setWallDeath: function (v) { wallDeath = v; }
    };
})();