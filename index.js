// Constants and Settings
const VALID_USERNAME = '777';
const VALID_PASSWORD = '777';
// Allow short form as well in case you typed "77"
const VALID_ALT_USERNAME = '77';
const VALID_ALT_PASSWORD = '77';
const WEBAMP_CODE = 'webamp2025';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const authSection = document.getElementById('auth');
// gated content (features that require login)
const gatedContent = document.getElementById('gated-content');
const webampOverlay = document.getElementById('webamp-overlay');
const webampContainer = document.getElementById('webamp-container');
const debugPanel = document.getElementById('debug-panel');
const mainLogo = document.getElementById('main-logo');
const prideLogo = document.getElementById('pride-logo');

// State
let isAuthenticated = false;
let webampInstance = null;
let debugMode = false;  // debug panel hidden by default

// Logo Management
function updateLogo() {
    const now = new Date();
    const isPrideMonth = now.getMonth() === 5; // June is 5 (0-based months)
    mainLogo.style.display = isPrideMonth ? 'none' : 'block';
    prideLogo.style.display = isPrideMonth ? 'block' : 'none';
    if (isPrideMonth) {
        document.body.classList.add('pride-theme');
    } else {
        document.body.classList.remove('pride-theme');
    }
}

// Initialize logo on load and check daily
updateLogo();
setInterval(updateLogo, 24 * 60 * 60 * 1000); // Check every 24 hours

// Debug Functions
function log(message) {
    if (debugMode && debugPanel) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        debugPanel.appendChild(logEntry);
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
}

function toggleDebug() {
    debugMode = !debugMode;
    debugPanel.style.display = debugMode ? 'block' : 'none';
    log('Debug mode ' + (debugMode ? 'enabled' : 'disabled'));
}

// Initialize debug mode with keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDebug();
    }
});

// Authentication
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const usernameOk = username === VALID_USERNAME || username === VALID_ALT_USERNAME;
    const passwordOk = password === VALID_PASSWORD || password === VALID_ALT_PASSWORD;

    if (usernameOk && passwordOk) {
        isAuthenticated = true;
        authSection.classList.add('hidden');
        if (gatedContent) gatedContent.classList.remove('hidden');
        loginBtn.textContent = 'Logout';
        localStorage.setItem('isAuthenticated', 'true');
        log('User authenticated successfully');
    } else {
        alert('Invalid credentials');
        log('Login attempt failed');
    }
}

loginBtn.addEventListener('click', () => {
    if (isAuthenticated) {
        isAuthenticated = false;
        authSection.classList.remove('hidden');
        if (gatedContent) gatedContent.classList.add('hidden');
        loginBtn.textContent = 'Login';
        localStorage.removeItem('isAuthenticated');
        log('User logged out');
    } else {
        authSection.classList.remove('hidden');
    }
});

// Check for existing authentication
if (localStorage.getItem('isAuthenticated') === 'true') {
    isAuthenticated = true;
    authSection.classList.add('hidden');
    if (gatedContent) gatedContent.classList.remove('hidden');
    loginBtn.textContent = 'Logout';
    log('Restored authenticated session');
}

// Webamp Integration
function openWebamp() {
    if (!isAuthenticated) {
        alert('Please login to open Webamp');
        return;
    }

    const code = document.getElementById('webamp-code').value;
    if (code === WEBAMP_CODE) {
        webampOverlay.style.display = 'block';
        if (!webampInstance) {
            webampInstance = new Webamp({
                initialTracks: [{
                    url: "https://example.com/demo.mp3",
                    duration: 300,
                    metaData: {
                        title: "Demo Track",
                        artist: "UNDERHEAT Studio"
                    }
                }]
            });
            webampInstance.renderWhenReady(webampContainer).then(() => {
                log('Webamp initialized and rendered');
            });
        }
        log('Webamp overlay opened');
    } else {
        alert('Invalid Webamp access code');
        log('Invalid Webamp access code attempt');
    }
}

// YouTube Search Integration
async function searchYouTube() {
    if (!isAuthenticated) {
        alert('Please login to use YouTube search');
        return;
    }
    
    const query = document.getElementById('youtube-query').value;
    const resultsContainer = document.getElementById('youtube-results');
    
    try {
        // Replace with actual YouTube API implementation
        const mockResults = [
            { id: '1', title: 'Demo Result 1', thumbnail: 'thumbnail1.jpg' },
            { id: '2', title: 'Demo Result 2', thumbnail: 'thumbnail2.jpg' }
        ];
        
        resultsContainer.innerHTML = mockResults.map(result => `
            <div class="video-item">
                <img src="${result.thumbnail}" alt="${result.title}">
                <h3>${result.title}</h3>
                <button onclick="playVideo('${result.id}')">Play</button>
            </div>
        `).join('');
        
        log('YouTube search completed');
    } catch (error) {
        log('YouTube search error: ' + error.message);
        alert('Error searching YouTube');
    }
}

function playVideo(videoId) {
    // New signature: playVideo(videoId, containerId)
    const containerId = arguments[1];
    if (!isAuthenticated) {
        alert('Please login to play videos');
        return;
    }

    const container = containerId ? document.getElementById(containerId) : null;
    const embed = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen style="width:100%;height:200px;border:none"></iframe>`;
    if (container) {
        container.innerHTML = embed;
    } else {
        // fallback: open in new tab
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
    log('Playing video: ' + videoId);
}

// Theme Customization
function setTheme(theme) {
    const root = document.documentElement;
    
    switch (theme) {
        case 'default':
            root.style.setProperty('--primary-color', '#ff5500');
            root.style.setProperty('--secondary-color', '#333333');
            root.style.setProperty('--accent-color', '#00aaff');
            root.style.setProperty('--background-color', '#1a1a1a');
            break;
        case 'dark':
            root.style.setProperty('--primary-color', '#8800ff');
            root.style.setProperty('--secondary-color', '#222222');
            root.style.setProperty('--accent-color', '#00ff88');
            root.style.setProperty('--background-color', '#000000');
            break;
        case 'pride':
            root.style.setProperty('--primary-color', '#ff0000');
            root.style.setProperty('--secondary-color', '#ff8800');
            root.style.setProperty('--accent-color', '#ffff00');
            root.style.setProperty('--background-color', '#111111');
            document.body.classList.add('pride-theme');
            break;
    }
    
    if (theme !== 'pride') {
        document.body.classList.remove('pride-theme');
    }
    
    localStorage.setItem('theme', theme);
    log('Theme changed to: ' + theme);
}

// Color picker event listeners
document.getElementById('primary-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--primary-color', e.target.value);
    log('Primary color updated');
});

document.getElementById('secondary-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--secondary-color', e.target.value);
    log('Secondary color updated');
});

document.getElementById('accent-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent-color', e.target.value);
    log('Accent color updated');
});

document.getElementById('bg-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--background-color', e.target.value);
    log('Background color updated');
});

// Restore saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme);
    log('Restored saved theme: ' + savedTheme);
}

// Console log for immediate debug info
console.log('Script loaded');
window.addEventListener('load', () => {
    console.log('Window loaded');
    log('DOM Elements status:');
    log(`loginBtn: ${loginBtn ? 'found' : 'missing'}`);
    log(`authSection: ${authSection ? 'found' : 'missing'}`);
    log(`gatedContent: ${gatedContent ? 'found' : 'missing'}`);
    log(`mainLogo: ${mainLogo ? 'found' : 'missing'}`);
    log(`prideLogo: ${prideLogo ? 'found' : 'missing'}`);
});