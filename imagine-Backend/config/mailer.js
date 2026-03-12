import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER, // vishmagunawardhana99@gmail.com
    pass: process.env.BREVO_API_KEY, // Brevo SMTP Standard Key
  },
});

export const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"Imagine Entertainment" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };
  return transporter.sendMail(mailOptions);
};

export default transporter;
