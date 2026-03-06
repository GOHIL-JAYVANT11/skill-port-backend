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
router.get("/get-recruiter-jobs", authDeviceMiddleware, recruiterController.getRecruiterJobs);
router.post("/toggle-save-candidate", authDeviceMiddleware, recruiterController.toggleSavedCandidate);

module.exports = router;
