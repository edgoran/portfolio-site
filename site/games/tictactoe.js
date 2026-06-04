// ============================================================
// Ed's & Crosses - Noughts and Crosses
// O = Ed's head (brown hair, glasses)
// X = Samurai sword crossing a baseball bat
// ============================================================
(function () {
    'use strict';

    let canvas, ctx, wrapper;
    let W = 0, H = 0;
    let cellSize = 0;
    let board = []; // 0 = empty, 1 = player (Ed), 2 = AI (crosses)
    let gameState = 'idle'; // idle, playing, won, lost, draw
    let playerTurn = true;
    let playerFirst = true;
    let hardMode = false;
    let twoPlayer = false;
    let winLine = null; // { cells: [{r,c}, ...] }
    let score = { player: 0, ai: 0, draws: 0 };

    // Animation
    let animationId = null;
    let placedPieces = []; // {row, col, type, animProgress}
    let animating = false;

    // DOM
    let overlay, overlayTitle, overlayText, startBtn, hud, scoreEl, highScoreEl;

    function getColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function colors() {
        return {
            bg: getColor('--bg-card'),
            grid: getColor('--border'),
            gridStrong: getColor('--text-muted'),
            skin: '#f5deb3',
            hair: '#6b4c2a',
            glasses: '#333333',
            shirt: getColor('--accent-light'),
            sword: '#a0aab5',
            swordHandle: '#8b4513',
            bat: '#d2a679',
            batGrip: '#1a1a1a',
            winLine: getColor('--accent-green'),
            text: getColor('--text-primary')
        };
    }

    function getOverlayText() {
        if (twoPlayer) {
            return {
                title: "Ed's & Crosses",
                text: 'Player 1 is Ed (O), Player 2 is Crosses (X)',
                btn: 'Tap to Start'
            };
        }
        return {
            title: "Ed's & Crosses",
            text: 'You are Ed (O). Beat the AI!',
            btn: 'Press Space or Tap to Start'
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

    // Clean up other game classes and set ours
    wrapper.classList.remove('square');
    wrapper.classList.add('square-small');

    resize();
    resetBoard();

    const overlayInfo = getOverlayText();
    showOverlay(overlayInfo.title, overlayInfo.text, overlayInfo.btn);
    updateScoreDisplay();

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('keydown', onKeyDown);
    canvas.setAttribute('tabindex', '0');
    window.addEventListener('resize', resize);

    draw();
}

    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        gameState = 'idle';
        animating = false;

        if (canvas) {
            canvas.removeEventListener('click', onClick);
            canvas.removeEventListener('keydown', onKeyDown);
        }
        window.removeEventListener('resize', resize);

        if (wrapper) {
            wrapper.classList.remove('square-small');
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

        cellSize = Math.floor(Math.min(W, H) / 3);

        if (gameState !== 'idle') {
            draw();
        }
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetBoard() {
        board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        placedPieces = [];
        winLine = null;
        playerTurn = playerFirst;
        animating = false;
    }

    function startGame() {
        resetBoard();
        gameState = 'playing';
        hideOverlay();
        hud.classList.add('visible');
        canvas.focus();
        updateScoreDisplay();
        draw();

        if (!twoPlayer && !playerFirst) {
            playerTurn = false;
            setTimeout(() => {
                aiMove();
            }, 400);
        }
    }

    function endGame(result) {
        gameState = result;

        if (result === 'won') {
            score.player++;
        } else if (result === 'lost') {
            score.ai++;
        } else {
            score.draws++;
        }

        updateScoreDisplay();
        draw();

        let message;
        if (twoPlayer) {
            const messages = {
                won: 'Player 1 (Ed) wins! 🎉',
                lost: 'Player 2 (Crosses) wins! ⚔️',
                draw: "It's a draw!"
            };
            message = messages[result];
        } else {
            const messages = {
                won: 'Ed wins! 🎉',
                lost: 'AI wins!',
                draw: "It's a draw!"
            };
            message = messages[result];
        }

        const scoreText = twoPlayer
            ? `P1 ${score.player} - ${score.ai} P2 (${score.draws} draws)`
            : `Ed ${score.player} - ${score.ai} AI (${score.draws} draws)`;

        setTimeout(() => {
            showOverlay(message, scoreText, 'Play Again');
        }, 800);
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const offsetX = (W - cellSize * 3) / 2;
        const offsetY = (H - cellSize * 3) / 2;

        // Clear
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // Draw grid
        ctx.strokeStyle = c.gridStrong;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let i = 1; i < 3; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(offsetX + i * cellSize, offsetY + 10);
            ctx.lineTo(offsetX + i * cellSize, offsetY + cellSize * 3 - 10);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(offsetX + 10, offsetY + i * cellSize);
            ctx.lineTo(offsetX + cellSize * 3 - 10, offsetY + i * cellSize);
            ctx.stroke();
        }

        // Draw pieces
        for (const piece of placedPieces) {
            const x = offsetX + piece.col * cellSize;
            const y = offsetY + piece.row * cellSize;

            if (piece.type === 1) {
                drawEd(x, y, c);
            } else {
                drawCross(x, y, c);
            }
        }

        // Draw win line
        if (winLine) {
            drawWinLine(offsetX, offsetY, c);
        }
    }

    function drawEd(x, y, c) {
        const s = cellSize;
        const cx = x + s / 2;
        const cy = y + s / 2;
        const headSize = s * 0.6;
        const hs = headSize / 2;

        // Head shape (rounded square-ish)
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(cx, cy, hs, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = c.hair;
        ctx.beginPath();
        ctx.arc(cx, cy - hs * 0.15, hs, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - hs, cy - hs * 0.7, hs * 2, hs * 0.45);

        // Fringe detail
        ctx.fillRect(cx - hs * 0.8, cy - hs * 0.3, hs * 0.4, hs * 0.15);

        // Skin visible below hair
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(cx, cy + hs * 0.1, hs * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Glasses
        ctx.fillStyle = c.glasses;
        const glassW = hs * 0.5;
        const glassH = hs * 0.4;
        const glassY = cy - glassH / 2;
        const gap = hs * 0.1;

        // Left lens
        ctx.strokeStyle = c.glasses;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - gap / 2 - glassW, glassY, glassW, glassH);
        // Right lens
        ctx.strokeRect(cx + gap / 2, glassY, glassW, glassH);
        // Bridge
        ctx.beginPath();
        ctx.moveTo(cx - gap / 2, glassY + glassH / 2);
        ctx.lineTo(cx + gap / 2, glassY + glassH / 2);
        ctx.stroke();
        // Arms of glasses
        ctx.beginPath();
        ctx.moveTo(cx - gap / 2 - glassW, glassY + glassH / 2);
        ctx.lineTo(cx - hs * 0.75, glassY + glassH / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + gap / 2 + glassW, glassY + glassH / 2);
        ctx.lineTo(cx + hs * 0.75, glassY + glassH / 2);
        ctx.stroke();

        // Eyes behind glasses
        ctx.fillStyle = '#ffffff';
        const eyeSize = hs * 0.15;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - eyeSize / 2, glassY + glassH * 0.35, eyeSize, eyeSize);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - eyeSize / 2, glassY + glassH * 0.35, eyeSize, eyeSize);

        // Pupils
        ctx.fillStyle = '#1a1a1a';
        const pupilSize = eyeSize * 0.6;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - pupilSize / 2, glassY + glassH * 0.4, pupilSize, pupilSize);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - pupilSize / 2, glassY + glassH * 0.4, pupilSize, pupilSize);

        // Mouth - small smile
        ctx.strokeStyle = c.glasses;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy + hs * 0.45, hs * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Ears
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(cx - hs * 0.9, cy, hs * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + hs * 0.9, cy, hs * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCross(x, y, c) {
        const s = cellSize;
        const cx = x + s / 2;
        const cy = y + s / 2;
        const size = s * 0.6;
        const hs = size / 2;

        // Samurai sword (top-left to bottom-right)
        drawSword(cx - hs * 0.8, cy - hs * 0.8, cx + hs * 0.8, cy + hs * 0.8, c);

        // Baseball bat (top-right to bottom-left)
        drawBat(cx + hs * 0.8, cy - hs * 0.8, cx - hs * 0.8, cy + hs * 0.8, c);
    }

    function drawSword(x1, y1, x2, y2, c) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Blade
        ctx.fillStyle = c.sword;
        ctx.beginPath();
        ctx.moveTo(len * 0.25, -1.5);
        ctx.lineTo(len, 0);
        ctx.lineTo(len * 0.25, 1.5);
        ctx.closePath();
        ctx.fill();

        // Blade shine
        ctx.fillStyle = '#d4dae0';
        ctx.fillRect(len * 0.4, -0.5, len * 0.4, 1);

        // Guard (tsuba)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(len * 0.22, -5, 4, 10);

        // Handle (tsuka)
        ctx.fillStyle = c.swordHandle;
        ctx.fillRect(0, -3, len * 0.22, 6);

        // Handle wrapping
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 1;
        for (let i = 0; i < len * 0.2; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i + 2, -3);
            ctx.lineTo(i + 5, 3);
            ctx.stroke();
        }

        // Pommel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawBat(x1, y1, x2, y2, c) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Bat barrel (thick end)
        ctx.fillStyle = c.bat;
        ctx.beginPath();
        ctx.moveTo(len * 0.35, -3);
        ctx.lineTo(len * 0.7, -5);
        ctx.quadraticCurveTo(len + 2, -5.5, len, 0);
        ctx.quadraticCurveTo(len + 2, 5.5, len * 0.7, 5);
        ctx.lineTo(len * 0.35, 3);
        ctx.closePath();
        ctx.fill();

        // Bat taper
        ctx.fillStyle = c.bat;
        ctx.beginPath();
        ctx.moveTo(len * 0.15, -2.5);
        ctx.lineTo(len * 0.35, -3);
        ctx.lineTo(len * 0.35, 3);
        ctx.lineTo(len * 0.15, 2.5);
        ctx.closePath();
        ctx.fill();

        // Handle
        ctx.fillStyle = c.bat;
        ctx.fillRect(0, -2, len * 0.15, 4);

        // Grip tape
        ctx.fillStyle = c.batGrip;
        ctx.fillRect(0, -2.5, len * 0.13, 5);

        // Grip texture
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 0.8;
        for (let i = 2; i < len * 0.12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -2.5);
            ctx.lineTo(i + 2, 2.5);
            ctx.stroke();
        }

        // Knob
        ctx.fillStyle = c.batGrip;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Wood grain lines
        ctx.strokeStyle = '#b8956b';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(len * 0.4, -2);
        ctx.lineTo(len * 0.85, -2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(len * 0.45, 1);
        ctx.lineTo(len * 0.8, 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawWinLine(offsetX, offsetY, c) {
        const cells = winLine.cells;
        const startX = offsetX + cells[0].c * cellSize + cellSize / 2;
        const startY = offsetY + cells[0].r * cellSize + cellSize / 2;
        const endX = offsetX + cells[2].c * cellSize + cellSize / 2;
        const endY = offsetY + cells[2].r * cellSize + cellSize / 2;

        ctx.strokeStyle = c.winLine;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // ============================================================
    // Game Logic
    // ============================================================
    function placePiece(row, col, type) {
        board[row][col] = type;
        placedPieces.push({ row, col, type });
        draw();
    }

    function checkWin(player) {
        const lines = [
            // Rows
            [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
            [{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
            [{ r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
            // Cols
            [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
            [{ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
            [{ r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }],
            // Diagonals
            [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }],
            [{ r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }]
        ];

        for (const line of lines) {
            if (line.every(cell => board[cell.r][cell.c] === player)) {
                winLine = { cells: line };
                return true;
            }
        }
        return false;
    }

    function isBoardFull() {
        return board.every(row => row.every(cell => cell !== 0));
    }

    function getEmptyCells() {
        const cells = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) cells.push({ r, c });
            }
        }
        return cells;
    }

    // ============================================================
    // AI
    // ============================================================
    function aiMove() {
        if (gameState !== 'playing') return;

        let move;
        if (hardMode) {
            move = minimax(board, 2, true).move;
        } else {
            move = getEasyMove();
        }

        if (move) {
            placePiece(move.r, move.c, 2);

            if (checkWin(2)) {
                endGame('lost');
            } else if (isBoardFull()) {
                endGame('draw');
            } else {
                playerTurn = true;
            }
        }
    }

    function getEasyMove() {
        // Check if AI can win (always take the win)
        let move = findWinningMove(2);
        if (move) return move;

        // 50% chance to block player from winning
        if (Math.random() < 0.5) {
            move = findWinningMove(1);
            if (move) return move;
        }

        // 30% chance to take centre
        if (board[1][1] === 0 && Math.random() < 0.3) return { r: 1, c: 1 };

        // Otherwise pick random
        const empty = getEmptyCells();
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function findWinningMove(player) {
        const empty = getEmptyCells();
        for (const cell of empty) {
            board[cell.r][cell.c] = player;
            const wins = checkWinNoSet(player);
            board[cell.r][cell.c] = 0;
            if (wins) return cell;
        }
        return null;
    }

    function checkWinNoSet(player) {
        const lines = [
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]],
            [[2, 0], [2, 1], [2, 2]],
            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],
            [[0, 0], [1, 1], [2, 2]],
            [[0, 2], [1, 1], [2, 0]]
        ];

        for (const line of lines) {
            if (line.every(([r, c]) => board[r][c] === player)) {
                return true;
            }
        }
        return false;
    }

    function minimax(boardState, depth, isAI) {
        // Check terminal states
        if (checkWinNoSet(2)) return { score: 10 + depth };
        if (checkWinNoSet(1)) return { score: -10 - depth };
        if (isBoardFull() || depth === 0) return { score: 0 };

        const empty = getEmptyCells();
        let best = { score: isAI ? -Infinity : Infinity, move: null };

        for (const cell of empty) {
            board[cell.r][cell.c] = isAI ? 2 : 1;

            const result = minimax(board, depth - 1, !isAI);

            board[cell.r][cell.c] = 0;

            if (isAI) {
                if (result.score > best.score) {
                    best = { score: result.score, move: cell };
                }
            } else {
                if (result.score < best.score) {
                    best = { score: result.score, move: cell };
                }
            }
        }

        return best;
    }

// ============================================================
// Input
// ============================================================
function onClick(e) {
    if (gameState !== 'playing') return;
    if (!twoPlayer && !playerTurn) return;

    const rect = canvas.getBoundingClientRect();
    const offsetX = (W - cellSize * 3) / 2;
    const offsetY = (H - cellSize * 3) / 2;

    const mx = e.clientX - rect.left - offsetX;
    const my = e.clientY - rect.top - offsetY;

    const col = Math.floor(mx / cellSize);
    const row = Math.floor(my / cellSize);

    if (row < 0 || row > 2 || col < 0 || col > 2) return;
    if (board[row][col] !== 0) return;

    if (twoPlayer) {
        // Alternate between player 1 (Ed/O) and player 2 (Crosses/X)
        const currentPiece = playerTurn ? 1 : 2;
        placePiece(row, col, currentPiece);

        if (checkWin(currentPiece)) {
            endGame(currentPiece === 1 ? 'won' : 'lost');
            return;
        }
        if (isBoardFull()) {
            endGame('draw');
            return;
        }

        playerTurn = !playerTurn;
    } else {
        // Single player - place Ed then AI responds
        placePiece(row, col, 1);
        playerTurn = false;

        if (checkWin(1)) {
            endGame('won');
            return;
        }
        if (isBoardFull()) {
            endGame('draw');
            return;
        }

        setTimeout(() => {
            aiMove();
        }, 300);
    }
}

    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;

            if (gameState !== 'playing') {
                startGame();
            }
        }
    }

    // ============================================================
    // UI Helpers
    // ============================================================
    function showOverlay(title, text, btnText) {
        overlayTitle.textContent = title;
        overlayText.textContent = text;
        startBtn.textContent = btnText;
        overlay.classList.remove('hidden');
        if (title.includes('wins') || title.includes('draw')) {
            overlay.classList.add('game-over');
        } else {
            overlay.classList.remove('game-over');
        }
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    function updateScoreDisplay() {
        if (twoPlayer) {
            scoreEl.textContent = `P1 ${score.player}`;
            highScoreEl.textContent = `P2 ${score.ai}`;
        } else {
            scoreEl.textContent = `Ed ${score.player}`;
            highScoreEl.textContent = `AI ${score.ai}`;
        }
    }

    // ============================================================
    // Public API
    // ============================================================
    window.EdsCrosses = {
        init: init,
        destroy: destroy,
        start: function () {
            startGame();
            canvas.focus();
        },
        setHardMode: function (enabled) {
            hardMode = enabled;
        },
        setPlayerFirst: function (enabled) {
            playerFirst = enabled;
            if (gameState === 'idle' || gameState === 'won' || gameState === 'lost' || gameState === 'draw') {
                const overlayInfo = getOverlayText();
                showOverlay(overlayInfo.title, overlayInfo.text, overlayInfo.btn);
            }
        },
        setTwoPlayer: function (enabled) {
            twoPlayer = enabled;
            if (gameState === 'idle' || gameState === 'won' || gameState === 'lost' || gameState === 'draw') {
                const overlayInfo = getOverlayText();
                showOverlay(overlayInfo.title, overlayInfo.text, overlayInfo.btn);
                updateScoreDisplay();
            }
        }
    };

})();