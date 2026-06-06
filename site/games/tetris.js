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

    // Piece definitions - distinct colours
    const PIECES = {
        I: { color: '#48dbfb', shirt: '#0abde3', shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]] },
        O: { color: '#feca57', shirt: '#f6b93b', shapes: [[[1,1],[1,1]]] },
        T: { color: '#c9a0ff', shirt: '#9b72cf', shapes: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]] },
        S: { color: '#55efc4', shirt: '#00b894', shapes: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]] },
        Z: { color: '#ff7675', shirt: '#d63031', shapes: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]] },
        J: { color: '#74b9ff', shirt: '#0984e3', shapes: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]] },
        L: { color: '#fdcb6e', shirt: '#e17055', shapes: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]] }
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

    function getHeadPosition(shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) return { r, c };
            }
        }
        return { r: 0, c: 0 };
    }

// ============================================================
// Block Roles - Fixed per piece type
// Roles are assigned to filled cells in reading order
// (top-to-bottom, left-to-right) for EVERY rotation.
// Since the shape definition handles the physical rotation,
// the roles stay locked to their block.
// ============================================================
const PIECE_ROLE_ORDER = {
    I: ['head', 'torso', 'shirt', 'trousers'],      // head at one end, trousers at other
    O: ['head', 'torso', 'shirt', 'trousers'],      // top-left to bottom-right
    T: ['head', 'shirt', 'torso', 'trousers'],      // head is the spike, torso center, trousers opposite end
    S: ['torso', 'head', 'trousers', 'shirt'],      // head top-right end, trousers bottom-left end
    Z: ['head', 'torso', 'shirt', 'trousers'],      // head top-left end, trousers bottom-right end
    J: ['head', 'torso', 'shirt', 'trousers'],      // head is the spike (top-left), flows to bottom-right
    L: ['head', 'trousers', 'shirt', 'torso']       // head is the spike (top-right), torso adjacent to it
};

function getBlockRoles(shape, headPos, pieceName, rotation) {
    const roles = [];
    for (let r = 0; r < shape.length; r++) {
        roles.push([]);
        for (let c = 0; c < shape[r].length; c++) {
            roles[r].push(null);
        }
    }

    // Get the filled cells for rotation 0 in reading order
    const rot0Shape = PIECES[pieceName].shapes[0];
    const rot0Cells = getFilledCells(rot0Shape);

    // Get the filled cells for current rotation in reading order
    const currentCells = getFilledCells(shape);

    // The role order is defined for rotation 0's reading order.
    // We need to map: which cell in rot0 became which cell in current rotation.
    // Since shapes are pre-defined rotations, the ith block in rot0
    // corresponds to a specific block in each rotation.
    // We use the physical mapping: track each block through rotation.

    const roleOrder = PIECE_ROLE_ORDER[pieceName] || ['head', 'torso', 'shirt', 'trousers'];

    // Build rotation mapping using the fact that all rotations
    // have the same number of filled cells, and blocks maintain
    // their relative identity through rotation.
    const rotationMappings = buildRotationMappings(pieceName);
    const currentRotation = rotation % PIECES[pieceName].shapes.length;
    const mapping = rotationMappings[currentRotation];

    for (let i = 0; i < currentCells.length; i++) {
        const cell = currentCells[i];
        const rot0Index = mapping[i];
        roles[cell.r][cell.c] = roleOrder[rot0Index] || 'trousers';
    }

    return roles;
}

function getFilledCells(shape) {
    const cells = [];
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) cells.push({ r, c });
        }
    }
    return cells;
}

    // Build a mapping for each rotation that says:
    // "the ith cell in this rotation's reading order corresponds to
    //  which index in rotation 0's reading order"
    // We do this by rotating the rot0 cell coordinates and matching.
    function buildRotationMappings(pieceName) {
        const shapes = PIECES[pieceName].shapes;
        const rot0Cells = getFilledCells(shapes[0]);
        const numCells = rot0Cells.length;

        // For each rotation, figure out the mapping
        const mappings = [];

        for (let rot = 0; rot < shapes.length; rot++) {
            if (rot === 0) {
                // Identity mapping
                mappings.push(rot0Cells.map((_, i) => i));
                continue;
            }

            // Rotate rot0 cells by 90 degrees `rot` times
            // and match to the actual shape's filled cells
            const rotatedCells = rot0Cells.map(cell => rotatePoint(cell, rot, shapes[0]));

            // Normalize rotated cells (shift to 0,0 origin)
            const normalized = normalizeCells(rotatedCells);

            // Get actual cells for this rotation
            const actualCells = getFilledCells(shapes[rot]);

            // Match normalized rotated cells to actual cells
            const mapping = [];
            for (let i = 0; i < actualCells.length; i++) {
                const actual = actualCells[i];
                let foundIndex = -1;
                for (let j = 0; j < normalized.length; j++) {
                    if (normalized[j].r === actual.r && normalized[j].c === actual.c && !mapping.includes(j)) {
                        foundIndex = j;
                        break;
                    }
                }
                mapping.push(foundIndex >= 0 ? foundIndex : i);
            }
            mappings.push(mapping);
        }

        return mappings;
    }

    function rotatePoint(cell, times, shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        let r = cell.r, c = cell.c;

        for (let t = 0; t < times; t++) {
            const newR = c;
            const newC = rows - 1 - r;
            r = newR;
            c = newC;
            // Note: after rotation, the "rows" dimension becomes the old "cols"
            // This is handled by normalization
        }

        return { r, c };
    }

    function normalizeCells(cells) {
        if (cells.length === 0) return cells;
        let minR = Infinity, minC = Infinity;
        for (const cell of cells) {
            if (cell.r < minR) minR = cell.r;
            if (cell.c < minC) minC = cell.c;
        }
        return cells.map(cell => ({ r: cell.r - minR, c: cell.c - minC }));
    }

    function findRolePosition(roles, role) {
        for (let r = 0; r < roles.length; r++) {
            for (let c = 0; c < roles[r].length; c++) {
                if (roles[r][c] === role) return { r, c };
            }
        }
        return null;
    }

    function findAdjacent(shape, roles, pos, targetRole) {
        const adjacent = [
            { r: pos.r + 1, c: pos.c },
            { r: pos.r - 1, c: pos.c },
            { r: pos.r, c: pos.c + 1 },
            { r: pos.r, c: pos.c - 1 }
        ];

        for (const adj of adjacent) {
            if (adj.r >= 0 && adj.r < shape.length && adj.c >= 0 && adj.c < shape[adj.r].length) {
                if (shape[adj.r][adj.c] && roles[adj.r][adj.c] === targetRole) {
                    return adj;
                }
            }
        }
        return null;
    }

    function getNeckDirection(headPos, torsoR, torsoC) {
        return { x: headPos.c - torsoC, y: headPos.r - torsoR };
    }

    function getFlowDirection(fromR, fromC, toR, toC) {
        return { x: toC - fromC, y: toR - fromR };
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
        const roles = getBlockRoles(shape, headPos, current.name, currentRotation);

        const headRolePos = findRolePosition(roles, 'head');
        const torsoPos = findRolePosition(roles, 'torso');
        const shirtPos = findRolePosition(roles, 'shirt');

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const gy = currentY + r;
                const gx = currentX + c;
                if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
                    const role = roles[r][c];
                    let dir = null;

                    if (role === 'torso' && headRolePos) {
                        dir = getNeckDirection(headRolePos, r, c);
                    } else if (role === 'shirt' && torsoPos) {
                        dir = getFlowDirection(torsoPos.r, torsoPos.c, r, c);
                    } else if (role === 'trousers' && shirtPos) {
                        dir = getFlowDirection(shirtPos.r, shirtPos.c, r, c);
                    } else if (role === 'trousers' && torsoPos) {
                        dir = getFlowDirection(torsoPos.r, torsoPos.c, r, c);
                    }

                    grid[gy][gx] = { color: current.color, shirt: current.shirt, role: role, dir: dir };
                }
            }
        }

        checkLines();
        spawnPiece();
    }

    function checkLines() {
        const lines = [];
        for (let r = 0; r < ROWS; r++) {
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

        // Remove lines from bottom to top (highest index first)
        for (let i = lines.length - 1; i >= 0; i--) {
            grid.splice(lines[i], 1);
        }
        // Add empty rows at top
        for (let i = 0; i < lines.length; i++) {
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

        if (leftPressed || rightPressed) {
            moveHeld += delta;
            moveTimer += delta;
            if (moveHeld > moveDelay && moveTimer > moveRepeat) {
                moveTimer = 0;
                if (leftPressed) moveLeft();
                if (rightPressed) moveRight();
            }
        }

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
                    if (cell.role === 'head') {
                        drawEdHead(ctx, x, y, cell.color, c);
                    } else if (cell.role === 'torso') {
                        drawEdTorso(ctx, x, y, cell.color, cell.shirt, cell.dir, c);
                    } else if (cell.role === 'shirt') {
                        drawEdShirt(ctx, x, y, cell.color, cell.shirt, cell.dir, c);
                    } else {
                        drawEdTrousers(ctx, x, y, cell.color, cell.dir, c);
                    }
                }
            }
        }
    }

    function drawCurrentPiece(ctx, c) {
        const shape = getShape();
        const headPos = getHeadPosition(shape);
        const roles = getBlockRoles(shape, headPos, current.name, currentRotation);

        const headRolePos = findRolePosition(roles, 'head');
        const torsoPos = findRolePosition(roles, 'torso');
        const shirtPos = findRolePosition(roles, 'shirt');

        for (let r = 0; r < shape.length; r++) {
            for (let col = 0; col < shape[r].length; col++) {
                if (!shape[r][col]) continue;
                const x = offsetX + (currentX + col) * cellSize;
                const y = offsetY + (currentY + r) * cellSize;
                const role = roles[r][col];

                if (role === 'head') {
                    drawEdHead(ctx, x, y, current.color, c);
                } else if (role === 'torso') {
                    const neckDir = headRolePos ? getNeckDirection(headRolePos, r, col) : { x: 0, y: -1 };
                    drawEdTorso(ctx, x, y, current.color, current.shirt, neckDir, c);
                } else if (role === 'shirt') {
                    const dir = torsoPos ? getFlowDirection(torsoPos.r, torsoPos.c, r, col) : { x: 0, y: 1 };
                    drawEdShirt(ctx, x, y, current.color, current.shirt, dir, c);
                } else {
                    const dir = shirtPos ? getFlowDirection(shirtPos.r, shirtPos.c, r, col) : (torsoPos ? getFlowDirection(torsoPos.r, torsoPos.c, r, col) : { x: 0, y: 1 });
                    drawEdTrousers(ctx, x, y, current.color, dir, c);
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

    function drawNextPiece(ctx, c) {
        if (!nextPiece) return;

        const previewX = offsetX + COLS * cellSize + 12;
        const previewY = offsetY + 5;

        ctx.fillStyle = c.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('NEXT', previewX, previewY);

        const shape = nextPiece.shapes[0];
        const headPos = getHeadPosition(shape);
        const roles = getBlockRoles(shape, headPos, nextPiece.name, 0);

        const headRolePos = findRolePosition(roles, 'head');
        const torsoPos = findRolePosition(roles, 'torso');
        const shirtPos = findRolePosition(roles, 'shirt');

        const previewCellSize = Math.min(cellSize * 0.8, 18);
        const savedCellSize = cellSize;
        cellSize = previewCellSize;

        for (let r = 0; r < shape.length; r++) {
            for (let col = 0; col < shape[r].length; col++) {
                if (!shape[r][col]) continue;
                const x = previewX + col * previewCellSize;
                const y = previewY + 10 + r * previewCellSize;
                const role = roles[r][col];

                if (role === 'head') {
                    drawEdHead(ctx, x, y, nextPiece.color, c);
                } else if (role === 'torso') {
                    const neckDir = headRolePos ? getNeckDirection(headRolePos, r, col) : { x: 0, y: -1 };
                    drawEdTorso(ctx, x, y, nextPiece.color, nextPiece.shirt, neckDir, c);
                } else if (role === 'shirt') {
                    const dir = torsoPos ? getFlowDirection(torsoPos.r, torsoPos.c, r, col) : { x: 0, y: 1 };
                    drawEdShirt(ctx, x, y, nextPiece.color, nextPiece.shirt, dir, c);
                } else {
                    const dir = shirtPos ? getFlowDirection(shirtPos.r, shirtPos.c, r, col) : (torsoPos ? getFlowDirection(torsoPos.r, torsoPos.c, r, col) : { x: 0, y: 1 });
                    drawEdTrousers(ctx, x, y, nextPiece.color, dir, c);
                }
            }
        }

        cellSize = savedCellSize;
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
    // Block Drawing
    // ============================================================
    function drawEdHead(ctx, x, y, color, c) {
        const s = cellSize;
        const p = 1;

        ctx.fillStyle = c.skin;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        const cx = x + s / 2;
        const cy = y + s / 2;

        ctx.fillStyle = c.hair;
        ctx.fillRect(x + p, y + p, s - p * 2, s * 0.3);

        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.05, s * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.glasses;
        const glassW = s * 0.22;
        const glassH = s * 0.16;
        const glassY = cy - glassH / 2 - s * 0.02;
        const gap = s * 0.06;
        ctx.fillRect(cx - gap / 2 - glassW, glassY, glassW, glassH);
        ctx.fillRect(cx + gap / 2, glassY, glassW, glassH);
        ctx.fillRect(cx - gap / 2, glassY + glassH * 0.3, gap, glassH * 0.4);

        ctx.fillStyle = '#ffffff';
        const es = s * 0.08;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - es / 2, glassY + glassH * 0.25, es, es);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - es / 2, glassY + glassH * 0.25, es, es);

        ctx.fillStyle = '#1a1a1a';
        const ps = es * 0.6;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - ps / 2, glassY + glassH * 0.35, ps, ps);

        ctx.strokeStyle = c.glasses;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.12, cy + s * 0.22);
        ctx.quadraticCurveTo(cx, cy + s * 0.18, cx + s * 0.12, cy + s * 0.22);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
    }

    function drawEdTorso(ctx, x, y, color, shirt, neckDir, c) {
        const s = cellSize;
        const p = 1;

        ctx.fillStyle = shirt;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        ctx.fillStyle = c.skin;
        if (neckDir && neckDir.y === -1) {
            ctx.fillRect(x + s * 0.3, y + p, s * 0.4, s * 0.25);
        } else if (neckDir && neckDir.y === 1) {
            ctx.fillRect(x + s * 0.3, y + s * 0.75 - p, s * 0.4, s * 0.25);
        } else if (neckDir && neckDir.x === -1) {
            ctx.fillRect(x + p, y + s * 0.3, s * 0.25, s * 0.4);
        } else if (neckDir && neckDir.x === 1) {
            ctx.fillRect(x + s * 0.75 - p, y + s * 0.3, s * 0.25, s * 0.4);
        }

        ctx.fillStyle = c.skin;
        if (neckDir && neckDir.y !== 0) {
            ctx.fillRect(x + p, y + s * 0.35, s * 0.15, s * 0.3);
            ctx.fillRect(x + s - s * 0.15 - p, y + s * 0.35, s * 0.15, s * 0.3);
        } else {
            ctx.fillRect(x + s * 0.35, y + p, s * 0.3, s * 0.15);
            ctx.fillRect(x + s * 0.35, y + s - s * 0.15 - p, s * 0.3, s * 0.15);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
    }

    function drawEdShirt(ctx, x, y, color, shirt, dir, c) {
        const s = cellSize;
        const p = 1;

        ctx.fillStyle = shirt;
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        // Belt at the edge flowing away from torso
        ctx.fillStyle = '#2a2a40';
        if (dir && dir.y === 1) {
            ctx.fillRect(x + p, y + s - s * 0.15 - p, s - p * 2, s * 0.15);
        } else if (dir && dir.y === -1) {
            ctx.fillRect(x + p, y + p, s - p * 2, s * 0.15);
        } else if (dir && dir.x === 1) {
            ctx.fillRect(x + s - s * 0.15 - p, y + p, s * 0.15, s - p * 2);
        } else if (dir && dir.x === -1) {
            ctx.fillRect(x + p, y + p, s * 0.15, s - p * 2);
        }

        // Belt buckle
        ctx.fillStyle = '#888888';
        if (dir && dir.y === 1) {
            ctx.fillRect(x + s * 0.4, y + s - s * 0.14 - p, s * 0.2, s * 0.1);
        } else if (dir && dir.y === -1) {
            ctx.fillRect(x + s * 0.4, y + p + 1, s * 0.2, s * 0.1);
        } else if (dir && dir.x === 1) {
            ctx.fillRect(x + s - s * 0.14 - p, y + s * 0.4, s * 0.1, s * 0.2);
        } else if (dir && dir.x === -1) {
            ctx.fillRect(x + p + 1, y + s * 0.4, s * 0.1, s * 0.2);
        }

        // Subtle shirt lines
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        if (!dir || dir.y !== 0) {
            ctx.fillRect(x + s * 0.3, y + s * 0.35, s * 0.4, s * 0.03);
            ctx.fillRect(x + s * 0.3, y + s * 0.55, s * 0.4, s * 0.03);
        } else {
            ctx.fillRect(x + s * 0.35, y + s * 0.3, s * 0.03, s * 0.4);
            ctx.fillRect(x + s * 0.55, y + s * 0.3, s * 0.03, s * 0.4);
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
    }

    function drawEdTrousers(ctx, x, y, color, dir, c) {
        const s = cellSize;
        const p = 1;

        ctx.fillStyle = '#3d3d5c';
        ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);

        const isVertical = !dir || dir.y !== 0;

        if (isVertical) {
            ctx.fillRect(x + p + 2, y + p, s * 0.33, s - p * 2);
            ctx.fillRect(x + s - s * 0.33 - p - 2, y + p, s * 0.33, s - p * 2);

            ctx.fillStyle = '#2d2d45';
            ctx.fillRect(x + s * 0.36, y + s * 0.1, s * 0.28, s * 0.8);

            ctx.fillStyle = '#1a1a1a';
            if (!dir || dir.y === 1) {
                ctx.fillRect(x + p + 1, y + s - s * 0.2 - p, s * 0.3, s * 0.2);
                ctx.fillRect(x + s - s * 0.3 - p - 1, y + s - s * 0.2 - p, s * 0.3, s * 0.2);
            } else {
                ctx.fillRect(x + p + 1, y + p, s * 0.3, s * 0.2);
                ctx.fillRect(x + s - s * 0.3 - p - 1, y + p, s * 0.3, s * 0.2);
            }
        } else {
            ctx.fillRect(x + p, y + p + 2, s - p * 2, s * 0.33);
            ctx.fillRect(x + p, y + s - s * 0.33 - p - 2, s - p * 2, s * 0.33);

            ctx.fillStyle = '#2d2d45';
            ctx.fillRect(x + s * 0.1, y + s * 0.36, s * 0.8, s * 0.28);

            ctx.fillStyle = '#1a1a1a';
            if (dir.x === 1) {
                ctx.fillRect(x + s - s * 0.2 - p, y + p + 1, s * 0.2, s * 0.3);
                ctx.fillRect(x + s - s * 0.2 - p, y + s - s * 0.3 - p - 1, s * 0.2, s * 0.3);
            } else {
                ctx.fillRect(x + p, y + p + 1, s * 0.2, s * 0.3);
                ctx.fillRect(x + p, y + s - s * 0.3 - p - 1, s * 0.2, s * 0.3);
            }
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + p, y + p, s - p * 2, s - p * 2);
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