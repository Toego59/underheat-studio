// ============================================================
// GLOBAL THEME LOADER — RUNS ON EVERY PAGE
// ============================================================

(function () {
  const root = document.documentElement;

  // -----------------------------
  // DEFAULT VALUES (if none saved)
  // -----------------------------
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

  // -----------------------------
  // APPLY COLOR VARIABLES
  // -----------------------------
  const colorVars = [
    "--primary-color",
    "--secondary-color",
    "--accent-color",
    "--background-color",
    "--neon-color"
  ];

  colorVars.forEach(v => {
    const saved = localStorage.getItem(v);
    const value = saved || DEFAULTS[v];
    root.style.setProperty(v, value);
  });

  // -----------------------------
  // CARD STYLE (default = glass)
  // -----------------------------
  const savedCard = localStorage.getItem("card-style");
  const cardStyle = savedCard || DEFAULTS["card-style"];
  document.body.setAttribute("card-style", cardStyle);

  // -----------------------------
  // FONT STYLE
  // -----------------------------
  const savedFont = localStorage.getItem("font-style");
  const fontStyle = savedFont || DEFAULTS["font-style"];
  document.body.setAttribute("font-style", fontStyle);

  // -----------------------------
  // UI SCALE
  // -----------------------------
  const savedScale = localStorage.getItem("ui-scale");
  const scale = savedScale || DEFAULTS["ui-scale"];
  root.style.setProperty("--ui-scale", scale);

  // -----------------------------
  // REMOVE BACKGROUND STYLE SYSTEM
  // (You requested background-style removed)
  // -----------------------------
  document.body.removeAttribute("bg-style");
})();
