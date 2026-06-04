// ============================================================
// Shared Game Utilities
// ============================================================
window.GameUtils = {

    // Get a CSS variable value
    getColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    },

    // Get all shared DOM elements
    getElements() {
        return {
            canvas: document.getElementById('game-canvas'),
            ctx: document.getElementById('game-canvas').getContext('2d'),
            wrapper: document.getElementById('game-wrapper'),
            overlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('game-overlay-title'),
            overlayText: document.getElementById('game-overlay-text'),
            startBtn: document.getElementById('game-start-btn'),
            hud: document.getElementById('game-hud'),
            scoreEl: document.getElementById('game-score'),
            highScoreEl: document.getElementById('game-high-score')
        };
    },

    // Show the game overlay
    showOverlay(els, title, text, btnText, isGameOver) {
        els.overlayTitle.textContent = title;
        els.overlayText.textContent = text;
        els.startBtn.textContent = btnText;
        els.overlay.classList.remove('hidden');
        els.overlay.classList.toggle('game-over', !!isGameOver);
    },

    // Hide the game overlay
    hideOverlay(els) {
        els.overlay.classList.add('hidden');
    },

    // Set up canvas for high-DPI rendering, returns dimensions
    setupCanvas(els) {
        const rect = els.wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const W = rect.width;
        const H = rect.height;
        els.canvas.width = W * dpr;
        els.canvas.height = H * dpr;
        els.canvas.style.width = W + 'px';
        els.canvas.style.height = H + 'px';
        els.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { W, H };
    },

    // Make canvas focusable and focus it
    focusCanvas(els) {
        els.canvas.setAttribute('tabindex', '0');
        els.canvas.focus();
    },

    // Set wrapper aspect ratio class
    setWrapperClass(els, className) {
        els.wrapper.classList.remove('square', 'square-small', 'tall');
        if (className) els.wrapper.classList.add(className);
    },

    // Get high score from localStorage
    getHighScore(key) {
        return parseInt(localStorage.getItem(key) || '0');
    },

    // Save high score to localStorage
    setHighScore(key, value) {
        localStorage.setItem(key, value.toString());
    }
};