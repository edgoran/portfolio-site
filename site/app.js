// ============================================================
// Theme Switching
// ============================================================
const themeToggle = document.getElementById("theme-toggle");

function getPreferredTheme() {
    // Check localStorage first
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    // Fall back to system preference
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
}

// Set initial theme
setTheme(getPreferredTheme());

// Toggle handler
themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
});

// Listen for system theme changes
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    // Only auto-switch if user hasn't manually set a preference
    if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "light" : "dark");
    }
});

// ============================================================
// Deep Dive Content Data
// ============================================================
const deepDiveData = {
      steamwishlist: {
        icon: "🏷️",
        title: "Steam Wishlist Alerts",
        summary: "A Chrome extension that tracks Steam game prices, notifies on drops, and compares prices across 30+ stores. Features a freemium model with LemonSqueezy payment integration.",
        entries: [
        {
            type: "normal",
            title: "Concept and Architecture",
            text: "Designed a Chrome extension using Manifest V3 with multiple content scripts for different Steam pages, a background service worker for scheduled price checks, and a popup UI for the main interface. Integrated three external APIs: Steam Store, IsThereAnyDeal, and LemonSqueezy."
        },
        {
            type: "normal",
            title: "Wishlist Import via Page Parsing",
            text: "Steam removed their public wishlist API, so implemented a content script that reads wishlist data from embedded JavaScript state on the wishlist page. The script parses the SSR-rendered data using regex pattern matching to extract game IDs, then shows a non-intrusive toast notification offering to import."
        },
        {
            type: "challenge",
            title: "Challenge: Steam's React Rendering",
            text: "Steam's wishlist page is a React SPA with dynamically generated class names. Traditional DOM selectors were unreliable. Solved by identifying that game data was embedded in a script tag as serialised state, and extracting app IDs via regex rather than DOM traversal."
        },
        {
            type: "normal",
            title: "Quick-Add on Steam Store Pages",
            text: "Injected a 'Track Price' button on every Steam game page. The content script detects the app ID from the URL, checks if it's already tracked, and communicates with the background worker to add the game with full price details."
        },
        {
            type: "normal",
            title: "Background Price Monitoring",
            text: "Service worker uses Chrome's Alarms API to check all tracked game prices every 2 hours. Compares against stored prices and user targets, sends browser notifications on drops, and updates the extension badge with the count of active deals."
        },
        {
            type: "challenge",
            title: "Challenge: Content Script Injection on chrome:// Pages",
            text: "The price comparison modal (injected as a content script) failed on Chrome internal pages with 'Cannot access chrome:// URL'. Implemented a graceful fallback that detects restricted pages and redirects to IsThereAnyDeal instead."
        },
        {
            type: "normal",
            title: "Price Comparison via IsThereAnyDeal",
            text: "Integrated ITAD's API for cross-store price comparison. The lookup endpoint finds a game by Steam App ID, then the prices endpoint (POST with game IDs) returns current deals across 30+ official stores. Results are displayed in a full-page modal injected into the active tab."
        },
        {
            type: "normal",
            title: "Freemium Model with LemonSqueezy",
            text: "Implemented a free tier (5 games, basic tracking) and premium tier (unlimited games, price comparison, deal scores). Licence keys are validated via LemonSqueezy's API, stored in chrome.storage.sync for cross-device persistence, and re-validated every 7 days."
        },
        {
            type: "challenge",
            title: "Challenge: Licence Persistence Across Reinstalls",
            text: "chrome.storage.local is lost on reinstall. Solved by storing the licence key in chrome.storage.sync which persists across reinstalls and syncs across devices when the user is signed into Chrome. On startup, the extension checks sync storage to restore premium status automatically."
        },
        {
            type: "normal",
            title: "Deal Score Algorithm",
            text: "Calculates how close the current price is to the all-time lowest price ever recorded. Uses ITAD's historyLow data per store, finds the absolute lowest, then computes a percentage: 100% means at the all-time low, 0% means full price. Colour-coded from green (amazing) to grey (not great)."
        },
        {
            type: "normal",
            title: "Multi-Region Support",
            text: "Users select their Steam region in settings. All price fetches pass the country code to Steam's API, which returns prices in the correct local currency. The currency symbol is auto-detected from the API response and applied across the entire UI."
        },
        {
            type: "challenge",
            title: "Challenge: Regional Pricing via VPN",
            text: "During development, a VPN caused Steam to return Euro prices instead of GBP despite passing cc=gb. Discovered that removing the cc parameter entirely made Steam auto-detect from IP, which was wrong due to the VPN. Solution: always pass the user's chosen region explicitly."
        },
        {
            type: "normal",
            title: "Compare Modal as Content Script",
            text: "Price comparison results display in a full-page centred modal overlay injected into the current tab via chrome.scripting.executeScript. This allows the modal to be larger than the extension popup and provides a native-feeling experience. Includes store icons, deal highlighting, and clickable links to each store."
        },
        {
            type: "normal",
            title: "Result Caching",
            text: "ITAD comparison results are cached in memory for 30 minutes. Subsequent clicks on the compare button for the same game return instantly without another API call. Cache is cleared when the popup closes."
        },
        {
            type: "normal",
            title: "Steam Sale Countdown",
            text: "Shows a banner in the popup when a major Steam sale is approaching (within 30 days) or currently live. Uses estimated dates based on historical patterns, with pulsing animation when a sale is active."
        }
        ]
    },
    levels: {
        icon: "🔊",
        title: "Levels: Tab Volume Mixer",
        summary: "A Chrome extension for controlling individual tab volumes. Built with Manifest V3, Web Audio API, and chrome.storage for persistence.",
        entries: [
            {
                type: "normal",
                title: "Initial Setup",
                text: "I set up the Chrome extension structure with Manifest V3: a service worker for background tab tracking, content script for audio manipulation, and classic popup UI for the mixer interface."
            },
            {
                type: "normal",
                title: "Core Volume Control",
                text: "I then implemented per-tab volume control using the Web Audio API. Each media element gets routed through a GainNode, allowing volume adjustment from 0% to 100%."
            },
            {
                type: "challenge",
                title: "Challenge: Audio Context Conflicts",
                text: "The first issue I encountered was that media elements can only be connected to one AudioContext. Sites like YouTube already use the Web Audio API internally. This was resolved with a try/catch graceful degradation and marking elements to prevent repeated connection attempts."
            },
            {
                type: "normal",
                title: "Mute Toggle & Volume Boost",
                text: "I added per-tab mute functionality and an optional volume boost mode (up to 1000%) using GainNode values above 1.0. The boost is toggled via a switch."
            },
            {
                type: "challenge",
                title: "Challenge: Popup Re-rendering Flicker",
                text: "I'd added 1-second polling interval to detect new audio tabs, as they weren't always adding as expected. This was destroying and recreating the entire UI, which interrupted slider interactions. Fixed by only re-rendering when the actual tab list changes, and blocking re-renders while the user is dragging a slider."
            },
            {
                type: "normal",
                title: "Per-Site Presets",
                text: "Implemented automatic volume memory per website using chrome.storage.local. Volumes persist across page refreshes and are applied automatically when a site starts playing audio."
            },
            {
                type: "normal",
                title: "Service Worker Preset Application",
                text: "I then moved preset application to the service worker so volumes are applied immediately when a tab starts playing - without needing the popup to be open."
            },
            {
                type: "challenge",
                title: "Challenge: Mute State Desync After Refresh",
                text: "After a page refresh, the content script was destroyed and re-injected. The mute state wasn't being properly restored because the service worker only sent the volume value, not the mute flag. Fixed by always sending both volume and mute state on re-injection."
            },
            {
                type: "normal",
                title: "Theme-Adaptive Icon",
                text: "Extension icon switches between light and dark variants based on system theme. Since service workers can't access matchMedia, I compromised by making the theme be detected when the popup opens. The icon is updated via chrome.action.setIcon."
            },
            {
                type: "normal",
                title: "Settings UI & Polish",
                text: "Added a settings dropdown with Chrome-style toggle switches for boost mode and preset memory. Implemented collapsible sections, smooth transitions, and accessibility features including ARIA labels and keyboard navigation."
            },
            {
                type: "normal",
                title: "Published to Chrome Web Store",
                text: "I prepared my first store listing with screenshots, privacy policy, and permission justifications. Submitted for review and published."
            }
        ]
    },
    linkgrab: {
        icon: "🔗",
        title: "Link Grab",
        summary: "A Chrome extension for extracting and opening links from selected text. Built with DOM parsing, context menus, and content script injection.",
        entries: [
            {
                type: "normal",
                title: "Initial Setup",
                text: "Firstly, I created the extension structure with a context menu item that appears when text is selected. Basic URL extraction from the selection text using regex pattern matching."
            },
            {
                type: "normal",
                title: "Opening Links in Tabs",
                text: "I then implemented the core functionality: extract URLs from selected text and open each in a new tab. Added options for tab grouping and opening in a new window."
            },
            {
                type: "challenge",
                title: "Challenge: Hyperlink Detection",
                text: "The context menu's selectionText only provides plain text, not HTML. Links where the visible text differs from the URL (e.g. 'click here' linking to example.com) were missed. Solved by injecting a content script that clones the DOM selection and extracts href attributes from anchor tags."
            },
            {
                type: "challenge",
                title: "Challenge: URL Deduplication",
                text: "The same URL appeared as two different strings: the href attribute added a trailing slash (example.com/) while the plain text version didn't (example.com). Implemented URL normalisation by stripping trailing slashes before comparison."
            },
            {
                type: "normal",
                title: "Link Preview Panel",
                text: "Added an optional confirmation overlay injected into the page. It shows all found links with checkboxes so users can selectively open or copy links before committing."
            },
            {
                type: "challenge",
                title: "Challenge: Multiple Preview Overlays",
                text: "I noticed each right-click injected the preview script again, registering duplicate message listeners. Multiple overlays would stack. I fixed this by removing previous listeners before adding new ones and always cleaning up existing overlays."
            },
            {
                type: "normal",
                title: "Copy to Clipboard",
                text: "I added a copy button in the preview panel and a dedicated keyboard shortcut. Also, it shows a notification confirming the copy action."
            },
            {
                type: "normal",
                title: "Dynamic Context Menu Count",
                text: "A selection monitor content script runs on all pages, counting links in the current selection in real-time. The context menu title updates to show 'Open links in selection (3)'. Uses debouncing to avoid excessive updates."
            },
            {
                type: "normal",
                title: "Keyboard Shortcuts",
                text: "Added configurable shortcuts: Ctrl+Shift+L to open links, Ctrl+Shift+K to copy. Displayed in the popup with a link to Chrome's shortcut settings page."
            },
            {
                type: "normal",
                title: "Settings & Polish",
                text: "Final polish included building a settings popup with segmented control for open mode (current window, tab group, new window), collapsible options, max tabs limit, and customisable tab group names with timestamps."
            }
        ]
    },
    leaguestats: {
        icon: "⚔️",
        title: "League Stats",
        summary: "A full-stack web app for League of Legends player stats. Built with C#/.NET on AWS Lambda, DynamoDB, API Gateway, and deployed via CDK.",
        entries: [
            {
                type: "normal",
                title: "Architecture & AWS Setup",
                text: "Initially designed a serverless architecture: API Gateway for routing, Lambda (.NET 8) for business logic, DynamoDB for caching, and S3/CloudFront for the static frontend. All defined as infrastructure-as-code using AWS CDK in C#."
            },
            {
                type: "normal",
                title: "Riot API Integration",
                text: "Built a service layer for interacting with Riot's API: account lookups, match history, champion data, and champion mastery. All responses typed with C# models."
            },
            {
                type: "challenge",
                title: "Challenge: API Key Security",
                text: "The app needed the Riot API key accessible to Lambda without committing it to source code. Stored it in AWS SSM Parameter Store as a SecureString. The Lambda reads it on cold start and caches it in memory for subsequent invocations."
            },
            {
                type: "challenge",
                title: "Challenge: Deprecated Riot Endpoints",
                text: "Mid-development, discovered Riot had removed the summoner-by-ID endpoint needed to convert Challenger player IDs to PUUIDs. Found that the League-v4 endpoint now returns PUUIDs directly, eliminating the need for the intermediary lookup."
            },
            {
                type: "challenge",
                title: "Challenge: API Gateway Timeout",
                text: "Initial approach of crawling matches on-demand hit API Gateway's hard 29-second timeout. Fetching data for less popular champions required checking hundreds of matches. I pivoted from aggregated build data to a player-focused approach showing personal stats."
            },
            {
                type: "normal",
                title: "Player Profile Endpoint",
                text: "Built the /player/{name}/{tag} endpoint returning match history, per-champion stats, ranked info, and mastery data. Each match is processed to extract KDA, items, duration, and time-ago formatting."
            },
            {
                type: "normal",
                title: "Champion Info Endpoint",
                text: "Built the /champion/{name} endpoint pulling from Riot's Data Dragon: abilities, lore, skins. Accepts optional player context to include personal stats with that champion."
            },
            {
                type: "normal",
                title: "Split Loading Pattern",
                text: "Champion page loads static info (abilities, lore, skins) immediately from Data Dragon, then fetches personal stats asynchronously with a dedicated spinner. Users see content instantly while heavier data loads in the background."
            },
            {
                type: "normal",
                title: "Caching Layer",
                text: "Implemented a generic DynamoDB cache service with TTL-based expiry. Responses are cached to reduce Riot API calls and improve response times on subsequent requests."
            },
            {
                type: "normal",
                title: "Frontend Development",
                text: "Built the three main views: player search with champion grid, player profile with match history, and champion detail pages. Dark themed with responsive design."
            },
            {
                type: "normal",
                title: "Cost Optimisation",
                text: "Entire stack runs under $2/month using on-demand DynamoDB, pay-per-invocation Lambda, and S3/CloudFront for static assets. I set up AWS Budget alerts as a safety measure."
            },
        ],
    },
    portfolio: {
        icon: "🌐",
        title: "Portfolio Site",
        summary: "A personal portfolio site (this site!) with theme switching, WCAG accessibility, and responsive design. Deployed to AWS with S3, CloudFront, Route 53, and CDK.",
        entries: [
            {
                type: "normal",
                title: "Planning & Structure",
                text: "Designed a single-page application with tab-based navigation: About, Projects, Experience, and Contact. Chose a dark theme with purple and green accents to create a distinctive but professional look."
            },
            {
                type: "normal",
                title: "Theme System",
                text: "Implemented a dual-theme system using CSS custom properties. Dark and light themes swap all colours via a data-theme attribute on the root element. User preference is saved to localStorage and system theme is detected on first visit via prefers-color-scheme."
            },
            {
                type: "challenge",
                title: "Challenge: Flash of Unstyled Content",
                text: "The theme was being applied by JavaScript after the page rendered, causing a brief flash of the wrong theme. Fixed by adding an inline script in the head that sets the theme attribute before the stylesheet loads, preventing any visual flash."
            },
            {
                type: "normal",
                title: "WCAG Accessibility Mode",
                text: "Added a dedicated accessibility toggle that switches to a high-contrast colour scheme meeting WCAG AAA standards (7:1 contrast ratio). Increases font sizes, adds visible focus indicators, underlines all links, and thickens borders. Works independently with both light and dark themes, creating four possible combinations."
            },
            {
                type: "challenge",
                title: "Challenge: Accessibility with Theme Switching",
                text: "Initially forced the light theme when accessibility mode was enabled. Realised this excluded users who need high contrast but prefer dark backgrounds. Created separate WCAG-compliant palettes for both light and dark modes so the theme toggle remains functional."
            },
            {
                type: "normal",
                title: "Project Deep Dives",
                text: "Built a dynamic timeline view for each project. Clicking a project card navigates to a chronological development story with challenges highlighted. Content is stored as structured data in JavaScript and rendered dynamically, keeping the HTML clean."
            },
            {
                type: "challenge",
                title: "Challenge: Navigation State",
                text: "When viewing a project deep dive, the user needs to return to the projects list, not the home page. Implemented a previousView tracker so the back button always returns to the correct context. The Projects tab stays highlighted during deep dives."
            },
            {
                type: "normal",
                title: "Responsive Design",
                text: "Built mobile-first responsive layouts. Navigation tabs stretch to fill width on small screens, contact card labels hide to save space, and grid layouts adapt from multi-column to single-column. Print styles were added to produce clean single-page output."
            },
            {
                type: "normal",
                title: "Contact Page",
                text: "Designed a centered contact page with cards for email, GitHub, and LinkedIn. Added a copy-to-clipboard button on the email card with visual feedback. Footer includes icon-only links for quick access from any page."
            },
            {
                type: "normal",
                title: "AWS Infrastructure",
                text: "Deployed using AWS CDK (C#) defining the entire infrastructure as code: S3 bucket for static file hosting, CloudFront distribution for HTTPS and caching, and Route 53 DNS records pointing the custom subdomain to CloudFront."
            },
            {
                type: "normal",
                title: "Custom Domain & SSL",
                text: "Registered edgoran.co.uk via Route 53 and configured portfolio.edgoran.co.uk as a subdomain. Requested a wildcard SSL certificate (*.edgoran.co.uk) through ACM in us-east-1 (required by CloudFront). DNS validation was automated through Route 53 integration."
            },
            {
                type: "challenge",
                title: "Challenge: Certificate Region Requirement",
                text: "CloudFront requires SSL certificates to be in us-east-1 regardless of where other resources are deployed. Initially created the certificate in eu-west-2 (London) which caused deployment failures. Learned that this is a hard CloudFront requirement and re-created in the correct region."
            },
            {
                type: "normal",
                title: "Deployment Pipeline",
                text: "CDK's BucketDeployment construct handles the full deployment cycle: uploads site files to S3, then automatically invalidates the CloudFront cache so changes appear immediately. A single 'cdk deploy' command updates everything."
            },
            {
                type: "normal",
                title: "Automated Deployment - CI/CD",
                text: "I reviewed my options for CI/CD and chose to use AWS CodeBuild triggered by GitHub webhooks for continuous deployment. On every push to main, CodeBuild runs the build and deploys directly to S3/Lambda/CloudFront. I chose CodeBuild over CodePipeline to keep costs at zero while still being fully AWS-native."
            },
            {
                type: "normal",
                title: "Moved infrastructure stack to separate repository",
                text: "In line with industry standards, I separated my portfolio site content and the deployment CDK infrastructure into two separate projects. The site is now simpler, and the infrastructure project handles everything to do with deployment."
            }
        ]
    },
    patchbot: {
        icon: "🤖",
        title: "PatchBot",
        summary: "A Discord bot that monitors game patches and notifies subscribed channels. Supports Steam, RSS feeds, and custom user-added feeds. Runs 24/7 on a Raspberry Pi.",
        entries: [
            {
                type: "normal",
                title: "Concept & Architecture",
                text: "Built a Discord bot using Discord.Net in C# that checks for game patches on a schedule. Uses a hosted service pattern with dependency injection, background workers for monitoring, and SQLite for persistent storage."
            },
            {
                type: "normal",
                title: "Raspberry Pi Deployment",
                text: "Set up a Raspberry Pi as a dedicated server. Installed .NET 8, configured the bot as a systemd service for automatic startup on boot, and set up SSH key authentication for passwordless deployment from my development machine."
            },
            {
                type: "normal",
                title: "Steam Integration",
                text: "Integrated with Steam's store search API and news API. Any game on Steam works automatically without configuration - the bot searches by name, resolves the app ID, and fetches the latest news. Game thumbnails are pulled from Steam's CDN."
            },
            {
                type: "challenge",
                title: "Challenge: Steam News URL Validation",
                text: "Some Steam news items return malformed URLs that Discord rejects in embeds. Implemented URL validation with fallback to the Steam store news page when the original URL is invalid."
            },
            {
                type: "normal",
                title: "RSS Feed Support",
                text: "Added RSS/Atom feed parsing using System.ServiceModel.Syndication. Built-in feeds for games like World of Warcraft, Path of Exile, and Old School RuneScape. The bot filters for patch-related content by searching titles for keywords like 'patch', 'update', and 'hotfix'."
            },
            {
                type: "normal",
                title: "User-Added Feeds",
                text: "Implemented a /addfeed command that lets users register custom RSS feeds for any game. The bot validates the feed URL before accepting it, checking that it returns valid XML with at least one item. Feeds are stored in SQLite and monitored alongside built-in sources."
            },
            {
                type: "challenge",
                title: "Challenge: Feed Auto-Discovery",
                text: "Users don't always know RSS feed URLs. Built a discovery system with a curated dictionary of known feeds. When a user requests a game, the bot checks built-in feeds, then user-added feeds, then auto-discovery, then falls back to Steam search."
            },
            {
                type: "normal",
                title: "Subscription System",
                text: "Discord channels can subscribe to games. The background monitor checks all subscribed games every 30 minutes, compares versions against the last known state in SQLite, and posts rich embeds with game logos when changes are detected."
            },
            {
                type: "challenge",
                title: "Challenge: Slash Command Caching",
                text: "Discord caches global slash commands for up to an hour. During development, command changes appeared immediately in one server but not others. Solved by using guild-specific command registration during development and switching to global for production."
            },
            {
                type: "normal",
                title: "Deploy Script",
                text: "Created a PowerShell deploy script that publishes the .NET project, copies files to the Pi via SCP, and restarts the systemd service. SSH key auth and sudoers configuration allow fully automated deployment with no password prompts."
            },
            {
                type: "challenge",
                title: "Challenge: IPv6 Networking",
                text: "The Raspberry Pi only had an IPv6 address on the local network due to VPN routing. SCP commands failed because IPv6 addresses contain colons which conflict with SCP's path syntax. Resolved by wrapping the address in square brackets."
            },
            {
                type: "normal",
                title: "Reliability",
                text: "The bot runs as a systemd service with automatic restart on failure. If the Pi reboots, the bot starts automatically. SQLite database persists subscription and patch history data across restarts."
            }
        ]
    }
};

// ============================================================
// Tab Navigation
// ============================================================
const tabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");

function showTab(tabName) {
    // Clean up any running game when leaving the games tab
    if (window.currentGame && tabName !== 'games') {
        window.currentGame.destroy();
        window.currentGame = null;
    }

    tabs.forEach(t => t.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));

    // Update games toggle state
    const gamesToggle = document.getElementById('games-toggle');
    if (tabName === 'games') {
        gamesToggle.classList.add('active');
    } else {
        gamesToggle.classList.remove('active');
    }

    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add("active");

    document.getElementById(`tab-${tabName}`).classList.add("active");
    window.scrollTo(0, 0);

    // Initialise game when switching to games tab
    if (tabName === 'games') {
        launchGame(activeGame);
    }

    // Update page title
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
    tab.addEventListener("click", () => {
        showTab(tab.dataset.tab);
    });
});

// Games toggle button
const gamesToggle = document.getElementById('games-toggle');
let previousTab = 'about';

gamesToggle.addEventListener('click', () => {
    if (document.getElementById('tab-games').classList.contains('active')) {
        showTab(previousTab);
    } else {
        // Remember current tab before switching to games
        const currentActive = document.querySelector('.nav-tab.active');
        if (currentActive) {
            previousTab = currentActive.dataset.tab;
        }
        showTab('games');
    }
});

// ============================================================
// Game Management
// ============================================================
const gameSelectBtns = document.querySelectorAll('.game-select-btn');
let activeGame = 'runner';

function launchGame(game) {
    if (window.currentGame) {
        window.currentGame.destroy();
        window.currentGame = null;
    }

    activeGame = game;
    updateGameControls(game);
    updateGameOptions(game);

    if (game === 'runner' && window.DinoRunner) {
        window.currentGame = window.DinoRunner;
        window.currentGame.init();
    } else if (game === 'snake' && window.SnakEd) {
        window.currentGame = window.SnakEd;
        window.currentGame.init();
    } else if (game === 'tictactoe' && window.EdsCrosses) {
        window.currentGame = window.EdsCrosses;
        window.currentGame.init();
    }
}

gameSelectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const game = btn.dataset.game;
        if (game === activeGame) return;

        gameSelectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        launchGame(game);
    });
});

// ============================================================
// Project Cards - Click to Deep Dive
// ============================================================
document.querySelectorAll(".project-card.clickable").forEach(card => {
    card.addEventListener("click", () => {
        const projectId = card.dataset.project;
        showDeepDive(projectId);
    });
});

function showDeepDive(projectId) {
    const project = deepDiveData[projectId];
    if (!project) return;

    const content = document.getElementById("deep-dive-content");

    content.innerHTML = `
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
          <div class="timeline-marker ${entry.type === 'challenge' ? 'challenge' : ''}"></div>
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

    // Keep Projects tab highlighted
    tabs.forEach(t => t.classList.remove("active"));
    const projectsTab = document.querySelector('.nav-tab[data-tab="projects"]');
    if (projectsTab) projectsTab.classList.add("active");
    window.scrollTo(0, 0);
    document.title = `Ed Goran - ${project.title}`;
}

// ============================================================
// Deep Dive Back Button
// ============================================================
document.getElementById("deep-dive-back").addEventListener("click", () => {
    showTab("projects");
});

// Auto-update footer year
document.getElementById("footer-year").textContent = new Date().getFullYear();

// ============================================================
// Accessibility Mode
// ============================================================
const a11yToggle = document.getElementById("a11y-toggle");

function getA11yPreference() {
    return localStorage.getItem("a11y") === "true";
}

function setA11y(enabled) {
    if (enabled) {
        document.documentElement.setAttribute("data-a11y", "true");
        // Set explicit theme so the dark a11y styles can match
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

// Set initial state
setA11y(getA11yPreference());

// Toggle handler
a11yToggle.addEventListener("click", () => {
    const current = document.documentElement.hasAttribute("data-a11y");
    setA11y(!current);
});

// Copy email to clipboard
function copyEmail() {
    const email = "edgoran@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const btn = document.getElementById("copy-email");
        btn.classList.add("copied");
        btn.title = "Copied!";

        setTimeout(() => {
            btn.classList.remove("copied");
            btn.title = "Copy email";
        }, 2000);
    });
}

function updateGameControls(game) {
    const container = document.getElementById('game-controls-info');
    if (game === 'runner') {
        container.innerHTML = `
            <div class="game-control">
                <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>Click</kbd>
                <span>Jump</span>
            </div>
            <div class="game-control">
                <kbd>↓</kbd> / <kbd>S</kbd> / <kbd>Right Click</kbd>
                <span>Duck</span>
            </div>
        `;
    } else if (game === 'snake') {
        container.innerHTML = `
            <div class="game-control">
                <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> / <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
                <span>Move</span>
            </div>
            <div class="game-control">
                <kbd>Space</kbd> / <kbd>Tap</kbd>
                <span>Start / Restart</span>
            </div>
            <div class="game-control">
                <kbd>Swipe</kbd>
                <span>Move (mobile)</span>
            </div>
        `;
    } else if (game === 'tictactoe') {
        container.innerHTML = `
            <div class="game-control">
                <kbd>Click</kbd> / <kbd>Tap</kbd>
                <span>Place piece</span>
            </div>
        `;
    }
}

function updateGameOptions(game) {
    const snakeOptions = document.getElementById('game-options-snake');
    const tttOptions = document.getElementById('game-options-tictactoe');
    snakeOptions.style.display = game === 'snake' ? 'flex' : 'none';
    tttOptions.style.display = game === 'tictactoe' ? 'flex' : 'none';
}

// Wall death toggle
document.getElementById('snake-wall-death').addEventListener('change', (e) => {
    if (window.SnakEd && window.SnakEd.setWallDeath) {
        window.SnakEd.setWallDeath(e.target.checked);
    }
});

// Central game start button
document.getElementById('game-start-btn').addEventListener('click', () => {
    if (window.currentGame && window.currentGame.start) {
        window.currentGame.start();
    }
});

document.getElementById('ttt-hard-mode').addEventListener('change', (e) => {
    if (window.EdsCrosses && window.EdsCrosses.setHardMode) {
        window.EdsCrosses.setHardMode(e.target.checked);
    }
});

document.getElementById('ttt-player-first').addEventListener('change', (e) => {
    if (window.EdsCrosses && window.EdsCrosses.setPlayerFirst) {
        window.EdsCrosses.setPlayerFirst(e.target.checked);
    }
});

document.getElementById('ttt-two-player').addEventListener('change', (e) => {
    if (window.EdsCrosses && window.EdsCrosses.setTwoPlayer) {
        window.EdsCrosses.setTwoPlayer(e.target.checked);
    }
    // Hide AI options when in two player mode
    document.getElementById('ttt-hard-mode').closest('.game-option-toggle').style.display = e.target.checked ? 'none' : 'flex';
});