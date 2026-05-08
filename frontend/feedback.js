// UNDERHEAT Studio — Feedback System (Local Storage + Clean UI)

document.addEventListener("DOMContentLoaded", () => {
  console.log("FEEDBACK.JS: Loaded");

  // -----------------------------
  // ELEMENTS
  // -----------------------------
  const nameInput = document.getElementById("fb-name");
  const emailInput = document.getElementById("fb-email");
  const typeSelect = document.getElementById("fb-type");
  const messageInput = document.getElementById("fb-message");
  const submitBtn = document.getElementById("fb-submit");
  const statusBox = document.getElementById("fb-status");

  // -----------------------------
  // SAVE FEEDBACK LOCALLY
  // -----------------------------
  function saveFeedback(entry) {
    const existing = JSON.parse(localStorage.getItem("feedback") || "[]");
    existing.push(entry);
    localStorage.setItem("feedback", JSON.stringify(existing));
  }

  // -----------------------------
  // SUBMIT HANDLER
  // -----------------------------
  submitBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const type = typeSelect.value;
    const message = messageInput.value.trim();

    if (!message) {
      statusBox.textContent = "Please enter a message.";
      statusBox.style.color = "var(--accent-color)";
      return;
    }

    const entry = {
      name: name || "Anonymous",
      email: email || "Not provided",
      type,
      message,
      date: new Date().toISOString()
    };

    saveFeedback(entry);

    statusBox.textContent = "Feedback submitted. Thank you!";
    statusBox.style.color = "var(--accent-color)";

    // Clear fields
    nameInput.value = "";
    emailInput.value = "";
    messageInput.value = "";
    typeSelect.value = "General Feedback";
  });
});
