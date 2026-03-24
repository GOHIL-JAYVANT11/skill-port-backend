const User = require('../../models/User/User');
const Education = require('../../models/User/Education');
const Project = require('../../models/User/Project');
const Certification = require('../../models/User/certifications');
const JobPost = require('../../models/Recuiters/JobPost');
const Recruiter = require('../../models/Recuiters/Recuiter'); // Ensure Recruiter model is registered for populate
const ApplyJob = require('../../models/User/ApplyJob');
const Meeting = require('../../models/Recuiters/Meeting');
const Proposal = require('../../models/Recuiters/Proposal(Freelancing_Application)');
const mongoose = require('mongoose');


class UserService {
    async applyForJob(applicationData) {
        const { userId, jobId, recId } = applicationData;

        // Check if already applied
        const existingApplication = await ApplyJob.findOne({ userId, jobId });
        if (existingApplication) {
            throw new Error("You have already applied for this job");
        }

        // Validate Job and Recruiter
        const job = await JobPost.findById(jobId);
        if (!job) throw new Error("Job post not found");

        const application = new ApplyJob(applicationData);
        await application.save();
        
        return application;
    }

    async getAllJobPosts() {
        return await JobPost.aggregate([
            {
                $lookup: {
                    from: "recruiterprofiles",
                    localField: "recId",
                    foreignField: "_id",
                    as: "recruiterDetails"
                }
            },
            {
                $unwind: {
                    path: "$recruiterDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    recId: { $ifNull: ["$recruiterDetails", "$recId"] }
                }
            },
            {
                $project: {
                    recruiterDetails: 0,
                    "recId.password": 0
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
    }

    async getUserProfile(userId) {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            throw new Error("User not found");
        }

        const education = await Education.find({ userId });
        const projects = await Project.find({ userId });
        const certifications = await Certification.find({ userId });

        return {
            user,
            education,
            projects,
            certifications
        };
    }

    async updateProfile(userId, updateData) {
        // If email is being updated, check if it's already taken
        if (updateData.email) {
            const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
            if (existingUser) {
                throw new Error("Email already in use by another account");
            }
        }

        // If number is being updated, check if it's already taken
        if (updateData.number) {
            const existingUserWithNumber = await User.findOne({ number: updateData.number, _id: { $ne: userId } });
            if (existingUserWithNumber) {
                throw new Error("Number already in use by another account");
            }
        }

        // Handle skill array if it's provided but not an array
        if (updateData.skill !== undefined) {
            updateData.skill = Array.isArray(updateData.skill) ? updateData.skill : [updateData.skill];
        }

        // Handle SocialLinks array if it's provided but not an array
        if (updateData.SocialLinks !== undefined) {
            updateData.SocialLinks = Array.isArray(updateData.SocialLinks) ? updateData.SocialLinks : [updateData.SocialLinks];
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    async upsertEducations(userId, items) {
        if (!Array.isArray(items)) {
            throw new Error("Education payload must be an array");
        }

        const normalizeCourseType = (raw) => {
            if (!raw) return undefined;
            const v = String(raw).toLowerCase();
            if (v.includes("full")) return "Full Time";
            if (v.includes("part")) return "Part Time";
            if (v.includes("correspondence") || v.includes("distance")) return "Distance";
            if (v.includes("online")) return "Online";
            return undefined;
        };

        const mapOne = (item, index) => {
            const highestQualification = item.qualification || item.highestQualification;
            const course = item.course;
            const courseType = normalizeCourseType(item.courseType);
            const specialization = item.specialization;
            const universityInstitute = item.university || item.universityInstitute;
            const gradingSystem = item.gradingSystem;

            let startingYear = item.startYear;
            let passingYear = item.endYear;
            startingYear = startingYear !== undefined ? parseInt(startingYear, 10) : undefined;
            passingYear = passingYear !== undefined ? parseInt(passingYear, 10) : undefined;

            let cgpa;
            let percentage;
            let cgpaOutOf;

            const marks = item.marks;
            const marksNum = marks !== undefined ? Number(marks) : undefined;
            const gradingText = (gradingSystem || "").toLowerCase();

            if (gradingText.includes("marks") || gradingText.includes("%") || gradingText.includes("100")) {
                percentage = marks !== undefined ? String(marks) : undefined;
                if (gradingText.includes("100")) {
                    cgpaOutOf = 100;
                }
            } else if (gradingText.includes("cgpa") || gradingText.includes("gpa")) {
                cgpa = marksNum;
                if (gradingText.includes("10")) cgpaOutOf = 10;
                else if (gradingText.includes("4")) cgpaOutOf = 4;
            }

            const mapClassEntries = (entries) => {
                if (!Array.isArray(entries)) return [];
                return entries.map((e) => {
                    const examinationBoard = e.examinationBoard ?? e["Examination board"] ?? e.board ?? e["board"];
                    const mediumOfStudy = e.mediumOfStudy ?? e["Medium of study"] ?? e.medium ?? e["medium"];
                    const percentageVal = e.percentage ?? e["Percentage"] ?? e.marks ?? e["marks"];
                    const passingYearRaw = e.passingYear ?? e["Passing year"] ?? e.year ?? e["year"];
                    const passingYearVal = passingYearRaw !== undefined ? parseInt(passingYearRaw, 10) : undefined;
                    return {
                        examinationBoard,
                        mediumOfStudy,
                        percentage: percentageVal !== undefined ? String(percentageVal) : undefined,
                        passingYear: passingYearVal
                    };
                });
            };

            return {
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
                percentage,
                cgpaOutOf,
                classXII: mapClassEntries(item.classXII),
                classX: mapClassEntries(item.classX),
                keySkills: [],
                isCurrentlyPursuing: false,
                isPrimary: index === 0
            };
        };

        const chosen =
            items.find((it) => it && it.isPrimary === true) ??
            (items.length ? items[items.length - 1] : null);

        if (!chosen) {
            return await Education.find({ userId });
        }

        const doc = mapOne(chosen, 0);
        const { userId: _ignore, ...updateFields } = doc;

        await Education.findOneAndUpdate(
            { userId },
            { $set: updateFields },
            { new: true, upsert: true, runValidators: true }
        );

        return await Education.find({ userId });
    }

    async upsertProjects(userId, projects) {
        if (!Array.isArray(projects)) {
            throw new Error("Projects must be an array");
        }

        const results = [];
        for (const projectData of projects) {
            const { _id, projectId, ...fields } = projectData;
            
            if (_id) {
                // Update existing project
                // We exclude projectId from updates to keep it immutable
                const updated = await Project.findOneAndUpdate(
                    { _id, userId },
                    { $set: fields },
                    { new: true, runValidators: true }
                );
                if (updated) results.push(updated);
            } else {
                // Create new project
                const newProject = new Project({
                    ...fields,
                    userId
                });
                await newProject.save();
                results.push(newProject);
            }
        }
        return results;
    }

    async upsertCertifications(userId, certifications) {
        if (!Array.isArray(certifications)) {
            throw new Error("Certifications must be an array");
        }

        const results = [];
        for (const certData of certifications) {
            const { _id, certificationId, ...fields } = certData;

            let existingCert = null;

            if (_id) {
                existingCert = await Certification.findOne({ _id, userId });
            } else if (certificationId) {
                existingCert = await Certification.findOne({ certificationId, userId });
            }

            if (existingCert) {
                // Update existing certification
                const updated = await Certification.findByIdAndUpdate(
                    existingCert._id,
                    { $set: fields },
                    { new: true, runValidators: true }
                );
                if (updated) results.push(updated);
            } else {
                // Create new certification
                const newCert = new Certification({
                    ...fields,
                    userId
                });
                await newCert.save();
                results.push(newCert);
            }
        }
        return results;
    }

    async deleteData(userId, { educationIds, projectIds, certificationIds }) {
        const results = { educationDeleted: 0, projectsDeleted: 0, certificationsDeleted: 0 };
        
        if (educationIds && Array.isArray(educationIds) && educationIds.length > 0) {
            const delEdu = await Education.deleteMany({ _id: { $in: educationIds }, userId });
            results.educationDeleted = delEdu.deletedCount;
        }
        
        if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
            const delProj = await Project.deleteMany({ _id: { $in: projectIds }, userId });
            results.projectsDeleted = delProj.deletedCount;
        }

        if (certificationIds && Array.isArray(certificationIds) && certificationIds.length > 0) {
            const delCert = await Certification.deleteMany({ _id: { $in: certificationIds }, userId });
            results.certificationsDeleted = delCert.deletedCount;
        }
        
        return results;
    }

    async toggleSavedJob(userId, jobId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const isSaved = user.SavedJobs.includes(jobId);

        if (isSaved) {
            // Unsave
            user.SavedJobs = user.SavedJobs.filter(id => id.toString() !== jobId.toString());
        } else {
            // Save
            user.SavedJobs.push(jobId);
        }

        await user.save();
        return { saved: !isSaved, savedJobs: user.SavedJobs };
    }

    async getSavedJobs(userId) {
        const user = await User.findById(userId).populate({
            path: 'SavedJobs',
            populate: {
                path: 'recId'
            }
        });
        
        if (!user) throw new Error("User not found");
        
        return user.SavedJobs;
    }

    async getInterviews(userId) {
        const interviews = await Meeting.find({ candidateId: userId })
            .populate('jobId')
            .populate('recruiterId', '-password')
            .sort({ interviewDate: -1, interviewTime: -1 });
        
        return interviews;
    }

    // ================= CREATE PROPOSAL =================
    async createProposal(data) {
        const { freelancerId, projectId } = data;

        // Check already applied
        const existing = await Proposal.findOne({ freelancerId, projectId });
        if (existing) {
            throw new Error("You already submitted proposal for this project");
        }

        // Fetch project to get recId
        const project = await mongoose.model("FreelanceProject").findById(projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        const proposal = new Proposal({
            ...data,
            recId: project.recId
        });
        await proposal.save();

        return proposal;
    }

    async getMyProposals(userId) {
        return await Proposal.find({ freelancerId: userId })
            .populate("projectId", "title budget duration recId")
            .populate("recId", "Fullname email profilePic")
            .sort({ createdAt: -1 });
    }
}

module.exports = new UserService();
