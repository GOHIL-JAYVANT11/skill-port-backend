const Recruiter = require("../../models/Recuiters/Recuiter");
const JobPost = require("../../models/Recuiters/JobPost");
const CompanyProfile = require("../../models/Recuiters/ComapnyProfile");
const ApplyJob = require("../../models/User/ApplyJob");
const Meeting = require("../../models/Recuiters/Meeting");
const FreelanceProject = require("../../models/Recuiters/Freelancing");
const FreelancerReview = require("../../models/Recuiters/FreelancerReview");
const Milestone = require("../../models/Recuiters/Milestone");
const Proposal = require("../../models/Recuiters/Proposal(Freelancing_Application)");
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

  async getJobApplicationsByRecruiter(recId) {
    return await ApplyJob.find({ recId })
      .populate('userId', 'Fullname email number profilePic')
      .populate('jobId', 'jobtitle companyName location')
      .sort({ createdAt: -1 });
  }

  // Internal helper for scoring logic
  _scoreApplication(app, jobPost) {
    let score = 0;
    const reasons = [];

    // 1. Job Title Match (weight: 20)
    if (app.jobtitle && jobPost.jobtitle) {
      const appTitle = app.jobtitle.toLowerCase().trim();
      const jobTitle = jobPost.jobtitle.toLowerCase().trim();
      if (appTitle === jobTitle) {
        score += 20;
        reasons.push("Job title exact match");
      } else if (appTitle.includes(jobTitle) || jobTitle.includes(appTitle)) {
        score += 10;
        reasons.push("Job title partial match");
      }
    }

    // 2. Experience Match (weight: 20)
    if (app.Experience && jobPost.Experience) {
      const parseExp = (str) => {
        const nums = str.match(/\d+/g);
        return nums ? nums.map(Number) : [];
      };
      const appExpNums = parseExp(app.Experience);
      const jobExpNums = parseExp(jobPost.Experience);
      const appExpMax = appExpNums.length ? Math.max(...appExpNums) : null;
      const jobExpMin = jobExpNums.length ? Math.min(...jobExpNums) : null;
      const jobExpMax = jobExpNums.length ? Math.max(...jobExpNums) : null;

      if (appExpMax !== null && jobExpMin !== null) {
        if (appExpMax >= jobExpMin && (jobExpMax === null || appExpMax <= jobExpMax + 2)) {
          score += 20;
          reasons.push("Experience matches required range");
        } else if (appExpMax >= jobExpMin - 1) {
          score += 10;
          reasons.push("Experience close to required range");
        }
      }
    }

    // 3. Location Match — City or State (weight: 15)
    if (app.location) {
      const loc = app.location.toLowerCase();
      const cityMatch = jobPost.City && loc.includes(jobPost.City.toLowerCase());
      const stateMatch = jobPost.State && loc.includes(jobPost.State.toLowerCase());
      const countryMatch = jobPost.Country && loc.includes(jobPost.Country.toLowerCase());

      if (cityMatch) {
        score += 15;
        reasons.push("City matches");
      } else if (stateMatch) {
        score += 10;
        reasons.push("State matches");
      } else if (countryMatch) {
        score += 5;
        reasons.push("Country matches");
      }
      if (!cityMatch && !stateMatch && app.willing_to_relocate) {
        score += 5;
        reasons.push("Willing to relocate");
      }
    }

    // 4. Expected Salary within Job Range (weight: 15)
    if (app.Salary?.ExpectedSalary && jobPost.Salary) {
      const expectedNum = parseFloat(app.Salary.ExpectedSalary.toString().replace(/[^0-9.]/g, ""));
      const { minSalary, maxSalary } = jobPost.Salary;
      if (!isNaN(expectedNum)) {
        if (minSalary && maxSalary && expectedNum >= minSalary && expectedNum <= maxSalary) {
          score += 15;
          reasons.push("Expected salary within job range");
        } else if (minSalary && expectedNum >= minSalary * 0.9 && expectedNum <= minSalary * 1.1) {
          score += 8;
          reasons.push("Expected salary close to job range");
        }
      }
    }

    // 5. Skill Match (weight: 15)
    if (app.Skill && app.Skill.length > 0 && jobPost.Skill && jobPost.Skill.length > 0) {
      const appSkills = app.Skill.map(s => s.toLowerCase().trim());
      const mandatorySkills = jobPost.Skill.map(s => s.toLowerCase().trim());
      
      const matchedSkills = mandatorySkills.filter(s => appSkills.includes(s));
      const matchPercentage = (matchedSkills.length / mandatorySkills.length) * 100;

      if (matchPercentage >= 100) {
        score += 15;
        reasons.push("All mandatory skills match");
      } else if (matchPercentage >= 50) {
        score += 8;
        reasons.push(`Partial skill match (${matchedSkills.length}/${mandatorySkills.length})`);
      }
    }

    // 6. has_required_skill flag (weight: 5)
    if (app.has_required_skill === true) {
      score += 5;
      reasons.push("Candidate confirmed required skills");
    }

    // 7. Resume provided (weight: 5)
    if (app.Resume && app.Resume.trim() !== "") {
      score += 5;
      reasons.push("Resume provided");
    }

    // 8. Social Links / Portfolio (weight: 5)
    const links = app.SocialLinks || {};
    if (links.Portfolio || links.LinkedIn || links.project_link) {
      score += 5;
      reasons.push("Social/portfolio links provided");
    }

    // 9. Description / Cover Note (weight: 5)
    if (app.Description && app.Description.trim().length > 30) {
      score += 5;
      reasons.push("Cover note provided");
    }

    // 10. Status is not Rejected (weight: 5)
    if (app.status !== "Rejected") {
      score += 5;
      reasons.push("Active application status");
    }

    return { score, reasons };
  }

  async getShortlistedApplicationsByJob(recId, jobId) {
    const jobPost = await JobPost.findOne({ _id: jobId, recId });
    if (!jobPost) throw new Error("Job Post not found or unauthorized");

    const allApplications = await ApplyJob.find({ jobId, recId })
      .populate("userId", "Fullname email number profilePic")
      .populate("jobId", "jobtitle companyName City State Salary Experience Skill Department Industry")
      .sort({ createdAt: -1 });

    const shortlisted = allApplications.map((app) => {
      const { score, reasons } = this._scoreApplication(app, jobPost);
      return {
        ...app.toObject(),
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

    return {
      jobPost,
      totalApplications: allApplications.length,
      shortlistedCount: shortlisted.length,
      shortlistedApplications: shortlisted,
    };
  }

  async getAllJobsWithApplications(recId) {
    const jobs = await JobPost.find({ recId }).sort({ createdAt: -1 });
    
    const jobsWithApps = await Promise.all(jobs.map(async (job) => {
      const applications = await ApplyJob.find({ jobId: job._id, recId })
        .populate("userId", "Fullname email number profilePic")
        .sort({ createdAt: -1 });

      const scoredApps = applications.map(app => {
        const { score, reasons } = this._scoreApplication(app, job);
        return {
          ...app.toObject(),
          matchScore: score,
          matchReasons: reasons
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

      return {
        jobPost: job,
        totalApplications: applications.length,
        applications: scoredApps
      };
    }));

    return jobsWithApps;
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

  async updateMeeting(meetingId, recruiterId, updateData) {
    const meeting = await Meeting.findOne({ _id: meetingId, recruiterId });
    if (!meeting) throw new Error("Meeting not found or unauthorized");

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updatedMeeting;
  }

  async createFreelanceProject(data) {
    const project = new FreelanceProject(data);
    return await project.save();
  }

  async createFreelancerReview(data) {
    const review = new FreelancerReview(data);
    return await review.save();
  }

  async createMilestone(data) {
    const milestone = new Milestone(data);
    return await milestone.save();
  }

  async createProposal(data) {
    const proposal = new Proposal(data);
    return await proposal.save();
  }

  async getFreelanceProposals(recId) {
    // 1. Find all projects belonging to this recruiter
    const projects = await FreelanceProject.find({ recId }).select("_id title");
    const projectIds = projects.map(p => p._id);

    // 2. Find all proposals for these projects
    const proposals = await Proposal.find({ projectId: { $in: projectIds } })
      .populate("projectId", "title budget duration")
      .populate("freelancerId", "Fullname email profilePic location skill")
      .sort({ createdAt: -1 });

    return proposals;
  }

  async updateProposalStatus(proposalId, recId, status) {
    // Check if the proposal belongs to a project owned by this recruiter
    const proposal = await Proposal.findById(proposalId).populate("projectId");
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.projectId.recId.toString() !== recId.toString()) {
      throw new Error("Unauthorized: This proposal does not belong to your project");
    }

    proposal.status = status;
    await proposal.save();
    return proposal;
  }

  // Internal helper for freelance proposal scoring logic
  _scoreProposal(proposal, project) {
    let score = 0;
    const reasons = [];
    const freelancer = proposal.freelancerId || {};
    const freelancerSkills = (freelancer.skill || []).map(s => s.toLowerCase().trim());
    const projectSkills = (project.skillsRequired || []).map(s => s.toLowerCase().trim());
    const projectTitleWords = project.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // 1. Skill Match (weight: 40)
    if (projectSkills.length > 0 && freelancerSkills.length > 0) {
      const matchedSkills = projectSkills.filter(s => freelancerSkills.includes(s));
      const matchPercentage = (matchedSkills.length / projectSkills.length) * 100;
      
      if (matchPercentage >= 100) {
        score += 40;
        reasons.push("All required skills match");
      } else if (matchPercentage >= 50) {
        score += 20;
        reasons.push(`Partial skill match (${matchedSkills.length}/${projectSkills.length})`);
      } else if (matchPercentage > 0) {
        score += 10;
        reasons.push("Some skills match");
      }
    }

    // 2. Budget Match (weight: 30)
    const proposedBudget = proposal.proposedBudget;
    const { min, max } = project.budget || {};
    if (proposedBudget && min !== undefined && max !== undefined) {
      if (proposedBudget >= min && proposedBudget <= max) {
        score += 30;
        reasons.push("Proposed budget within project range");
      } else if (proposedBudget < min) {
        score += 20;
        reasons.push("Proposed budget is below minimum (Competitive)");
      } else if (proposedBudget <= max * 1.2) {
        score += 10;
        reasons.push("Proposed budget slightly above range");
      }
    }

    // 3. Title/Content Match in Cover Letter (weight: 20)
    if (proposal.coverLetter && projectTitleWords.length > 0) {
      const coverLetterLower = proposal.coverLetter.toLowerCase();
      const matchedWords = projectTitleWords.filter(word => coverLetterLower.includes(word));
      
      if (matchedWords.length >= projectTitleWords.length / 2) {
        score += 20;
        reasons.push("Cover letter strongly relates to project title");
      } else if (matchedWords.length > 0) {
        score += 10;
        reasons.push("Cover letter mentions project keywords");
      }
    }

    // 4. Status Check (weight: 10)
    if (proposal.status !== "Rejected") {
      score += 10;
      reasons.push("Active proposal status");
    }

    return { score, reasons };
  }

  async shortlistFreelanceProposals(recId, projectId) {
    const project = await FreelanceProject.findOne({ _id: projectId, recId });
    if (!project) throw new Error("Freelance Project not found or unauthorized");

    const allProposals = await Proposal.find({ projectId })
      .populate("freelancerId", "Fullname email profilePic location skill userstatus")
      .sort({ createdAt: -1 });

    const scoredProposals = allProposals.map(proposal => {
      const { score, reasons } = this._scoreProposal(proposal, project);
      return {
        ...proposal.toObject(),
        matchScore: score,
        matchReasons: reasons
      };
    })
    .filter(p => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

    return {
      freelanceProject: project,
      totalProposals: allProposals.length,
      proposals: scoredProposals
    };
  }

  async getAllFreelanceProjectsWithProposals(recId) {
    const projects = await FreelanceProject.find({ recId }).sort({ createdAt: -1 });
    
    const projectsWithProposals = await Promise.all(projects.map(async (project) => {
      const allProposals = await Proposal.find({ projectId: project._id })
        .populate("freelancerId", "Fullname email profilePic location skill userstatus")
        .sort({ createdAt: -1 });

      const scoredProposals = allProposals.map(proposal => {
        const { score, reasons } = this._scoreProposal(proposal, project);
        return {
          ...proposal.toObject(),
          matchScore: score,
          matchReasons: reasons
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

      return {
        freelanceProject: project,
        totalProposals: allProposals.length,
        proposals: scoredProposals
      };
    }));

    return projectsWithProposals;
  }

  async getRecruiterFreelanceProjects(recId) {
    const projects = await FreelanceProject.find({ recId }).sort({ createdAt: -1 });
    
    const projectsWithData = await Promise.all(projects.map(async (project) => {
      const [reviews, milestones, proposals] = await Promise.all([
        FreelancerReview.find({ projectId: project._id }),
        Milestone.find({ projectId: project._id }),
        Proposal.find({ projectId: project._id }).populate("freelancerId", "Fullname email profilePic")
      ]);

      return {
        ...project.toObject(),
        reviews,
        milestones,
        proposals
      };
    }));

    return projectsWithData;
  }

  async getAllFreelanceProjects() {
    const projects = await FreelanceProject.find({ status: "Open" }).populate("recId", "Fullname email profilePic").sort({ createdAt: -1 });
    
    const projectsWithData = await Promise.all(projects.map(async (project) => {
      const [reviews, milestones, proposals] = await Promise.all([
        FreelancerReview.find({ projectId: project._id }),
        Milestone.find({ projectId: project._id }),
        Proposal.find({ projectId: project._id }).populate("freelancerId", "Fullname email profilePic")
      ]);

      return {
        ...project.toObject(),
        reviews,
        milestones,
        proposals
      };
    }));

    return projectsWithData;
  }
}

module.exports = new RecruiterService();
