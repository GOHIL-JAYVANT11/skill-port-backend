const express = require('express');
const router = express.Router();
const userController = require('../controllers/User/User.Controller');
const authDeviceMiddleware = require('../middlewares/authDeviceMiddleware');
const upload = require('../middlewares/Upload.middleware');

router.get('/get-profile', authDeviceMiddleware, userController.getProfile);
router.post('/add-education', authDeviceMiddleware, userController.addEducation);
router.put('/update-profile', authDeviceMiddleware, 
    upload.fields([{ name: 'resume', maxCount: 1 }, 
                 { name: 'certificationFiles', maxCount: 10 }, 
                 { name: 'companyLogo', maxCount: 1 }]), userController.updateProfile);
router.delete('/delete-data', authDeviceMiddleware, userController.deleteData);
router.get('/get-All-Job', authDeviceMiddleware, userController.getJobPosts);
router.get('/get-all-Recuiters', authDeviceMiddleware, userController.getAllRecruiters);
router.post('/toggle-save-job', authDeviceMiddleware, userController.toggleSavedJob);
router.post('/save-job/:jobId', authDeviceMiddleware, userController.saveJob);
router.get('/get-saved-jobs', authDeviceMiddleware, userController.getSavedJobs);
router.get('/get-my-applications', authDeviceMiddleware, userController.getMyApplications);
router.get('/get-interviews', authDeviceMiddleware, userController.getInterviews);
router.post('/apply-job', authDeviceMiddleware, userController.applyForJob);

router.post('/apply-project', authDeviceMiddleware, userController.applyForProject);
router.get('/get-my-proposals', authDeviceMiddleware, userController.getMyProposals);
router.get('/notifications', authDeviceMiddleware, userController.getNotifications);
router.put('/notifications/:notificationId/read', authDeviceMiddleware, userController.markNotificationRead);


module.exports = router;
