// =======================================
//  AUTO BACKEND URL DETECTION
// =======================================
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:3000/api"
    : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

// =======================================
//  DOM ELEMENTS
// =======================================
const adminAuthBtn = document.getElementById("admin-auth");
const adminLogoutBtn = document.getElementById("admin-logout");
const adminMsg = document.getElementById("admin-auth-msg");
const toolsCard = document.getElementById("tools-card");

const listUsersBtn = document.getElementById("list-users");
const usersListEl = document.getElementById("users-list");

const deleteBtn = document.getElementById("delete-user");
const deleteMsg = document.getElementById("delete-msg");

const setpassBtn = document.getElementById("setpass-btn");
const setpassMsg = document.getElementById("setpass-msg");

const submissionsList = document.getElementById("submissions-list");
const clearSubBtn = document.getElementById("clear-submissions");
const refreshSubBtn = document.getElementById("refresh-submissions");

// Debug controls
const debugShowBtn = document.getElementById("debug-show");
const debugHideBtn = document.getElementById("debug-hide");
const debugAppendBtn = document.getElementById("debug-append");
const debugClearBtn = document.getElementById("debug-clear");
const debugInput = document.getElementById("debug-message-input");
const debugLogEl = document.getElementById("debug-log");
const debugVisibilityMsg = document.getElementById("debug-visibility-msg");

// =======================================
//  ADMIN AUTH STATE (LOCAL ONLY)
// =======================================
let adminCreds = null;

function showMsg(el, text, ok = true) {
  el.textContent = text;
  el.className = ok ? "small ok" : "small err";
  setTimeout(() => {
    el.textContent = "";
    el.className = "small muted";
  }, 4000);
}

// =======================================
//  AUTHENTICATION
// =======================================
adminAuthBtn.addEventListener("click", () => {
  const u = document.getElementById("admin-username").value.trim();
  const p = document.getElementById("admin-password").value;

  if (!u || !p) {
    adminMsg.textContent = "Enter admin username and password";
    return;
  }

  adminCreds = { adminUsername: u, adminPassword: p };
  adminMsg.textContent = "Authenticated locally. Admin tools unlocked.";
  toolsCard.classList.remove("hidden");
  adminLogoutBtn.style.display = "inline-block";

  document.getElementById("admin-password").value = "";
});

adminLogoutBtn.addEventListener("click", () => {
  adminCreds = null;
  toolsCard.classList.add("hidden");
  adminMsg.textContent = "Cleared credentials.";
  adminLogoutBtn.style.display = "none";
});

// =======================================
//  ADMIN API CALLS
// =======================================
listUsersBtn.addEventListener("click", async () => {
  if (!adminCreds) return alert("Authenticate first");

  usersListEl.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/admin/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCreds),
    });

    const data = await res.json();
    usersListEl.textContent = JSON.stringify(data, null, 2);
  } catch {
    usersListEl.textContent = "Network error";
  }
});

deleteBtn.addEventListener("click", async () => {
  if (!adminCreds) return alert("Authenticate first");

  const username = document.getElementById("delete-username").value.trim();
  if (!username) return showMsg(deleteMsg, "Enter username", false);

  showMsg(deleteMsg, "Deleting...");

  try {
    const res = await fetch(`${API_BASE}/admin/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...adminCreds, username }),
    });

    const data = await res.json();
    showMsg(deleteMsg, data.message || "Done", data.success);
  } catch {
    showMsg(deleteMsg, "Network error", false);
  }
});

setpassBtn.addEventListener("click", async () => {
  if (!adminCreds) return alert("Authenticate first");

  const username = document.getElementById("setpass-username").value.trim();
  const newPassword = document.getElementById("setpass-password").value;

  if (!username || !newPassword)
    return showMsg(setpassMsg, "Enter username + new password", false);

  showMsg(setpassMsg, "Updating...");

  try {
    const res = await fetch(`${API_BASE}/admin/setpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...adminCreds, username, newPassword }),
    });

    const data = await res.json();
    showMsg(setpassMsg, data.message || "Done", data.success);
  } catch {
    showMsg(setpassMsg, "Network error", false);
  }
});

// =======================================
//  LOCAL SUBMISSIONS VIEWER
// =======================================
function loadLocalSubmissions() {
  const subs = JSON.parse(localStorage.getItem("submissions") || "[]");
  submissionsList.textContent = subs.length
    ? JSON.stringify(subs, null, 2)
    : "No submissions";
}

clearSubBtn.addEventListener("click", () => {
  localStorage.removeItem("submissions");
  loadLocalSubmissions();
});

refreshSubBtn.addEventListener("click", loadLocalSubmissions);

// =======================================
//  DEBUG PANEL CONTROLS (SITE-WIDE)
// =======================================
function readDebugLog() {
  try {
    return JSON.parse(localStorage.getItem("debug_log") || "[]");
  } catch {
    return [];
  }
}

function writeDebugLog(arr) {
  localStorage.setItem("debug_log", JSON.stringify(arr));
  localStorage.setItem("debug_updated_at", Date.now().toString());
}

function renderDebugLog() {
  const arr = readDebugLog();
  debugLogEl.textContent = arr.length ? arr.join("\n") : "(empty)";
}

function updateDebugVisibilityMsg() {
  const visible = localStorage.getItem("debug_visible") === "1";
  debugVisibilityMsg.textContent = visible
    ? "Debug panel is visible on all pages."
    : "Debug panel is hidden.";
}

debugShowBtn.addEventListener("click", () => {
  localStorage.setItem("debug_visible", "1");
  localStorage.setItem("debug_visibility_updated_at", Date.now().toString());
  updateDebugVisibilityMsg();
});

debugHideBtn.addEventListener("click", () => {
  localStorage.setItem("debug_visible", "0");
  localStorage.setItem("debug_visibility_updated_at", Date.now().toString());
  updateDebugVisibilityMsg();
});

debugAppendBtn.addEventListener("click", () => {
  const msg = debugInput.value.trim();
  if (!msg) return alert("Enter a message");

  const arr = readDebugLog();
  arr.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  writeDebugLog(arr);

  debugInput.value = "";
  renderDebugLog();
});

debugClearBtn.addEventListener("click", () => {
  if (!confirm("Clear debug log?")) return;
  writeDebugLog([]);
  renderDebugLog();
});

// Sync updates from other tabs/pages
window.addEventListener("storage", () => {
  renderDebugLog();
  updateDebugVisibilityMsg();
});

// =======================================
//  INIT
// =======================================
loadLocalSubmissions();
renderDebugLog();
updateDebugVisibilityMsg();
