/* ============================================================
   CHANGE PASSWORD — Secure Update
   Takes a bcryptjs hash (no plain password needed)
   ============================================================ */

require("dotenv").config();

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

async function changePassword(username, passwordHash) {
  try {
    console.log(`Fetching user: ${username}`);
    const user = await getFromKV(username);

    if (!user) {
      console.error(`User ${username} not found in KV`);
      return false;
    }

    user.passwordHash = passwordHash;

    console.log(`Updating password for ${username}...`);
    const success = await setInKV(username, user);

    if (success) {
      console.log(`✓ Password updated for ${username}`);
      return true;
    } else {
      console.error(`Failed to update password for ${username}`);
      return false;
    }
  } catch (e) {
    console.error("Error:", e);
    return false;
  }
}

// Get args: username passwordHash
const username = process.argv[2];
const passwordHash = process.argv[3];

if (!username || !passwordHash) {
  console.log("Usage: node change-password.js <username> <passwordHash>");
  console.log("");
  console.log("First, hash your password locally:");
  console.log("  node -e \"require('bcryptjs').hash('YOUR_PASSWORD', 10, (err, hash) => console.log(hash))\"");
  console.log("");
  console.log("Then use the hash:");
  console.log("  node change-password.js Toego58 $2a$10$...");
  process.exit(1);
}

changePassword(username, passwordHash).then((success) => {
  process.exit(success ? 0 : 1);
});
