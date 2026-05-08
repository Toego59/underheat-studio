// UNDERHEAT Studio — Full Auth + Role System + Founder-Only Webamp

document.addEventListener("DOMContentLoaded", () => {
  console.log("INDEX.JS: Loaded");

  // -----------------------------
  // ELEMENTS
  // -----------------------------
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const adminBtn = document.getElementById("adminBtn");
  const feedbackBtn = document.getElementById("feedbackBtn");
  const userIndicator = document.getElementById("user-indicator");

  const auth = document.getElementById("auth");
  const authTitle = document.getElementById("auth-title");
  const authAction = document.getElementById("auth-action");
  const authToggle = document.getElementById("auth-toggle");
  const authCancel = document.getElementById("auth-cancel");
  const authMessage = document.getElementById("auth-message");

  const username = document.getElementById("username");
  const password = document.getElementById("password");

  const gated = document.getElementById("gated-content");
  const debug = document.getElementById("debug-panel");

  // Webamp
  const webampToggle = document.getElementById("webamp-toggle");
  const webampContainer = document.getElementById("webamp-container");
  let webamp = null;

  // -----------------------------
  // STATE
  // -----------------------------
  let mode = "login";
  let currentUser = null;
  let token = localStorage.getItem("token") || null;

  const API = "/api/auth";

  // -----------------------------
  // HELPERS
  // -----------------------------
  function showAuth(newMode) {
    mode = newMode;
    auth.classList.remove("hidden");
    authMessage.textContent = "";
    username.value = "";
    password.value = "";

    if (mode === "login") {
      authTitle.textContent = "Login";
      authAction.textContent = "Login";
      authToggle.textContent = "Switch to Register";
    } else {
      authTitle.textContent = "Register";
      authAction.textContent = "Register";
      authToggle.textContent = "Switch to Login";
    }
  }

  function hideAuth() {
    auth.classList.add("hidden");
  }

  async function api(path, method = "GET", body = null) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
      }
    };

    if (token) {
      opts.headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(path, opts);
    return res.json();
  }

  // -----------------------------
  // WEBAMP — Founder Only
  // -----------------------------
  function updateWebampVisibility() {
    if (!currentUser || currentUser.role !== "founder") {
      webampToggle.classList.add("hidden");
      webampContainer.classList.add("hidden");

      if (webamp) {
        webamp.dispose();
        webamp = null;
      }
      return;
    }

    webampToggle.classList.remove("hidden");
  }

  async function initWebamp() {
    if (webamp) {
      webamp.dispose();
      webamp = null;
    }

    webamp = new Webamp({
      initialTracks: [
        {
          url: "assets/shout.mp3",
          metaData: { title: "Shout" }
        }
      ],
      initialSkin: {
        url: "assets/skin.wsz"
      }
    });

    await webamp.renderWhenReady(webampContainer);
    webampContainer.classList.remove("hidden");
  }

  webampToggle.addEventListener("click", () => {
    if (!currentUser || currentUser.role !== "founder") return;

    if (!webamp) {
      initWebamp();
      webampToggle.textContent = "Hide Webamp Player";
    } else {
      webamp.dispose();
      webamp = null;
      webampContainer.classList.add("hidden");
      webampToggle.textContent = "Show Webamp Player";
    }
  });

  // -----------------------------
  // UI UPDATE
  // -----------------------------
  function updateUI() {
    if (!currentUser) {
      userIndicator.textContent = "";
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      settingsBtn.classList.add("hidden");
      adminBtn.classList.add("hidden");
      gated.classList.add("hidden");
      debug.classList.add("hidden");
      updateWebampVisibility();
      return;
    }

    userIndicator.textContent = `${currentUser.email} (${currentUser.role})`;

    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    settingsBtn.classList.remove("hidden");
    gated.classList.remove("hidden");

    if (currentUser.role === "founder" || currentUser.role === "admin") {
      adminBtn.classList.remove("hidden");
      debug.classList.remove("hidden");
      debug.textContent = `Admin mode active\nRole: ${currentUser.role}`;
    } else {
      adminBtn.classList.add("hidden");
      debug.classList.add("hidden");
    }

    updateWebampVisibility();
  }

  // -----------------------------
  // AUTH ACTIONS
  // -----------------------------
  async function doLogin() {
    const email = username.value.trim();
    const pass = password.value.trim();

    if (!email || !pass) {
      authMessage.textContent = "Enter email and password.";
      return;
    }

    const result = await api(`${API}/login`, "POST", {
      email,
      password: pass
    });

    if (!result.success) {
      authMessage.textContent = result.message || "Login failed.";
      return;
    }

    token = result.token;
    localStorage.setItem("token", token);
    currentUser = result.user;

    hideAuth();
    updateUI();
  }

  async function doRegister() {
    const email = username.value.trim();
    const pass = password.value.trim();

    if (!email || !pass) {
      authMessage.textContent = "Enter email and password.";
      return;
    }

    const result = await api(`${API}/register`, "POST", {
      email,
      password: pass
    });

    if (!result.success) {
      authMessage.textContent = result.message || "Registration failed.";
      return;
    }

    token = result.token;
    localStorage.setItem("token", token);
    currentUser = result.user;

    hideAuth();
    updateUI();
  }

  async function restoreSession() {
    if (!token) return;

    const result = await api(`${API}/session`);
    if (result.success) {
      currentUser = result.user;
      updateUI();
    } else {
      localStorage.removeItem("token");
      token = null;
    }
  }

  // -----------------------------
  // EVENT LISTENERS
  // -----------------------------
  loginBtn.addEventListener("click", () => showAuth("login"));
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    token = null;
    currentUser = null;
    updateUI();
  });

  authCancel.addEventListener("click", hideAuth);

  authToggle.addEventListener("click", () => {
    showAuth(mode === "login" ? "register" : "login");
  });

  authAction.addEventListener("click", () => {
    if (mode === "login") doLogin();
    else doRegister();
  });

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  restoreSession();
});
