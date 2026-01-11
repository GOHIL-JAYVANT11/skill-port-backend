const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const User = require('../models/User');
const Education = require('../models/Education');
const { getOtpTemplate } = require('../utils/emailTemplate');

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

if (!global.__USER_OTPS__) global.__USER_OTPS__ = new Map();

class UserController {
    async register(req, res) {
        try {
            const { Fullname, number, email, password, Role } = req.body;

            const existingUser = await User.findOne({ $or: [{ email }, { number }] });
            if (existingUser) {
                return res.status(400).json({ message: "User with this email or number already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // ✅ ONLY ROLE CHANGE
            const newUser = new User({
                Fullname,
                number,
                email,
                password: hashedPassword,
                Role: Array.isArray(Role) ? Role : [Role]
            });

            await newUser.save();

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            global.__USER_OTPS__.set(String(newUser._id), { otp, expiresAt });

            (async () => {
                try {
                    const transporter = await getMailTransporter();
                    await transporter.sendMail({
                        from: process.env.MAIL_FROM || process.env.SMTP_USER,
                        to: newUser.email,
                        subject: "Your Registration OTP",
                        html: getOtpTemplate(otp),
                    });
                } catch (err) {
                    console.error("OTP send failed:", err.message);
                }
            })();

            res.status(201).json({
                success: true,
                message: "User registered successfully. OTP sent to email. Verify to continue.",
                email: newUser.email,
                userId: newUser._id
            });

        } catch (error) {
            console.error("Register Error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // ================= VERIFY OTP =================
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp)
                return res.status(400).json({ message: "Email & OTP required" });

            const user = await User.findOne({ email });
            if (!user)
                return res.status(404).json({ message: "User not found" });

            const record = global.__USER_OTPS__.get(String(user._id));
            if (!record)
                return res.status(400).json({ message: "OTP not requested or expired" });

            if (Date.now() > record.expiresAt) {
                global.__USER_OTPS__.delete(String(user._id));
                return res.status(400).json({ message: "OTP expired" });
            }

            if (record.otp !== otp)
                return res.status(400).json({ message: "Invalid OTP" });

            // OTP Verified - Clear from memory
            global.__USER_OTPS__.delete(String(user._id));

            // Generate Token
            const token = jwt.sign(
                { _id: user._id, role: user.Role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: "24h" }
            );

            // Optional: Mark user as verified if you had that field (but we removed it from schema)
            // await User.findByIdAndUpdate(user._id, { isVerified: true });

            return res.status(200).json({
                success: true,
                message: "OTP Verified Successfully",
                token,
                user: {
                    _id: user._id,
                    Fullname: user.Fullname,
                    email: user.email,
                    Role: user.Role
                }
            });

        } catch (error) {
            console.error("Verify OTP Error:", error);
            return res.status(500).json({ message: "Failed to verify OTP", error: error.message });
        }
    }

    // ================= RESEND OTP =================
    async resendOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email)
                return res.status(400).json({ message: "Email is required" });

            const user = await User.findOne({ email });
            if (!user)
                return res.status(404).json({ message: "User not found" });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
            global.__USER_OTPS__.set(String(user._id), { otp, expiresAt });

            (async () => {
                try {
                    const transporter = await getMailTransporter();
                    await transporter.sendMail({
                        from: process.env.MAIL_FROM || process.env.SMTP_USER,
                        to: user.email,
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
                email: user.email
            });

        } catch (error) {
            console.error("Resend OTP Error:", error);
            return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
        }
    }

    // ================= ADD EDUCATION =================
    async addEducation(req, res) {
        try {
            // Check if user is authenticated via middleware (req.user) or passed in body
            const userId = req.user ? req.user._id : req.body.userId;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: User ID missing" });
            }

            const {
                highestQualification,
                course,
                courseType,
                specialization,
                universityInstitute,
                startingYear,
                passingYear,
                gradingSystem,
                cgpa,
                cgpaOutOf,
                keySkills,
                isCurrentlyPursuing,
                isPrimary
            } = req.body;

            // Handle isPrimary logic: if this is primary, set others for this user to false
            if (isPrimary) {
                
                await Education.updateMany({ userId }, { isPrimary: false });
            }

            const education = new Education({
                userId,
                highestQualification,
                course,
                courseType,
                specialization,
                universityInstitute,
                startingYear,
                passingYear,
                gradingSystem,
                cgpa,
                cgpaOutOf,
                keySkills,
                isCurrentlyPursuing,
                isPrimary
            });

            await education.save();

            res.status(201).json({
                success: true,
                message: "Education details added successfully",
                data: education
            });

        } catch (error) {
            console.error("Add Education Error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
}

module.exports = new UserController();
