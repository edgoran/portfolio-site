// ============================================================
// Theme Switching
// ============================================================
const themeToggle = document.getElementById("theme-toggle");

function getPreferredTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
}

setTheme(getPreferredTheme());

themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "light" ? "dark" : "light");
});

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "light" : "dark");
    }
});

// ============================================================
// Accessibility Mode
// ============================================================
const a11yToggle = document.getElementById("a11y-toggle");

function setA11y(enabled) {
    if (enabled) {
        document.documentElement.setAttribute("data-a11y", "true");
        const currentTheme = document.documentElement.getAttribute("data-theme")
            || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
        document.documentElement.setAttribute("data-theme", currentTheme);
        a11yToggle.classList.add("active");
        a11yToggle.title = "Disable accessibility mode";
    } else {
        document.documentElement.removeAttribute("data-a11y");
        a11yToggle.classList.remove("active");
        a11yToggle.title = "Enable accessibility mode";
    }
    localStorage.setItem("a11y", enabled);
}

setA11y(localStorage.getItem("a11y") === "true");

a11yToggle.addEventListener("click", () => {
    setA11y(!document.documentElement.hasAttribute("data-a11y"));
});

// ============================================================
// Tab Navigation
// ============================================================
const tabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");
const gamesToggle = document.getElementById("games-toggle");
let previousTab = "about";

function showTab(tabName) {
    if (window.currentGame && tabName !== "games") {
        window.currentGame.destroy();
        window.currentGame = null;
    }

    tabs.forEach(t => t.classList.remove("active"));
    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add("active");

    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");

    gamesToggle.classList.toggle("active", tabName === "games");

    if (tabName === "games") {
        launchGame(activeGame);
    }

    window.scrollTo(0, 0);

    const titles = {
        about: "Ed Goran - Software Developer",
        projects: "Ed Goran - Projects",
        experience: "Ed Goran - Experience",
        contact: "Ed Goran - Contact",
        games: "Ed Goran - Games"
    };
    document.title = titles[tabName] || "Ed Goran - Software Developer";
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

gamesToggle.addEventListener("click", () => {
    if (document.getElementById("tab-games").classList.contains("active")) {
        showTab(previousTab);
    } else {
        const currentActive = document.querySelector(".nav-tab.active");
        if (currentActive) previousTab = currentActive.dataset.tab;
        showTab("games");
    }
});

// ============================================================
// Project Deep Dives
// ============================================================
document.querySelectorAll(".project-card.clickable").forEach(card => {
    card.addEventListener("click", () => showDeepDive(card.dataset.project));
});

function showDeepDive(projectId) {
    const project = window.deepDiveData[projectId];
    if (!project) return;

    document.getElementById("deep-dive-content").innerHTML = `
        <div class="deep-dive-hero">
            <div class="deep-dive-hero-header">
                <span class="deep-dive-icon">${project.icon}</span>
                <h2 class="deep-dive-title">${project.title}</h2>
            </div>
            <p class="deep-dive-summary">${project.summary}</p>
        </div>
        <div class="timeline">
            ${project.entries.map(entry => `
                <div class="timeline-entry">
                    <div class="timeline-marker ${entry.type === "challenge" ? "challenge" : ""}"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">${entry.title}</h4>
                        <p class="timeline-text">${entry.text}</p>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-deep-dive").classList.add("active");

    tabs.forEach(t => t.classList.remove("active"));
    const projectsTab = document.querySelector('.nav-tab[data-tab="projects"]');
    if (projectsTab) projectsTab.classList.add("active");

    window.scrollTo(0, 0);
    document.title = `Ed Goran - ${project.title}`;
}

document.getElementById("deep-dive-back").addEventListener("click", () => showTab("projects"));

// ============================================================
// Game Management
// ============================================================
const gameSelectBtns = document.querySelectorAll(".game-select-btn");
let activeGame = "runner";

const gameRegistry = {
    runner: () => window.DinoRunner,
    snake: () => window.SnakEd,
    tictactoe: () => window.EdsCrosses
};

function launchGame(game) {
    if (window.currentGame) {
        window.currentGame.destroy();
        window.currentGame = null;
    }

    activeGame = game;
    updateGameControls(game);
    updateGameOptions(game);

    const getGame = gameRegistry[game];
    if (getGame) {
        const gameInstance = getGame();
        if (gameInstance) {
            try {
                window.currentGame = gameInstance;
                window.currentGame.init();
            } catch (e) {
                console.error(`Failed to init game: ${game}`, e);
                window.currentGame = null;
            }
        }
    }
}

gameSelectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const game = btn.dataset.game;
        if (game === activeGame) return;
        gameSelectBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        launchGame(game);
    });
});

document.getElementById("game-start-btn").addEventListener("click", () => {
    if (window.currentGame && window.currentGame.start) {
        window.currentGame.start();
    }
});

function updateGameControls(game) {
    const container = document.getElementById("game-controls-info");
    const mobileControls = document.getElementById("mobile-game-controls");

    const controls = {
        runner: `
            <div class="game-control"><kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>Click</kbd> <span>Jump</span></div>
            <div class="game-control"><kbd>↓</kbd> / <kbd>S</kbd> / <kbd>Right Click</kbd> <span>Duck</span></div>
        `,
        snake: `
            <div class="game-control"><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> / <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <span>Move</span></div>
            <div class="game-control"><kbd>Space</kbd> / <kbd>Tap</kbd> <span>Start / Restart</span></div>
            <div class="game-control"><kbd>Swipe</kbd> <span>Move (mobile)</span></div>
        `,
        tictactoe: `
            <div class="game-control"><kbd>Click</kbd> / <kbd>Tap</kbd> <span>Place piece</span></div>
        `
    };

    container.innerHTML = controls[game] || "";
    mobileControls.classList.toggle("visible", game === "runner");
}

function updateGameOptions(game) {
    document.getElementById("game-options-snake").style.display = game === "snake" ? "flex" : "none";
    document.getElementById("game-options-tictactoe").style.display = game === "tictactoe" ? "flex" : "none";
}

// Game option toggles
document.getElementById("snake-wall-death").addEventListener("change", (e) => {
    if (window.SnakEd) window.SnakEd.setWallDeath(e.target.checked);
});

document.getElementById("ttt-hard-mode").addEventListener("change", (e) => {
    if (window.EdsCrosses) window.EdsCrosses.setHardMode(e.target.checked);
});

document.getElementById("ttt-player-first").addEventListener("change", (e) => {
    if (window.EdsCrosses) window.EdsCrosses.setPlayerFirst(e.target.checked);
});

document.getElementById("ttt-two-player").addEventListener("change", (e) => {
    if (window.EdsCrosses) window.EdsCrosses.setTwoPlayer(e.target.checked);
    const hide = e.target.checked;
    document.getElementById("ttt-hard-mode").closest(".game-option-toggle").style.display = hide ? "none" : "flex";
    document.getElementById("ttt-player-first").closest(".game-option-toggle").style.display = hide ? "none" : "flex";
});

// ============================================================
// Contact
// ============================================================
function copyEmail() {
    navigator.clipboard.writeText("edgoran@gmail.com").then(() => {
        const btn = document.getElementById("copy-email");
        btn.classList.add("copied");
        btn.title = "Copied!";
        setTimeout(() => {
            btn.classList.remove("copied");
            btn.title = "Copy email";
        }, 2000);
    });
}

// ============================================================
// Footer
// ============================================================
document.getElementById("footer-year").textContent = new Date().getFullYear();