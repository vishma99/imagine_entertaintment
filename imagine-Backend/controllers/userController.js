import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import transporter from "../config/mailer.js";

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
    });

    await newUser.save();

    const mailOptions = {
      from: `"Imagine Entertainment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `<h1>Your OTP is: ${otp}</h1>`,
    };

    // වැදගත්: මෙතැනදී await පාවිච්චි කරන්න එපා.
    // එවිට API එක වහාම response එක ලබා දෙයි. ඊමේල් එක හෙමින් යයි.
    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Email error in background:", err.message);
    });

    res.status(201).json({
      message: "OTP sent! Please check your email (it might take a moment).",
    });
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

      const adminMailOptions = {
        from: `"Imagine System" <${process.env.EMAIL_USER}>`,
        to: adminEmails,
        subject: "New User Approval Required",
        html: `<h2>Approval Required</h2><p>User ${user.name} verified email.</p><a href="${approveLink}">Approve User</a>`,
      };

      // මෙතැනදීත් await ඉවත් කරන්න
      transporter.sendMail(adminMailOptions).catch((err) => {
        console.error("Background Email Error (Admin Notify):", err.message);
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
