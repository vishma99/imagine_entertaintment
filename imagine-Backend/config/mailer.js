import nodemailer from "nodemailer";
import dns from "dns";

// IPv4 වලට ප්‍රමුඛතාවය ලබා දීම (Render සඳහා වැදගත්)
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // මෙන්න මේ සැකසුම් ටික අනිවාර්යයෙන් ඇතුළත තිබිය යුතුයි
  connectionTimeout: 20000,
  greetingTimeout: 15000,
  socketTimeout: 25000,
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
