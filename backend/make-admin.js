const sqlite3 = require('sqlite3').verbose();

if (!process.argv[2]) {
  console.log("Usage: node make-admin.js <username>");
  process.exit(1);
}

const username = process.argv[2];
const dbPath = __dirname + "/data/users.db";

const db = new sqlite3.Database(dbPath);

db.run(
  "UPDATE users SET isAdmin = 1 WHERE username = ?",
  [username],
  function (err) {
    if (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }

    if (this.changes === 0) {
      console.log(`No user found with username '${username}'.`);
    } else {
      console.log(`User '${username}' is now an admin.`);
    }

    db.close();
  }
);
