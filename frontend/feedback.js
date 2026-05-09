document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  let currentUser = null;

  const api = async (path, method = "GET", body = null, isForm = false) => {
    const opts = { method, headers: {} };
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    if (body && !isForm) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    } else if (body && isForm) {
      opts.body = body;
    }
    return (await fetch(path, opts)).json();
  };

  // Restore session
  async function restoreSession() {
    if (!token) return;
    const res = await api("/api/auth/session");
    if (res.success) {
      currentUser = res.user;
      if (["admin", "founder"].includes(currentUser.role)) {
        document.getElementById("admin-section").classList.remove("hidden");
        loadAdminNotes();
      }
    }
  }

  // Logout
  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  };

  // Private feedback
  fb-submit.onclick = async () => {
    const result = await api("/api/feedback/private", "POST", {
      name: fb-name.value,
      email: fb-email.value,
      type: fb-type.value,
      message: fb-message.value
    });
    fb-status.textContent = result.success ? "Sent!" : result.message;
  };

  // Public post
  pub-submit.onclick = async () => {
    const form = new FormData();
    form.append("author", pub-author.value);
    form.append("message", pub-message.value);
    form.append("sensitive", pub-sensitive.checked);

    if (pub-image.files[0]) form.append("image", pub-image.files[0]);

    const result = await api("/api/feedback/public", "POST", form, true);
    pub-status.textContent = result.success ? "Posted!" : result.message;
    loadPublicPosts();
  };

  async function loadPublicPosts() {
    const res = await api("/api/feedback/public");
    const list = document.getElementById("pub-list");
    list.innerHTML = "";

    res.items.forEach(post => {
      const div = document.createElement("div");
      div.className = "panel small";

      div.innerHTML = `
        <div class="small muted">${post.author} — ${new Date(post.date).toLocaleString()}</div>
        <p>${post.message}</p>
      `;

      if (post.image) {
        const img = document.createElement("img");
        img.src = post.image;
        img.className = "pub-image";
        div.appendChild(img);
      }

      if (currentUser && ["admin", "founder"].includes(currentUser.role)) {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = async () => {
          await api(`/api/feedback/public/${post.id}`, "DELETE");
          loadPublicPosts();
        };
        div.appendChild(del);
      }

      list.appendChild(div);
    });
  }

  // Admin notes
  admin-submit.onclick = async () => {
    const result = await api("/api/feedback/admin", "POST", {
      message: admin-message.value
    });
    admin-status.textContent = result.success ? "Posted!" : result.message;
    loadAdminNotes();
  };

  async function loadAdminNotes() {
    const res = await api("/api/feedback/admin");
    const list = document.getElementById("admin-list");
    list.innerHTML = "";

    res.items.forEach(note => {
      const div = document.createElement("div");
      div.className = "panel small";
      div.innerHTML = `
        <div class="small muted">${note.author} — ${new Date(note.date).toLocaleString()}</div>
        <p>${note.message}</p>
      `;
      list.appendChild(div);
    });
  }

  restoreSession();
  loadPublicPosts();
});
