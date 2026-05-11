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

  // Back button
  document.getElementById("back-btn").onclick = () => {
    window.location.href = "/index.html";
  };

  // Logout
  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
  };

  // Private feedback
  document.getElementById("fb-submit").onclick = async () => {
    const result = await api("/api/feedback/private", "POST", {
      name: document.getElementById("fb-name").value,
      email: document.getElementById("fb-email").value,
      type: document.getElementById("fb-type").value,
      message: document.getElementById("fb-message").value
    });
    document.getElementById("fb-status").textContent = result.success ? "Sent!" : result.message;
    if (result.success) {
      document.getElementById("fb-name").value = "";
      document.getElementById("fb-email").value = "";
      document.getElementById("fb-message").value = "";
    }
  };

  // Public post
  document.getElementById("pub-submit").onclick = async () => {
    const form = new FormData();
    form.append("author", document.getElementById("pub-author").value);
    form.append("message", document.getElementById("pub-message").value);
    form.append("sensitive", document.getElementById("pub-anonymous").checked);

    if (document.getElementById("pub-image").files[0]) {
      form.append("image", document.getElementById("pub-image").files[0]);
    }

    const result = await api("/api/feedback/public", "POST", form, true);
    document.getElementById("pub-status").textContent = result.success ? "Posted!" : result.message;
    if (result.success) {
      document.getElementById("pub-author").value = "";
      document.getElementById("pub-message").value = "";
      document.getElementById("pub-image").value = "";
      document.getElementById("pub-anonymous").checked = false;
    }
    loadPublicPosts();
  };

  async function loadPublicPosts() {
    const res = await api("/api/feedback/public");
    const list = document.getElementById("pub-list");
    list.innerHTML = "";

    if (!res.items || res.items.length === 0) {
      list.innerHTML = "<p class='small muted'>No posts yet</p>";
      return;
    }

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
        img.style.maxWidth = "100%";
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
  document.getElementById("admin-submit").onclick = async () => {
    const result = await api("/api/feedback/admin", "POST", {
      message: document.getElementById("admin-message").value
    });
    document.getElementById("admin-status").textContent = result.success ? "Posted!" : result.message;
    if (result.success) {
      document.getElementById("admin-message").value = "";
    }
    loadAdminNotes();
  };

  async function loadAdminNotes() {
    const res = await api("/api/feedback/admin");
    const list = document.getElementById("admin-list");
    list.innerHTML = "";

    if (!res.items || res.items.length === 0) {
      list.innerHTML = "<p class='small muted'>No notes yet</p>";
      return;
    }

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
