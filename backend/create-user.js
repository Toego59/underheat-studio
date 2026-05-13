/* ============================================================
   CREATE USER — Direct KV User Creation
   ============================================================ */

require("dotenv").config();
const bcrypt = require("bcryptjs");

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

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

async function createUser(username, password, role = "user") {
  try {
    console.log(`Creating user: ${username} with role: ${role}`);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      username,
      passwordHash,
      role
    };

    const success = await setInKV(username, user);

    if (success) {
      console.log(`✓ Successfully created ${username} with role "${role}"`);
      return true;
    } else {
      console.error(`Failed to create ${username}`);
      return false;
    }
  } catch (e) {
    console.error("Error:", e);
    return false;
  }
}

// Get args: username password [role]
const username = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || "user";

if (!username || !password) {
  console.log("Usage: node create-user.js <username> <password> [role]");
  console.log("Example: node create-user.js Toego58 mypassword user");
  console.log("Example: node create-user.js Toego58 mypassword founder");
  process.exit(1);
}

createUser(username, password, role).then((success) => {
  process.exit(success ? 0 : 1);
});
