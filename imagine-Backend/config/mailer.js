import nodemailer from "nodemailer";
import dns from "dns";

// IPv4 පමණක් භාවිතා කිරීමට බල කිරීම
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  service: "gmail", // කෙලින්ම service එක gmail ලෙස දෙන්න
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// සම්බන්ධතාවය පරීක්ෂා කිරීම
transporter.verify((error, success) => {
  if (error) {
    console.log("Gmail Connection Error: ", error.message);
  } else {
    console.log("Gmail is ready to send OTPs!");
  }
});

export default transporter;
