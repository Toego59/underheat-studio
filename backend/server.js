// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// In-memory store for verification codes
// Structure: { email: { code, expires } }
const codes = {};

// ---------------------------------------------
// EMAIL TRANSPORT (REAL EMAIL SENDING)
// ---------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // e.g. smtp.gmail.com
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ---------------------------------------------
// SEND VERIFICATION CODE
// ---------------------------------------------
app.post("/send-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email required" });
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  codes[email] = { code, expires };

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to: email,
      subject: "UNDERHEAT Studio — Verification Code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// ---------------------------------------------
// VERIFY CODE
// ---------------------------------------------
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

  // Valid code — remove it
  delete codes[email];

  // We do NOT store email or message — privacy by design
  res.json({ success: true });
});

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
app.listen(PORT, () => {
  console.log(`Email verification server running at http://localhost:${PORT}`);
});
