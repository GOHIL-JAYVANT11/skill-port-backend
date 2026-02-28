const express = require('express');
const router = express.Router();
const userController = require('../../controllers/User/User.Controller');
const authDeviceMiddleware = require('../../middlewares/authDeviceMiddleware');
const upload = require('../../middlewares/Upload.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google', userController.googleLogin);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/get-profile', authDeviceMiddleware, userController.getProfile);
router.post('/add-education', authDeviceMiddleware, userController.addEducation);
router.put('/update-profile', authDeviceMiddleware, upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'certificationFiles', maxCount: 10 }]), userController.updateProfile);
router.delete('/delete-data', authDeviceMiddleware, userController.deleteData);


module.exports = router;
