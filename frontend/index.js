// UNDERHEAT Studio — Auth0 Auth + KV Roles + Founder-Only Webamp

document.addEventListener("DOMContentLoaded", async () => {

  // -----------------------------
  // ELEMENTS
  // -----------------------------
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const adminBtn = document.getElementById("adminBtn");
  const feedbackBtn = document.getElementById("feedbackBtn");
  const userIndicator = document.getElementById("user-indicator");

  const gated = document.getElementById("gated-content");
  const debug = document.getElementById("debug-panel");

  const webampToggle = document.getElementById("webamp-toggle");
  const webampContainer = document.getElementById("webamp-container");
  let webamp = null;

  let currentUser = null;
  let role = null;

  // -----------------------------
  // AUTH0 INITIALIZATION
  // -----------------------------
  window.auth0Client = await auth0.createAuth0Client({
    domain: "dev-4ltdfgozv6ve68zm.us.auth0.com",
    clientId: "nq6P9QVnA0WT2GCls7JNl5Unj35l8oGz",
    authorizationParams: {
      redirect_uri: "https://miniature-system-q7p4wgx7g96g2r95-5500.app.github.dev"
    }
  });

  // -----------------------------
  // HANDLE REDIRECT CALLBACK
  // -----------------------------
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await window.auth0Client.handleRedirectCallback();
    window.history.replaceState({}, "", window.location.pathname);
  }

  // -----------------------------
  // GET TOKEN
  // -----------------------------
  async function getToken() {
    try {
      return await window.auth0Client.getTokenSilently();
    } catch {
      return null;
    }
  }

  // -----------------------------
  // API BASE URL (FIXED)
  // -----------------------------
  const API_BASE = "https://cold-cell-aa07.jkmeiihh.workers.dev";

  // -----------------------------
  // FETCH ROLE FROM WORKER (FIXED)
  // -----------------------------
  async function fetchRole() {
    const token = await getToken();
    if (!token) return "guest";

    try {
      const res = await fetch(`${API_BASE}/api/role`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      return data.role || "user";
    } catch {
      return "user";
    }
  }

  // -----------------------------
  // WEBAMP
  // -----------------------------
  function updateWebampVisibility() {
    if (role !== "founder") {
      webampToggle.classList.add("hidden");
      webampContainer.classList.add("hidden");
      if (webamp) webamp.dispose();
      webamp = null;
      return;
    }

    webampToggle.classList.remove("hidden");
  }

  async function initWebamp() {
    if (webamp) webamp.dispose();

    webamp = new Webamp({
      initialTracks: [
        { url: "assets/shout.mp4", metaData: { title: "Shout" } },
        { url: "assets/thatsall.mp4", metaData: { title: "That's All" } }
      ],
      initialSkin: { url: "assets/Fallout_Pip-Boy_3000_Amber_v4.wsz" }
    });

    await webamp.renderWhenReady(webampContainer);
    webampContainer.classList.remove("hidden");
  }

  webampToggle.addEventListener("click", () => {
    if (role !== "founder") return;

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
  async function updateUI() {
    const isAuthenticated = await window.auth0Client.isAuthenticated();

    if (!isAuthenticated) {
      currentUser = null;
      role = null;

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

    currentUser = await window.auth0Client.getUser();
    role = await fetchRole();

    userIndicator.textContent = `${currentUser.email} (${role})`;

    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    settingsBtn.classList.remove("hidden");
    gated.classList.remove("hidden");

    if (role === "founder" || role === "admin") {
      adminBtn.classList.remove("hidden");
      debug.classList.remove("hidden");
      debug.textContent = `Admin mode active\nRole: ${role}`;
    } else {
      adminBtn.classList.add("hidden");
      debug.classList.add("hidden");
    }

    updateWebampVisibility();
  }

  // -----------------------------
  // EVENT LISTENERS
  // -----------------------------
  loginBtn.addEventListener("click", () => {
    window.auth0Client.loginWithRedirect();
  });

  logoutBtn.addEventListener("click", () => {
    window.auth0Client.logout({
      logoutParams: {
        returnTo: "https://miniature-system-q7p4wgx7g96g2r95-5500.app.github.dev"
      }
    });
  });

  feedbackBtn.addEventListener("click", () => {
    window.location.href = "/feedback.html";
  });

  settingsBtn.addEventListener("click", () => {
    window.location.href = "/settings.html";
  });

  adminBtn.addEventListener("click", () => {
    window.location.href = "/admin.html";
  });

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  updateUI();
});
