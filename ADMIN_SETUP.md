# Admin Setup & Cloudflare Deployment

## Quick Start - Local Testing

Run everything locally with one command:

```bash
./test-runtime.sh
```

This starts:
- **Backend** on `http://localhost:4000`
- **Frontend** on `http://localhost:5500`
- **Admin panel** at `http://localhost:5500/admin.html`

Press `Ctrl+C` to stop.

---

## Admin Login (Local Testing)

Once running, visit `http://localhost:5500/admin.html` and use **any credentials** you want — the local backend doesn't validate them. The credentials are only validated by the Cloudflare worker when deployed to production.

---

## Production Setup - Cloudflare Deployment

### 1. Deploy the Worker

```bash
cd underheat-api
npm run deploy
```

This uploads the latest worker code to Cloudflare.

### 2. Set Admin Credentials in Cloudflare

After deployment, go to **Cloudflare Dashboard → Workers** and find your worker.

1. Click your worker name → **Settings** tab
2. Scroll to **Variables and Secrets** section
3. Click **Add variable** and create two **encrypted secrets**:

**Secret 1:**
- Name: `ADMIN_USERNAME`
- Value: Your desired admin username (e.g., `admin`, `stefano`, etc.)

**Secret 2:**
- Name: `ADMIN_PASSWORD`
- Value: A strong password (e.g., `MySecure#Pass123!`)

⚠️ **Store these credentials somewhere safe!** You'll use them to log into the admin panel after deployment.

### 3. Setup KV Namespaces (if not already done)

Your worker needs two KV namespaces for storage:

1. `USERS` — stores user accounts
2. `UNDERHEAT_KV` — stores verification codes and rate-limit data

Go to **Cloudflare Dashboard → KV Namespaces** and create these if they don't exist.

Then, bind them to your worker:
1. Go to **Settings → Bindings**
2. Add two KV namespace bindings:
   - Variable name: `USERS` → Select namespace: `USERS`
   - Variable name: `UNDERHEAT_KV` → Select namespace: `UNDERHEAT_KV`

### 4. (Optional) Setup Resend Email API

If you want email verification to actually send emails:

1. Get your Resend API key from https://resend.com
2. Add it as an encrypted secret in Cloudflare:
   - Name: `RESEND_API_KEY`
   - Value: Your key (starts with `re_`)

### 5. (Optional) Setup Custom Domain

When your `.eu.org` domain is approved:

1. Add an encrypted secret:
   - Name: `VERIFIED_DOMAIN`
   - Value: Your domain (e.g., `underheatstudio.eu.org`)

This makes email come from your domain instead of `onboarding@resend.dev`.

---

## Troubleshooting

### Admin login says "Unauthorized"

- **Local testing?** Any credentials work locally.
- **Production?** Double-check your `ADMIN_USERNAME` and `ADMIN_PASSWORD` secrets in Cloudflare. They must match exactly what you type in the login form.

### Endpoints return 404

- Make sure the worker is deployed: `cd underheat-api && npm run deploy`
- Check the worker logs in Cloudflare Dashboard → Workers → Tail

### Rate limiting blocks requests

- Wait 60 seconds — the system allows max 5 requests per IP per minute.

---

## Files Updated

- **underheat-api/src/index.js** — Full Cloudflare worker implementation
- **frontend/admin.js** — Fixed API URL detection (localhost vs production)
- **test-runtime.sh** — New bash script to run everything locally
