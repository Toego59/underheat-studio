// ============================================================
// THEME SYSTEM — UNDERHEAT STUDIO
// Loads theme settings on every page and applies them globally.
// ============================================================

// Apply a CSS variable safely
function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

// Load saved settings from localStorage
function loadThemeSettings() {
  const accent = localStorage.getItem("accentColor");
  const bg = localStorage.getItem("bgStyle");
  const card = localStorage.getItem("cardStyle");
  const font = localStorage.getItem("fontStyle");
  const scale = localStorage.getItem("uiScale");

  if (accent) setVar("--accent-color", accent);
  if (bg) applyBackgroundStyle(bg);
  if (card) applyCardStyle(card);
  if (font) applyFontStyle(font);
  if (scale) setVar("--ui-scale", scale);

  // Apply defaults if nothing saved
  if (!card) document.body.setAttribute("card-style", "glass");
  if (!font) document.body.setAttribute("font-style", "modern");
}

// ============================================================
// BACKGROUND STYLE
// ============================================================

function applyBackgroundStyle(style) {
  if (style === "solid") {
    setVar("--bg-color", "#0d0d0d");
    document.body.style.backgroundImage = "none";
  }

  if (style === "gradient") {
    document.body.style.backgroundImage =
      "linear-gradient(135deg, #0d0d0d, #1a1a1a, #0d0d0d)";
  }

  if (style === "grid") {
    document.body.style.backgroundImage =
      "radial-gradient(#222 1px, transparent 1px)";
    document.body.style.backgroundSize = "20px 20px";
  }
}

// ============================================================
// CARD STYLE
// Maps stored values to body[card-style] attribute for CSS selectors
// ============================================================

function applyCardStyle(style) {
  // Map legacy values to CSS attribute values
  const styleMap = {
    "rounded":  "glass",
    "flat":     "flat",
    "glass":    "glass",
    "neon":     "neon",
    "shadowed": "shadowed"
  };

  const mapped = styleMap[style] || "glass";
  document.body.setAttribute("card-style", mapped);

  if (style === "rounded" || style === "glass") {
    setVar("--panel-bg", "#1a1a1a");
    setVar("--card-radius", "14px");
  }

  if (style === "flat") {
    setVar("--panel-bg", "#111");
    setVar("--card-radius", "0px");
  }
}

// ============================================================
// FONT STYLE
// ============================================================

function applyFontStyle(style) {
  document.body.setAttribute("font-style", style || "modern");

  if (style === "modern") {
    setVar("--font-family", "system-ui, sans-serif");
  }

  if (style === "classic") {
    setVar("--font-family", "'Times New Roman', serif");
  }

  if (style === "mono") {
    setVar("--font-family", "'Fira Code', 'Courier New', monospace");
  }
}

// ============================================================
// THEME PRESETS
// ============================================================

function setThemePreset(preset) {
  if (preset === "default") {
    setVar("--bg-color", "#0d0d0d");
    setVar("--accent-color", "#ff0055");
    localStorage.setItem("accentColor", "#ff0055");
  }

  if (preset === "dark") {
    setVar("--bg-color", "#000");
    setVar("--accent-color", "#4444ff");
    localStorage.setItem("accentColor", "#4444ff");
  }

  if (preset === "neon") {
    setVar("--bg-color", "#000");
    setVar("--accent-color", "#00ffea");
    localStorage.setItem("accentColor", "#00ffea");
  }
}

// ============================================================
// LIVE ACCENT COLOR UPDATES (Settings Page Only)
// ============================================================

function initAccentControls() {
  const picker = document.getElementById("accentPicker");
  const hex = document.getElementById("accentHex");

  if (!picker || !hex) return;

  picker.oninput = (e) => {
    const color = e.target.value;
    setVar("--accent-color", color);
    hex.value = color;
    localStorage.setItem("accentColor", color);
  };

  hex.oninput = (e) => {
    const color = e.target.value;
    if (color.startsWith("#") && color.length === 7) {
      setVar("--accent-color", color);
      picker.value = color;
      localStorage.setItem("accentColor", color);
    }
  };
}

// ============================================================
// UI SCALE (Settings Page Only)
// ============================================================

function initScaleControl() {
  const scale = document.getElementById("uiScale");
  if (!scale) return;

  scale.oninput = (e) => {
    const value = e.target.value;
    setVar("--ui-scale", value);
    localStorage.setItem("uiScale", value);
  };
}

// ============================================================
// BACKGROUND / CARD / FONT SELECTORS (Settings Page Only)
// ============================================================

function initSelectControls() {
  const bg = document.getElementById("bgStyle");
  const card = document.getElementById("cardStyle");
  const font = document.getElementById("fontStyle");

  if (bg) {
    bg.onchange = (e) => {
      localStorage.setItem("bgStyle", e.target.value);
      applyBackgroundStyle(e.target.value);
    };
  }

  if (card) {
    card.onchange = (e) => {
      localStorage.setItem("cardStyle", e.target.value);
      applyCardStyle(e.target.value);
    };
  }

  if (font) {
    font.onchange = (e) => {
      localStorage.setItem("fontStyle", e.target.value);
      applyFontStyle(e.target.value);
    };
  }
}

// ============================================================
// INITIALIZE THEME ON EVERY PAGE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadThemeSettings();
  initAccentControls();
  initScaleControl();
  initSelectControls();
});