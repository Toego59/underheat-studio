// ============================================================
// AUTH + USER SYSTEM
// ============================================================

let users = JSON.parse(localStorage.getItem("users") || "{}");
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

authAction.onclick = () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    authMessage.textContent = "Please fill out all fields.";
    return;
  }

  if (isRegistering) {
    if (users[username]) {
      authMessage.textContent = "User already exists.";
      return;
    }

    users[username] = {
      password,
      role: "user"
    };

    localStorage.setItem("users", JSON.stringify(users));
    authMessage.textContent = "Account created! You can now log in.";
    return;
  }

  if (!users[username] || users[username].password !== password) {
    authMessage.textContent = "Invalid username or password.";
    return;
  }

  currentUser = { username, role: users[username].role };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  updateUI();
  authModal.classList.add("hidden");
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
// UPDATE UI BASED ON USER
// ============================================================

function updateUI() {
  if (currentUser) {
    userIndicator.textContent = `Logged in as ${currentUser.username}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    settingsBtn.style.display = "inline-block";

    if (currentUser.role === "admin") {
      adminBtn.style.display = "inline-block";
    } else {
      adminBtn.style.display = "none";
    }

    document.getElementById("gated-content").classList.remove("hidden");
  } else {
    userIndicator.textContent = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    settingsBtn.style.display = "none";
    adminBtn.style.display = "none";

    document.getElementById("gated-content").classList.add("hidden");
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