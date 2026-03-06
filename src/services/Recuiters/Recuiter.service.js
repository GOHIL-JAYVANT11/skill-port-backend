const Recruiter = require("../../models/Recuiters/Recuiter");
const JobPost = require("../../models/Recuiters/JobPost");
const CompanyProfile = require("../../models/Recuiters/ComapnyProfile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

class RecruiterService {
  async findByEmail(email) {
    return await Recruiter.findOne({ email });
  }

  async findByNumber(number) {
    return await Recruiter.findOne({ number });
  }

  async createRecruiter(data) {
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const recruiter = new Recruiter({
      ...rest,
      password: hashedPassword,
      Role: ["Recruiter"],
    });
    return await recruiter.save();
  }

  async updateRecruiter(id, data) {
    return await Recruiter.findByIdAndUpdate(id, data, { new: true });
  }

  async updateCompanyProfile(recId, data) {
    return await CompanyProfile.findOneAndUpdate({ recId }, data, { new: true, upsert: true });
  }

  async getRecruiterProfile(id) {
    const recruiter = await Recruiter.findById(id).select("-password");
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }
    const companyProfile = await CompanyProfile.findOne({ recId: id });
    return { recruiter, companyProfile };
  }

  async verifyPassword(recruiter, password) {
    return await bcrypt.compare(password, recruiter.password);
  }

  async createJobPost(data) {
    const jobPost = new JobPost(data);
    return await jobPost.save();
  }

  async getAllJobPosts() {
    return await JobPost.find({}).populate('recId').sort({ createdAt: -1 });
  }

  async getJobsByRecruiter(recId) {
    return await JobPost.find({ recId }).populate('recId').sort({ createdAt: -1 });
  }

  generateToken(recruiter) {
    return jwt.sign(
      { _id: recruiter._id, role: recruiter.Role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
  }

  async toggleSavedCandidate(recruiterId, userId) {
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) throw new Error("Recruiter not found");

    const isSaved = recruiter.SavedCandidates.includes(userId);

    if (isSaved) {
        // Unsave
        recruiter.SavedCandidates = recruiter.SavedCandidates.filter(id => id.toString() !== userId.toString());
    } else {
        // Save
        recruiter.SavedCandidates.push(userId);
    }

    await recruiter.save();
    return { saved: !isSaved, savedCandidates: recruiter.SavedCandidates };
  }
}

module.exports = new RecruiterService();
