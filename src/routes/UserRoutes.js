const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.Controller');
const authDeviceMiddleware = require('../middlewares/authDeviceMiddleware');
const { route } = require('./AdminRoutes');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.post('/add-education', authDeviceMiddleware, userController.addEducation);

module.exports = router;
