/* ============================================================
   UNDERHEAT Studio — Cloudflare KV Auth Backend
   Username + SHA-256 Hash + JWT + Cloudflare KV
   ============================================================ */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
app.use(cors());

/* ============================================================
   CLOUDFLARE KV SETUP
   ============================================================ */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

async function getFromKV(key) {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    });

    if (!res.ok) {
      console.warn(`KV GET failed: ${key} - Status ${res.status}`);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("KV GET error:", key, e.message);
    return null;
  }
}

async function setInKV(key, value) {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
      },
      body: JSON.stringify(value)
    });
    if (!res.ok) {
      console.warn(`KV SET failed: ${key} - Status ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("KV SET error:", key, e.message);
    return false;
  }
}

/* ============================================================
   SUPABASE STORAGE (for image uploads)
   ============================================================ */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET;

/* ============================================================
   MULTER (IMAGE UPLOAD)
   ============================================================ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 7.5 * 1024 * 1024 }
});

/* ============================================================
   AUTH MIDDLEWARE
   ============================================================ */

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

app.use(authMiddleware);

/* ============================================================
   HELPER: Password Hashing (bcryptjs - secure)
   ============================================================ */

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/* ============================================================
   AUTH ROUTES
   ============================================================ */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required" });

    // Check if user exists
    const existing = await getFromKV(username);
    if (existing)
      return res.status(400).json({ success: false, message: "User already exists" });

    // Store new user with role "user" by default
    const passwordHash = await hashPassword(password);
    const newUser = {
      username,
      passwordHash,
      role: "user"
    };

    const stored = await setInKV(username, newUser);
    if (!stored)
      return res.status(500).json({ success: false, message: "Failed to store user — KV API error" });

    const token = jwt.sign(
      { username, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { username, role: "user" }
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required" });

    const user = await getFromKV(username);
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid username or password" });

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch)
      return res.status(401).json({ success: false, message: "Invalid username or password" });

    // Support both old (isAdmin) and new (role) formats
    const role = user.role || (user.isAdmin ? "founder" : "user");
    const token = jwt.sign(
      { username, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { username, role }
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/auth/session", (req, res) => {
  if (!req.user) return res.json({ success: false });
  res.json({ success: true, user: req.user });
});

/* ============================================================
   ADMIN SETUP — DISABLED (Founder access managed via KV only)
   ============================================================ */

app.post("/api/auth/setup", (req, res) => {
  // Setup endpoint is disabled — founder accounts are managed directly in Cloudflare KV
  res.status(403).json({ success: false, message: "Setup endpoint disabled" });
});

/* ============================================================
   PRIVATE FEEDBACK
   ============================================================ */

app.post("/api/feedback/private", (req, res) => {
  const { name, email, type, message } = req.body;

  if (!message)
    return res.json({ success: false, message: "Message required." });

  // TODO: Store in Cloudflare KV or database
  res.json({ success: true });
});

/* ============================================================
   PUBLIC POSTS (WITH IMAGE UPLOAD)
   ============================================================ */

async function isBadImage(buffer) {
  return false;
}

app.post("/api/feedback/public", upload.single("image"), async (req, res) => {
  try {
    const { author, message, sensitive } = req.body;

    if (!message)
      return res.json({ success: false, message: "Message required." });

    let finalAuthor =
      sensitive === "true" ? "Anonymous" : author || "Anonymous";

    let imageUrl = null;

    if (req.file) {
      const { buffer, mimetype, originalname } = req.file;

      const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowed.includes(mimetype))
        return res.json({ success: false, message: "Unsupported image type." });

      const bad = await isBadImage(buffer);
      if (bad)
        return res.json({
          success: false,
          message: "Image rejected: unsafe content detected."
        });

      const ext = originalname.split(".").pop();
      const fileName = `post-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, { contentType: mimetype });

      if (error)
        return res.json({ success: false, message: "Upload failed." });

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
    }

    // TODO: Store post in KV
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: "Failed to submit post." });
  }
});

app.get("/api/feedback/public", (req, res) => {
  // TODO: Fetch posts from KV
  res.json({ success: true, items: [] });
});

app.delete("/api/feedback/public/:id", (req, res) => {
  // TODO: Delete from KV
  res.json({ success: true });
});

/* ============================================================
   ADMIN NOTES
   ============================================================ */

app.post("/api/feedback/admin", (req, res) => {
  if (!req.user || req.user.role !== "founder")
    return res.status(403).json({ success: false });

  const { message } = req.body;

  if (!message)
    return res.json({ success: false, message: "Message required." });

  // TODO: Store admin note in KV
  res.json({ success: true });
});

app.get("/api/feedback/admin", (req, res) => {
  if (!req.user || req.user.role !== "founder")
    return res.status(403).json({ success: false });

  // TODO: Fetch admin notes from KV
  res.json({ success: true, items: [] });
});

/* ============================================================
   START SERVER
   ============================================================ */

app.listen(4000, () => {
  console.log("UNDERHEAT backend running on port 4000 (Cloudflare KV mode)");
});
