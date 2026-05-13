// UNDERHEAT Studio — Supabase Auth + KV Roles + Founder-Only Webamp

document.addEventListener("DOMContentLoaded", () => {

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

  const authPanel = document.getElementById("auth-panel");
  const doLogin = document.getElementById("doLogin");
  const doSignup = document.getElementById("doSignup");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  let currentUser = null;
  let role = null;

  // -----------------------------
  // GET TOKEN
  // -----------------------------
  async function getToken() {
    const session = (await supabase.auth.getSession()).data.session;
    return session?.access_token || null;
  }

  // -----------------------------
  // FETCH ROLE
  // -----------------------------
  async function fetchRole() {
    const token = await getToken();
    if (!token) return "guest";

    try {
      const res = await fetch("/api/role", {
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
    const session = (await supabase.auth.getSession()).data.session;

    if (!session) {
      currentUser = null;
      role = null;

      userIndicator.textContent = "";
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      settingsBtn.classList.add("hidden");
      adminBtn.classList.add("hidden");
      gated.classList.add("hidden");
      debug.classList.add("hidden");
      authPanel.classList.add("hidden");

      updateWebampVisibility();
      return;
    }

    currentUser = session.user;
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
    authPanel.classList.remove("hidden");
  });

  doLogin.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);

    authPanel.classList.add("hidden");
    updateUI();
  });

  doSignup.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email to confirm your account");

    authPanel.classList.add("hidden");
    updateUI();
  });

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    updateUI();
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
  supabase.auth.onAuthStateChange(() => updateUI());
  updateUI();
});
