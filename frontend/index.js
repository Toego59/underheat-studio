// =======================================
//  AUTO BACKEND URL DETECTION
// =======================================
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:3000/api"
    : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

const API_LOGIN = `${API_BASE}/login`;
const API_REGISTER = `${API_BASE}/register`;

// =======================================
//  DOM ELEMENTS
// =======================================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const settingsBtn = document.getElementById("settingsBtn");
const adminBtn = document.getElementById("adminBtn");

const authSection = document.getElementById("auth");
const gatedContent = document.getElementById("gated-content");
const webampContainer = document.getElementById("webamp-container");
const debugPanel = document.getElementById("debug-panel");
const userIndicator = document.getElementById("user-indicator");

let isAuthenticated = false;
let currentUser = null;
let currentIsAdmin = false;
let webampInstance = null;

// =======================================
//  DEBUG PANEL (Admin Controls Only)
// =======================================
function appendDebug(msg) {
  const ts = new Date().toLocaleTimeString();
  const log = `[${ts}] ${msg}`;

  // Store in localStorage so admin.html can read it
  const arr = JSON.parse(localStorage.getItem("debug_log") || "[]");
  arr.push(log);
  localStorage.setItem("debug_log", JSON.stringify(arr));

  // If visible, update panel
  if (debugPanel && !debugPanel.classList.contains("hidden")) {
    debugPanel.innerHTML += log + "<br>";
    debugPanel.scrollTop = debugPanel.scrollHeight;
  }

  console.log(log);
}

function renderDebugPanel() {
  const visible = localStorage.getItem("debug_visible") === "1";
  if (!visible || !currentIsAdmin) {
    debugPanel.classList.add("hidden");
    return;
  }

  debugPanel.classList.remove("hidden");

  const logs = JSON.parse(localStorage.getItem("debug_log") || "[]");
  debugPanel.innerHTML = logs.join("<br>");
  debugPanel.scrollTop = debugPanel.scrollHeight;
}

// Listen for admin.html updates
window.addEventListener("storage", () => renderDebugPanel());

// =======================================
//  AUTH STATE
// =======================================
function setAuthState(auth, username = null, isAdmin = false) {
  isAuthenticated = auth;
  currentUser = username;
  currentIsAdmin = isAdmin;

  if (auth) {
    gatedContent.classList.remove("hidden");
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    settingsBtn.style.display = "inline-block";

    userIndicator.textContent = `Logged in as ${username}${isAdmin ? " (Admin)" : ""}`;

    adminBtn.style.display = isAdmin ? "inline-block" : "none";

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
  } else {
    gatedContent.classList.add("hidden");
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    settingsBtn.style.display = "none";
    adminBtn.style.display = "none";
    userIndicator.textContent = "";

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
  }

  renderDebugPanel();
}

// =======================================
//  AUTH MODAL
// =======================================
function openAuthModal() {
  authSection.classList.remove("hidden");
}

function closeAuthModal() {
  authSection.classList.add("hidden");
  document.getElementById("auth-message").textContent = "";
  document.getElementById("password").value = "";
}

// =======================================
//  API LOGIN / REGISTER
// =======================================
async function loginViaApi() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msgEl = document.getElementById("auth-message");

  if (!username || !password) {
    msgEl.textContent = "Username and password required";
    return;
  }

  try {
    const res = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!data.success) {
      msgEl.textContent = data.message || "Login failed";
      appendDebug("Login failed: " + data.message);
      return;
    }

    setAuthState(true, data.username, data.isAdmin);
    closeAuthModal();
    appendDebug(`User logged in: ${data.username}`);
  } catch {
    msgEl.textContent = "Network error";
  }
}

async function registerViaApi() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msgEl = document.getElementById("auth-message");

  if (!username || !password) {
    msgEl.textContent = "Username and password required";
    return;
  }

  try {
    const res = await fetch(API_REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!data.success) {
      msgEl.textContent = data.message || "Registration failed";
      appendDebug("Registration failed: " + data.message);
      return;
    }

    msgEl.textContent = "Registered — you can now login";
    appendDebug("User registered: " + username);
  } catch {
    msgEl.textContent = "Network error";
  }
}

// =======================================
//  WEBAMP (Admin Only)
// =======================================
async function toggleWebamp() {
  if (!currentIsAdmin) {
    alert("Webamp is admin-only");
    return;
  }

  const container = webampContainer;
  const button = document.getElementById("webamp-toggle");

  if (container.classList.contains("hidden")) {
    container.classList.remove("hidden");
    button.textContent = "Hide Webamp Player";
  } else {
    container.classList.add("hidden");
    button.textContent = "Show Webamp Player";
    return;
  }

  if (!webampInstance) {
    try {
      webampInstance = new Webamp({
        initialTracks: [
          {
            url: "./assets/thatsall.mp4",
            metaData: { title: "That's All", artist: "UNDERHEAT Studio" },
          },
        ],
      });

      await webampInstance.renderWhenReady(container);
      appendDebug("Webamp loaded");
    } catch {
      appendDebug("Webamp failed to load");
    }
  }
}

// =======================================
//  SESSION RESTORE
// =======================================
function restoreSession() {
  const savedAuth = localStorage.getItem("isAuthenticated") === "true";
  const savedUser = localStorage.getItem("username");
  const savedAdmin = localStorage.getItem("isAdmin") === "true";

  if (savedAuth && savedUser) {
    setAuthState(true, savedUser, savedAdmin);
  }
}

// =======================================
//  UI WIRING
// =======================================
window.addEventListener("load", () => {
  restoreSession();

  loginBtn.addEventListener("click", openAuthModal);
  logoutBtn.addEventListener("click", () => setAuthState(false));
  settingsBtn.addEventListener("click", () => (location.href = "settings.html"));
  adminBtn.addEventListener("click", () => (location.href = "admin.html"));

  const authAction = document.getElementById("auth-action");
  const authToggle = document.getElementById("auth-toggle");
  const authCancel = document.getElementById("auth-cancel");

  let registerMode = false;

  authAction.addEventListener("click", () => {
    registerMode ? registerViaApi() : loginViaApi();
  });

  authToggle.addEventListener("click", () => {
    registerMode = !registerMode;
    document.getElementById("auth-title").textContent = registerMode ? "Register" : "Login";
    authAction.textContent = registerMode ? "Register" : "Login";
    authToggle.textContent = registerMode ? "Switch to Login" : "Switch to Register";
  });

  authCancel.addEventListener("click", closeAuthModal);

  const webampToggleBtn = document.getElementById("webamp-toggle");
  if (webampToggleBtn) webampToggleBtn.addEventListener("click", toggleWebamp);

  renderDebugPanel();
});
