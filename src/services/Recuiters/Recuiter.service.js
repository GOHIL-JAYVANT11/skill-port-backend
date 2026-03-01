const Recruiter = require("../../models/Recuiters/Recuiter");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  async getRecruiterProfile(id) {
    const recruiter = await Recruiter.findById(id).select("-password");
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }
    return recruiter;
  }

  async verifyPassword(recruiter, password) {
    return await bcrypt.compare(password, recruiter.password);
  }

  generateToken(recruiter) {
    return jwt.sign(
      { _id: recruiter._id, role: recruiter.Role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
  }
}

module.exports = new RecruiterService();
