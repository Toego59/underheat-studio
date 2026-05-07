// ============================================================
// UNDERHEAT STUDIO — FEEDBACK / FORM SYSTEM
// ============================================================

// Auto backend detection
const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:4000/api"
    : "https://cold-cell-aa07.jkmeiihh.workers.dev/api";

// DOM elements
const fbForm = document.getElementById("feedback-form");
const fbUsernameGroup = document.getElementById("fb-username-group");
const fbUsername = document.getElementById("fb-username");
const fbEmail = document.getElementById("fb-email");
const fbMessage = document.getElementById("fb-message");
const fbMsg = document.getElementById("fb-msg");

// Load current user
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

// ============================================================
// LOGGED-IN BEHAVIOR
// ============================================================

if (currentUser && currentUser.username) {
  fbUsernameGroup.classList.add("hidden");
}

// ============================================================
// USERNAME VALIDATION
// Allowed: A–Z, a–z, 0–9, '
// ============================================================

function isValidUsername(name) {
  return /^[A-Za-z0-9']+$/.test(name);
}

// ============================================================
// MESSAGE SANITIZATION
// (Prevents HTML injection, keeps text safe)
// ============================================================

function sanitizeMessage(msg) {
  return msg.replace(/[<>]/g, "");
}

// ============================================================
// SUBMIT FEEDBACK
// ============================================================

fbForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = currentUser && currentUser.username
    ? currentUser.username
    : fbUsername.value.trim();

  const email = fbEmail.value.trim();
  const message = sanitizeMessage(fbMessage.value.trim());

  // Required fields
  if (!username || !email || !message) {
    fbMsg.textContent = "Please fill out all fields.";
    fbMsg.className = "small err";
    return;
  }

  // Username rules
  if (!isValidUsername(username)) {
    fbMsg.textContent = "Username can only contain letters, numbers, and '";
    fbMsg.className = "small err";
    return;
  }

  fbMsg.textContent = "Sending...";
  fbMsg.className = "small muted";

  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, message })
    });

    const data = await res.json();

    if (!data.success) {
      fbMsg.textContent = data.message || "Failed to send feedback.";
      fbMsg.className = "small err";
      return;
    }

    // ============================================================
    // LOCAL SUBMISSIONS (for admin viewer)
    // ============================================================

    const subs = JSON.parse(localStorage.getItem("submissions") || "[]");

    subs.push({
      username,
      email,
      message,
      timestamp: Date.now()
    });

    localStorage.setItem("submissions", JSON.stringify(subs));

    fbMsg.textContent = "Feedback sent. Thank you.";
    fbMsg.className = "small ok";

    // Clear message field
    fbMessage.value = "";

    // Clear username if not logged in
    if (!currentUser) fbUsername.value = "";

  } catch (err) {
    fbMsg.textContent = "Network error.";
    fbMsg.className = "small err";
  }
});
