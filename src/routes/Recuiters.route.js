const express = require("express");
const router = express.Router();
const recruiterController = require("../controllers/Recuiters/Recuiters.controller");
const authDeviceMiddleware = require("../middlewares/authDeviceMiddleware");

router.post("/register", recruiterController.register);
router.post("/google-login", recruiterController.googleLogin);
router.get("/get-Recuiter-profile", authDeviceMiddleware, recruiterController.getProfile);
router.post("/add-recruiter-details", authDeviceMiddleware, recruiterController.addRecruiterDetails);
router.put("/update-profile", authDeviceMiddleware, recruiterController.updateRecruiterProfile);
router.post("/post-job", authDeviceMiddleware, recruiterController.postJob);

// Get all jobs posted by the recruiter
router.get("/get-recruiter-jobs", authDeviceMiddleware, recruiterController.getRecruiterJobs);

// Get all recruiters
router.get("/get-all-Recuiters", authDeviceMiddleware, recruiterController.getAllRecruiters);

// Get all job applications for a specific job
router.get("/get-job-applications/:jobId", authDeviceMiddleware, recruiterController.getJobApplications);
router.post("/schedule-meeting", authDeviceMiddleware, recruiterController.scheduleMeeting);
router.get("/ShortListApplication", authDeviceMiddleware, recruiterController.shortlistApplications);
router.post("/toggle-save-candidate", authDeviceMiddleware, recruiterController.toggleSavedCandidate);

router.get("/get-meeting/:roomCode", authDeviceMiddleware, recruiterController.getMeetingByRoom);
router.get("/get-recruiter-meetings", authDeviceMiddleware, recruiterController.getRecruiterMeetings);
router.patch("/complete-meeting/:meetingId", authDeviceMiddleware, recruiterController.completeMeeting);
router.put("/update-meeting/:meetingId", authDeviceMiddleware, recruiterController.updateMeeting);
router.put("/update-application-status/:applicationId", authDeviceMiddleware, recruiterController.updateApplicationStatus);

// Freelancing Routes
router.post("/create-freelance-project", authDeviceMiddleware, recruiterController.createFreelanceProject);
router.post("/create-freelancer-review", authDeviceMiddleware, recruiterController.createFreelancerReview);
router.post("/create-milestone", authDeviceMiddleware, recruiterController.createMilestone);
router.post("/create-proposal", authDeviceMiddleware, recruiterController.createProposal);

// Fetching Freelancing Data
router.get("/get-recruiter-freelance-projects", authDeviceMiddleware, recruiterController.getRecruiterFreelanceProjects);
router.get("/get-all-freelance-projects", authDeviceMiddleware, recruiterController.getAllFreelanceProjects);
router.get("/get-freelance-proposals", authDeviceMiddleware, recruiterController.getFreelanceProposals);
router.get("/shortlist-freelance-proposals", authDeviceMiddleware, recruiterController.shortlistFreelanceProposals);
router.put("/update-proposal-status/:proposalId", authDeviceMiddleware, recruiterController.updateProposalStatus);

// Fetch all meetings
router.get("/all-meetings", recruiterController.getAllMeetings);

// Fetch selected candidates for payment
router.get("/selected-candidates", authDeviceMiddleware, recruiterController.getSelectedCandidates);

module.exports = router;
