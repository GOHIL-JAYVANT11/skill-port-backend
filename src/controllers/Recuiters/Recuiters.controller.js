const RecruiterService = require("../../services/Recuiters/Recuiter.service");
const Recruiter = require("../../models/Recuiters/Recuiter");
const CompanyProfile = require("../../models/Recuiters/ComapnyProfile");
const Meeting = require("../../models/Recuiters/Meeting");
const User = require("../../models/User/User");
const NotificationService = require("../../services/User/Notification.service");
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
          recId: recruiter.recId,
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
          recId: recruiter.recId,
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
        socialLinks,
        companyLogo
      } = req.body;

      const updatedCompany = await RecruiterService.updateCompanyProfile(userId, {
        recId: userId,
        companyName,
        designation,
        industry,
        companySize,
        companyWebsite,
        companyLocation,
        companyDescription,
        socialLinks,
        companyLogo
      });

      res.status(200).json({
        success: true,
        message: "Recruiter company details updated successfully",
        data: updatedCompany,
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

      const { recruiter, companyProfile } = await RecruiterService.getRecruiterProfile(userId);

      res.status(200).json({
        success: true,
        message: "Recruiter profile fetched successfully",
        data: {
            ...recruiter.toObject(),
            companyProfile
        },
      });
    } catch (error) {
      console.error("Get Recruiter Profile Error:", error);
      if (error.message === "Recruiter not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async postJob(req, res) {
    try {
      const userId = req.user ? req.user._id : req.body.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID missing" });
      }

      const {
        jobtitle,
        EmploymentType,
        WorkMode,
        Department,
        Industry,
        Openings,
        Deadline,
        Country,
        State,
        City,
        OfficeAddress,
        Salary,
        MinSalary,
        MaxSalary,
        SalaryType,
        Experience,
        Skill,
        Qualification,
        DegreeRequired,
        JobDescription,
        Benefits,
        InterviewMode,
      } = req.body;

      // Handle salary mapping from either top-level or nested object
      let minSal = MinSalary;
      let maxSal = MaxSalary;

      if (Salary && typeof Salary === 'object') {
        minSal = Salary.minSalary || minSal;
        maxSal = Salary.maxSalary || maxSal;
      }

      const jobData = {
        recId: userId,
        jobtitle,
        EmploymentType,
        WorkMode,
        Department,
        Industry,
        Openings,
        Deadline,
        Country,
        State,
        City,
        OfficeAddress,
        Salary: {
            minSalary: minSal,
            maxSalary: maxSal
        },
        SalaryType,
        Experience,
        Skill,
        Qualification,
        DegreeRequired,
        JobDescription,
        Benefits,
        InterviewMode,
      };

      const jobPost = await RecruiterService.createJobPost(jobData);

      // --- AUTOMATIC NOTIFICATIONS FOR MATCHING USERS ---
      (async () => {
        try {
          // 1. Get company name for the notification message
          const companyProfile = await CompanyProfile.findOne({ recId: userId });
          const compName = companyProfile ? companyProfile.companyName : "a company";

          // 2. Find users with matching skills
          const matchingUsers = await User.find({
            skill: { $in: Skill },
            Role: "Job Seeker"
          }).select("_id skill");

          if (matchingUsers.length > 0) {
            const notifications = matchingUsers.map(u => {
              // Simple skill overlap calculation for message
              const matchedSkills = u.skill.filter(s => Skill.includes(s));
              const matchCount = matchedSkills.length;
              const topSkill = matchedSkills[0] || "relevant";
              
              return {
                userId: u._id,
                title: `New job matched your ${topSkill} skills`,
                message: `A ${jobtitle} position at ${compName} in ${City} matches your skills. Apply now to get prioritized.`,
                type: "JOB_MATCH",
                referenceId: jobPost._id,
                actionUrl: `/jobs/${jobPost._id}`,
                metadata: {
                  jobTitle: jobPost.jobtitle,
                  companyName: compName,
                  matchCount
                }
              };
            });

            await NotificationService.createBatchNotifications(notifications);
            console.log(`Sent ${notifications.length} job match notifications for job: ${jobPost._id}`);
          }
        } catch (err) {
          console.error("Failed to send job match notifications:", err.message);
        }
      })();

      res.status(201).json({
        success: true,
        message: "Job posted successfully",
        data: jobPost,
      });
    } catch (error) {
      console.error("Post Job Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async updateRecruiterProfile(req, res) {
    try {
      const userId = req.user ? req.user._id : req.body.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID missing" });
      }

      const {
        // Recruiter Profile fields
        Fullname,
        number,
        email,
        profilePic,
        
        // Company Profile fields
        companyName,
        designation,
        industry,
        companySize,
        companyWebsite,
        companyLocation,
        companyDescription,
        socialLinks,
        companyLogo
      } = req.body;

      // Update Recruiter Profile
      const recruiterData = {};
      if (Fullname !== undefined) recruiterData.Fullname = Fullname;
      if (number !== undefined) recruiterData.number = number;
      if (email !== undefined) recruiterData.email = email;
      if (profilePic !== undefined) recruiterData.profilePic = profilePic;

      const updatedRecruiter = await RecruiterService.updateRecruiter(userId, recruiterData);

      if (!updatedRecruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      // Update Company Profile
      const companyData = {
        recId: userId,
        companyName,
        designation,
        industry,
        companySize,
        companyWebsite,
        companyLocation,
        companyDescription,
        socialLinks,
        companyLogo
      };

      // Filter out undefined fields to avoid overwriting with null/undefined if using a partial update method
      // However, updateCompanyProfile usually handles upsert. 
      // Let's rely on the service to handle it, but typically we want to pass what's provided.
      // Since the request might contain mixed data, we pass all potential company fields.
      
      const updatedCompany = await RecruiterService.updateCompanyProfile(userId, companyData);

      res.status(200).json({
        success: true,
        message: "Recruiter and Company profile updated successfully",
        data: {
          recruiter: updatedRecruiter,
          companyProfile: updatedCompany
        }
      });

    } catch (error) {
      console.error("Update Recruiter Profile Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async getRecruiterJobs(req, res) {
    try {
      const userId = req.user ? req.user._id : req.query.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID missing" });
      }

      const jobs = await RecruiterService.getJobsByRecruiter(userId);

      res.status(200).json({
        success: true,
        message: "Recruiter jobs fetched successfully",
        data: jobs,
      });
    } catch (error) {
      console.error("Get Recruiter Jobs Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async getAllRecruiters(req, res) {
    try {
      // Fetch all recruiters (excluding password)
      const recruiters = await Recruiter.find({}).select("-password").lean();

      // Fetch all company profiles
      const companies = await CompanyProfile.find({}).lean();

      // Merge data: Attach company profile to corresponding recruiter
      const mergedData = recruiters.map(recruiter => {
        const company = companies.find(c => c.recId.toString() === recruiter._id.toString());
        return {
          ...recruiter,
          companyProfile: company || null // Add company profile or null if not found
        };
      });

      return res.status(200).json({
        success: true,
        message: "All recruiters with company profiles fetched successfully",
        data: mergedData
      });
    } catch (error) {
      console.error("Get All Recruiters Error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async getJobApplications(req, res) {
    try {
      const userId = req.user ? req.user._id : req.query.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: Recruiter ID missing" });
      }

      const applications = await RecruiterService.getJobApplicationsByRecruiter(userId);

      res.status(200).json({
        success: true,
        message: "Job applications fetched successfully",
        data: applications,
      });
    } catch (error) {
      console.error("Get Job Applications Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async shortlistApplications(req, res) {
    try {
      const recId = req.user ? req.user._id : req.body?.recId;
      const jobId = req.query?.jobId || req.body?.jobId;

      if (!recId) {
        return res.status(401).json({ message: "Unauthorized: Recruiter ID missing" });
      }

      // If jobId is provided, fetch for that specific job
      if (jobId) {
        const result = await RecruiterService.getShortlistedApplicationsByJob(recId, jobId);
        return res.status(200).json({
          success: true,
          message: "Shortlisted applications fetched successfully",
          jobPost: result.jobPost,
          totalApplications: result.totalApplications,
          shortlistedCount: result.shortlistedCount,
          data: result.shortlistedApplications,
        });
      } 
      
      // If no jobId is provided, fetch ALL jobs with their applications
      const result = await RecruiterService.getAllJobsWithApplications(recId);
      return res.status(200).json({
        success: true,
        message: "All job applications fetched successfully",
        totalJobs: result.length,
        data: result,
      });

    } catch (error) {
      console.error("Shortlist Applications Error:", error);
      if (error.message === "Job Post not found or unauthorized") {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async toggleSavedCandidate(req, res) {
    try {
      const recruiterId = req.user ? req.user._id : req.body.recruiterId;
      const { userId } = req.body;

      if (!recruiterId) return res.status(401).json({ message: "Unauthorized: Recruiter ID missing" });
      if (!userId) return res.status(400).json({ message: "User ID (Candidate) is required" });

      const result = await RecruiterService.toggleSavedCandidate(recruiterId, userId);

      return res.status(200).json({
        success: true,
        message: result.saved ? "Candidate saved successfully" : "Candidate removed from saved list",
        data: result.savedCandidates
      });

    } catch (error) {
      console.error("Toggle Saved Candidate Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async scheduleMeeting(req, res) {
    try {
      const recruiterId = req.user ? req.user._id : req.body.recruiterId;
      const { 
        jobId, 
        candidateId, 
        applicationId, 
        interviewTitle, 
        interviewType, 
        meetingPlatform, 
        meetingLink, 
        interviewDate, 
        interviewTime, 
        duration, 
        notes, 
        status, 
        result 
      } = req.body;

      if (!recruiterId) return res.status(401).json({ message: "Unauthorized: Recruiter ID missing" });
      
      if (!jobId || !candidateId || !interviewDate || !interviewTime) {
        return res.status(400).json({ message: "Missing required meeting fields: jobId, candidateId, interviewDate, interviewTime" });
      }

      // Auto-generate meeting link if not provided or if platform is "SkillPort Meet"
      let finalMeetingLink = meetingLink;
      if (!finalMeetingLink && (!meetingPlatform || meetingPlatform === "SkillPort Meet")) {
        const randomStr = Math.random().toString(36).substring(2, 7); // 5 random chars
        finalMeetingLink = `http://SkillPortMeeting.com/${randomStr}`;
      }

      const meeting = new Meeting({
        jobId,
        recruiterId,
        candidateId,
        applicationId,
        interviewTitle,
        interviewType,
        meetingPlatform: meetingPlatform || "SkillPort Meet",
        meetingLink: finalMeetingLink,
        interviewDate,
        interviewTime,
        duration,
        notes,
        status,
        result
      });

      await meeting.save();

      // --- SEND NOTIFICATION FOR INTERVIEW SCHEDULED ---
      (async () => {
        try {
          const companyProfile = await CompanyProfile.findOne({ recId: recruiterId });
          const compName = companyProfile ? companyProfile.companyName : "a recruiter";
          const jobPost = await mongoose.model("JobPost").findById(jobId);
          const jobTitle = jobPost ? jobPost.jobtitle : "position";
          
          const formattedDate = new Date(interviewDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
          });

          await NotificationService.createNotification({
            userId: candidateId,
            title: "Interview scheduled",
            message: `Your ${interviewType} interview with ${compName} for ${jobTitle} is scheduled for ${formattedDate} at ${interviewTime}. Check your email for details.`,
            type: "INTERVIEW",
            referenceId: meeting._id,
            actionUrl: `/interviews/${meeting._id}`
          });
        } catch (err) {
          console.error("Failed to send interview scheduled notification:", err.message);
        }
      })();

      return res.status(201).json({
        success: true,
        message: "Meeting scheduled successfully",
        data: meeting
      });

    } catch (error) {
      console.error("Schedule Meeting Error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  async getMeetingByRoom(req, res) {
    try {
      const { roomCode } = req.params;

      const meeting = await Meeting.findOne({
        meetingLink: { $regex: roomCode + "$" }
      })
      .populate("recruiterId", "Fullname email profilePic")
      .populate("candidateId", "Fullname email profilePic")
      .populate("jobId", "jobtitle");

      if (!meeting) {
        return res.status(404).json({ success: false, message: "Meeting not found" });
      }

      // Security check: only allow access if req.user._id matches either recruiterId or candidateId
      const userId = req.user._id.toString();
      if (meeting.recruiterId._id.toString() !== userId && meeting.candidateId._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this meeting" });
      }

      return res.status(200).json({ success: true, data: meeting });
    } catch (error) {
      console.error("Get Meeting By Room Error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async completeMeeting(req, res) {
    try {
      const { meetingId } = req.params;
      const { result } = req.body;

      const updatedMeeting = await Meeting.findByIdAndUpdate(
        meetingId,
        {
          status: "Completed",
          ...(result && { result }),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedMeeting) {
        return res.status(404).json({ success: false, message: "Meeting not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Meeting marked as completed",
        data: updatedMeeting
      });
    } catch (error) {
      console.error("Complete Meeting Error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async getRecruiterMeetings(req, res) {
    try {
      const recruiterId = req.user ? req.user._id : req.query.recruiterId;

      if (!recruiterId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const meetings = await Meeting.find({ recruiterId })
        .populate("candidateId", "Fullname email profilePic")
        .populate("jobId", "jobtitle")
        .sort({ interviewDate: -1 });

      return res.status(200).json({
        success: true,
        message: "Recruiter meetings fetched successfully",
        data: meetings
      });
    } catch (error) {
      console.error("Get Recruiter Meetings Error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async updateMeeting(req, res) {
    try {
      const recruiterId = req.user ? req.user._id : req.body.recruiterId;
      const { meetingId } = req.params;
      const updateData = req.body;

      if (!recruiterId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      if (!meetingId) {
        return res.status(400).json({ success: false, message: "Meeting ID is required" });
      }

      // We exclude fields that shouldn't be updated by this API directly (like recruiterId)
      delete updateData.recruiterId;

      const updatedMeeting = await RecruiterService.updateMeeting(meetingId, recruiterId, updateData);

      return res.status(200).json({
        success: true,
        message: "Meeting updated successfully",
        data: updatedMeeting
      });
    } catch (error) {
      console.error("Update Meeting Error:", error);
      if (error.message === "Meeting not found or unauthorized") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async createFreelanceProject(req, res) {
    try {
      const recId = req.user ? req.user._id : req.body.recId;
      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const projectData = { ...req.body, recId };
      const project = await RecruiterService.createFreelanceProject(projectData);

      res.status(201).json({
        success: true,
        message: "Freelance project created successfully",
        data: project
      });
    } catch (error) {
      console.error("Create Freelance Project Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async createFreelancerReview(req, res) {
    try {
      const recruiterId = req.user ? req.user._id : req.body.recruiterId;
      if (!recruiterId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const reviewData = { ...req.body, recruiterId };
      const review = await RecruiterService.createFreelancerReview(reviewData);

      res.status(201).json({
        success: true,
        message: "Freelancer review created successfully",
        data: review
      });
    } catch (error) {
      console.error("Create Freelancer Review Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async createMilestone(req, res) {
    try {
      const milestone = await RecruiterService.createMilestone(req.body);
      res.status(201).json({
        success: true,
        message: "Milestone created successfully",
        data: milestone
      });
    } catch (error) {
      console.error("Create Milestone Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async createProposal(req, res) {
    try {
      const proposal = await RecruiterService.createProposal(req.body);
      res.status(201).json({
        success: true,
        message: "Proposal created successfully",
        data: proposal
      });
    } catch (error) {
      console.error("Create Proposal Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async getRecruiterFreelanceProjects(req, res) {
    try {
      const recId = req.user ? req.user._id : req.query.recId;
      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const projects = await RecruiterService.getRecruiterFreelanceProjects(recId);

      res.status(200).json({
        success: true,
        message: "Recruiter freelance projects fetched successfully",
        data: projects
      });
    } catch (error) {
      console.error("Get Recruiter Freelance Projects Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async getAllFreelanceProjects(req, res) {
    try {
      const projects = await RecruiterService.getAllFreelanceProjects();

      res.status(200).json({
        success: true,
        message: "All open freelance projects fetched successfully",
        data: projects
      });
    } catch (error) {
      console.error("Get All Freelance Projects Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async getFreelanceProposals(req, res) {
    try {
      const recId = req.user ? req.user._id : req.query.recId;
      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const proposals = await RecruiterService.getFreelanceProposals(recId);

      res.status(200).json({
        success: true,
        message: "Freelance proposals fetched successfully",
        data: proposals
      });
    } catch (error) {
      console.error("Get Freelance Proposals Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async updateProposalStatus(req, res) {
    try {
      const recId = req.user ? req.user._id : req.body.recId;
      const { proposalId } = req.params;
      const { status } = req.body;

      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      if (!proposalId || !status) {
        return res.status(400).json({ success: false, message: "Proposal ID and status are required" });
      }

      const updatedProposal = await RecruiterService.updateProposalStatus(proposalId, recId, status);

      // --- SEND NOTIFICATION FOR PROPOSAL STATUS UPDATE ---
      (async () => {
        try {
          const proposal = await updatedProposal.populate("projectId");
          const companyProfile = await CompanyProfile.findOne({ recId: recId });
          const compName = companyProfile ? companyProfile.companyName : "a recruiter";
          
          await NotificationService.createNotification({
            userId: proposal.freelancerId,
            title: `Proposal ${status}`,
            message: `Your proposal for the project "${proposal.projectId.title}" at ${compName} has been ${status}.`,
            type: "APPLICATION", // Freelance proposal is a type of application
            referenceId: proposal._id,
            actionUrl: `/freelance-proposals/${proposal._id}`
          });
        } catch (err) {
          console.error("Failed to send proposal status notification:", err.message);
        }
      })();

      res.status(200).json({
        success: true,
        message: "Proposal status updated successfully",
        data: updatedProposal
      });
    } catch (error) {
      console.error("Update Proposal Status Error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const recId = req.user ? req.user._id : req.body.recId;
      const { applicationId } = req.params;
      const { status } = req.body;

      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      const application = await mongoose.model("ApplyJob").findOne({ _id: applicationId, recId });
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }

      application.status = status;
      await application.save();

      // --- SEND NOTIFICATION FOR APPLICATION STATUS UPDATE (SHORTLISTED/REJECTED/HIRED) ---
      (async () => {
        try {
          const companyProfile = await CompanyProfile.findOne({ recId: recId });
          const compName = companyProfile ? companyProfile.companyName : "a recruiter";
          const jobPost = await mongoose.model("JobPost").findById(application.jobId);
          const jobTitle = jobPost ? jobPost.jobtitle : "position";
          
          let title = `Application ${status}`;
          let message = `Your application for ${jobTitle} at ${compName} has been ${status.toLowerCase()}.`;
          
          if (status === "Shortlisted") {
            title = "Application Shortlisted";
            message = `Congratulations! Your application for ${jobTitle} at ${compName} has been shortlisted for the next round.`;
          } else if (status === "Hired") {
            title = "Congratulations! You are Hired";
            message = `We are pleased to inform you that you have been hired for ${jobTitle} at ${compName}.`;
          }

          await NotificationService.createNotification({
            userId: application.userId,
            title,
            message,
            type: "APPLICATION",
            referenceId: application._id,
            actionUrl: `/my-applications/${application._id}`
          });
        } catch (err) {
          console.error("Failed to send application status notification:", err.message);
        }
      })();

      res.status(200).json({
        success: true,
        message: `Application marked as ${status}`,
        data: application
      });
    } catch (error) {
      console.error("Update Application Status Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  async shortlistFreelanceProposals(req, res) {
    try {
      const recId = req.user ? req.user._id : req.query.recId;
      const { projectId } = req.query;

      if (!recId) {
        return res.status(401).json({ success: false, message: "Unauthorized: Recruiter ID missing" });
      }

      // If projectId is provided, fetch for that specific project
      if (projectId) {
        const result = await RecruiterService.shortlistFreelanceProposals(recId, projectId);
        return res.status(200).json({
          success: true,
          message: "Freelance proposals shortlisted successfully",
          freelanceProject: result.freelanceProject,
          totalProposals: result.totalProposals,
          data: result.proposals
        });
      }

      // If no projectId is provided, fetch ALL projects with their proposals
      const result = await RecruiterService.getAllFreelanceProjectsWithProposals(recId);
      return res.status(200).json({
        success: true,
        message: "All freelance proposals fetched successfully",
        totalProjects: result.length,
        data: result
      });

    } catch (error) {
      console.error("Shortlist Freelance Proposals Error:", error);
      if (error.message === "Freelance Project not found or unauthorized") {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }

  /**
   * Controller to fetch all meetings from the database.
   */
  async getAllMeetings(req, res) {
    try {
      // Ensure models are registered for population
      require('../../models/Recuiters/JobPost');
      require('../../models/User/User');
      require('../../models/Recuiters/Recuiter');

      const meetings = await Meeting.find()
        .populate("jobId", "jobtitle companyName")
        .populate("candidateId", "Fullname email")
        .populate("recruiterId", "Fullname email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "All meetings fetched successfully",
        count: meetings.length,
        data: meetings
      });
    } catch (error) {
      console.error("Get All Meetings Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch meetings",
        error: error.message
      });
    }
  }

  /**
   * Controller to fetch all candidates with a meeting result of "Selected".
   * Calculates commission based on the job's salary.
   */
  async getSelectedCandidates(req, res) {
    try {
      const meetings = await Meeting.find({ result: "Selected" })
        .populate({
          path: 'jobId',
          model: 'JobPost',
          select: 'jobtitle Salary'
        })
        .populate({
          path: 'candidateId',
          model: 'User',
          select: 'Fullname'
        })
        .sort({ createdAt: -1 });

      const responseData = meetings.map(meeting => {
        const job = meeting.jobId;
        const candidate = meeting.candidateId;

        if (!job || !candidate) return null;

        const monthlySalary = (job.Salary.minSalary + job.Salary.maxSalary) / 2;
        const yearlySalary = monthlySalary * 12;
        const commission = yearlySalary * 0.08;

        return {
          candidateName: candidate.Fullname,
          jobTitle: job.jobtitle,
          status: 'PENDING', // Defaulting to PENDING as per the image
          monthlySalary: monthlySalary,
          yearlyTotal: yearlySalary,
          commission: commission,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 12)) // Due date 12 days from now
        };
      }).filter(item => item !== null);

      res.status(200).json({
        success: true,
        message: "Selected candidates fetched successfully",
        count: responseData.length,
        data: responseData
      });
    } catch (error) {
      console.error("Get Selected Candidates Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch selected candidates",
        error: error.message
      });
    }
  }
}

module.exports = new RecruiterController();
