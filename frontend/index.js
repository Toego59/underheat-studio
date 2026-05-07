// ============================================================
// API CONFIGURATION
// ============================================================
const API_BASE = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  ? "http://localhost:4000/api"
  : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

// ============================================================
// AUTH + USER SYSTEM
// ============================================================
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const settingsBtn = document.getElementById("settingsBtn");
const adminBtn = document.getElementById("adminBtn");
const userIndicator = document.getElementById("user-indicator");
const feedbackBtn = document.getElementById("feedbackBtn");

const authModal = document.getElementById("auth");
const authTitle = document.getElementById("auth-title");
const authAction = document.getElementById("auth-action");
const authToggle = document.getElementById("auth-toggle");
const authCancel = document.getElementById("auth-cancel");
const authMessage = document.getElementById("auth-message");

let isRegistering = false;

// ============================================================
// OPEN AUTH MODAL
// ============================================================
loginBtn.onclick = () => {
  authModal.classList.remove("hidden");
  isRegistering = false;
  authTitle.textContent = "Login";
  authAction.textContent = "Login";
  authToggle.textContent = "Switch to Register";
};

// ============================================================
// CLOSE AUTH MODAL
// ============================================================
authCancel.onclick = () => {
  authModal.classList.add("hidden");
  authMessage.textContent = "";
};

// ============================================================
// SWITCH LOGIN / REGISTER
// ============================================================
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

// ============================================================
// LOGIN / REGISTER ACTION
// ============================================================
authAction.onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    authMessage.textContent = "Please fill out all fields.";
    return;
  }

  authMessage.textContent = isRegistering ? "Creating account..." : "Logging in...";
  const endpoint = isRegistering ? "/register" : "/login";

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
      authMessage.textContent = data.message || "An error occurred.";
      return;
    }

    if (isRegistering) {
      authMessage.textContent = "Account created! You can now log in.";
      isRegistering = false;
      authTitle.textContent = "Login";
      authAction.textContent = "Login";
      authToggle.textContent = "Switch to Register";
      return;
    }

    // Login success
    currentUser = { 
      username: data.username, 
      role: data.role,
      password: password
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    updateUI();
    authModal.classList.add("hidden");

  } catch (err) {
    authMessage.textContent = "Network error. Is the backend running?";
  }
};

// ============================================================
// LOGOUT
// ============================================================
logoutBtn.onclick = () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateUI();
};

// ============================================================
// NAV BUTTONS
// ============================================================
feedbackBtn.onclick = () => {
  window.location.href = "feedback.html";
};

settingsBtn.onclick = () => {
  window.location.href = "settings.html";
};

adminBtn.onclick = () => {
  window.location.href = "admin.html";
};

// ============================================================
// FIXED UPDATE UI — BUTTONS NOW SHOW CORRECTLY
// ============================================================
function updateUI() {
  const gated = document.getElementById("gated-content");

  if (currentUser) {
    userIndicator.textContent = `Logged in as ${currentUser.username}`;

    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // SETTINGS BUTTON FIX
    settingsBtn.classList.remove("hidden");
    settingsBtn.style.display = "inline-block";

    // ADMIN BUTTON FIX
    if (currentUser.role === "admin" || currentUser.role === "founder") {
      adminBtn.classList.remove("hidden");
      adminBtn.style.display = "inline-block";
    } else {
      adminBtn.classList.add("hidden");
      adminBtn.style.display = "none";
    }

    gated.classList.remove("hidden");

  } else {
    userIndicator.textContent = "";

    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    settingsBtn.classList.add("hidden");
    adminBtn.classList.add("hidden");

    settingsBtn.style.display = "none";
    adminBtn.style.display = "none";

    gated.classList.add("hidden");
  }
}

updateUI();

// ============================================================
// WEBAMP
// ============================================================
const webampToggle = document.getElementById("webamp-toggle");
const webampContainer = document.getElementById("webamp-container");

let webampInstance = null;

function createWebamp() {
  webampInstance = new Webamp({
    initialTracks: [
      {
        metaData: { title: "Shout" },
        url: "assets/shout.mp3"
      }
    ],
    availableSkins: [
      { url: "assets/skin.wsz" }
    ]
  });

  webampInstance.renderWhenReady(webampContainer);

  webampInstance.onClose(() => {
    webampInstance = null;
    webampContainer.classList.add("hidden");
  });
}

webampToggle.onclick = () => {
  if (webampInstance) {
    webampInstance.dispose();
    webampInstance = null;
    webampContainer.classList.add("hidden");
    return;
  }

  createWebamp();
  webampContainer.classList.remove("hidden");
};
