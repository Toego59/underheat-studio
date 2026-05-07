// ============================================================
// UNDERHEAT STUDIO — SETTINGS SYSTEM
// ============================================================

const root = document.documentElement;

// Default fallback values
const DEFAULTS = {
  primary: "#ff5500",
  secondary: "#333333",
  accent: "#ff5500",
  background: "#1a1a1a",
  neon: "#00ffff",
  cardStyle: "glass",
  fontStyle: "modern",
  uiScale: "1"
};

// ============================================================
// LOAD + SAVE SETTINGS
// ============================================================

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem("uh_settings") || "{}");
  return { ...DEFAULTS, ...saved };
}

function saveSettings(settings) {
  localStorage.setItem("uh_settings", JSON.stringify(settings));

  // Sync across tabs/pages
  localStorage.setItem("uh_settings_updated", Date.now().toString());

  applySettings(settings);
}

// ============================================================
// APPLY SETTINGS TO PAGE
// ============================================================

function applySettings(s) {
  // Colors
  root.style.setProperty("--primary-color", s.primary);
  root.style.setProperty("--secondary-color", s.secondary);
  root.style.setProperty("--accent-color", s.accent);
  root.style.setProperty("--background-color", s.background);
  root.style.setProperty("--neon-color", s.neon);

  // UI scale
  root.style.setProperty("--ui-scale", s.uiScale);

  // Card + font styles
  document.body.setAttribute("card-style", s.cardStyle);
  document.body.setAttribute("font-style", s.fontStyle);

  updatePreview();
}

// ============================================================
// PREVIEW BOX
// ============================================================

function updatePreview() {
  const box = document.getElementById("preview-box");
  if (!box) return;

  const panelBg = getComputedStyle(root).getPropertyValue("--panel-bg").trim();
  const accent = getComputedStyle(root).getPropertyValue("--accent-color").trim();

  box.style.background = panelBg;
  box.style.borderColor = accent;
}

// ============================================================
// BIND COLOR PICKERS
// ============================================================

function bindColor(id, key) {
  const el = document.getElementById(id);
  if (!el) return;

  const settings = loadSettings();
  el.value = settings[key];

  el.addEventListener("input", () => {
    const s = loadSettings();
    s[key] = el.value;
    saveSettings(s);
  });
}

bindColor("primary-color", "primary");
bindColor("secondary-color", "secondary");
bindColor("accent-color", "accent");
bindColor("background-color", "background");
bindColor("neon-color", "neon");

// ============================================================
// BIND SELECTS
// ============================================================

function bindSelect(id, key) {
  const el = document.getElementById(id);
  if (!el) return;

  const settings = loadSettings();
  el.value = settings[key];

  el.addEventListener("change", () => {
    const s = loadSettings();
    s[key] = el.value;
    saveSettings(s);
  });
}

bindSelect("card-style", "cardStyle");
bindSelect("font-style", "fontStyle");

// ============================================================
// UI SCALE
// ============================================================

const scaleEl = document.getElementById("ui-scale");
if (scaleEl) {
  const settings = loadSettings();
  scaleEl.value = settings.uiScale;

  scaleEl.addEventListener("input", (e) => {
    const s = loadSettings();
    s.uiScale = e.target.value;
    saveSettings(s);
  });
}

// ============================================================
// PRESETS
// ============================================================

function applyPreset(values) {
  const s = loadSettings();
  Object.assign(s, values);
  saveSettings(s);
}

document.getElementById("preset-default").onclick = () =>
  applyPreset({
    primary: "#ff5500",
    secondary: "#333333",
    accent: "#ff5500",
    background: "#1a1a1a",
    neon: "#00ffff"
  });

document.getElementById("preset-dark").onclick = () =>
  applyPreset({
    primary: "#ffffff",
    secondary: "#0f0f0f",
    accent: "#ff0066",
    background: "#000000",
    neon: "#00ffff"
  });

document.getElementById("preset-green").onclick = () =>
  applyPreset({
    primary: "#00ff88",
    secondary: "#0d1f0d",
    accent: "#00cc66",
    background: "#071407",
    neon: "#00ffaa"
  });

document.getElementById("preset-pink").onclick = () =>
  applyPreset({
    primary: "#ff71ce",
    secondary: "#2d1b3d",
    accent: "#ff4fa3",
    background: "#1a0f2e",
    neon: "#ff99ff"
  });

// ============================================================
// RESET BUTTONS
// ============================================================

document.getElementById("reset-colors").onclick = () => {
  const s = loadSettings();
  s.primary = DEFAULTS.primary;
  s.secondary = DEFAULTS.secondary;
  s.accent = DEFAULTS.accent;
  s.background = DEFAULTS.background;
  s.neon = DEFAULTS.neon;
  saveSettings(s);
};

document.getElementById("reset-all").onclick = () => {
  localStorage.removeItem("uh_settings");
  location.reload();
};

// ============================================================
// SYNC ACROSS TABS
// ============================================================

window.addEventListener("storage", () => {
  if (localStorage.getItem("uh_settings_updated")) {
    applySettings(loadSettings());
  }
});

// ============================================================
// INIT
// ============================================================

applySettings(loadSettings());
