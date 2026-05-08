// UNDERHEAT Studio — Full Settings System (Theme, Colors, UI Scale, Fonts, Cards)

document.addEventListener("DOMContentLoaded", () => {
  console.log("SETTINGS.JS: Loaded");

  // -----------------------------
  // ELEMENTS
  // -----------------------------
  const accentInput = document.getElementById("accent-color");
  const bgInput = document.getElementById("background-color");
  const textInput = document.getElementById("text-color");

  const cardStyleSelect = document.getElementById("card-style");
  const fontStyleSelect = document.getElementById("font-style");
  const uiScaleInput = document.getElementById("ui-scale");

  const preview = document.getElementById("preview-box");

  const saveBtn = document.getElementById("save-settings");
  const resetBtn = document.getElementById("reset-settings");

  // -----------------------------
  // DEFAULT SETTINGS
  // -----------------------------
  const DEFAULTS = {
    accent: "#ff5500",
    background: "#1a1a1a",
    text: "#ffffff",
    cardStyle: "default",
    fontStyle: "modern",
    uiScale: 1
  };

  // -----------------------------
  // LOAD SETTINGS
  // -----------------------------
  function loadSettings() {
    return {
      accent: localStorage.getItem("accent-color") || DEFAULTS.accent,
      background: localStorage.getItem("background-color") || DEFAULTS.background,
      text: localStorage.getItem("text-color") || DEFAULTS.text,
      cardStyle: localStorage.getItem("card-style") || DEFAULTS.cardStyle,
      fontStyle: localStorage.getItem("font-style") || DEFAULTS.fontStyle,
      uiScale: parseFloat(localStorage.getItem("ui-scale")) || DEFAULTS.uiScale
    };
  }

  // -----------------------------
  // APPLY SETTINGS TO PAGE
  // -----------------------------
  function applySettings(s) {
    document.documentElement.style.setProperty("--accent-color", s.accent);
    document.documentElement.style.setProperty("--background-color", s.background);
    document.documentElement.style.setProperty("--text-color", s.text);

    document.body.setAttribute("card-style", s.cardStyle);
    document.body.setAttribute("font-style", s.fontStyle);

    document.documentElement.style.setProperty("--ui-scale", s.uiScale);

    updatePreview(s);
  }

  // -----------------------------
  // UPDATE PREVIEW BOX
  // -----------------------------
  function updatePreview(s) {
    if (!preview) return;

    preview.style.borderColor = s.accent;
    preview.style.background = s.background;
    preview.style.color = s.text;
  }

  // -----------------------------
  // SAVE SETTINGS
  // -----------------------------
  function saveSettings() {
    const s = {
      accent: accentInput.value,
      background: bgInput.value,
      text: textInput.value,
      cardStyle: cardStyleSelect.value,
      fontStyle: fontStyleSelect.value,
      uiScale: parseFloat(uiScaleInput.value)
    };

    localStorage.setItem("accent-color", s.accent);
    localStorage.setItem("background-color", s.background);
    localStorage.setItem("text-color", s.text);
    localStorage.setItem("card-style", s.cardStyle);
    localStorage.setItem("font-style", s.fontStyle);
    localStorage.setItem("ui-scale", s.uiScale);

    applySettings(s);
  }

  // -----------------------------
  // RESET SETTINGS
  // -----------------------------
  function resetSettings() {
    Object.keys(DEFAULTS).forEach(key => {
      localStorage.removeItem(key);
    });

    applySettings(DEFAULTS);

    accentInput.value = DEFAULTS.accent;
    bgInput.value = DEFAULTS.background;
    textInput.value = DEFAULTS.text;
    cardStyleSelect.value = DEFAULTS.cardStyle;
    fontStyleSelect.value = DEFAULTS.fontStyle;
    uiScaleInput.value = DEFAULTS.uiScale;
  }

  // -----------------------------
  // LIVE PREVIEW
  // -----------------------------
  function livePreview() {
    const s = {
      accent: accentInput.value,
      background: bgInput.value,
      text: textInput.value,
      cardStyle: cardStyleSelect.value,
      fontStyle: fontStyleSelect.value,
      uiScale: parseFloat(uiScaleInput.value)
    };

    updatePreview(s);
  }

  // -----------------------------
  // INITIALIZE
  // -----------------------------
  const settings = loadSettings();

  accentInput.value = settings.accent;
  bgInput.value = settings.background;
  textInput.value = settings.text;
  cardStyleSelect.value = settings.cardStyle;
  fontStyleSelect.value = settings.fontStyle;
  uiScaleInput.value = settings.uiScale;

  applySettings(settings);

  // -----------------------------
  // EVENT LISTENERS
  // -----------------------------
  accentInput.addEventListener("input", livePreview);
  bgInput.addEventListener("input", livePreview);
  textInput.addEventListener("input", livePreview);
  cardStyleSelect.addEventListener("change", livePreview);
  fontStyleSelect.addEventListener("change", livePreview);
  uiScaleInput.addEventListener("input", livePreview);

  saveBtn.addEventListener("click", saveSettings);
  resetBtn.addEventListener("click", resetSettings);
});
