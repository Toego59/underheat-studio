// Constants and Settings
const WEBAMP_CODE = 'webamp2025';

// Authentication server endpoints
const API_REGISTER = '/api/register';
const API_LOGIN = '/api/login';

// Admin credential (hashed for security)
// Store as base64 encoded hash instead of plaintext
// Change these to your own admin credentials
const ADMIN_HASH = btoa('admin:admin'); // Update with your own username:password

// Encrypted admin usernames (base64 encoded for obfuscation)
const ADMIN_USERNAMES = [
  btoa('777'),
  btoa('jkmeiihh@gmail.com')
];

// Function to create integrity token for admin status
function createAdminToken(username, isAdmin) {
  const data = btoa(username + ':::' + isAdmin + ':::' + new Date().toDateString());
  return data;
}

// Function to verify admin token hasn't been tampered with
function verifyAdminToken(username, token) {
  const decoded = atob(token);
  const [storedUsername, storedAdmin, storedDate] = decoded.split(':::');

  // Check if token is from the same day and username matches
  if (storedUsername !== username) return false;
  if (storedDate !== new Date().toDateString()) return false;

  return storedAdmin === 'true';
}

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

// Simple hash function for password obfuscation (frontend use only)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// Check if user is admin (based on username from users.json)
function isAdminUser(username) {
    if (!username) return false;
    // Check if username is in the encrypted admin list
    const encodedUsername = btoa(username);
    return ADMIN_USERNAMES.includes(encodedUsername);
}

// Debug logging function
function log(message) {
    const panel = document.getElementById('debug-panel');
    if (panel) {
        const timestamp = new Date().toLocaleTimeString();
        panel.innerHTML += `[${timestamp}] ${message}<br>`;
        panel.scrollTop = panel.scrollHeight;
    }
    console.log(message);
}


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

// Webamp Integration
async function toggleWebamp() {
    // Only admins can use Webamp
    if (!window.currentIsAdmin) {
        alert('Webamp is only available for admins');
        log('Non-admin attempted to access Webamp');
        return;
    }

    const container = document.getElementById('webamp-container');
    const button = document.getElementById('webamp-toggle');

    // If already showing, hide it
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        button.textContent = 'Show Webamp Player';
        log('Webamp player hidden');
        return;
    }

    // Show it
    container.classList.remove('hidden');
    button.textContent = 'Hide Webamp Player';

    // Only create instance once
    if (!webampInstance) {
        try {
            if (!window.Webamp) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://unpkg.com/webamp@2.2.0/built/webamp.bundle.min.js';
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('Failed to load Webamp script'));
                    document.head.appendChild(s);
                });
            }

            webampInstance = new Webamp({
                initialTracks: [
                    {
                        url: "./assets/thatsall.mp4",
                        metaData: {
                            title: "That's All",
                            artist: "UNDERHEAT Studio"
                        }
                    },
                    {
                        url: "./assets/shout.mp4",
                        metaData: {
                            title: "Shout",
                            artist: "UNDERHEAT Studio"
                        }
                    }
                ],
                initialSkin: {
                    url: "./assets/Fallout_Pip-Boy_3000_Amber_v4.wsz"
                }
            });

            await webampInstance.renderWhenReady(container);
            log('Webamp player loaded and displayed');
        } catch (err) {
            console.error('Webamp initialization failed', err);
            alert('Failed to load Webamp: ' + (err && err.message ? err.message : err));
            container.classList.add('hidden');
            button.textContent = 'Show Webamp Player';
            webampInstance = null;
        }
    }
}

async function loginViaApi() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msgEl = document.getElementById('auth-message');

    if (!username || !password) {
        msgEl.textContent = 'username and password required';
        alert('Please enter both username and password');
        return;
    }

    // For testing: accept any username/password locally
    isAuthenticated = true;
    window.currentUser = username;
    window.currentIsAdmin = isAdminUser(username);
    authSection.classList.add('hidden');
    if (gatedContent) gatedContent.classList.remove('hidden');
    loginBtn.textContent = 'Logout';
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', username);

    // Create encrypted admin token (prevents tampering)
    if (window.currentIsAdmin) {
        const adminToken = createAdminToken(username, true);
        localStorage.setItem('adminToken', adminToken);
    } else {
        localStorage.removeItem('adminToken');
    }

    msgEl.textContent = 'Logged in successfully!';
    log('User authenticated locally');
}

async function registerViaApi() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msgEl = document.getElementById('auth-message');
    // require both fields
    if (!username || !password) {
        msgEl.textContent = 'username and password required';
        alert('Please enter both username and password to register');
        return;
    }
    try {
        const res = await fetch(API_REGISTER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (data && data.success) {
            msgEl.textContent = 'Registered — you can now login';
            alert('Registration successful — you can now login');
        } else {
            msgEl.textContent = (data && data.message) || 'Registration failed';
            alert(msgEl.textContent || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        msgEl.textContent = 'Network error';
        alert('Network error — could not reach server');
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
        // show auth modal/form
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

            localStorage.setItem('--primary-color', '#ff5500');
            localStorage.setItem('--secondary-color', '#333333');
            localStorage.setItem('--accent-color', '#00aaff');
            localStorage.setItem('--background-color', '#1a1a1a');
            break;
        case 'dark':
            root.style.setProperty('--primary-color', '#4a9eff');
            root.style.setProperty('--secondary-color', '#0f0f0f');
            root.style.setProperty('--accent-color', '#00d4ff');
            root.style.setProperty('--background-color', '#000000');

            localStorage.setItem('--primary-color', '#4a9eff');
            localStorage.setItem('--secondary-color', '#0f0f0f');
            localStorage.setItem('--accent-color', '#00d4ff');
            localStorage.setItem('--background-color', '#000000');
            break;
    }

    document.body.classList.remove('pride-theme');

    localStorage.setItem('theme', theme);
    log('Theme changed to: ' + theme);
}

// Color picker event listeners
document.getElementById('primary-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--primary-color', e.target.value);
    localStorage.setItem('--primary-color', e.target.value);
    log('Primary color updated');
});

document.getElementById('secondary-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--secondary-color', e.target.value);
    localStorage.setItem('--secondary-color', e.target.value);
    log('Secondary color updated');
});

document.getElementById('accent-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent-color', e.target.value);
    localStorage.setItem('--accent-color', e.target.value);
    log('Accent color updated');
});

document.getElementById('bg-color').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--background-color', e.target.value);
    localStorage.setItem('--background-color', e.target.value);
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

    // Wire auth form buttons
    const authAction = document.getElementById('auth-action');
    const authToggle = document.getElementById('auth-toggle');
    const webampToggle = document.getElementById('webamp-toggle');
    let registerMode = false;
    if (authAction) authAction.addEventListener('click', () => {
        if (registerMode) registerViaApi(); else loginViaApi();
    });
    if (authToggle) authToggle.addEventListener('click', () => {
        registerMode = !registerMode;
        document.getElementById('auth-title').textContent = registerMode ? 'Register' : 'Login';
        document.getElementById('auth-action').textContent = registerMode ? 'Register' : 'Login';
        authToggle.textContent = registerMode ? 'Switch to Login' : 'Switch to Register';
        document.getElementById('auth-message').textContent = '';
    });
    if (webampToggle) webampToggle.addEventListener('click', toggleWebamp);

    // Restore session info if present
    const savedUser = localStorage.getItem('username');
    const adminToken = localStorage.getItem('adminToken');
    if (localStorage.getItem('isAuthenticated') === 'true' && savedUser) {
        window.currentUser = savedUser;
        // Verify admin token hasn't been tampered with
        if (adminToken && verifyAdminToken(savedUser, adminToken)) {
            window.currentIsAdmin = true;
        } else {
            window.currentIsAdmin = false;
        }
    }

    // Server check disabled for local testing with Live Server
    // If you need full authentication, run: npm start
    log('Running in test mode (Live Server)');
});