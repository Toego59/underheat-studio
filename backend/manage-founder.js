/* ============================================================
   FOUNDER MANAGEMENT — Local KV Updater
   Upgrades a user to founder role directly in Cloudflare KV
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

async function upgradeToFounder(username) {
  try {
    console.log(`Fetching user: ${username}`);
    const user = await getFromKV(username);

    if (!user) {
      console.error(`User ${username} not found in KV`);
      return false;
    }

    console.log(`Current user data:`, user);

    user.role = "founder";

    console.log(`Upgrading ${username} to founder...`);
    const success = await setInKV(username, user);

    if (success) {
      console.log(`✓ Successfully upgraded ${username} to founder role`);
      return true;
    } else {
      console.error(`Failed to upgrade ${username}`);
      return false;
    }
  } catch (e) {
    console.error("Error:", e);
    return false;
  }
}

// Get username from command line args
const username = process.argv[2];

if (!username) {
  console.log("Usage: node manage-founder.js <username>");
  console.log("Example: node manage-founder.js Toego58");
  process.exit(1);
}

upgradeToFounder(username).then((success) => {
  process.exit(success ? 0 : 1);
});
