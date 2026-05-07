// ============================================================
// UNDERHEAT STUDIO — INDEX PAGE LOGIC
// ============================================================

// Auto backend detection
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:4000/api"
    : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const settingsBtn = document.getElementById("settingsBtn");
const adminBtn = document.getElementById("adminBtn");
const userIndicator = document.getElementById("user-indicator");

const authModal = document.getElementById("auth");
const authTitle = document.getElementById("auth-title");
const authAction = document.getElementById("auth-action");
const authToggle = document.getElementById("auth-toggle");
const authCancel = document.getElementById("auth-cancel");
const authMessage = document.getElementById("auth-message");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const gatedContent = document.getElementById("gated-content");

// Webamp
const webampToggle = document.getElementById("webamp-toggle");
const webampContainer = document.getElementById("webamp-container");
let webampInstance = null;

// ============================================================
// USER STATE
// ============================================================

let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
} catch {
  currentUser = null;
}

// ============================================================
// USERNAME VALIDATION (letters, numbers, ' only)
// ============================================================

function isValidUsername(name) {
  return /^[A-Za-z0-9']+$/.test(name);
}

// ============================================================
// UPDATE UI BASED ON LOGIN STATE
// ============================================================

function updateUI() {
  if (currentUser) {
    userIndicator.textContent = `Logged in as ${currentUser.username}`;
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (settingsBtn) settingsBtn.classList.remove("hidden");
    if (gatedContent) gatedContent.classList.remove("hidden");

    if (adminBtn) {
      if (currentUser.role === "admin" || currentUser.role === "founder") {
        adminBtn.classList.remove("hidden");
      } else {
        adminBtn.classList.add("hidden");
      }
    }
  } else {
    userIndicator.textContent = "";
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (settingsBtn) settingsBtn.classList.add("hidden");
    if (adminBtn) adminBtn.classList.add("hidden");
    if (gatedContent) gatedContent.classList.add("hidden");
  }
}

updateUI();

// ============================================================
// AUTH MODAL OPEN/CLOSE
// ============================================================

if (loginBtn) {
  loginBtn.onclick = () => {
    if (!authModal) return;
    authModal.classList.remove("hidden");
    authTitle.textContent = "Login";
    authAction.textContent = "Login";
    authToggle.textContent = "Switch to Register";
    authMessage.textContent = "";
  };
}

if (authCancel) {
  authCancel.onclick = () => {
    authModal.classList.add("hidden");
    authMessage.textContent = "";
  };
}

// ============================================================
// LOGIN / REGISTER TOGGLE
// ============================================================

let isRegistering = false;

if (authToggle) {
  authToggle.onclick = () => {
    isRegistering = !isRegistering;

    if (isRegistering) {
      authTitle.textContent = "Register";
      authAction.textContent = "Create Account";
      authToggle.textContent = "Switch to Login";
    } else {
      authTitle.textContent = "Login";
      authAction.textContent = "Login";
      authToggle.textContent = "Switch to Register";
    }

    authMessage.textContent = "";
  };
}

// ============================================================
// LOGIN / REGISTER ACTION
// ============================================================

if (authAction) {
  authAction.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      authMessage.textContent = "Fill out all fields.";
      authMessage.className = "small err";
      return;
    }

    if (isRegistering && !isValidUsername(username)) {
      authMessage.textContent = "Username can only contain letters, numbers, and '";
      authMessage.className = "small err";
      return;
    }

    authMessage.textContent = "Processing...";
    authMessage.className = "small muted";

    try {
      const endpoint = isRegistering ? "/register" : "/login";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!data.success) {
        authMessage.textContent = data.message || "Authentication failed.";
        authMessage.className = "small err";
        return;
      }

      currentUser = {
        username: data.username,
        role: data.role,
        password
      };

      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      authModal.classList.add("hidden");
      usernameInput.value = "";
      passwordInput.value = "";

      updateUI();

    } catch (err) {
      authMessage.textContent = "Network error.";
      authMessage.className = "small err";
    }
  };
}

// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("currentUser");
    currentUser = null;
    updateUI();
  };
}

// ============================================================
// WEBAMP PLAYER (WITH YOUR SKIN)
// ============================================================

function createWebamp() {
  if (typeof Webamp === "undefined") {
    console.warn("Webamp bundle not loaded.");
    return;
  }

  webampInstance = new Webamp({
    initialTracks: [
      {
        metaData: { title: "Shout" },
        url: "assets/shout.mp3"
      }
    ],
    initialSkin: {
      // your actual skin file
      url: "assets/Fallout_Pip-Boy_3000_Amber_v4.wsz"
      // if Cloudflare/host blocks .wsz, rename to .zip and use:
      // url: "assets/Fallout_Pip-Boy_3000_Amber_v4.zip"
    }
  });

  webampInstance.renderWhenReady(webampContainer);

  webampInstance.onClose(() => {
    webampInstance = null;
    if (webampContainer) webampContainer.classList.add("hidden");
    if (webampToggle) webampToggle.textContent = "Show Webamp Player";
  });
}

if (webampToggle && webampContainer) {
  webampToggle.onclick = () => {
    if (webampInstance) {
      webampInstance.dispose();
      webampInstance = null;
      webampContainer.classList.add("hidden");
      webampToggle.textContent = "Show Webamp Player";
      return;
    }

    createWebamp();
    if (webampInstance) {
      webampContainer.classList.remove("hidden");
      webampToggle.textContent = "Hide Webamp Player";
    }
  };
}

// ============================================================
// GLOBAL DEBUG PANEL SYNC
// ============================================================

(function () {
  const panel = document.getElementById("debug-panel");
  if (!panel) return;

  function readDebugLog() {
    try {
      return JSON.parse(localStorage.getItem("debug_log") || "[]");
    } catch {
      return [];
    }
  }

  function renderDebugPanel() {
    const visible = localStorage.getItem("debug_visible") === "1";
    panel.classList.toggle("hidden", !visible);
    if (!visible) return;

    const arr = readDebugLog();
    panel.textContent = arr.length ? arr.join("\n") : "(debug empty)";
  }

  window.addEventListener("storage", renderDebugPanel);
  renderDebugPanel();
})();
