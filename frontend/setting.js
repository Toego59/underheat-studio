const root = document.documentElement;

// ============================================================
// APPLY SAVED SETTINGS
// ============================================================

function applySaved() {
  const vars = [
    "--primary-color",
    "--secondary-color",
    "--accent-color",
    "--background-color",
    "--neon-color"
  ];

  vars.forEach(v => {
    const val = localStorage.getItem(v);
    if (val) root.style.setProperty(v, val);
  });

  // CARD STYLE (default = glass)
  const savedCard = localStorage.getItem("card-style");
  const cardStyle = savedCard || "glass";
  document.body.setAttribute("card-style", cardStyle);

  // FONT STYLE
  const savedFont = localStorage.getItem("font-style");
  const fontStyle = savedFont || "modern";
  document.body.setAttribute("font-style", fontStyle);

  // UI SCALE
  const savedScale = localStorage.getItem("ui-scale");
  const scale = savedScale || "1";
  root.style.setProperty("--ui-scale", scale);

  updatePreview();
}

// ============================================================
// LIVE PREVIEW BOX
// ============================================================

function updatePreview() {
  const box = document.getElementById("preview-box");
  if (!box) return;

  const cardBg = getComputedStyle(root).getPropertyValue("--card-bg");
  const accent = getComputedStyle(root).getPropertyValue("--accent-color");

  box.style.background = cardBg;
  box.style.borderColor = accent;
}

// ============================================================
// COLOR BINDING
// ============================================================

function bindColor(id, variable) {
  const el = document.getElementById(id);
  el.value =
    localStorage.getItem(variable) ||
    getComputedStyle(root).getPropertyValue(variable).trim();

  el.addEventListener("input", () => {
    root.style.setProperty(variable, el.value);
    localStorage.setItem(variable, el.value);
    updatePreview();
  });
}

bindColor("primary-color", "--primary-color");
bindColor("secondary-color", "--secondary-color");
bindColor("accent-color", "--accent-color");
bindColor("background-color", "--background-color");
bindColor("neon-color", "--neon-color");

// ============================================================
// SELECT BINDING
// ============================================================

function bindSelect(id, attr, storageKey, defaultValue) {
  const el = document.getElementById(id);
  const saved = localStorage.getItem(storageKey);

  el.value = saved || defaultValue;

  el.addEventListener("change", () => {
    document.body.setAttribute(attr, el.value);
    localStorage.setItem(storageKey, el.value);
    updatePreview();
  });
}

bindSelect("card-style", "card-style", "card-style", "glass");
bindSelect("font-style", "font-style", "font-style", "modern");

// UI SCALE
document.getElementById("ui-scale").addEventListener("change", e => {
  root.style.setProperty("--ui-scale", e.target.value);
  localStorage.setItem("ui-scale", e.target.value);
});

// ============================================================
// PRESETS
// ============================================================

document.getElementById("preset-default").onclick = () => {
  localStorage.setItem("--primary-color", "#ff5500");
  localStorage.setItem("--secondary-color", "#333333");
  localStorage.setItem("--accent-color", "#ff5500");
  localStorage.setItem("--background-color", "#1a1a1a");
  localStorage.setItem("--neon-color", "#00ffff");
  applySaved();
};

document.getElementById("preset-dark").onclick = () => {
  localStorage.setItem("--primary-color", "#ffffff");
  localStorage.setItem("--secondary-color", "#0f0f0f");
  localStorage.setItem("--accent-color", "#ff0066");
  localStorage.setItem("--background-color", "#000000");
  localStorage.setItem("--neon-color", "#00ffff");
  applySaved();
};

document.getElementById("preset-green").onclick = () => {
  localStorage.setItem("--primary-color", "#00ff88");
  localStorage.setItem("--secondary-color", "#0d1f0d");
  localStorage.setItem("--accent-color", "#00cc66");
  localStorage.setItem("--background-color", "#071407");
  localStorage.setItem("--neon-color", "#00ffaa");
  applySaved();
};

document.getElementById("preset-pink").onclick = () => {
  localStorage.setItem("--primary-color", "#ff71ce");
  localStorage.setItem("--secondary-color", "#2d1b3d");
  localStorage.setItem("--accent-color", "#ff4fa3");
  localStorage.setItem("--background-color", "#1a0f2e");
  localStorage.setItem("--neon-color", "#ff99ff");
  applySaved();
};

// ============================================================
// RESET BUTTONS
// ============================================================

document.getElementById("reset-colors").onclick = () => {
  ["--primary-color","--secondary-color","--accent-color","--background-color","--neon-color"]
    .forEach(v => localStorage.removeItem(v));
  applySaved();
};

document.getElementById("reset-all").onclick = () => {
  localStorage.clear();
  location.reload();
};

// ============================================================
// INIT
// ============================================================

applySaved();
