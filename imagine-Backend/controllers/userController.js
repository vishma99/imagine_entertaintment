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
      isVerified: false, // OTP තහවුරු වන තෙක් false
      isAdminApproved: false, // Admin Approve කරන තෙක් false
    });

    await newUser.save();

    const mailOptions = {
      from: `"Imagine Entertainment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code - Imagine Entertainment",
      html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; text-align: center;">
          <h2>Account Verification</h2>
          <p>Hi ${name}, thank you for registering with Imagine Entertainment.</p>
          <p>Your OTP verification code is:</p>
          <h1 style="color: #1a73e8; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire shortly. Do not share this code with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "OTP sent to your email." });
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

    user.isVerified = true; // Email එක තහවුරුයි

    // වැදගත්: පරිශීලකයා Admin කෙනෙක් නම් කෙලින්ම Approve වේ.
    // නැතිනම් Admin Approval අවශ්‍යයි.
    if (user.role === "Admin") {
      user.isAdminApproved = true;
      user.verificationToken = undefined;
      await user.save();
      return res
        .status(200)
        .json({ message: "Admin account verified successfully!" });
    }

    // Admin නොවන අයට Approval Token එකක් සෑදීම
    const approveToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = approveToken;
    await user.save();

    // පද්ධතියේ සිටින සියලුම Adminවරුන්ගේ Email ලබා ගැනීම
    const admins = await User.find({ role: "Admin" });
    const adminEmails = admins.map((admin) => admin.email);

    if (adminEmails.length > 0) {
      const approveLink = `http://localhost:5001/api/user/approve/${approveToken}`;

      const adminMailOptions = {
        from: `"Imagine System" <${process.env.EMAIL_USER}>`,
        to: adminEmails, // සියලුම Adminවරුන්ට යැවීම
        subject: "New User Approval Required",
        html: `<h2>Approval Required</h2>
               <p>User <b>${user.name}</b> (${user.role}) has verified their email.</p>
               <p>Click below to approve this registration:</p>
               <a href="${approveLink}" style="padding:10px; background:green; color:white; text-decoration:none;">Approve User</a>`,
      };
      await transporter.sendMail(adminMailOptions);
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
