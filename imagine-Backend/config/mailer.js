import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER, // ඔයා Brevo හදන්න පාවිච්චි කරපු Email එක
    pass: process.env.BREVO_API_KEY, // අර අලුතින් ගත්ත API Key එක
  },
});

export default transporter;
