// UNDERHEAT Studio — Admin Panel (Supabase + KV Roles)

document.addEventListener("DOMContentLoaded", async () => {
  console.log("ADMIN.JS: Loaded");

  // ---------------------------------------------------------
  // ELEMENTS
  // ---------------------------------------------------------
  const statusBox = document.getElementById("admin-status");
  const userList = document.getElementById("admin-user-list");
  const adminUserIndicator = document.getElementById("admin-user-indicator");

  const backBtn = document.getElementById("back-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const navUsers = document.getElementById("nav-users");
  const navRoles = document.getElementById("nav-roles");
  const navLogs = document.getElementById("nav-logs");

  const sectionUsers = document.getElementById("admin-users-section");
  const sectionRoles = document.getElementById("admin-roles-section");
  const sectionLogs = document.getElementById("admin-logs-section");

  const roleUserId = document.getElementById("role-user-id");
  const roleSelect = document.getElementById("role-select");
  const applyRoleBtn = document.getElementById("apply-role-btn");

  // ---------------------------------------------------------
  // GET TOKEN
  // ---------------------------------------------------------
  async function getToken() {
    const session = (await supabase.auth.getSession()).data.session;
    return session?.access_token || null;
  }

  // ---------------------------------------------------------
  // API HELPER
  // ---------------------------------------------------------
  async function api(path, method = "GET", body = null) {
    const token = await getToken();
    if (!token) return { success: false, message: "No token" };

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

  // ---------------------------------------------------------
  // CHECK AUTHORIZATION
  // ---------------------------------------------------------
  async function checkAuth() {
    const token = await getToken();
    if (!token) {
      statusBox.classList.remove("hidden");
      statusBox.textContent = "Not logged in. Redirecting...";
      setTimeout(() => (window.location.href = "/index.html"), 2000);
      return null;
    }

    // Get role from Worker
    const roleRes = await api("/api/role");
    const role = roleRes.role || "guest";

    if (!["admin", "founder"].includes(role)) {
      statusBox.classList.remove("hidden");
      statusBox.textContent = `Unauthorized. Your role is "${role}".`;
      setTimeout(() => (window.location.href = "/index.html"), 3000);
      return null;
    }

    return role;
  }

  // ---------------------------------------------------------
  // LOAD USERS FROM KV
  // ---------------------------------------------------------
  async function loadUsers() {
    userList.innerHTML = "<p class='small muted'>Loading users...</p>";

    // You don't have a list-users endpoint yet, so placeholder:
    userList.innerHTML = `
      <p class="small muted">
        User listing requires a /api/list-users endpoint.<br>
        Your KV currently stores users by ID only.<br><br>
        I can generate the Worker code for this if you want.
      </p>
    `;
  }

  // ---------------------------------------------------------
  // APPLY ROLE
  // ---------------------------------------------------------
  applyRoleBtn.addEventListener("click", async () => {
    const targetUserId = roleUserId.value.trim();
    const newRole = roleSelect.value;

    if (!targetUserId) {
      statusBox.classList.remove("hidden");
      statusBox.textContent = "Enter a user ID.";
      return;
    }

    const res = await api("/api/set-role", "POST", {
      targetUserId,
      newRole
    });

    statusBox.classList.remove("hidden");

    if (res.success) {
      statusBox.textContent = `✓ Role updated to "${newRole}"`;
    } else {
      statusBox.textContent = `Error: ${res.message}`;
    }
  });

  // ---------------------------------------------------------
  // NAVIGATION BETWEEN SECTIONS
  // ---------------------------------------------------------
  function showSection(section) {
    sectionUsers.classList.add("hidden");
    sectionRoles.classList.add("hidden");
    sectionLogs.classList.add("hidden");

    navUsers.classList.remove("active");
    navRoles.classList.remove("active");
    navLogs.classList.remove("active");

    section.classList.remove("hidden");

    if (section === sectionUsers) navUsers.classList.add("active");
    if (section === sectionRoles) navRoles.classList.add("active");
    if (section === sectionLogs) navLogs.classList.add("active");
  }

  navUsers.addEventListener("click", () => showSection(sectionUsers));
  navRoles.addEventListener("click", () => showSection(sectionRoles));
  navLogs.addEventListener("click", () => showSection(sectionLogs));

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });

  // ---------------------------------------------------------
  // BACK BUTTON
  // ---------------------------------------------------------
  backBtn.addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  // ---------------------------------------------------------
  // INITIALIZE
  // ---------------------------------------------------------
  const role = await checkAuth();
  if (!role) return;

  const session = (await supabase.auth.getSession()).data.session;
  adminUserIndicator.textContent = `${session.user.email} (${role})`;

  statusBox.classList.remove("hidden");
  statusBox.textContent = "✓ Admin access granted.";

  await loadUsers();
  showSection(sectionUsers);
});
