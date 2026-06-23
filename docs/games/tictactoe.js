// ============================================================
// Ed's & Crosses - Noughts and Crosses
// ============================================================
(function () {
    'use strict';

    const GU = window.GameUtils;

    let els = {};
    let W = 0, H = 0, cellSize = 0;
    let board = [];
    let gameState = 'idle';
    let playerTurn = true;
    let playerFirst = true;
    let hardMode = false;
    let twoPlayer = false;
    let winLine = null;
    let score = { player: 0, ai: 0, draws: 0 };
    let placedPieces = [];
    let handlers = {};

    function colors() {
        return {
            bg: GU.getColor('--bg-card'), grid: GU.getColor('--border'),
            gridStrong: GU.getColor('--text-muted'), skin: '#f5deb3',
            hair: '#6b4c2a', glasses: '#333333', shirt: GU.getColor('--accent-light'),
            sword: '#a0aab5', swordHandle: '#8b4513', bat: '#d2a679',
            batGrip: '#1a1a1a', winLine: GU.getColor('--accent-green')
        };
    }

    function getOverlayText() {
        if (twoPlayer) return { title: "Ed's & Crosses", text: 'Player 1 is Ed (O), Player 2 is Crosses (X)', btn: 'Tap to Start' };
        return { title: "Ed's & Crosses", text: 'You are Ed (O). Beat the AI!', btn: 'Press Space or Tap to Start' };
    }

    // ============================================================
    // Init / Destroy
    // ============================================================
    function init() {
        els = GU.getElements();
        GU.setWrapperClass(els, 'square-small');

        handlers = {
            click: onClick,
            keydown: onKeyDown,
            resize: resize
        };

        els.canvas.addEventListener('click', handlers.click);
        els.canvas.addEventListener('keydown', handlers.keydown);
        window.addEventListener('resize', handlers.resize);

        GU.focusCanvas(els);
        resize();
        resetBoard();

        const info = getOverlayText();
        GU.showOverlay(els, info.title, info.text, info.btn, false);
        updateScoreDisplay();
        draw();
    }

    function destroy() {
        gameState = 'idle';
        els.canvas.removeEventListener('click', handlers.click);
        els.canvas.removeEventListener('keydown', handlers.keydown);
        window.removeEventListener('resize', handlers.resize);
        GU.setWrapperClass(els, null);
    }

    // ============================================================
    // Sizing
    // ============================================================
    function resize() {
        if (!els.wrapper) return;
        const dims = GU.setupCanvas(els);
        W = dims.W; H = dims.H;
        cellSize = Math.floor(Math.min(W, H) / 3);
        if (gameState !== 'idle') draw();
    }

    // ============================================================
    // Game State
    // ============================================================
    function resetBoard() {
        board = [[0,0,0],[0,0,0],[0,0,0]];
        placedPieces = []; winLine = null;
        playerTurn = playerFirst;
    }

    function startGame() {
        resetBoard(); gameState = 'playing';
        GU.hideOverlay(els); els.hud.classList.add('visible');
        els.canvas.focus(); updateScoreDisplay(); draw();
        if (!twoPlayer && !playerFirst) {
            playerTurn = false;
            setTimeout(() => aiMove(), 400);
        }
    }

    function endGame(result) {
        gameState = result;
        if (result === 'won') score.player++;
        else if (result === 'lost') score.ai++;
        else score.draws++;
        updateScoreDisplay(); draw();

        let message;
        if (twoPlayer) {
            message = { won: 'Player 1 (Ed) wins! 🎉', lost: 'Player 2 (Crosses) wins! ⚔️', draw: "It's a draw!" }[result];
        } else {
            message = { won: 'Ed wins! 🎉', lost: 'AI wins!', draw: "It's a draw!" }[result];
        }
        const scoreText = twoPlayer
            ? `P1 ${score.player} - ${score.ai} P2 (${score.draws} draws)`
            : `Ed ${score.player} - ${score.ai} AI (${score.draws} draws)`;

        setTimeout(() => GU.showOverlay(els, message, scoreText, 'Play Again', true), 800);
    }

    function updateScoreDisplay() {
        if (twoPlayer) { els.scoreEl.textContent = `P1 ${score.player}`; els.highScoreEl.textContent = `P2 ${score.ai}`; }
        else { els.scoreEl.textContent = `Ed ${score.player}`; els.highScoreEl.textContent = `AI ${score.ai}`; }
    }

    // ============================================================
    // Drawing
    // ============================================================
    function draw() {
        const c = colors();
        const ctx = els.ctx;
        const offsetX = (W - cellSize * 3) / 2, offsetY = (H - cellSize * 3) / 2;

        ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = c.gridStrong; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(offsetX + i * cellSize, offsetY + 10); ctx.lineTo(offsetX + i * cellSize, offsetY + cellSize * 3 - 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(offsetX + 10, offsetY + i * cellSize); ctx.lineTo(offsetX + cellSize * 3 - 10, offsetY + i * cellSize); ctx.stroke();
        }

        for (const piece of placedPieces) {
            const x = offsetX + piece.col * cellSize, y = offsetY + piece.row * cellSize;
            if (piece.type === 1) drawEd(ctx, x, y, c);
            else drawCross(ctx, x, y, c);
        }

        if (winLine) {
            const cells = winLine.cells;
            ctx.strokeStyle = c.winLine; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(offsetX + cells[0].c * cellSize + cellSize / 2, offsetY + cells[0].r * cellSize + cellSize / 2);
            ctx.lineTo(offsetX + cells[2].c * cellSize + cellSize / 2, offsetY + cells[2].r * cellSize + cellSize / 2);
            ctx.stroke(); ctx.globalAlpha = 1;
        }
    }

    function drawEd(ctx, x, y, c) {
        const s = cellSize, cx = x + s / 2, cy = y + s / 2, hs = s * 0.3;
        ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(cx, cy, hs, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.hair; ctx.beginPath(); ctx.arc(cx, cy - hs * 0.15, hs, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - hs, cy - hs * 0.7, hs * 2, hs * 0.45);
        ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(cx, cy + hs * 0.1, hs * 0.85, 0, Math.PI * 2); ctx.fill();
        const glassW = hs * 0.5, glassH = hs * 0.4, glassY = cy - glassH / 2, gap = hs * 0.1;
        ctx.strokeStyle = c.glasses; ctx.lineWidth = 2;
        ctx.strokeRect(cx - gap / 2 - glassW, glassY, glassW, glassH);
        ctx.strokeRect(cx + gap / 2, glassY, glassW, glassH);
        ctx.beginPath(); ctx.moveTo(cx - gap / 2, glassY + glassH / 2); ctx.lineTo(cx + gap / 2, glassY + glassH / 2); ctx.stroke();
        ctx.fillStyle = '#ffffff'; const es = hs * 0.15;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - es / 2, glassY + glassH * 0.35, es, es);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - es / 2, glassY + glassH * 0.35, es, es);
        ctx.fillStyle = '#1a1a1a'; const ps = es * 0.6;
        ctx.fillRect(cx - gap / 2 - glassW / 2 - ps / 2, glassY + glassH * 0.4, ps, ps);
        ctx.fillRect(cx + gap / 2 + glassW / 2 - ps / 2, glassY + glassH * 0.4, ps, ps);
        ctx.strokeStyle = c.glasses; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy + hs * 0.45, hs * 0.2, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }

    function drawCross(ctx, x, y, c) {
        const s = cellSize, cx = x + s / 2, cy = y + s / 2, hs = s * 0.3;
        drawSword(ctx, cx - hs * 0.8, cy - hs * 0.8, cx + hs * 0.8, cy + hs * 0.8, c);
        drawBat(ctx, cx + hs * 0.8, cy - hs * 0.8, cx - hs * 0.8, cy + hs * 0.8, c);
    }

    function drawSword(ctx, x1, y1, x2, y2, c) {
        const angle = Math.atan2(y2 - y1, x2 - x1), len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.save(); ctx.translate(x1, y1); ctx.rotate(angle);
        ctx.fillStyle = c.sword; ctx.beginPath(); ctx.moveTo(len * 0.25, -1.5); ctx.lineTo(len, 0); ctx.lineTo(len * 0.25, 1.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d4dae0'; ctx.fillRect(len * 0.4, -0.5, len * 0.4, 1);
        ctx.fillStyle = '#ffd700'; ctx.fillRect(len * 0.22, -5, 4, 10);
        ctx.fillStyle = c.swordHandle; ctx.fillRect(0, -3, len * 0.22, 6);
        ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1;
        for (let i = 0; i < len * 0.2; i += 6) { ctx.beginPath(); ctx.moveTo(i + 2, -3); ctx.lineTo(i + 5, 3); ctx.stroke(); }
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawBat(ctx, x1, y1, x2, y2, c) {
        const angle = Math.atan2(y2 - y1, x2 - x1), len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.save(); ctx.translate(x1, y1); ctx.rotate(angle);
        ctx.fillStyle = c.bat; ctx.beginPath();
        ctx.moveTo(len * 0.35, -3); ctx.lineTo(len * 0.7, -5); ctx.quadraticCurveTo(len + 2, -5.5, len, 0);
        ctx.quadraticCurveTo(len + 2, 5.5, len * 0.7, 5); ctx.lineTo(len * 0.35, 3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(len * 0.15, -2.5); ctx.lineTo(len * 0.35, -3); ctx.lineTo(len * 0.35, 3); ctx.lineTo(len * 0.15, 2.5); ctx.closePath(); ctx.fill();
        ctx.fillRect(0, -2, len * 0.15, 4);
        ctx.fillStyle = c.batGrip; ctx.fillRect(0, -2.5, len * 0.13, 5);
        ctx.strokeStyle = '#444444'; ctx.lineWidth = 0.8;
        for (let i = 2; i < len * 0.12; i += 4) { ctx.beginPath(); ctx.moveTo(i, -2.5); ctx.lineTo(i + 2, 2.5); ctx.stroke(); }
        ctx.fillStyle = c.batGrip; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b8956b'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(len * 0.4, -2); ctx.lineTo(len * 0.85, -2.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(len * 0.45, 1); ctx.lineTo(len * 0.8, 2); ctx.stroke();
        ctx.restore();
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
            [{r:0,c:0},{r:0,c:1},{r:0,c:2}],[{r:1,c:0},{r:1,c:1},{r:1,c:2}],[{r:2,c:0},{r:2,c:1},{r:2,c:2}],
            [{r:0,c:0},{r:1,c:0},{r:2,c:0}],[{r:0,c:1},{r:1,c:1},{r:2,c:1}],[{r:0,c:2},{r:1,c:2},{r:2,c:2}],
            [{r:0,c:0},{r:1,c:1},{r:2,c:2}],[{r:0,c:2},{r:1,c:1},{r:2,c:0}]
        ];
        for (const line of lines) {
            if (line.every(cell => board[cell.r][cell.c] === player)) { winLine = { cells: line }; return true; }
        }
        return false;
    }

    function checkWinNoSet(player) {
        const lines = [[[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],[[0,0],[1,0],[2,0]],[[0,1],[1,1],[2,1]],[[0,2],[1,2],[2,2]],[[0,0],[1,1],[2,2]],[[0,2],[1,1],[2,0]]];
        for (const line of lines) { if (line.every(([r,c]) => board[r][c] === player)) return true; }
        return false;
    }

    function isBoardFull() { return board.every(row => row.every(cell => cell !== 0)); }

    function getEmptyCells() {
        const cells = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (board[r][c] === 0) cells.push({ r, c });
        return cells;
    }

    // ============================================================
    // AI
    // ============================================================
    function aiMove() {
        if (gameState !== 'playing') return;
        const move = hardMode ? minimax(board, 2, true).move : getEasyMove();
        if (move) {
            placePiece(move.r, move.c, 2);
            if (checkWin(2)) endGame('lost');
            else if (isBoardFull()) endGame('draw');
            else playerTurn = true;
        }
    }

    function getEasyMove() {
        let move = findWinningMove(2);
        if (move) return move;
        if (Math.random() < 0.5) { move = findWinningMove(1); if (move) return move; }
        if (board[1][1] === 0 && Math.random() < 0.3) return { r: 1, c: 1 };
        const empty = getEmptyCells();
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function findWinningMove(player) {
        for (const cell of getEmptyCells()) {
            board[cell.r][cell.c] = player;
            const wins = checkWinNoSet(player);
            board[cell.r][cell.c] = 0;
            if (wins) return cell;
        }
        return null;
    }

    function minimax(boardState, depth, isAI) {
        if (checkWinNoSet(2)) return { score: 10 + depth };
        if (checkWinNoSet(1)) return { score: -10 - depth };
        if (isBoardFull() || depth === 0) return { score: 0 };
        const empty = getEmptyCells();
        let best = { score: isAI ? -Infinity : Infinity, move: null };
        for (const cell of empty) {
            board[cell.r][cell.c] = isAI ? 2 : 1;
            const result = minimax(board, depth - 1, !isAI);
            board[cell.r][cell.c] = 0;
            if (isAI ? result.score > best.score : result.score < best.score) best = { score: result.score, move: cell };
        }
        return best;
    }

    // ============================================================
    // Input
    // ============================================================
    function onClick(e) {
        if (gameState !== 'playing') return;
        if (!twoPlayer && !playerTurn) return;
        const rect = els.canvas.getBoundingClientRect();
        const offsetX = (W - cellSize * 3) / 2, offsetY = (H - cellSize * 3) / 2;
        const col = Math.floor((e.clientX - rect.left - offsetX) / cellSize);
        const row = Math.floor((e.clientY - rect.top - offsetY) / cellSize);
        if (row < 0 || row > 2 || col < 0 || col > 2) return;
        if (board[row][col] !== 0) return;

        if (twoPlayer) {
            const piece = playerTurn ? 1 : 2;
            placePiece(row, col, piece);
            if (checkWin(piece)) { endGame(piece === 1 ? 'won' : 'lost'); return; }
            if (isBoardFull()) { endGame('draw'); return; }
            playerTurn = !playerTurn;
        } else {
            placePiece(row, col, 1); playerTurn = false;
            if (checkWin(1)) { endGame('won'); return; }
            if (isBoardFull()) { endGame('draw'); return; }
            setTimeout(() => aiMove(), 300);
        }
    }

    function onKeyDown(e) {
        if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && gameState !== 'playing') startGame(); }
    }

    // ============================================================
    // Public API
    // ============================================================
    window.EdsCrosses = {
        init: init,
        destroy: destroy,
        start: function () { startGame(); els.canvas.focus(); },
        setHardMode: function (v) { hardMode = v; },
        setPlayerFirst: function (v) {
            playerFirst = v;
            if (gameState !== 'playing') { const info = getOverlayText(); GU.showOverlay(els, info.title, info.text, info.btn, false); }
        },
        setTwoPlayer: function (v) {
            twoPlayer = v;
            if (gameState !== 'playing') { const info = getOverlayText(); GU.showOverlay(els, info.title, info.text, info.btn, false); updateScoreDisplay(); }
        }
    };
})();