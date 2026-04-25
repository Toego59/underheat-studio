// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory verification code store
const codes = {};

// --------------------------------------------------
// SEND VERIFICATION CODE (Resend API)
// --------------------------------------------------
app.post("/send-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email required" });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 10 * 60 * 1000;

  codes[email] = { code, expires };

  try {
    await resend.emails.send({
      from: "UNDERHEAT <noreply@underheat.dev>",
      to: email,
      subject: "UNDERHEAT Studio — Verification Code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// --------------------------------------------------
// VERIFY CODE
// --------------------------------------------------
app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code required" });
  }

  const entry = codes[email];
  if (!entry) {
    return res.status(400).json({ success: false, message: "No code found for this email" });
  }

  if (Date.now() > entry.expires) {
    delete codes[email];
    return res.status(400).json({ success: false, message: "Code expired" });
  }

  if (entry.code !== code) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  delete codes[email];
  res.json({ success: true });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`Email verification server running at http://localhost:${PORT}`);
});
