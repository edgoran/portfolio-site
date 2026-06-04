// ============================================================
// SnakEd - Snake game with pixel art Ed as the snake
// ============================================================
(function () {
    'use strict';

    const GRID_SIZE = 20;
    const TICK_INITIAL = 150;
    const TICK_MIN = 70;
    const TICK_DECREASE = 2;

    let canvas, ctx;
    let gameState = 'idle'; // idle, playing, dead
    let tickInterval = null;
    let tickRate = TICK_INITIAL;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snaked-high') || '0');
    let wallDeath = false;

    // Grid dimensions (calculated on resize)
    let cols = 0, rows = 0;
    let cellSize = 0;
    let W = 0, H = 0;

    // Game objects
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let growing = false;

    // Death lockout
    let deathTimestamp = 0;
    const DEATH_LOCKOUT_MS = 600;

    // DOM elements
    let overlay, overlayTitle, overlayText, startBtn, hud, scoreEl, highScoreEl, wrapper;

    function getColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function colors() {
        return {
            bg: getColor('--bg-card'),
            grid: getColor('--border'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            shirt: getColor('--accent-light'),
            body: getColor('--accent'),
            food: getColor('--accent-green'),
            foodAlt: '#ff6b6b',
            text: getColor('--text-primary')
        };
    }

    // ============================================================
    // Initialisation
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

        // Switch to square aspect ratio
        wrapper.classList.add('square');

        resize();
        resetGame();
        showOverlay('SnakEd', 'Eat food to grow. Don\'t hit yourself!', 'Press Space or Tap to Start');
        updateHighScoreDisplay();
        draw();

        // Bind events
        canvas.addEventListener('keydown', onKeyDown);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });

        canvas.setAttribute('tabindex', '0');
        canvas.focus();
    }

function destroy() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
    gameState = 'idle';

    if (canvas) {
        canvas.removeEventListener('keydown', onKeyDown);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
    }

    if (wrapper) {
        wrapper.classList.remove('square');
    }
}

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        const rect = wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        W = rect.width;
        H = rect.height;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Calculate grid
        cellSize = Math.floor(Math.min(W, H) / GRID_SIZE);
        cols = Math.floor(W / cellSize);
        rows = Math.floor(H / cellSize);

        if (gameState !== 'playing') {
            draw();
        }
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        score = 0;
        tickRate = TICK_INITIAL;
        growing = false;

        const startX = Math.floor(cols / 2);
        const startY = Math.floor(rows / 2);

        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };

        spawnFood();
    }

function startGame() {
    if (gameState === 'playing') return;
    if (Date.now() - deathTimestamp < DEATH_LOCKOUT_MS) return;

    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }

    resetGame();
    gameState = 'playing';
    hideOverlay();
    hud.classList.add('visible');
    canvas.focus();

    tickInterval = setInterval(tick, tickRate);
}

    function die() {
        gameState = 'dead';
        deathTimestamp = Date.now();

        if (tickInterval) {
            clearInterval(tickInterval);
            tickInterval = null;
        }

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snaked-high', highScore.toString());
        }
        updateHighScoreDisplay();
        scoreEl.textContent = score;

        // Flash and show overlay
        draw();
        setTimeout(() => {
            showOverlay('Game Over', `Score: ${score}`, 'Press Space or Tap to Restart');
        }, 400);
    }

    // ============================================================
    // Game Tick
    // ============================================================
    function tick() {
        if (gameState !== 'playing') return;

        // Apply queued direction
        direction = { ...nextDirection };

        // Calculate new head position
        const head = snake[0];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y
        };

        // Wall collision
        if (wallDeath) {
            if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
                die();
                return;
            }
        } else {
            // Wrap around
            if (newHead.x < 0) newHead.x = cols - 1;
            if (newHead.x >= cols) newHead.x = 0;
            if (newHead.y < 0) newHead.y = rows - 1;
            if (newHead.y >= rows) newHead.y = 0;
        }

        // Self collision
        for (const segment of snake) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
                die();
                return;
            }
        }

        // Move snake
        snake.unshift(newHead);

        // Check food
        if (newHead.x === food.x && newHead.y === food.y) {
            score++;
            scoreEl.textContent = score;
            spawnFood();

            // Speed up
            tickRate = Math.max(TICK_MIN, tickRate - TICK_DECREASE);
            clearInterval(tickInterval);
            tickInterval = setInterval(tick, tickRate);
        } else {
            snake.pop();
        }

        draw();
    }

    // ============================================================
    // Food
    // ============================================================
    function spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        food = pos;
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();

        // Clear
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // Grid lines (subtle)
        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, rows * cellSize);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(cols * cellSize, y * cellSize);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Wall death border indicator
        if (wallDeath) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            ctx.strokeRect(1.5, 1.5, cols * cellSize - 3, rows * cellSize - 3);
        }

        // Food
        drawFood(c);

        // Snake
        drawSnake(c);
    }

    function drawFood(c) {
        const x = food.x * cellSize;
        const y = food.y * cellSize;
        const padding = 3;

        // Pulsing apple/dot
        ctx.fillStyle = c.food;
        ctx.beginPath();
        ctx.arc(
            x + cellSize / 2,
            y + cellSize / 2,
            (cellSize - padding * 2) / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Stem
        ctx.fillStyle = c.hair;
        ctx.fillRect(x + cellSize / 2 - 1, y + padding - 2, 2, 4);
    }

function drawSnake(c) {
    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        const x = seg.x * cellSize;
        const y = seg.y * cellSize;
        const padding = 1;

        if (i === 0) {
            // Head - Ed's face
            drawHead(x, y, c);
        } else if (i === snake.length - 1) {
            // Tail - trousers
            drawTrousers(x, y, c);
        } else {
            // Body segments - purple shirt colored with subtle pattern
            const shade = i % 2 === 0 ? c.shirt : c.body;
            ctx.fillStyle = shade;
            ctx.fillRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

            // Shirt collar detail on first body segment
            if (i === 1) {
                ctx.fillStyle = c.skin;
                ctx.fillRect(x + cellSize * 0.3, y + padding, cellSize * 0.4, 3);
            }
        }
    }
}

    function drawHead(x, y, c) {
        const s = cellSize;
        const p = 1;

        // Face background
        ctx.fillStyle = c.skin;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        // Hair on top
        ctx.fillStyle = c.hair;
        ctx.fillRect(x + p, y + p, s - p * 2, s * 0.25);

        // Glasses
        ctx.fillStyle = c.glasses;
        const glassY = y + s * 0.4;
        const glassSize = s * 0.22;
        const gap = s * 0.08;

        // Left lens
        ctx.fillRect(x + s * 0.15, glassY, glassSize, glassSize);
        // Right lens
        ctx.fillRect(x + s * 0.15 + glassSize + gap, glassY, glassSize, glassSize);
        // Bridge
        ctx.fillRect(x + s * 0.15 + glassSize, glassY + glassSize * 0.3, gap, glassSize * 0.4);

        // Eyes (white behind glasses)
        ctx.fillStyle = '#ffffff';
        const eyeSize = s * 0.1;
        ctx.fillRect(x + s * 0.22, glassY + glassSize * 0.25, eyeSize, eyeSize);
        ctx.fillRect(x + s * 0.22 + glassSize + gap, glassY + glassSize * 0.25, eyeSize, eyeSize);

        // Pupils - look in direction of movement
        ctx.fillStyle = '#1a1a1a';
        const pupilOffset = s * 0.04;
        const px = direction.x * pupilOffset;
        const py = direction.y * pupilOffset;
        ctx.fillRect(x + s * 0.22 + px, glassY + glassSize * 0.25 + py, eyeSize * 0.7, eyeSize * 0.7);
        ctx.fillRect(x + s * 0.22 + glassSize + gap + px, glassY + glassSize * 0.25 + py, eyeSize * 0.7, eyeSize * 0.7);

        // Mouth
        ctx.fillStyle = c.glasses;
        ctx.fillRect(x + s * 0.35, y + s * 0.72, s * 0.3, s * 0.06);
    }

function drawTrousers(x, y, c) {
    const s = cellSize;
    const p = 1;

    // Trouser colour
    ctx.fillStyle = '#3d3d5c';

    // Left leg
    ctx.fillRect(x + p, y + p, s * 0.4 - p, s - p * 2);

    // Right leg
    ctx.fillRect(x + s * 0.6, y + p, s * 0.4 - p, s - p * 2);

    // Belt/waistband
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(x + p, y + p, s - p * 2, s * 0.2);

    // Belt buckle
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + s * 0.4, y + p + 1, s * 0.2, s * 0.15);

    // Gap between legs
    ctx.fillStyle = c.bg;
    ctx.fillRect(x + s * 0.4, y + s * 0.35, s * 0.2, s * 0.65 - p);

    // Shoes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + p, y + s - s * 0.2 - p, s * 0.4 - p, s * 0.2);
    ctx.fillRect(x + s * 0.6, y + s - s * 0.2 - p, s * 0.4 - p, s * 0.2);
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
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;

        if (gameState === 'dead' || gameState === 'idle') {
            startGame();
        }
        return;
    }

    if (gameState !== 'playing') return;

    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
}

function onTouchStart(e) {
    e.preventDefault();
    if (gameState === 'dead' || gameState === 'idle') {
        startGame();
        return;
    }
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function onTouchMove(e) {
    e.preventDefault();
}

function onTouchEnd(e) {
    e.preventDefault();
    if (gameState !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    const minSwipe = 20;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x !== -1) {
            nextDirection = { x: 1, y: 0 };
        } else if (dx < 0 && direction.x !== 1) {
            nextDirection = { x: -1, y: 0 };
        }
    } else {
        if (dy > 0 && direction.y !== -1) {
            nextDirection = { x: 0, y: 1 };
        } else if (dy < 0 && direction.y !== 1) {
            nextDirection = { x: 0, y: -1 };
        }
    }
}

// ============================================================
// Public API
// ============================================================
window.SnakEd = {
    init: init,
    destroy: destroy,
    start: function () {
        startGame();
        canvas.focus();
    },
    setWallDeath: function (enabled) {
        wallDeath = enabled;
    }
};

})();