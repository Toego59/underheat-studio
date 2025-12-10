const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const PORT = process.env.PORT || 3000;

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Failed to load users:', e);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Create default admin user '777' if none exists
function ensureDefaultAdmin() {
  ensureDataDir();
  const users = loadUsers();
  if (!users.find(u => u.username === '777')) {
    const hash = bcrypt.hashSync('777', 10);
    users.push({ username: '777', passwordHash: hash, createdAt: new Date().toISOString(), isAdmin: true });
    saveUsers(users);
    console.log('Created default admin user: 777');
  }
}

ensureDefaultAdmin();

const app = express();
app.use(bodyParser.json());

// Serve static files (the site)
app.use(express.static(path.join(__dirname)));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password required' });
  }
  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ success: false, message: 'username already exists' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { username, passwordHash, createdAt: new Date().toISOString(), isAdmin: username === '777' };
  users.push(user);
  saveUsers(users);
  return res.json({ success: true, username: user.username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password required' });
  }
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ success: false, message: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, message: 'invalid credentials' });
  // simple session token (not secure for production)
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  return res.json({ success: true, username: user.username, isAdmin: !!user.isAdmin, token });
});

app.get('/api/users', (req, res) => {
  // return non-sensitive list (no password hashes)
  const users = loadUsers().map(u => ({ username: u.username, createdAt: u.createdAt, isAdmin: !!u.isAdmin }));
  res.json({ success: true, users });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
