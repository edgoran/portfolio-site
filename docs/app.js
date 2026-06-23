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
        blog: "Ed Goran - Blog",
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
    if (card.dataset.project) {
        card.addEventListener("click", () => showDeepDive(card.dataset.project));
    }
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
// Blog Deep Dives
// ============================================================
document.querySelectorAll("[data-blog]").forEach(card => {
    card.addEventListener("click", () => showBlogDive(card.dataset.blog));
});

function showBlogDive(blogId) {
    const blog = window.blogDiveData[blogId];
    if (!blog) return;

    document.getElementById("blog-dive-content").innerHTML = `
        <div class="deep-dive-hero">
            <div class="deep-dive-hero-header">
                <span class="deep-dive-icon">${blog.icon}</span>
                <h2 class="deep-dive-title">${blog.title}</h2>
            </div>
            <p class="deep-dive-summary">${blog.summary}</p>
        </div>
        <div class="blog-sections">
            ${blog.sections.map(section => `
                <div class="blog-section">
                    <h3 class="blog-section-heading">${section.heading}</h3>
                    <div class="blog-section-items">
                        ${section.items.map(item => renderBlogItem(item)).join("")}
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-blog-dive").classList.add("active");

    tabs.forEach(t => t.classList.remove("active"));
    const blogTab = document.querySelector('.nav-tab[data-tab="blog"]');
    if (blogTab) blogTab.classList.add("active");

    window.scrollTo(0, 0);
    document.title = `Ed Goran - ${blog.title}`;
}

function renderBlogItem(item) {
    switch (item.type) {
        case "command":
            return `
                <div class="blog-command">
                    <div class="blog-terminal">
                        <span class="terminal-prompt">$</span>
                        <code>${escapeHtml(item.command)}</code>
                    </div>
                    <p class="blog-command-desc">${item.description}</p>
                </div>
            `;
        case "code":
            return `
                <div class="blog-code">
                    <div class="blog-code-header">
                        <span class="blog-code-lang">${item.language || ""}</span>
                    </div>
                    <pre><code>${escapeHtml(item.code)}</code></pre>
                </div>
            `;
        case "definition":
            return `
                <div class="blog-definition">
                    <dt class="blog-def-term">${item.term}</dt>
                    <dd class="blog-def-desc">${item.definition}</dd>
                </div>
            `;
        case "comparison":
            return `
                <div class="blog-comparison">
                    <div class="blog-comparison-side">
                        <h4 class="blog-comparison-title">${item.left.title}</h4>
                        <ul class="blog-comparison-list">
                            ${item.left.points.map(p => `<li>${p}</li>`).join("")}
                        </ul>
                    </div>
                    <div class="blog-comparison-side">
                        <h4 class="blog-comparison-title">${item.right.title}</h4>
                        <ul class="blog-comparison-list">
                            ${item.right.points.map(p => `<li>${p}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            `;
        case "steps":
            return `
                <div class="blog-steps">
                    <ol class="blog-steps-list">
                        ${item.steps.map(s => `<li>${s}</li>`).join("")}
                    </ol>
                    ${item.footer ? `<p class="blog-steps-footer">${item.footer}</p>` : ""}
                </div>
            `;
        case "info":
            return `
                <div class="blog-info">
                    <p>${item.text}</p>
                </div>
            `;
        default:
            return "";
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById("blog-dive-back").addEventListener("click", () => showTab("blog"));

// ============================================================
// Game Management
// ============================================================
const gameSelectBtns = document.querySelectorAll(".game-select-btn");
let activeGame = "runner";

const gameRegistry = {
    runner: () => window.DinoRunner,
    snake: () => window.SnakEd,
    tictactoe: () => window.EdsCrosses,
    invaders: () => window.SpaceInvEders,
    whackamole: () => window.WhackAEd,
    tetris: () => window.TEdris
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
    const runnerMobile = document.getElementById("mobile-runner-controls");
    const invaderMobile = document.getElementById("mobile-invader-controls");
    const snakeMobile = document.getElementById("mobile-snake-controls");
    const tetrisMobile = document.getElementById("mobile-tetris-controls");

    const controls = {
        runner: `
            <div class="game-control"><kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>Click</kbd> <span>Jump</span></div>
            <div class="game-control"><kbd>↓</kbd> / <kbd>S</kbd> / <kbd>Right Click</kbd> <span>Duck</span></div>
        `,
        snake: `
            <div class="game-control"><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> / <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <span>Move</span></div>
            <div class="game-control"><kbd>Space</kbd> / <kbd>Tap</kbd> <span>Start / Restart</span></div>
        `,
        tictactoe: `
            <div class="game-control"><kbd>Click</kbd> / <kbd>Tap</kbd> <span>Place piece</span></div>
        `,
        invaders: `
            <div class="game-control"><kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> <span>Move</span></div>
            <div class="game-control"><kbd>Space</kbd> <span>Shoot</span></div>
        `,
        whackamole: `
            <div class="game-control"><kbd>Click</kbd> / <kbd>Tap</kbd> <span>Whack!</span></div>
        `,
        tetris: `
            <div class="game-control"><kbd>←</kbd> <kbd>→</kbd> <span>Move</span></div>
            <div class="game-control"><kbd>↓</kbd> <span>Soft drop</span></div>
            <div class="game-control"><kbd>Space</kbd> <span>Hard drop</span></div>
            <div class="game-control"><kbd>↑</kbd> / <kbd>Z</kbd> <span>Rotate</span></div>
        `
    };

    container.innerHTML = controls[game] || "";

    if (runnerMobile) runnerMobile.classList.toggle("visible", game === "runner");
    if (invaderMobile) invaderMobile.classList.toggle("visible", game === "invaders");
    if (snakeMobile) snakeMobile.classList.toggle("visible", game === "snake");
    if (tetrisMobile) tetrisMobile.classList.toggle("visible", game === "tetris");
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