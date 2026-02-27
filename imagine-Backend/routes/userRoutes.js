import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = "YOUR_SECRET_KEY"; // මෙය ඔබ කැමති ආරක්ෂිත වචනයකට වෙනස් කරන්න

// --- MIDDLEWARE SECTION ---

// 1. පරිශීලකයා ලොග් වී ඇත්දැයි Token එක හරහා පරීක්ෂා කිරීම
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

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

// [REGISTER]
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [LOGIN]
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid Email or Password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Email or Password" });

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

export default router;
