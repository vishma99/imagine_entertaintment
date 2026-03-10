import nodemailer from "nodemailer";
import dns from "dns";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Render වලදී IPv6 ප්‍රශ්නය මඟහරවා ගැනීමට මෙය අත්‍යවශ්‍යයි
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  tls: {
    rejectUnauthorized: false,
  },
});
