import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// මෙය අනිවාර්යයි!
export default transporter;
