// ===============================
//  AUTO BACKEND URL DETECTION
// ===============================
const API_BASE =
   "https://cold-cell-aa07.jkmeiihh.workers.dev/api";


const API_LOGIN = `${API_BASE}/login`;
const API_REGISTER = `${API_BASE}/register`;

// ===============================
//  DOM ELEMENTS
// ===============================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const settingsBtn = document.getElementById("settingsBtn");
const adminBtn = document.getElementById("adminBtn");

const authSection = document.getElementById("auth");
const gatedContent = document.getElementById("gated-content");
const webampContainer = document.getElementById("webamp-container");
const debugPanel = document.getElementById("debug-panel");
const mainLogo = document.getElementById("main-logo");
const prideLogo = document.getElementById("pride-logo");
const userIndicator = document.getElementById("user-indicator");

let isAuthenticated = false;
let currentUser = null;
let currentIsAdmin = false;
let webampInstance = null;

// ===============================
//  DEBUG LOGGING
// ===============================
function log(message) {
  const ts = new Date().toLocaleTimeString();

  if (currentIsAdmin && debugPanel && !debugPanel.classList.contains("hidden")) {
    debugPanel.innerHTML += `[${ts}] ${message}<br>`;
    debugPanel.scrollTop = debugPanel.scrollHeight;
  }

  console.log(message);
}

// Toggle debug panel with Shift + `
document.addEventListener("keydown", (e) => {
  if (e.key === "`" && e.shiftKey) {
    if (!currentIsAdmin) return;
    debugPanel.classList.toggle("hidden");
    log("Debug panel toggled");
  }
});

// ===============================
//  PRIDE LOGO LOGIC
// ===============================
function updateLogo() {
  const now = new Date();
  const isPrideMonth = now.getMonth() === 5; // June

  if (isPrideMonth) {
    mainLogo.style.display = "none";
    prideLogo.style.display = "block";
    document.body.classList.add("pride-theme");
  } else {
    mainLogo.style.display = "block";
    prideLogo.style.display = "none";
    document.body.classList.remove("pride-theme");
  }
}

updateLogo();
setInterval(updateLogo, 24 * 60 * 60 * 1000);

// ===============================
//  AUTH STATE
// ===============================
function setAuthState(auth, username = null, isAdmin = false) {
  isAuthenticated = auth;
  currentUser = username;
  currentIsAdmin = isAdmin;

  if (auth) {
    gatedContent.classList.remove("hidden");
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    settingsBtn.style.display = "inline-block";

    userIndicator.textContent = `Logged in as ${username}${
      isAdmin ? " (Admin)" : ""
    }`;

    if (isAdmin) adminBtn.style.display = "inline-block";
    else adminBtn.style.display = "none";

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

  if (!isAdmin) debugPanel.classList.add("hidden");
}

// ===============================
//  API HELPERS
// ===============================
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
      log("Login failed: " + data.message);
      return;
    }

    setAuthState(true, data.username, data.isAdmin);
    closeAuthModal();
    log(`User logged in: ${data.username}, admin=${data.isAdmin}`);
  } catch (err) {
    msgEl.textContent = "Network error";
    log("Login network error");
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
      log("Registration failed: " + data.message);
      return;
    }

    msgEl.textContent = "Registered — you can now login";
    log("User registered: " + username);
  } catch (err) {
    msgEl.textContent = "Network error";
    log("Registration network error");
  }
}

// ===============================
//  AUTH MODAL
// ===============================
function openAuthModal() {
  authSection.classList.remove("hidden");
}

function closeAuthModal() {
  authSection.classList.add("hidden");
  document.getElementById("auth-message").textContent = "";
  document.getElementById("password").value = "";
}

// ===============================
//  WEBAMP
// ===============================
async function toggleWebamp() {
  if (!isAuthenticated || !currentIsAdmin) {
    alert("Webamp is only available for admins");
    return;
  }

  const container = webampContainer;
  const button = document.getElementById("webamp-toggle");

  if (!container || !button) return;

  if (!container.classList.contains("hidden")) {
    container.classList.add("hidden");
    button.textContent = "Show Webamp Player";
    return;
  }

  container.classList.remove("hidden");
  button.textContent = "Hide Webamp Player";

  if (!webampInstance) {
    try {
      webampInstance = new Webamp({
        initialTracks: [
          {
            url: "./assets/thatsall.mp4",
            metaData: { title: "That's All", artist: "UNDERHEAT Studio" },
          },
          {
            url: "./assets/shout.mp4",
            metaData: { title: "Shout", artist: "UNDERHEAT Studio" },
          },
        ],
        initialSkin: {
          url: "./assets/Fallout_Pip-Boy_3000_Amber_v4.wsz",
        },
      });

      await webampInstance.renderWhenReady(container);
      log("Webamp loaded");
    } catch (err) {
      alert("Failed to load Webamp");
      container.classList.add("hidden");
      button.textContent = "Show Webamp Player";
      webampInstance = null;
    }
  }
}

// ===============================
//  THEME + CUSTOMIZATION
// ===============================
function applyThemeFromStorage() {
  const root = document.documentElement;
  const theme = localStorage.getItem("theme");
  const p = localStorage.getItem("--primary-color");
  const s = localStorage.getItem("--secondary-color");
  const a = localStorage.getItem("--accent-color");
  const b = localStorage.getItem("--background-color");

  if (p) root.style.setProperty("--primary-color", p);
  if (s) root.style.setProperty("--secondary-color", s);
  if (a) root.style.setProperty("--accent-color", a);
  if (b) root.style.setProperty("--background-color", b);

  if (theme) log("Restored theme: " + theme);
}

function setTheme(theme) {
  const root = document.documentElement;

  if (theme === "default") {
    root.style.setProperty("--primary-color", "#ff5500");
    root.style.setProperty("--secondary-color", "#333333");
    root.style.setProperty("--accent-color", "#00aaff");
    root.style.setProperty("--background-color", "#1a1a1a");
  } else if (theme === "dark") {
    root.style.setProperty("--primary-color", "#4a9eff");
    root.style.setProperty("--secondary-color", "#0f0f0f");
    root.style.setProperty("--accent-color", "#00d4ff");
    root.style.setProperty("--background-color", "#000000");
  }

  localStorage.setItem(
    "--primary-color",
    getComputedStyle(root).getPropertyValue("--primary-color").trim()
  );
  localStorage.setItem(
    "--secondary-color",
    getComputedStyle(root).getPropertyValue("--secondary-color").trim()
  );
  localStorage.setItem(
    "--accent-color",
    getComputedStyle(root).getPropertyValue("--accent-color").trim()
  );
  localStorage.setItem(
    "--background-color",
    getComputedStyle(root).getPropertyValue("--background-color").trim()
  );
  localStorage.setItem("theme", theme);

  document.body.classList.remove("pride-theme");
  log("Theme set to " + theme);
}

// ===============================
//  COLOR PICKERS + CUSTOMIZATION
// ===============================
function wireColorPickers() {
  const primary = document.getElementById("primary-color");
  const secondary = document.getElementById("secondary-color");
  const accent = document.getElementById("accent-color");
  const bg = document.getElementById("bg-color");

  if (primary)
    primary.addEventListener("input", (e) => {
      document.documentElement.style.setProperty(
        "--primary-color",
        e.target.value
      );
      localStorage.setItem("--primary-color", e.target.value);
    });

  if (secondary)
    secondary.addEventListener("input", (e) => {
      document.documentElement.style.setProperty(
        "--secondary-color",
        e.target.value
      );
      localStorage.setItem("--secondary-color", e.target.value);
    });

  if (accent)
    accent.addEventListener("input", (e) => {
      document.documentElement.style.setProperty(
        "--accent-color",
        e.target.value
      );
      localStorage.setItem("--accent-color", e.target.value);
    });

  if (bg)
    bg.addEventListener("input", (e) => {
      document.documentElement.style.setProperty(
        "--background-color",
        e.target.value
      );
      localStorage.setItem("--background-color", e.target.value);
    });
}

function applyCustomizations() {
  const bgStyle = localStorage.getItem("bg-style") || "solid";
  const bgImage = localStorage.getItem("bg-image") || "";
  const cardStyle = localStorage.getItem("card-style") || "rounded";
  const fontStyle = localStorage.getItem("font-style") || "modern";
  const uiScale = localStorage.getItem("ui-scale") || "1";

  document.body.setAttribute("bg-style", bgStyle);
  document.body.setAttribute("card-style", cardStyle);
  document.body.setAttribute("font-style", fontStyle);
  document.body.style.setProperty("--ui-scale", uiScale);

  if (bgStyle === "image" && bgImage) {
    document.body.style.setProperty("--background-image", `url("${bgImage}")`);
  } else {
    document.body.style.removeProperty("--background-image");
  }

  const bgStyleSelect = document.getElementById("bg-style");
  const bgImageInput = document.getElementById("bg-image-url");
  const cardStyleSelect = document.getElementById("card-style");
  const fontStyleSelect = document.getElementById("font-style");
  const uiScaleSelect = document.getElementById("ui-scale");
  const bgImagePicker = document.getElementById("bg-image-picker");

  if (bgStyleSelect) bgStyleSelect.value = bgStyle;
  if (bgImageInput) bgImageInput.value = bgImage;
  if (cardStyleSelect) cardStyleSelect.value = cardStyle;
  if (fontStyleSelect) fontStyleSelect.value = fontStyle;
  if (uiScaleSelect) uiScaleSelect.value = uiScale;
  if (bgImagePicker)
    bgImagePicker.classList.toggle("hidden", bgStyle !== "image");
}

function wireCustomizationControls() {
  const bgStyleSelect = document.getElementById("bg-style");
  const bgImageInput = document.getElementById("bg-image-url");
  const cardStyleSelect = document.getElementById("card-style");
  const fontStyleSelect = document.getElementById("font-style");
  const uiScaleSelect = document.getElementById("ui-scale");
  const resetBtn = document.getElementById("reset-custom");
  const bgImagePicker = document.getElementById("bg-image-picker");

  if (bgStyleSelect)
    bgStyleSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      localStorage.setItem("bg-style", value);
      document.body.setAttribute("bg-style", value);
      if (bgImagePicker)
        bgImagePicker.classList.toggle("hidden", value !== "image");
    });

  if (bgImageInput)
    bgImageInput.addEventListener("input", (e) => {
      const url = e.target.value;
      localStorage.setItem("bg-image", url);
      if (url) {
        document.body.style.setProperty("--background-image", `url("${url}")`);
      } else {
        document.body.style.removeProperty("--background-image");
      }
    });

  if (cardStyleSelect)
    cardStyleSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      localStorage.setItem("card-style", value);
      document.body.setAttribute("card-style", value);
    });

  if (fontStyleSelect)
    fontStyleSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      localStorage.setItem("font-style", value);
      document.body.setAttribute("font-style", value);
    });

  if (uiScaleSelect)
    uiScaleSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      localStorage.setItem("ui-scale", value);
      document.body.style.setProperty("--ui-scale", value);
    });

  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("bg-style");
      localStorage.removeItem("bg-image");
      localStorage.removeItem("card-style");
      localStorage.removeItem("font-style");
      localStorage.removeItem("ui-scale");
      applyCustomizations();
    });
}

// ===============================
//  SESSION RESTORE
// ===============================
function restoreSession() {
  const savedAuth = localStorage.getItem("isAuthenticated") === "true";
  const savedUser = localStorage.getItem("username");
  const savedAdmin = localStorage.getItem("isAdmin") === "true";

  if (savedAuth && savedUser) {
    setAuthState(true, savedUser, savedAdmin);
    log("Session restored");
  } else {
    setAuthState(false);
  }
}

// ===============================
//  UI WIRING
// ===============================
window.addEventListener("load", () => {
  log("Window loaded");

  // Login button
  loginBtn.addEventListener("click", () => {
    openAuthModal();
  });

  // Logout button
  logoutBtn.addEventListener("click", () => {
    setAuthState(false);
    log("User logged out");
  });

  // Auth modal buttons
  const authAction = document.getElementById("auth-action");
  const authToggle = document.getElementById("auth-toggle");
  const authCancel = document.getElementById("auth-cancel");
  let registerMode = false;

  if (authAction)
    authAction.addEventListener("click", () => {
      if (registerMode) registerViaApi();
      else loginViaApi();
    });

  if (authToggle)
    authToggle.addEventListener("click", () => {
      registerMode = !registerMode;
      document.getElementById("auth-title").textContent = registerMode
        ? "Register"
        : "Login";
      authAction.textContent = registerMode ? "Register" : "Login";
      authToggle.textContent = registerMode
        ? "Switch to Login"
        : "Switch to Register";
      document.getElementById("auth-message").textContent = "";
    });

  if (authCancel)
    authCancel.addEventListener("click", () => {
      closeAuthModal();
    });

  // Webamp toggle
  const webampToggle = document.getElementById("webamp-toggle");
  if (webampToggle) webampToggle.addEventListener("click", toggleWebamp);

  // Theme buttons
  document
    .querySelectorAll(".theme-buttons [data-theme]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.getAttribute("data-theme");
        setTheme(theme);
      });
    });

  // Color pickers
  wireColorPickers();

  // Customization controls
  wireCustomizationControls();

  // Apply saved settings
  applyThemeFromStorage();
  applyCustomizations();
  restoreSession();

  log("UI wired");
});
