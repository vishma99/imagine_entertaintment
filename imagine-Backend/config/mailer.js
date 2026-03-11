import nodemailer from "nodemailer";
import dns from "dns";

// IPv4 වලට ප්‍රමුඛතාවය දීම
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS සඳහා false විය යුතුයි
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // මෙන්න මේ Timeout අගයන් ටික අනිවාර්යයෙන්ම එක් කරන්න
  connectionTimeout: 40000, // තත්පර 40ක් දක්වා වැඩි කළා
  greetingTimeout: 30000,
  socketTimeout: 45000,
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
});

// verify කොටස ඉවත් කරන්න - එය Render එකේදී ගැටලු ඇති කරයි

export default transporter;
