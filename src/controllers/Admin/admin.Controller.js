const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const Admin = require('../../models/Admin/Admin');
const { getOtpTemplate } = require('../../utils/emailTemplate');


// SMTP Transporter
async function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

if (!global.__ADMIN_OTPS__) global.__ADMIN_OTPS__ = new Map();

class AdminController {

  // ================= REGISTER =================
  async register(req, res) {
    try {
      const { Firstname, Lastname, email, number, password, roles } = req.body;

      const existingAdmin = await Admin.findOne({ number });
      if (existingAdmin)
        return res.status(400).json({ message: "Admin already exists" });

      if (!password) return res.status(400).json({ message: "Password required" });
      if (!roles) return res.status(400).json({ message: "Role required" });

      const hashedPassword = await bcrypt.hash(password, 12);

      const admin = new Admin({
        Firstname,
        Lastname,
        email,
        number,
        password: hashedPassword,
        roles: Array.isArray(roles) ? roles : [roles]
      });

      await admin.save();

      return res.status(201).json({
        message: "Admin registered successfully",
        admin
      });

    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // ================= LOGIN + SEND OTP =================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "Email & password required" });

      const admin = await Admin.findOne({ email });
      if (!admin)
        return res.status(401).json({ message: "Invalid email or password" });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      // Generate JWT Token
      const token = jwt.sign(
        { _id: admin._id, roles: admin.roles },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: "24h" }
      );

      // Generate OTP (Optional: keep it if you still want to send it, but login is now direct)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      global.__ADMIN_OTPS__.set(String(admin._id), { otp, expiresAt });

      // Send OTP Email in BACKGROUND (Optional)
      (async () => {
        try {
          const transporter = await getMailTransporter();
          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to: admin.email,
            subject: "Your Login OTP",
            html: getOtpTemplate(otp),
          });
          console.log("OTP sent to:", admin.email);
        } catch (err) {
          console.error("OTP send failed:", err.message);
        }
      })();

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        admin: {
          _id: admin._id,
          Firstname: admin.Firstname,
          Lastname: admin.Lastname,
          email: admin.email,
          roles: admin.roles
        }
      });

    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // ================= VERIFY OTP =================
  async verifyLoginOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp)
        return res.status(400).json({ message: "Email & OTP required" });

      const admin = await Admin.findOne({ email });
      if (!admin)
        return res.status(404).json({ message: "Admin not found" });

      const record = global.__ADMIN_OTPS__.get(String(admin._id));
      if (!record)
        return res.status(400).json({ message: "OTP not requested" });

      if (Date.now() > record.expiresAt)
        return res.status(400).json({ message: "OTP expired" });

      if (record.otp !== otp)
        return res.status(400).json({ message: "Invalid OTP" });

      global.__ADMIN_OTPS__.delete(String(admin._id));

      const token = jwt.sign(
        { _id: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        admin
      });

    } catch (error) {
      return res.status(500).json({ message: "Failed to verify OTP", error: error.message });
    }
  }
}

module.exports = new AdminController();
