const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const axios = require("axios");
const User = require('../../models/User/User');
const Education = require('../../models/User/Education');
const UserService = require('../../services/User/User.service');
const { getOtpTemplate } = require('../../utils/emailTemplate');

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

            let user = await User.findOne({ email });

            if (user) {
                // If the user exists and is a Google user who hasn't completed their profile
                if (user.isGoogleUser && (!user.password || !user.number || !user.Role || user.Role.length === 0)) {
                    
                    const hashedPassword = await bcrypt.hash(password, 10);
                    
                    user.Fullname = Fullname || user.Fullname;
                    user.number = number;
                    user.password = hashedPassword;
                    user.Role = Array.isArray(Role) ? Role : [Role];
                    
                    await user.save();

                    // Send OTP for verification after completing profile
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    const expiresAt = Date.now() + 10 * 60 * 1000;
                    global.__USER_OTPS__.set(String(user._id), { otp, expiresAt });

                    (async () => {
                        try {
                            const transporter = await getMailTransporter();
                            await transporter.sendMail({
                                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                                to: user.email,
                                subject: "Complete Your Registration - OTP",
                                html: getOtpTemplate(otp),
                            });
                        } catch (err) {
                            console.error("OTP send failed:", err.message);
                        }
                    })();

                    return res.status(200).json({
                        success: true,
                        message: "Google profile updated with additional details. OTP sent for verification.",
                        email: user.email,
                        userId: user._id
                    });
                }

                // If it's a regular user or a Google user who already completed their profile
                return res.status(400).json({ message: "User with this email already exists" });
            }

            // Check if number is already taken by someone else
            const existingNumber = await User.findOne({ number });
            if (existingNumber) {
                return res.status(400).json({ message: "User with this number already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new regular user
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

    // ================= LOGIN =================
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid email " });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid  password" });
            }

            // Check if education details are filled
            const education = await Education.findOne({ userId: user._id });
            if (!education) {
                return res.status(403).json({
                    success: false,
                    message: "pls fillup your education details",
                    userId: user._id
                });
            }

            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            global.__USER_OTPS__.set(String(user._id), { otp, expiresAt });

            (async () => {
                try {
                    const transporter = await getMailTransporter();
                    await transporter.sendMail({
                        from: process.env.MAIL_FROM || process.env.SMTP_USER,
                        to: user.email,
                        subject: "Your Login OTP",
                        html: getOtpTemplate(otp),
                    });
                } catch (err) {
                    console.error("OTP send failed:", err.message);
                }
            })();

            res.status(200).json({
                success: true,
                message: "Login successful. OTP sent to email. Verify to continue.",
                email: user.email,
                userId: user._id
            });

        } catch (error) {
            console.error("Login Error:", error);
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

    // ================= GOOGLE LOGIN =================
    async googleLogin(req, res) {
    try {

        // console.log("====== GOOGLE LOGIN HIT ======");
        // console.log("Request body:", req.body);

        const access_token = req.body.access_token || req.body.token;

        // console.log("Access token received:", access_token);

        if (!access_token) {
            // console.log("❌ access_token missing");
            return res.status(400).json({ message: "Google access token is required" });
        }

        // 🔹 Fetch Google user data
        const googleRes = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        // console.log("Google response data:", googleRes.data);

        const { email, name, picture } = googleRes.data;

        // console.log("Email:", email);
        // console.log("Name:", name);

        let user = await User.findOne({ email });

        if (!user) {
            // console.log("🟢 New user creating");

            user = await User.create({
                Fullname: name,
                email,
                profilePic: picture,
                isGoogleUser: true,
            });

        } else {
            // console.log("🟡 Existing user found");

            user.profilePic = picture;
            user.isGoogleUser = true;
            await user.save();
        }

        // console.log("User after DB:", user);

        const token = jwt.sign(
            { _id: user._id, role: user.Role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: "7d" }
        );

        // console.log("JWT created");

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token,
            user: {
                _id: user._id,
                Fullname: user.Fullname,
                email: user.email,
                Role: user.Role,
                profilePic: user.profilePic
            }
        });

    } catch (error) {
        console.error("🔥 Google login failed FULL ERROR:");
        console.error(error);
        console.error("Google error data:", error.response?.data);

        res.status(500).json({
            message: "Google login failed",
            error: error.message
        });
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
                medium,
                cgpaOutOf,
                keySkills,
                percentage,
                isCurrentlyPursuing,
                isPrimary
            } = req.body;

            // Check if education details already exist for this user
            const existingEducation = await Education.findOne({ userId });

            if (existingEducation) {
                // Update existing education details
                if (isPrimary) {
                    await Education.updateMany({ userId, _id: { $ne: existingEducation._id } }, { isPrimary: false });
                }

                const updatedEducation = await Education.findByIdAndUpdate(
                    existingEducation._id,
                    {
                        highestQualification,
                        course,
                        courseType,
                        specialization,
                        universityInstitute,
                        startingYear,
                        passingYear,
                        gradingSystem,
                        cgpa,
                        medium,
                        cgpaOutOf,
                        keySkills,
                        percentage,
                        isCurrentlyPursuing,
                        isPrimary
                    },
                    { new: true }
                );

                return res.status(200).json({
                    success: true,
                    message: "Education details updated successfully",
                    data: updatedEducation
                });
            }

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
                medium,
                cgpaOutOf,
                keySkills,
                percentage,
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

    // ================= GET PROFILE =================
    async getProfile(req, res) {
        try {
            const userId = req.user ? req.user._id : req.query.userId;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: User ID missing" });
            }

            const profileData = await UserService.getUserProfile(userId);

            return res.status(200).json({
                success: true,
                message: "Profile data fetched successfully",
                data: profileData
            });

        } catch (error) {
            console.error("Get Profile Error:", error);
            if (error.message === "User not found") {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    // ================= UPDATE PROFILE =================
    async updateProfile(req, res) {
        try {
            const userId = req.user ? req.user._id : req.body.userId;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: User ID missing" });
            }

            const {
                resume,
                location,
                userstatus,
                email,
                number,
                userimage,
                Fullname,
                resumeHeadline,
                skill,
                education,
                SocialLinks,
                projects,
                certifications
            } = req.body;

            const updateData = {};
            
            // Handle file upload for resume
            if (req.files && req.files.resume) {
                updateData.resume = `/uploads/resumes/${req.files.resume[0].filename}`;
            } else if (resume !== undefined) {
                updateData.resume = resume;
            }

            if (location !== undefined) updateData.location = location;
            if (userstatus !== undefined) updateData.userstatus = userstatus;
            if (email !== undefined) updateData.email = email;
            if (number !== undefined) updateData.number = number;
            if (userimage !== undefined) updateData.userimage = userimage;
            if (Fullname !== undefined) updateData.Fullname = Fullname;
            if (resumeHeadline !== undefined) updateData.resumeHeadline = resumeHeadline;
            if (skill !== undefined) updateData.skill = skill;
            if (SocialLinks !== undefined) updateData.SocialLinks = SocialLinks;

            if (education !== undefined) {
                const list = Array.isArray(education) ? education : [education];
                await UserService.upsertEducations(userId, list);
            }

            if (projects !== undefined) {
                const list = Array.isArray(projects) ? projects : [projects];
                await UserService.upsertProjects(userId, list);
            }

            if (certifications !== undefined) {
                let list = Array.isArray(certifications) ? certifications : [certifications];
                
                // Parse strings if they are sent as JSON strings from frontend
                list = list.map(c => typeof c === 'string' ? JSON.parse(c) : c);

                // Map uploaded certification files
                if (req.files && req.files.certificationFiles) {
                    req.files.certificationFiles.forEach((file, index) => {
                        if (list[index]) {
                            list[index].certificationURL = `/uploads/resumes/${file.filename}`;
                        }
                    });
                }
                
                await UserService.upsertCertifications(userId, list);
            }

            const updatedUser = await UserService.updateProfile(userId, updateData);

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedUser
            });

        } catch (error) {
            console.error("Update Profile Error:", error);
            if (error.message === "Email already in use by another account" || 
                error.message === "Number already in use by another account" || 
                error.message === "User not found") {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }

    async deleteData(req, res) {
        try {
            const userId = req.user._id;
            const { educationIds, projectIds, certificationIds } = req.body;

            if (!educationIds && !projectIds && !certificationIds) {
                return res.status(400).json({ message: "No education, project or certification IDs provided for deletion" });
            }

            const results = await UserService.deleteData(userId, { educationIds, projectIds, certificationIds });

            return res.status(200).json({
                success: true,
                message: "Data deleted successfully",
                data: results
            });
        } catch (error) {
            console.error("Delete Data Error:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
}

module.exports = new UserController();
