const RecruiterService = require("../../services/Recuiters/Recuiter.service");
const Recruiter = require("../../models/Recuiters/Recuiter");
const User = require("../../models/User/User");
const { getOtpTemplate } = require("../../utils/emailTemplate");
const nodemailer = require("nodemailer");
const axios = require("axios");
const jwt = require("jsonwebtoken");

if (!global.__RECRUITER_OTPS__) global.__RECRUITER_OTPS__ = new Map();

async function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

class RecruiterController {
  async register(req, res) {
    try {
      const { Fullname, number, email, password } = req.body;

      if (!email || !password || !number) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Check if email already exists in User model
      const userExists = await User.findOne({ 
        $or: [{ email }, { number }]
      });
      if (userExists) {
        return res.status(400).json({ message: "This email or number is already registered as a User." });
      }

      const existingRecruiter = await RecruiterService.findByEmail(email);
      if (existingRecruiter) {
        return res.status(400).json({ message: "Recruiter already exists" });
      }

      const recruiter = await RecruiterService.createRecruiter({
        Fullname,
        number,
        email,
        password,
      });

      // Send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.__RECRUITER_OTPS__.set(String(recruiter._id), { otp, expiresAt });

      (async () => {
        try {
          const transporter = await getMailTransporter();
          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to: recruiter.email,
            subject: "Recruiter Registration OTP",
            html: getOtpTemplate(otp),
          });
        } catch (err) {
          console.error("OTP send failed:", err.message);
        }
      })();

      res.status(201).json({
        success: true,
        message: "Recruiter registered. OTP sent to email.",
        email: recruiter.email,
        userId: recruiter._id,
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const recruiter = await RecruiterService.findByEmail(email);
      if (!recruiter) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await RecruiterService.verifyPassword(recruiter, password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.__RECRUITER_OTPS__.set(String(recruiter._id), { otp, expiresAt });

      (async () => {
        try {
          const transporter = await getMailTransporter();
          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to: recruiter.email,
            subject: "Recruiter Login OTP",
            html: getOtpTemplate(otp),
          });
        } catch (err) {
          console.error("OTP send failed:", err.message);
        }
      })();

      const token = RecruiterService.generateToken(recruiter);

      res.status(200).json({
        success: true,
        message: "OTP sent to email.",
        token,
        email: recruiter.email,
        userId: recruiter._id,
        Role: recruiter.Role,
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ message: "Email & OTP required" });
      }

      const recruiter = await RecruiterService.findByEmail(email);
      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const record = global.__RECRUITER_OTPS__.get(String(recruiter._id));
      if (!record) {
        return res.status(400).json({ message: "OTP not requested or expired" });
      }

      if (Date.now() > record.expiresAt) {
        global.__RECRUITER_OTPS__.delete(String(recruiter._id));
        return res.status(400).json({ message: "OTP expired" });
      }

      if (record.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      global.__RECRUITER_OTPS__.delete(String(recruiter._id));

      recruiter.isVerified = true;
      await recruiter.save();

      const token = RecruiterService.generateToken(recruiter);

      res.status(200).json({
        success: true,
        message: "OTP Verified Successfully",
        token,
        user: {
          _id: recruiter._id,
          Fullname: recruiter.Fullname,
          email: recruiter.email,
          Role: recruiter.Role,
          recruiterId: recruiter.recruiterId,
        },
      });
    } catch (error) {
      console.error("Verify OTP Error:", error);
      res.status(500).json({ message: "Failed to verify OTP", error: error.message });
    }
  }

  async resendOtp(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const recruiter = await RecruiterService.findByEmail(email);
      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      global.__RECRUITER_OTPS__.set(String(recruiter._id), { otp, expiresAt });

      (async () => {
        try {
          const transporter = await getMailTransporter();
          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to: recruiter.email,
            subject: "Your New OTP",
            html: getOtpTemplate(otp),
          });
        } catch (err) {
          console.error("OTP send failed:", err.message);
        }
      })();

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        email: recruiter.email,
      });
    } catch (error) {
      console.error("Resend OTP Error:", error);
      return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
    }
  }

  async googleLogin(req, res) {
    try {
      const access_token = req.body.access_token || req.body.token;

      if (!access_token) {
        return res.status(400).json({ message: "Google access token is required" });
      }

      const googleRes = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const { email, name, picture } = googleRes.data;

      // Check if email already exists in User model
      const user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "This email is already registered as a User. Please login as a User." });
      }

      let recruiter = await Recruiter.findOne({ email });

      if (!recruiter) {
        recruiter = await Recruiter.create({
          Fullname: name,
          email,
          profilePic: picture,
          isGoogleUser: true,
          Role: ["Recruiter"],
          isVerified: true,
        });
      } else {
        recruiter.profilePic = picture;
        recruiter.isGoogleUser = true;
        recruiter.isVerified = true;
        await recruiter.save();
      }

      const token = RecruiterService.generateToken(recruiter);

      res.status(200).json({
        success: true,
        message: "Google login successful",
        token,
        user: {
          _id: recruiter._id,
          Fullname: recruiter.Fullname,
          email: recruiter.email,
          Role: recruiter.Role,
          profilePic: recruiter.profilePic,
          recruiterId: recruiter.recruiterId,
        },
      });
    } catch (error) {
      console.error("Google login failed:", error.message);
      res.status(500).json({ message: "Google login failed", error: error.message });
    }
  }

  async addRecruiterDetails(req, res) {
    try {
      const userId = req.user ? req.user._id : req.body.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID missing" });
      }

      const {
        companyName,
        designation,
        industry,
        companySize,
        companyWebsite,
        companyLocation,
        companyDescription,
      } = req.body;

      const updatedRecruiter = await RecruiterService.updateRecruiter(userId, {
        companyName,
        designation,
        industry,
        companySize,
        companyWebsite,
        companyLocation,
        companyDescription,
      });

      if (!updatedRecruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      res.status(200).json({
        success: true,
        message: "Recruiter details added successfully",
        data: updatedRecruiter,
      });
    } catch (error) {
      console.error("Add Recruiter Details Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user ? req.user._id : req.query.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID missing" });
      }

      const recruiter = await RecruiterService.getRecruiterProfile(userId);

      res.status(200).json({
        success: true,
        message: "Recruiter profile fetched successfully",
        data: recruiter,
      });
    } catch (error) {
      console.error("Get Recruiter Profile Error:", error);
      if (error.message === "Recruiter not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
}

module.exports = new RecruiterController();
