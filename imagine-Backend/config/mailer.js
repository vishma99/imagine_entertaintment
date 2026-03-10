import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns"; // dns module එක import කරන්න

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // IPv4 පමණක් භාවිතා කිරීමට බල කිරීම (IPv6 මඟ හැරීමට)
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false,
  },
});

// Mailer එක වැඩ කරනවාද කියා පරීක්ෂා කර බැලීම
transporter.verify((error, success) => {
  if (error) {
    console.log("Mailer Connection Error: ", error);
  } else {
    console.log("Mail Server is ready to take our messages");
  }
});

export default transporter;
