import nodemailer from "nodemailer";
import dns from "dns";

const transporter = nodemailer.createTransport({
  // smtp.gmail.com වෙනුවට මෙම IP එක කෙලින්ම භාවිතා කරන්න
  host: "142.250.141.108",
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
  connectionTimeout: 20000, // තත්පර 20ක් ඉඩ දෙන්න
});

export default transporter;
