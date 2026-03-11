import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../config/mailer.js";

// [REGISTER]
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
      isAdminApproved: false,
    });
    await newUser.save();

    // API හරහා ඊමේල් යැවීම
    const html = `<div style="text-align:center;"><h2>OTP Code</h2><h1 style="color:blue;">${otp}</h1></div>`;
    sendEmail(email, "Your OTP Verification Code", html).catch((err) =>
      console.error("Brevo Error:", err.message),
    );

    res.status(201).json({ message: "OTP sent! Please check your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [VERIFY OTP]
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
    if (admins.length > 0) {
      const approveLink = `https://imagine-entertaintment.onrender.com/api/user/approve/${approveToken}`;
      admins.forEach((admin) => {
        sendEmail(
          admin.email,
          "New User Approval Required",
          `<a href="${approveLink}">Approve User ${user.name}</a>`,
        );
      });
    }
    res
      .status(200)
      .json({ message: "Email verified! Waiting for Admin approval." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [APPROVE USER]
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
