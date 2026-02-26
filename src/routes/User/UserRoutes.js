const express = require('express');
const router = express.Router();
const userController = require('../../controllers/User/User.Controller');
const authDeviceMiddleware = require('../../middlewares/authDeviceMiddleware');
const { route } = require('../Admin/AdminRoutes');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.post('/add-education', authDeviceMiddleware, userController.addEducation);
router.put('/update-profile', authDeviceMiddleware, userController.updateProfile);

module.exports = router;
