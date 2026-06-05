// ============================================================
// tEdris - Tetris with Ed-themed pieces
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;
    const HIGH_SCORE_KEY = 'tedris-high';

    // Grid
    const COLS = 10;
    const ROWS = 20;
    const TICK_INITIAL = 800;
    const TICK_MIN = 100;
    const TICK_DECREASE = 30;
    const SOFT_DROP_TICK = 50;
    const LOCK_DELAY = 500;
    const LINES_PER_LEVEL = 10;

    // Piece definitions - each has a "head" position (first block)
    const PIECES = {
        I: { color: '#48dbfb', shirt: '#2e86de', shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]] },
        O: { color: '#feca57', shirt: '#f6b93b', shapes: [[[1,1],[1,1]]] },
        T: { color: '#c9a0ff', shirt: '#9b72cf', shapes: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]] },
        S: { color: '#3fb950', shirt: '#2ea043', shapes: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]] },
        Z: { color: '#e53e3e', shirt: '#c53030', shapes: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]] },
        J: { color: '#54a0ff', shirt: '#2e86de', shapes: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]] },
        L: { color: '#ff9ff3', shirt: '#f368e0', shapes: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]] }
    };

    const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    // State
    let els = {};
    let gameState = 'idle';
    let animationId = null;
    let score = 0;
    let highScore = 0;
    let level = 1;
    let linesCleared = 0;
    let W = 0, H = 0;
    let cellSize = 0;
    let offsetX = 0, offsetY = 0;

    // Grid
    let grid = [];

    // Current piece
    let current = null;
    let currentX = 0, currentY = 0;
    let currentRotation = 0;

    // Next piece
    let nextPiece = null;

    // Timing
    let lastTimestamp = 0;
    let dropTimer = 0;
    let dropInterval = TICK_INITIAL;
    let softDropping = false;
    let lockTimer = 0;
    let locking = false;

    // Input
    let leftPressed = false;
    let rightPressed = false;
    let moveTimer = 0;
    let moveDelay = 150;
    let moveRepeat = 50;
    let moveHeld = 0;

    // Handlers
    let handlers = {};

    function colors() {
        return {
            bg: GU.getColor('--bg-card'),
            grid: GU.getColor('--border'),
            gridBg: GU.getColor('--bg-secondary'),
            text: GU.getColor('--text-secondary'),
            ghost: GU.getColor('--text-muted'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333'
        };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        highScore = GU.getHighScore(HIGH_SCORE_KEY);

        GU.setWrapperClass(els, 'tetris');

        handlers = {
            keydown: onKeyDown,
            keyup: onKeyUp,
            resize: resize,
            tLeft: (e) => { e.preventDefault(); moveLeft(); },
            tRight: (e) => { e.preventDefault(); moveRight(); },
            tDown: (e) => { e.preventDefault(); softDropping = true; },
            tDownEnd: (e) => { e.preventDefault(); softDropping = false; },
            tRotate: (e) => { e.preventDefault(); rotate(); },
            tDrop: (e) => { e.preventDefault(); if (gameState === 'playing') hardDrop(); else startGame(); }
        };

        els.canvas.addEventListener('keydown', handlers.keydown);
        els.canvas.addEventListener('keyup', handlers.keyup);
        window.addEventListener('resize', handlers.resize);

        // Mobile controls
        const leftBtn = document.getElementById('mobile-tleft-btn');
        const rightBtn = document.getElementById('mobile-tright-btn');
        const downBtn = document.getElementById('mobile-tdown-btn');
        const rotateBtn = document.getElementById('mobile-trotate-btn');
        const dropBtn = document.getElementById('mobile-tdrop-btn');

        if (leftBtn) leftBtn.addEventListener('touchstart', handlers.tLeft, { passive: false });
        if (rightBtn) rightBtn.addEventListener('touchstart', handlers.tRight, { passive: false });
        if (downBtn) {
            downBtn.addEventListener('touchstart', handlers.tDown, { passive: false });
            downBtn.addEventListener('touchend', handlers.tDownEnd, { passive: false });
        }
        if (rotateBtn) rotateBtn.addEventListener('touchstart', handlers.tRotate, { passive: false });
        if (dropBtn) dropBtn.addEventListener('touchstart', handlers.tDrop, { passive: false });

        GU.focusCanvas(els);

        // Initialise empty grid so draw() works before game starts
        grid = [];
        for (let r = 0; r < ROWS; r++) {
            grid.push(new Array(COLS).fill(null));
        }

        resize();
        GU.showOverlay(els, 'tEdris', 'Stack the Eds! Clear lines to score.', 'Press Space to Start', false);
        els.highScoreEl.textContent = `HI ${highScore}`;
        draw();
    }

    function destroy() {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        gameState = 'idle';

        els.canvas.removeEventListener('keydown', handlers.keydown);
        els.canvas.removeEventListener('keyup', handlers.keyup);
        window.removeEventListener('resize', handlers.resize);

        const leftBtn = document.getElementById('mobile-tleft-btn');
        const rightBtn = document.getElementById('mobile-tright-btn');
        const downBtn = document.getElementById('mobile-tdown-btn');
        const rotateBtn = document.getElementById('mobile-trotate-btn');
        const dropBtn = document.getElementById('mobile-tdrop-btn');

        if (leftBtn) leftBtn.removeEventListener('touchstart', handlers.tLeft);
        if (rightBtn) rightBtn.removeEventListener('touchstart', handlers.tRight);
        if (downBtn) {
            downBtn.removeEventListener('touchstart', handlers.tDown);
            downBtn.removeEventListener('touchend', handlers.tDownEnd);
        }
        if (rotateBtn) rotateBtn.removeEventListener('touchstart', handlers.tRotate);
        if (dropBtn) dropBtn.removeEventListener('touchstart', handlers.tDrop);

        GU.setWrapperClass(els, null);
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;

        // Calculate cell size to fit grid with space for preview
        const gridAreaW = W * 0.7;
        const maxCellW = Math.floor(gridAreaW / COLS);
        const maxCellH = Math.floor((H - 10) / ROWS);
        cellSize = Math.min(maxCellW, maxCellH);
        cellSize = Math.max(10, cellSize);

        offsetX = Math.floor((W * 0.7 - cellSize * COLS) / 2) + 5;
        offsetY = Math.floor((H - cellSize * ROWS) / 2);

        if (gameState !== 'playing') draw();
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetGame() {
        grid = [];
        for (let r = 0; r < ROWS; r++) {
            grid.push(new Array(COLS).fill(null));
        }
        score = 0; level = 1; linesCleared = 0;
        dropInterval = TICK_INITIAL;
        softDropping = false;
        leftPressed = false; rightPressed = false;
        moveTimer = 0; moveHeld = 0;
        locking = false; lockTimer = 0;
        nextPiece = randomPiece();
        spawnPiece();
    }

    function startGame() {
        if (gameState === 'playing') return;
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        resize();
        resetGame();
        gameState = 'playing';
        GU.hideOverlay(els);
        els.hud.classList.add('visible');
        els.canvas.focus();
        lastTimestamp = performance.now();
        loop(lastTimestamp);
    }

    function gameOver() {
        gameState = 'dead';
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        if (score > highScore) { highScore = score; GU.setHighScore(HIGH_SCORE_KEY, highScore); }
        els.highScoreEl.textContent = `HI ${highScore}`;
        els.scoreEl.textContent = score;

        setTimeout(() => {
            GU.showOverlay(els, 'Game Over', `Score: ${score} | Level: ${level} | Lines: ${linesCleared}`, 'Press Space to Restart', true);
        }, 500);
    }

    // ============================================================
    // Pieces
    // ============================================================
    function randomPiece() {
        const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
        return { name, ...PIECES[name] };
    }

    function spawnPiece() {
        current = nextPiece;
        nextPiece = randomPiece();
        currentRotation = 0;
        const shape = getShape();
        currentX = Math.floor((COLS - shape[0].length) / 2);
        currentY = 0;
        locking = false;
        lockTimer = 0;

        if (!isValid(currentX, currentY, currentRotation)) {
            gameOver();
        }
    }

    function getShape(rotation) {
        const rot = rotation !== undefined ? rotation : currentRotation;
        return current.shapes[rot % current.shapes.length];
    }

    // Find the "head" block index (first filled cell in shape)
    function getHeadPosition(shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) return { r, c };
            }
        }
        return { r: 0, c: 0 };
    }

    // ============================================================
    // Collision
    // ============================================================
    function isValid(x, y, rotation) {
        const shape = current.shapes[rotation % current.shapes.length];
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const gx = x + c;
                const gy = y + r;
                if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
                if (gy >= 0 && grid[gy][gx]) return false;
            }
        }
        return true;
    }

    // ============================================================
    // Movement
    // ============================================================
    function moveLeft() {
        if (!current || gameState !== 'playing') return;
        if (isValid(currentX - 1, currentY, currentRotation)) {
            currentX--;
            if (locking) lockTimer = 0;
        }
    }

    function moveRight() {
        if (!current || gameState !== 'playing') return;
        if (isValid(currentX + 1, currentY, currentRotation)) {
            currentX++;
            if (locking) lockTimer = 0;
        }
    }

    function moveDown() {
        if (!current || gameState !== 'playing') return;
        if (isValid(currentX, currentY + 1, currentRotation)) {
            currentY++;
            if (softDropping) score++;
            locking = false;
            lockTimer = 0;
            return true;
        }
        return false;
    }

    function hardDrop() {
        if (!current || gameState !== 'playing') return;
        let dropped = 0;
        while (isValid(currentX, currentY + 1, currentRotation)) {
            currentY++;
            dropped++;
        }
        score += dropped * 2;
        lockPiece();
    }

    function rotate() {
        if (!current || gameState !== 'playing') return;
        const newRotation = (currentRotation + 1) % current.shapes.length;

        if (isValid(currentX, currentY, newRotation)) {
            currentRotation = newRotation;
            if (locking) lockTimer = 0;
            return;
        }

        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (isValid(currentX + kick, currentY, newRotation)) {
                currentX += kick;
                currentRotation = newRotation;
                if (locking) lockTimer = 0;
                return;
            }
        }
    }

    function lockPiece() {
        const shape = getShape();
        const headPos = getHeadPosition(shape);

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const gy = currentY + r;
                const gx = currentX + c;
                if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
                    const isHead = (r === headPos.r && c === headPos.c);
                    grid[gy][gx] = { color: current.color, shirt: current.shirt, isHead: isHead };
                }
            }
        }

        checkLines();
        spawnPiece();
    }

    function checkLines() {
        const lines = [];
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r].every(cell => cell !== null)) {
                lines.push(r);
            }
        }

        if (lines.length === 0) return;

        const points = [0, 100, 300, 500, 800];
        score += (points[lines.length] || 800) * level;
        linesCleared += lines.length;
        els.scoreEl.textContent = score;

        const newLevel = Math.floor(linesCleared / LINES_PER_LEVEL) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(TICK_MIN, TICK_INITIAL - (level - 1) * TICK_DECREASE);
        }

        for (const line of lines.sort((a, b) => b - a)) {
            grid.splice(line, 1);
            grid.unshift(new Array(COLS).fill(null));
        }
    }

    function getGhostY() {
        let ghostY = currentY;
        while (isValid(currentX, ghostY + 1, currentRotation)) {
            ghostY++;
        }
        return ghostY;
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
        if (!current) return;

        // Horizontal movement with DAS
        if (leftPressed || rightPressed) {
            moveHeld += delta;
            moveTimer += delta;
            if (moveHeld > moveDelay && moveTimer > moveRepeat) {
                moveTimer = 0;
                if (leftPressed) moveLeft();
                if (rightPressed) moveRight();
            }
        }

        // Drop
        const currentDropInterval = softDropping ? SOFT_DROP_TICK : dropInterval;
        dropTimer += delta;

        if (dropTimer >= currentDropInterval) {
            dropTimer = 0;
            if (!moveDown()) {
                if (!locking) {
                    locking = true;
                    lockTimer = 0;
                }
            }
        }

        // Lock delay
        if (locking) {
            lockTimer += delta;
            if (lockTimer >= LOCK_DELAY) {
                lockPiece();
            }
        }
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;

        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        drawGrid(ctx, c);
        drawLockedPieces(ctx, c);

        if (current && gameState === 'playing') {
            drawGhost(ctx, c);
            drawCurrentPiece(ctx, c);
        }

        drawNextPiece(ctx, c);
        drawInfo(ctx, c);
    }

    function drawGrid(ctx, c) {
        ctx.fillStyle = c.gridBg;
        ctx.fillRect(offsetX, offsetY, COLS * cellSize, ROWS * cellSize);

        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + x * cellSize, offsetY);
            ctx.lineTo(offsetX + x * cellSize, offsetY + ROWS * cellSize);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + y * cellSize);
            ctx.lineTo(offsetX + COLS * cellSize, offsetY + y * cellSize);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX, offsetY, COLS * cellSize, ROWS * cellSize);
    }

    function drawLockedPieces(ctx, c) {
        if (grid.length === 0) return;
        for (let r = 0; r < ROWS; r++) {
            for (let col = 0; col < COLS; col++) {
                const cell = grid[r][col];
                if (cell) {
                    const x = offsetX + col * cellSize;
                    const y = offsetY + r * cellSize;
                    if (cell.isHead) {
                        drawEdHead(ctx, x, y, cell.color, c);
                    } else {
                        drawEdBody(ctx, x, y, cell.color, cell.shirt);
                    }
                }
            }
        }
    }

    function drawCurrentPiece(ctx, c) {
        const shape = getShape();
        const headPos = getHeadPosition(shape);

        for (let r = 0; r < shape.length; r++) {
            for (let col = 0; col < shape[r].length; col++) {
                if (!shape[r][col]) continue;
                const x = offsetX + (currentX + col) * cellSize;
                const y = offsetY + (currentY + r) * cellSize;
                const isHead = (r === headPos.r && col === headPos.c);

                if (isHead) {
                    drawEdHead(ctx, x, y, current.color, c);
                } else {
                    drawEdBody(ctx, x, y, current.color, current.shirt);
                }
            }
        }
    }

    function drawGhost(ctx, c) {
        const ghostY = getGhostY();
        if (ghostY === currentY) return;

        const shape = getShape();
        ctx.globalAlpha = 0.2;
        for (let r = 0; r < shape.length; r++) {
            for (let col = 0; col < shape[r].length; col++) {
                if (!shape[r][col]) continue;
                const x = offsetX + (currentX + col) * cellSize;
                const y = offsetY + (ghostY + r) * cellSize;
                ctx.fillStyle = current.color;
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawEdHead(ctx, x, y, color, c) {
        const s = cellSize;
        const p = 1;

        // Background
        ctx.fillStyle = color;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        // Full Ed head filling the cell
        const cx = x + s / 2;
        const cy = y + s / 2;
        const hs = s * 0.42;

        // Skin
        ctx.fillStyle = c.skin;
        ctx.fillRect(x + p + 2, y + p + 2, s - p * 2 - 4, s - p * 2 - 4);

        // Hair - top portion
        ctx.fillStyle = c.hair;
        ctx.fillRect(x + p + 2, y + p + 2, s - p * 2 - 4, s * 0.28);

        // Face below hair
        ctx.fillStyle = c.skin;
        ctx.fillRect(x + p + 2, y + s * 0.32, s - p * 2 - 4, s * 0.58);

        // Glasses
        ctx.fillStyle = c.glasses;
        const glassW = s * 0.22;
        const glassH = s * 0.16;
        const glassY = cy - glassH / 2 + s * 0.02;
        const gap = s * 0.06;
        // Left lens
        ctx.fillRect(cx - gap / 2 - glassW, glassY, glassW, glassH);
        // Right lens
        ctx.fillRect(cx + gap / 2, glassY, glassW, glassH);
        // Bridge
        ctx.fillRect(cx - gap / 2, glassY + glassH * 0.3, gap, glassH * 0.4);

        // Eyes behind glasses
        ctx.fillStyle = '#ffffff';
        const es = s * 0.08;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - es / 2, glassY + glassH * 0.25, es, es);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - es / 2, glassY + glassH * 0.25, es, es);

        // Pupils
        ctx.fillStyle = '#1a1a1a';
        const ps = es * 0.6;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);

        // Mouth
        ctx.fillStyle = c.glasses;
        ctx.fillRect(cx - s * 0.1, cy + hs * 0.55, s * 0.2, s * 0.04);

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
    }

    function drawEdBody(ctx, x, y, color, shirt) {
        const s = cellSize;
        const p = 1;

        // Shirt
        ctx.fillStyle = shirt;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        // Lighter top (collar area)
        ctx.fillStyle = color;
        ctx.fillRect(x + p, y + p, s - p * 2, s * 0.2);

        // Shirt detail - subtle lines
        if (s >= 14) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y + s * 0.4);
            ctx.lineTo(x + s * 0.7, y + s * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y + s * 0.7);
            ctx.lineTo(x + s * 0.7, y + s * 0.7);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
    }

    function drawNextPiece(ctx, c) {
        if (!nextPiece) return;

        const previewX = offsetX + COLS * cellSize + 12;
        const previewY = offsetY + 5;

        ctx.fillStyle = c.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('NEXT', previewX, previewY);

        const shape = nextPiece.shapes[0];
        const headPos = getHeadPositionStatic(shape);
        const previewCellSize = Math.min(cellSize * 0.8, 18);

        for (let r = 0; r < shape.length; r++) {
            for (let col = 0; col < shape[r].length; col++) {
                if (!shape[r][col]) continue;
                const x = previewX + col * previewCellSize;
                const y = previewY + 10 + r * previewCellSize;
                const isHead = (r === headPos.r && col === headPos.c);

                if (isHead) {
                    // Mini head
                    ctx.fillStyle = nextPiece.color;
                    ctx.fillRect(x, y, previewCellSize - 1, previewCellSize - 1);
                    ctx.fillStyle = c.skin;
                    const miniHS = previewCellSize * 0.3;
                    ctx.beginPath();
                    ctx.arc(x + previewCellSize / 2, y + previewCellSize / 2, miniHS, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = c.hair;
                    ctx.fillRect(x + previewCellSize * 0.2, y + previewCellSize * 0.15, previewCellSize * 0.6, previewCellSize * 0.2);
                } else {
                    ctx.fillStyle = nextPiece.shirt;
                    ctx.fillRect(x, y, previewCellSize - 1, previewCellSize - 1);
                    ctx.fillStyle = nextPiece.color;
                    ctx.fillRect(x, y, previewCellSize - 1, previewCellSize * 0.25);
                }
                ctx.strokeStyle = nextPiece.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, previewCellSize - 1, previewCellSize - 1);
            }
        }
    }

    function getHeadPositionStatic(shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) return { r, c };
            }
        }
        return { r: 0, c: 0 };
    }

    function drawInfo(ctx, c) {
        const infoX = offsetX + COLS * cellSize + 12;
        const infoY = offsetY + 90;

        ctx.fillStyle = c.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`Level: ${level}`, infoX, infoY);
        ctx.fillText(`Lines: ${linesCleared}`, infoX, infoY + 16);
    }

    // ============================================================
    // Input
    // ============================================================
    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;
            if (gameState === 'idle' || gameState === 'dead') { startGame(); return; }
            hardDrop();
            return;
        }

        if (gameState !== 'playing') return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                if (!e.repeat) { moveLeft(); leftPressed = true; moveHeld = 0; moveTimer = 0; }
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                if (!e.repeat) { moveRight(); rightPressed = true; moveHeld = 0; moveTimer = 0; }
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                softDropping = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                e.preventDefault();
                if (!e.repeat) rotate();
                break;
        }
    }

    function onKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA': leftPressed = false; moveHeld = 0; break;
            case 'ArrowRight': case 'KeyD': rightPressed = false; moveHeld = 0; break;
            case 'ArrowDown': case 'KeyS': softDropping = false; break;
        }
    }

    // ============================================================
    // Public API
    // ============================================================
    window.TEdris = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); }
    };
})();