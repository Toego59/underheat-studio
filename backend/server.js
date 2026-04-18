// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

// --- DB SETUP ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DB_PATH = path.join(DATA_DIR, 'users.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0
    )
  `);

  const defaultAdminUser = process.env.ADMIN_USER || 'admin';
  const defaultAdminPass = process.env.ADMIN_PASS || 'admin123';

  db.get('SELECT * FROM users WHERE username = ?', [defaultAdminUser], async (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
      return;
    }
    if (!row) {
      const hash = await bcrypt.hash(defaultAdminPass, 10);
      db.run(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)',
        [defaultAdminUser, hash, 1],
        (err2) => {
          if (err2) console.error('Error seeding admin user:', err2);
          else console.log(`Seeded admin user: ${defaultAdminUser}/${defaultAdminPass}`);
        }
      );
    }
  });
});

// --- MIDDLEWARE ---
app.use(express.json());

// --- API ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)',
      [username, hash, 0],
      (err) => {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ success: false, message: 'Username already exists' });
          }
          console.error(err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        return res.json({ success: true, message: 'Registered successfully' });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      username: user.username,
      isAdmin: !!user.is_admin
    });
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UNDERHEAT Studio server running on http://localhost:${PORT}`);
});
