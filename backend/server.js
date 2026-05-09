/* ============================================================
   UNDERHEAT Studio — Full Backend
   Auth + Roles + Feedback + Public Posts + Admin Notes
   Supabase Storage + SQLite + JWT + bcrypt
   ============================================================ */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
app.use(cors());

/* ============================================================
   DATABASE
   ============================================================ */

const db = new sqlite3.Database("./underheat.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_private (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      type TEXT,
      message TEXT,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS public_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      message TEXT,
      image TEXT,
      sensitive INTEGER,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      message TEXT,
      date TEXT
    )
  `);
});

/* ============================================================
   SUPABASE STORAGE
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
   AUTH ROUTES
   ============================================================ */

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ success: false, message: "Missing fields" });

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
    [email, hash, "user"],
    err => {
      if (err) return res.json({ success: false, message: "User exists" });

      const token = jwt.sign(
        { email, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: { email, role: "user" }
      });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (!user) return res.json({ success: false, message: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: "Invalid login" });

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { email: user.email, role: user.role }
    });
  });
});

app.get("/api/auth/session", (req, res) => {
  if (!req.user) return res.json({ success: false });
  res.json({ success: true, user: req.user });
});

/* ============================================================
   PRIVATE FEEDBACK
   ============================================================ */

app.post("/api/feedback/private", (req, res) => {
  const { name, email, type, message } = req.body;

  if (!message)
    return res.json({ success: false, message: "Message required." });

  db.run(
    `INSERT INTO feedback_private (name, email, type, message, date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name || "Anonymous",
      email || "Not provided",
      type || "General",
      message,
      new Date().toISOString()
    ],
    () => res.json({ success: true })
  );
});

/* ============================================================
   PUBLIC POSTS (WITH IMAGE UPLOAD)
   ============================================================ */

async function isBadImage(buffer) {
  return false; // placeholder for your detector
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

    db.run(
      `INSERT INTO public_posts (author, message, image, sensitive, date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        finalAuthor,
        message,
        imageUrl,
        sensitive === "true" ? 1 : 0,
        new Date().toISOString()
      ],
      () => res.json({ success: true })
    );
  } catch (e) {
    res.json({ success: false, message: "Failed to submit post." });
  }
});

app.get("/api/feedback/public", (req, res) => {
  db.all(`SELECT * FROM public_posts ORDER BY id DESC`, (err, rows) => {
    res.json({ success: true, items: rows });
  });
});

app.delete("/api/feedback/public/:id", (req, res) => {
  db.run(`DELETE FROM public_posts WHERE id = ?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

/* ============================================================
   ADMIN NOTES
   ============================================================ */

app.post("/api/feedback/admin", (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "founder"))
    return res.status(403).json({ success: false });

  const { message } = req.body;

  if (!message)
    return res.json({ success: false, message: "Message required." });

  db.run(
    `INSERT INTO admin_posts (author, message, date)
     VALUES (?, ?, ?)`,
    [req.user.email, message, new Date().toISOString()],
    () => res.json({ success: true })
  );
});

app.get("/api/feedback/admin", (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "founder"))
    return res.status(403).json({ success: false });

  db.all(`SELECT * FROM admin_posts ORDER BY id DESC`, (err, rows) => {
    res.json({ success: true, items: rows });
  });
});

/* ============================================================
   START SERVER
   ============================================================ */

app.listen(4000, () => {
  console.log("UNDERHEAT backend running on port 4000");
});
