// UNDERHEAT Studio — Admin Panel Logic
// Works with SQLite + JWT backend (founder/admin/user roles)

document.addEventListener("DOMContentLoaded", () => {
  console.log("ADMIN.JS: Loaded");

  const userList = document.getElementById("admin-user-list");
  const statusBox = document.getElementById("admin-status");

  const token = localStorage.getItem("token");
  if (!token) {
    statusBox.textContent = "Not logged in.";
    return;
  }

  // -----------------------------
  // API helper
  // -----------------------------
  async function api(path, method = "GET", body = null) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    };

    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    return res.json();
  }

  // -----------------------------
  // Load users
  // -----------------------------
  async function loadUsers() {
    statusBox.textContent = "Loading users...";

    const result = await api("/api/admin/users");
    if (!result.success) {
      statusBox.textContent = result.message || "Failed to load users.";
      return;
    }

    statusBox.textContent = "";
    renderUsers(result.users);
  }

  // -----------------------------
  // Render user list
  // -----------------------------
  function renderUsers(users) {
    userList.innerHTML = "";

    users.forEach(user => {
      const row = document.createElement("div");
      row.className = "admin-user-row panel";

      const email = document.createElement("div");
      email.textContent = user.email;

      const role = document.createElement("div");
      role.textContent = `Role: ${user.role}`;

      const controls = document.createElement("div");
      controls.className = "admin-controls";

      // Founder cannot be changed here
      if (user.role === "founder") {
        controls.textContent = "Founder (locked)";
      } else {
        // Promote to admin
        const promoteBtn = document.createElement("button");
        promoteBtn.className = "btn secondary";
        promoteBtn.textContent = "Make Admin";
        promoteBtn.onclick = () => updateRole(user.id, "admin");

        // Demote to user
        const demoteBtn = document.createElement("button");
        demoteBtn.className = "btn ghost";
        demoteBtn.textContent = "Make User";
        demoteBtn.onclick = () => updateRole(user.id, "user");

        controls.appendChild(promoteBtn);
        controls.appendChild(demoteBtn);
      }

      row.appendChild(email);
      row.appendChild(role);
      row.appendChild(controls);

      userList.appendChild(row);
    });
  }

  // -----------------------------
  // Update role
  // -----------------------------
  async function updateRole(id, newRole) {
    statusBox.textContent = "Updating role...";

    const result = await api(`/api/admin/users/${id}/role`, "POST", {
      role: newRole
    });

    if (!result.success) {
      statusBox.textContent = result.message || "Failed to update role.";
      return;
    }

    statusBox.textContent = "Role updated.";
    loadUsers();
  }

  // -----------------------------
  // Initial load
  // -----------------------------
  loadUsers();
});
