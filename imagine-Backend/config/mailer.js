import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Render සඳහා වඩාත් ගැලපෙන Port එක
  secure: false, // 587 සඳහා මෙය false විය යුතුයි (STARTTLS භාවිතා කරයි)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // මෙතැනට අකුරු 16ක App Password එක තිබිය යුතුයි
  },
  tls: {
    // Cloud Server එකකට Gmail සම්බන්ධ වීමේදී ඇතිවන බාධා ඉවත් කිරීමට මෙය අත්‍යවශ්‍යයි
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
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
