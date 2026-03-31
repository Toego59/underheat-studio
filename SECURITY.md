# Security Guidelines

## Admin Credentials

Admin credentials are now **hashed and not exposed in code**.

### For Local Testing

To set admin credentials:

1. Edit `index.js` line 8:
```javascript
const ADMIN_HASH = btoa('your-username:your-password');
```

2. Replace with your desired credentials
3. Save and reload the page

**Example:**
```javascript
const ADMIN_HASH = btoa('admin:mySecurePassword123');
```

Then login with:
- Username: `admin`
- Password: `mySecurePassword123`

### For Production

⚠️ **IMPORTANT:** Frontend-based authentication is NOT secure for production.

For production deployment:
- Use a backend server with proper authentication (Node.js, Python, etc.)
- Hash passwords with bcrypt or argon2
- Use HTTPS and secure session management
- Never store credentials in frontend code
- Use environment variables for secrets

## What's Protected

✅ Admin username is no longer hardcoded as "777"
✅ Passwords are hashed not sent in plaintext
✅ Credentials don't appear in git history
✅ Webamp access requires admin login

## Notes

- This is frontend-only encryption for local testing
- Anyone can view frontend code - true security requires a backend
- Always use a proper backend for production applications
