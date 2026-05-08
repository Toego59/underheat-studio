// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// -------------------------
// SQLite setup
// -------------------------
const db = new sqlite3.Database("./users.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('founder','admin','user'))
    )
  `);
});

// -------------------------
// Resend setup (email codes)
// -------------------------
const resend = new Resend(process.env.RESEND_API_KEY);
const codes = {}; // in-memory email verification codes

// -------------------------
// Helpers
// -------------------------
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}

// -------------------------
// EMAIL VERIFICATION
// -------------------------
app.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 10 * 60 * 1000;
  codes[email] = { code, expires };

  try {
    await resend.emails.send({
      from: "UNDERHEAT <noreply@underheat.dev>",
      to: email,
      subject: "UNDERHEAT Studio — Verification Code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code required" });
  }

  const entry = codes[email];
  if (!entry) return res.status(400).json({ success: false, message: "No code for this email" });

  if (Date.now() > entry.expires) {
    delete codes[email];
    return res.status(400).json({ success: false, message: "Code expired" });
  }

  if (entry.code !== code) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  delete codes[email];
  res.json({ success: true });
});

// -------------------------
// AUTH: register / login / session
// -------------------------

// Register: first user becomes founder, others = user
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const password_hash = await bcrypt.hash(password, 10);

  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }

    const isFirstUser = row.count === 0;
    const role = isFirstUser ? "founder" : "user";

    db.run(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, password_hash, role],
      function (err2) {
        if (err2) {
          if (err2.code === "SQLITE_CONSTRAINT") {
            return res.status(400).json({ success: false, message: "Email already registered" });
          }
          console.error("DB insert error:", err2);
          return res.status(500).json({ success: false, message: "DB error" });
        }

        const user = { id: this.lastID, email, role };
        const token = signToken(user);
        res.json({ success: true, user, token });
      }
    );
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const safeUser = { id: user.id, email: user.email, role: user.role };
    const token = signToken(safeUser);
    res.json({ success: true, user: safeUser, token });
  });
});

// Session (who am I?)
app.get("/api/auth/session", authRequired, (req, res) => {
  db.get("SELECT id, email, role FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  });
});

// "Logout" is client-side with JWT; endpoint just exists for symmetry
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

// -------------------------
// ADMIN ROUTES (roles)
// -------------------------

// List users (founder or admin)
app.get("/api/admin/users", authRequired, requireRole("founder", "admin"), (req, res) => {
  db.all("SELECT id, email, role FROM users ORDER BY id ASC", (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }
    res.json({ success: true, users: rows });
  });
});

// Change user role
// Rules:
// - founder can change anyone (except cannot demote self from founder via this route)
// - admin can change only users (not admins or founder)
app.post("/api/admin/users/:id/role", authRequired, requireRole("founder", "admin"), (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  db.get("SELECT id, email, role FROM users WHERE id = ?", [targetId], (err, target) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const actor = req.user;

    // Admin cannot modify admins or founder
    if (actor.role === "admin") {
      if (target.role === "admin" || target.role === "founder") {
        return res.status(403).json({ success: false, message: "Admins cannot modify admins or founder" });
      }
    }

    // Founder cannot demote self from founder via this route
    if (actor.role === "founder" && actor.id === target.id && role !== "founder") {
      return res.status(400).json({ success: false, message: "Use a dedicated flow to change founder role" });
    }

    db.run("UPDATE users SET role = ? WHERE id = ?", [role, targetId], function (err2) {
      if (err2) {
        console.error("DB update error:", err2);
        return res.status(500).json({ success: false, message: "DB error" });
      }
      res.json({ success: true });
    });
  });
});

// -------------------------
// START SERVER
// -------------------------
app.listen(PORT, () => {
  console.log(`Auth + email server running at http://localhost:${PORT}`);
});
