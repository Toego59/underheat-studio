// UNDERHEAT Studio — Admin Panel Logic

document.addEventListener("DOMContentLoaded", async () => {
  console.log("ADMIN.JS: Loaded");

  const userList = document.getElementById("admin-user-list");
  const statusBox = document.getElementById("admin-status");
  const token = localStorage.getItem("token");

  // Check if user is authenticated
  if (!token) {
    statusBox.textContent = "Not logged in. Redirecting...";
    setTimeout(() => window.location.href = "/index.html", 2000);
    return;
  }

  // API helper
  async function api(path, method = "GET", body = null) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    };

    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(path, opts);
      return await res.json();
    } catch (err) {
      console.error("API Error:", err);
      return { success: false, message: "Network error" };
    }
  }

  // Check authorization
  async function checkAuth() {
    const res = await api("/api/auth/session");
    console.log("Session response:", res);

    if (!res.success) {
      statusBox.textContent = "Not authenticated. Redirecting...";
      return false;
    }

    if (!["admin", "founder"].includes(res.user.role)) {
      statusBox.textContent = `Unauthorized. Your role is "${res.user.role}" but admin access requires "admin" or "founder" role.`;
      return false;
    }

    return true;
  }

  // Initialize
  async function init() {
    const authorized = await checkAuth();
    if (!authorized) {
      setTimeout(() => window.location.href = "/index.html", 3000);
      return;
    }

    statusBox.textContent = "✓ Admin access granted. User management coming soon.";
    userList.innerHTML = "<p class='small muted'>User management features are being implemented.</p>";
  }

  // Back button
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    });
  }

  await init();
});
