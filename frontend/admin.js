// ============================================================
// UNDERHEAT STUDIO — ADMIN PANEL LOGIC
// ============================================================

// Auto backend detection
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:4000/api"
    : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

// DOM elements
const adminAuthSection = document.getElementById("admin-auth-section");
const toolsCard = document.getElementById("tools-card");

const adminUsername = document.getElementById("admin-username");
const adminPassword = document.getElementById("admin-password");
const adminAuthBtn = document.getElementById("admin-auth");
const adminAuthMsg = document.getElementById("admin-auth-msg");

const listUsersBtn = document.getElementById("list-users");
const usersListEl = document.getElementById("users-list");

const refreshSubBtn = document.getElementById("refresh-submissions");
const clearSubBtn = document.getElementById("clear-submissions");
const submissionsList = document.getElementById("submissions-list");

const debugShowBtn = document.getElementById("debug-show");
const debugHideBtn = document.getElementById("debug-hide");
const debugAppendBtn = document.getElementById("debug-append");
const debugClearBtn = document.getElementById("debug-clear");
const debugInput = document.getElementById("debug-message-input");
const debugLog = document.getElementById("debug-log");
const debugVisibilityMsg = document.getElementById("debug-visibility-msg");

// ============================================================
// ADMIN AUTH
// ============================================================

let adminCreds = null;

adminAuthBtn.onclick = async () => {
  const username = adminUsername.value.trim();
  const password = adminPassword.value;

  if (!username || !password) {
    adminAuthMsg.textContent = "Fill out all fields.";
    adminAuthMsg.className = "small err";
    return;
  }

  adminAuthMsg.textContent = "Authenticating...";
  adminAuthMsg.className = "small muted";

  try {
    const res = await fetch(`${API_BASE}/admin/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
      adminAuthMsg.textContent = data.message || "Invalid admin credentials.";
      adminAuthMsg.className = "small err";
      return;
    }

    adminCreds = { username, password };

    adminAuthSection.classList.add("hidden");
    toolsCard.classList.remove("hidden");

  } catch {
    adminAuthMsg.textContent = "Network error.";
    adminAuthMsg.className = "small err";
  }
};

// ============================================================
// LIST USERS (CLEAN FORMAT)
// ============================================================

listUsersBtn.onclick = async () => {
  if (!adminCreds) return;

  usersListEl.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/admin/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCreds)
    });

    const data = await res.json();

    if (!data.success || !Array.isArray(data.users)) {
      usersListEl.textContent = data.message || "Failed to load users.";
      return;
    }

    const lines = data.users.map(u => {
      const role = u.isAdmin ? "admin" : "user";
      return `• ${u.username} (${role})`;
    });

    usersListEl.textContent = lines.join("\n");

  } catch {
    usersListEl.textContent = "Network error.";
  }
};

// ============================================================
// LOCAL SUBMISSIONS (BROWSER ONLY)
// ============================================================

function loadLocalSubmissions() {
  const subs = JSON.parse(localStorage.getItem("submissions") || "[]");

  if (!subs.length) {
    submissionsList.textContent = "No local submissions in this browser.";
    return;
  }

  const lines = subs.map(s => {
    const t = new Date(s.timestamp || Date.now()).toLocaleString();
    return `[${t}] ${s.username}: ${s.message}`;
  });

  submissionsList.textContent = lines.join("\n");
}

refreshSubBtn.onclick = loadLocalSubmissions;

clearSubBtn.onclick = () => {
  localStorage.removeItem("submissions");
  loadLocalSubmissions();
};

loadLocalSubmissions();

// ============================================================
// DEBUG PANEL CONTROLS (GLOBAL)
// ============================================================

function readDebugLog() {
  try {
    return JSON.parse(localStorage.getItem("debug_log") || "[]");
  } catch {
    return [];
  }
}

function writeDebugLog(arr) {
  localStorage.setItem("debug_log", JSON.stringify(arr));
  localStorage.setItem("debug_visible", "1");
  renderDebugLocal();
}

function renderDebugLocal() {
  const visible = localStorage.getItem("debug_visible") === "1";
  debugVisibilityMsg.textContent = visible ? "Debug panel is visible" : "Debug panel is hidden";

  const arr = readDebugLog();
  debugLog.textContent = arr.length ? arr.join("\n") : "(debug empty)";
}

debugShowBtn.onclick = () => {
  localStorage.setItem("debug_visible", "1");
  renderDebugLocal();
};

debugHideBtn.onclick = () => {
  localStorage.setItem("debug_visible", "0");
  renderDebugLocal();
};

debugAppendBtn.onclick = () => {
  const msg = debugInput.value.trim();
  if (!msg) return;

  const arr = readDebugLog();
  arr.push(msg);
  writeDebugLog(arr);

  debugInput.value = "";
};

debugClearBtn.onclick = () => {
  writeDebugLog([]);
};

renderDebugLocal();

// Sync debug panel across tabs/pages
window.addEventListener("storage", renderDebugLocal);
