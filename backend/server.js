// backend/server.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// DB path and open
const dbPath = path.join(dataDir, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite DB at', dbPath);
  }
});

// Initialize users table if missing
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      isAdmin INTEGER DEFAULT 0
    )`,
    (err) => {
      if (err) console.error('Failed to create users table', err);
    }
  );
});

// Health route
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, hashed, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'User exists' });
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ ok: true, id: this.lastID });
  });
  stmt.finalize();
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  db.get('SELECT id, username, password, isAdmin FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const match = bcrypt.compareSync(password, row.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Minimal session token placeholder (replace with real auth if needed)
    res.json({ ok: true, user: { id: row.id, username: row.username, isAdmin: !!row.isAdmin } });
  });
});

// Example admin toggle route (adjust to your app)
app.post('/api/admin/toggle', (req, res) => {
  const { username, makeAdmin } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });

  db.run('UPDATE users SET isAdmin = ? WHERE username = ?', [makeAdmin ? 1 : 0, username], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  });
});

// Use environment port or default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
