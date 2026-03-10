import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // මෙන්න මේ කොටස අලුතින් එක් කරන්න
  connectionTimeout: 10000, // තත්පර 10කින් නතර කරන්න
  greetingTimeout: 10000,
  socketTimeout: 15000,
  dnsLookup: (hostname, options, callback) => {
    // IPv4 (Family 4) පමණක් භාවිතා කිරීමට බල කිරීම
    const dns = require("dns");
    dns.lookup(hostname, { family: 4 }, callback);
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Mailer එක වැඩ කරනවාද කියා පරීක්ෂා කර බැලීම (Debug)
transporter.verify((error, success) => {
  if (error) {
    console.log("Mailer Connection Error: ", error);
  } else {
    console.log("Mail Server is ready to take our messages");
  }
});

export default transporter;
