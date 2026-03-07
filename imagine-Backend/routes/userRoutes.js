import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import transporter from "../config/mailer.js";
import crypto from "crypto";
import {
  registerUser,
  verifyOTP,
  approveUser,
} from "../controllers/userController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.get("/approve/:token", approveUser);

const JWT_SECRET = "YOUR_SECRET_KEY";

// --- MIDDLEWARE SECTION ---

// 1. පරිශීලකයා ලොග් වී ඇත්දැයි Token එක හරහා පරීක්ෂා කිරීම
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// 2. අදාළ Role එක තිබේදැයි පරීක්ෂා කිරීම
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access denied. ${req.user.role} role not allowed.` });
    }
    next();
  };
};

// --- ROUTES SECTION ---

// [LOGIN]

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. පරිශීලකයා සිටිනවාදැයි බැලීම
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid Email or Password" });

    // 2. Password එක නිවැරදිදැයි බැලීම
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Email or Password" });

    // --- මෙන්න මෙතැනට අලුත් පරීක්ෂාවන් ඇතුළත් කරන්න ---

    // 3. Email එක (OTP හරහා) Verify කර ඇත්දැයි බැලීම
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email with the OTP first.",
      });
    }

    // 4. Admin විසින් Approve කර ඇත්දැයි බැලීම
    if (!user.isAdminApproved) {
      return res.status(401).json({
        message:
          "Your account is pending Admin approval. Please wait for an email.",
      });
    }

    // --------------------------------------------------

    // සියල්ල හරි නම් Token එක සාදා යැවීම
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET ALL USERS] - Admin ට පමණි
router.get(
  "/all-users",
  verifyToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const users = await User.find({}, "-password");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// [DELETE USER] - Admin ට පමණි
router.delete(
  "/delete-user/:id",
  verifyToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.id === userId) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own admin account!" });
      }

      await User.findByIdAndDelete(userId);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // 1. පරිශීලකයා සිටිනවාදැයි පරීක්ෂා කරන්න
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    // 2. 6-digit OTP එකක් සාදාගන්න
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. මෙම OTP එක පරිශීලකයාගේ Record එකේ තාවකාලිකව Save කරන්න
    // සටහන: ඔබේ User Model එකේ 'resetOTP' සහ 'resetOTPExpires' තිබිය යුතුයි
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 600000; // විනාඩි 10 කින් අහෝසි වේ
    await user.save();

    const mailOptions = {
      from: `"Imagine Entertainment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset OTP - Imagine Entertainment",
      html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; text-align: center;">
          <h2>Password Reset</h2>
          <p>Hi ${user.name}, you have requested to reset your password.</p>
          <p>Your OTP for password reset is:</p>
          <h1 style="color: #1a73e8; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire shortly. Do not share this code with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Forgot Password Error:", error); // Error එක console එකේ බලන්න
    res
      .status(500)
      .json({ message: "Error sending email", error: error.message });
  }
});
router.post("/verify-otpForgot", async (req, res) => {
  const { email, otp } = req.body;
  console.log("--- OTP Verification Start ---");
  console.log("Email from Frontend:", email);
  console.log("OTP from Frontend:", otp);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found in DB!");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("OTP in DB:", user.resetOTP);
    console.log("Expiry in DB:", user.resetOTPExpires);
    console.log("Current Time:", new Date());

    // OTP එක සහ කාලය පරීක්ෂා කිරීම
    // String බවට සහතික කර ගැනීමට .toString() භාවිතා කරමු
    if (user.resetOTP?.toString() !== otp?.toString()) {
      console.log("Mismatch: DB OTP and Sent OTP are different!");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOTPExpires < Date.now()) {
      console.log("OTP has expired!");
      return res.status(400).json({ message: "Expired OTP" });
    }

    // සාර්ථක නම්...
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    console.log("OTP Verified Successfully!");
    res.status(200).json({ message: "OTP Verified Successfully!" });
  } catch (error) {
    console.error("Internal Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// [RESET PASSWORD - UPDATE PASSWORD IN DB]
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // 1. පරිශීලකයා සිටිනවාදැයි බැලීම
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. අලුත් Password එක Hash කිරීම (bcryptjs භාවිතා කර)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Database එකේ Password එක යාවත්කාලීන කර OTP දත්ත ඉවත් කිරීම
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
