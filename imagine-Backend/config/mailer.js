import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "74.125.142.108", // smtp.gmail.com වෙනුවට කෙලින්ම IP එක (IPv4)
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
});

// Mailer එක වැඩ කරනවාද කියා Logs වල බලන්න
transporter.verify((error, success) => {
  if (error) {
    console.log("CRITICAL: Mailer connection failed!", error.message);
  } else {
    console.log("SUCCESS: Mail Server is now CONNECTED!");
  }
});

export default transporter;
