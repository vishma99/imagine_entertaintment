import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import SibApiV3Sdk from "sib-api-v3-sdk";

// Brevo API Configuration
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Email යවන පොදු Function එක
const sendBrevoEmail = async (toEmail, subject, htmlContent) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = {
    name: "Imagine Entertainment",
    email: process.env.EMAIL_USER,
  };
  sendSmtpEmail.to = [{ email: toEmail }];

  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

// [REGISTER] - පරිශීලකයාට OTP එක යැවීම
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken: otp,
      isVerified: false,
      isAdminApproved: false, // Schema එකේ default තිබුණත් මෙහෙම දැමීම පැහැදිලියි
    });

    await newUser.save();

    // API හරහා පසුබිමේ Email එක යැවීම
    sendBrevoEmail(
      email,
      "Your OTP Verification Code",
      `<div style="text-align:center;"><h2>Your OTP is:</h2><h1 style="color:blue;">${otp}</h1></div>`,
    ).catch((err) => console.error("Brevo OTP Error:", err.message));

    res.status(201).json({ message: "OTP sent! Please check your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [VERIFY OTP] - OTP තහවුරු කර Adminවරුන්ට දැනුම් දීම
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, verificationToken: otp });

    if (!user) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;

    if (user.role === "Admin") {
      user.isAdminApproved = true;
      user.verificationToken = undefined;
      await user.save();
      return res
        .status(200)
        .json({ message: "Admin account verified successfully!" });
    }

    const approveToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = approveToken;
    await user.save();

    const admins = await User.find({ role: "Admin" });
    const adminEmails = admins.map((admin) => admin.email);

    if (adminEmails.length > 0) {
      const approveLink = `https://imagine-entertaintment.onrender.com/api/user/approve/${approveToken}`;

      // Admin ලාට API හරහා දැනුම් දීම
      adminEmails.forEach((adminEmail) => {
        sendBrevoEmail(
          adminEmail,
          "New User Approval Required",
          `<h2>Approval Required</h2><p>User ${user.name} verified email.</p><a href="${approveLink}">Approve User</a>`,
        ).catch((err) => console.error("Admin Email Error:", err.message));
      });
    }

    res
      .status(200)
      .json({ message: "Email verified! Waiting for Admin approval." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [APPROVE USER] - Admin විසින් Approve කිරීම
export const approveUser = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) return res.status(400).send("<h1>Invalid Link</h1>");

    user.isAdminApproved = true;
    user.verificationToken = undefined;
    await user.save();

    res.send(`<h1>User ${user.name} Approved Successfully!</h1>`);
  } catch (error) {
    res.status(500).send("Error");
  }
};
