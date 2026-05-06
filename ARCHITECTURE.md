# UNDERHEAT Studio Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│  (Firefox / Chrome / Safari / etc)                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Static HTML)                       │
│  Files: index.html, admin.html, settings.html, etc          │
│  Served on: http://localhost:5500/                          │
│  Served by: frontend/proxy-simple.js (Node.js)              │
└─────────────────────────────────────────────────────────────┘
         ↓ (API calls to /api/*)        ↓ (static files)
         ↓                               ↓
    ROUTES /api/*                     (serves directly)
         ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Express.js)                          │
│  Port: http://localhost:4000                                │
│  File: backend/server.js                                    │
│  Purpose:                                                    │
│  - Email verification (Resend API integration)               │
│  - Receives verification code submissions                    │
│  - Not used for admin auth (that's Cloudflare)              │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  - Resend (email sending)                                   │
│  - Cloudflare Workers (production auth)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Local vs Production

### Local Testing (Localhost)

```
Browser → Frontend (5500)
         ↓
         └→ Backend (4000) — IN-MEMORY email codes, NO admin auth
         └→ Cloudflare Worker — NOT used locally
```

**Key point:** Admin login works with ANY credentials locally. The backend server doesn't validate them.

### Production (After Cloudflare Deployment)

```
Browser → Cloudflare Edge (your-worker.workers.dev)
         ↓
         Admin API endpoints (/api/admin/*)
         ├→ /admin/list      (list all users)
         ├→ /admin/delete    (remove users)
         ├→ /admin/setpass   (update passwords)
         |
         Email endpoints (/api/send-code, /api/verify-code)
         ├→ Resend API (sends emails)
         └→ UNDERHEAT_KV (stores codes + rate limits)
```

**Key point:** Admin login validated against `ADMIN_USERNAME` + `ADMIN_PASSWORD` secrets set in Cloudflare dashboard.

---

## File Structure

```
/workspaces/underheat-studio/
│
├── frontend/                     # Static HTML + client JS
│   ├── index.html               # Main page
│   ├── admin.html               # Admin panel
│   ├── admin.js                 # Admin logic
│   ├── index.js                 # Main page logic
│   ├── proxy-simple.js          # Dev server (starts on 5500)
│   ├── theme.js                 # Theme manager
│   ├── settings.html            # Settings page
│   └── style.css                # Styles
│
├── backend/                      # Express.js backend
│   ├── server.js                # Main server (starts on 4000)
│   ├── .env                     # Environment vars (PORT, RESEND_API_KEY)
│   └── package.json             # Dependencies
│
├── underheat-api/               # Cloudflare Worker
│   ├── src/
│   │   └── index.js             # Worker code (handles admin auth, email)
│   ├── wrangler.jsonc           # Cloudflare config
│   └── package.json             # Dependencies
│
├── test-runtime.sh              # NEW: Run everything locally
├── ADMIN_SETUP.md               # NEW: Admin setup instructions
└── ARCHITECTURE.md              # This file
```

---

## How Admin Login Works

### Local (Testing)

1. User clicks login on `admin.html`
2. Client code (`admin.js`) collects username + password
3. Stores in `adminCreds` variable (NO server validation)
4. Shows admin tools immediately
5. When user clicks "List Users", sends creds to backend API

### Production (After Deploy)

1. User clicks login on `admin.html`
2. Client code (`admin.js`) sends username + password to Cloudflare worker
3. Worker compares against `ADMIN_USERNAME` + `ADMIN_PASSWORD` secrets
4. If match → worker responds with user list/status
5. If mismatch → worker responds with 403 Unauthorized

---

## Important: Backend vs Cloudflare

| Feature | Backend (4000) | Cloudflare Worker |
|---------|---|---|
| Admin auth | ❌ NO | ✅ YES |
| Email sending | ✅ YES (Resend) | ✅ YES (Resend) |
| User management | ✅ YES | ✅ YES |
| Rate limiting | ❌ NO | ✅ YES |
| KV storage | ❌ NO | ✅ YES |
| Production use | ❌ NO | ✅ YES |

**The frontend always prefers Cloudflare in production.** The backend server exists mainly for development and email testing.

---

## Running Locally

```bash
./test-runtime.sh
```

This script:
1. Installs npm dependencies (if needed)
2. Starts backend on port 4000
3. Starts frontend on port 5500
4. Logs output to `/tmp/backend.log` and `/tmp/frontend.log`

---

## Deploying to Production

```bash
# Deploy the Cloudflare worker
cd underheat-api
npm run deploy

# Then set admin secrets in Cloudflare dashboard
# (see ADMIN_SETUP.md for details)
```

After deployment, the frontend will automatically use the Cloudflare worker instead of localhost when accessed from your public domain.
