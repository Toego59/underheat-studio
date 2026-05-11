document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  const DEFAULTS = {
    "--primary-color": "#ff5500",
    "--secondary-color": "#333333",
    "--accent-color": "#ff5500",
    "--background-color": "#1a1a1a",
    "--neon-color": "#00ffff",
    "card-style": "glass",
    "font-style": "modern",
    "ui-scale": "1"
  };

  const colorVars = [
    "--primary-color",
    "--secondary-color",
    "--accent-color",
    "--background-color",
    "--neon-color"
  ];

  // Load current settings
  function loadSettings() {
    colorVars.forEach(v => {
      const val = localStorage.getItem(v) || DEFAULTS[v];
      const inputId = v.replace("--", "");
      const previewId = inputId + "-preview";
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      if (input) {
        input.value = val;
        if (preview) preview.style.backgroundColor = val;
      }
    });

    const cardStyle = localStorage.getItem("card-style") || DEFAULTS["card-style"];
    const fontStyle = localStorage.getItem("font-style") || DEFAULTS["font-style"];
    const uiScale = localStorage.getItem("ui-scale") || DEFAULTS["ui-scale"];

    const cardSelect = document.getElementById("card-style");
    const fontSelect = document.getElementById("font-style");
    const scaleInput = document.getElementById("ui-scale");
    const scaleLabel = document.getElementById("scale-label");

    if (cardSelect) cardSelect.value = cardStyle;
    if (fontSelect) fontSelect.value = fontStyle;
    if (scaleInput) {
      scaleInput.value = uiScale;
      if (scaleLabel) scaleLabel.textContent = Math.round(uiScale * 100) + "%";
    }
  }

  // Apply settings in real-time
  function applySetting(key, value) {
    if (key.startsWith("--")) {
      root.style.setProperty(key, value);
    } else if (key === "ui-scale") {
      root.style.setProperty("--ui-scale", value);
      const label = document.getElementById("scale-label");
      if (label) label.textContent = Math.round(value * 100) + "%";
    } else if (key === "card-style" || key === "font-style") {
      if (document.body) {
        document.body.setAttribute(key, value);
      }
    }
  }

  // Color inputs
  colorVars.forEach(v => {
    const inputId = v.replace("--", "");
    const previewId = inputId + "-preview";
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input) {
      input.addEventListener("input", (e) => {
        localStorage.setItem(v, e.target.value);
        applySetting(v, e.target.value);
        if (preview) preview.style.backgroundColor = e.target.value;
      });
    }
  });

  // Card style
  const cardSelect = document.getElementById("card-style");
  if (cardSelect) {
    cardSelect.addEventListener("change", (e) => {
      localStorage.setItem("card-style", e.target.value);
      applySetting("card-style", e.target.value);
    });
  }

  // Font style
  const fontSelect = document.getElementById("font-style");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      localStorage.setItem("font-style", e.target.value);
      applySetting("font-style", e.target.value);
    });
  }

  // UI scale
  const scaleInput = document.getElementById("ui-scale");
  if (scaleInput) {
    scaleInput.addEventListener("input", (e) => {
      localStorage.setItem("ui-scale", e.target.value);
      applySetting("ui-scale", e.target.value);
    });
  }

  // Reset
  const resetBtn = document.getElementById("reset-settings");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Object.entries(DEFAULTS).forEach(([key, value]) => {
        localStorage.setItem(key, value);
        applySetting(key, value);
      });
      loadSettings();
    });
  }

  // Back and logout
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    });
  }

  loadSettings();
});
