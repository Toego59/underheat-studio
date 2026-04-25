// ============================================================
// FEEDBACK SYSTEM — UNDERHEAT STUDIO
// Handles:
// 1. Sending verification code
// 2. Verifying code
// 3. Submitting feedback locally
// ============================================================

// Your backend URL (Codespaces)
const API_BASE = "https://verbose-lamp-jjq7xwgjw4p73qq7q-4000.app.github.dev";

// UI elements
const step1 = document.getElementById("fb-step1");
const step2 = document.getElementById("fb-step2");
const statusBox = document.getElementById("fb-status");

const nameInput = document.getElementById("fb-name");
const emailInput = document.getElementById("fb-email");
const typeInput = document.getElementById("fb-type");
const messageInput = document.getElementById("fb-message");
const codeInput = document.getElementById("fb-code");

const sendCodeBtn = document.getElementById("fb-send-code");
const verifySubmitBtn = document.getElementById("fb-verify-submit");

// ============================================================
// SEND VERIFICATION CODE
// ============================================================

sendCodeBtn.onclick = async () => {
  const email = emailInput.value.trim();

  if (!email) {
    statusBox.textContent = "Please enter an email.";
    return;
  }

  statusBox.textContent = "Sending verification code...";

  try {
    const res = await fetch(`${API_BASE}/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (data.success) {
      statusBox.textContent = "Verification code sent!";
      step1.classList.add("hidden");
      step2.classList.remove("hidden");
    } else {
      statusBox.textContent = data.message || "Failed to send code.";
    }

  } catch (err) {
    statusBox.textContent = "Network error. Try again.";
  }
};

// ============================================================
// VERIFY CODE + SUBMIT FEEDBACK
// ============================================================

verifySubmitBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  const type = typeInput.value;
  const message = messageInput.value.trim();

  if (!code) {
    statusBox.textContent = "Enter your verification code.";
    return;
  }

  if (!message) {
    statusBox.textContent = "Please enter a message.";
    return;
  }

  statusBox.textContent = "Verifying code...";

  try {
    const res = await fetch(`${API_BASE}/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();

    if (!data.success) {
      statusBox.textContent = data.message || "Invalid code.";
      return;
    }

    // Save feedback locally for Admin Panel
    const entry = {
      name,
      email,
      type,
      message,
      date: new Date().toISOString()
    };

    const stored = JSON.parse(localStorage.getItem("feedback") || "[]");
    stored.push(entry);
    localStorage.setItem("feedback", JSON.stringify(stored));

    statusBox.textContent = "Feedback submitted! Thank you.";
    step2.classList.add("hidden");

    // Clear fields
    messageInput.value = "";
    codeInput.value = "";

  } catch (err) {
    statusBox.textContent = "Network error. Try again.";
  }
};
