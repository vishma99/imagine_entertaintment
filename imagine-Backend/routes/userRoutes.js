import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  registerUser,
  verifyOTP,
  approveUser,
} from "../controllers/userController.js";
import { sendEmail } from "../config/mailer.js";

const router = express.Router();
const JWT_SECRET = "YOUR_SECRET_KEY"; // මෙය ඔබේ .env එකේ ඇති අගයට සමාන විය යුතුයි

// --- MIDDLEWARE SECTION ---

// Token එක පරීක්ෂා කිරීම
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Role එක පරීක්ෂා කිරීම
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Role not allowed." });
    }
    next();
  };
};

// --- ROUTES SECTION ---

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.get("/approve/:token", approveUser);

// [LOGIN]
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }
    if (!user.isVerified)
      return res.status(401).json({ message: "Verify OTP first." });
    if (!user.isAdminApproved)
      return res.status(401).json({ message: "Wait for Admin approval." });

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

// [FORGOT PASSWORD]
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 600000; // විනාඩි 10 කින් අහෝසි වේ
    await user.save();

    await sendEmail(email, "Password Reset OTP", `<h2>Your OTP: ${otp}</h2>`);
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [VERIFY FORGOT OTP]
router.post("/verify-otpForgot", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (
      !user ||
      user.resetOTP?.toString() !== otp?.toString() ||
      user.resetOTPExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();
    res.status(200).json({ message: "OTP Verified Successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [RESET PASSWORD]
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [ADMIN ONLY ROUTES]
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

router.delete(
  "/delete-user/:id",
  verifyToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      if (req.user.id === req.params.id)
        return res.status(400).json({ message: "Cannot delete yourself!" });
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
