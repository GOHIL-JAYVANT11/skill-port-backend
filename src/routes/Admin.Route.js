const express = require('express');
const router = express.Router();
const adminController = require('../controllers/Admin/admin.Controller');
const authDeviceMiddleware = require('../middlewares/authDeviceMiddleware');

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.post('/verify-otp', adminController.verifyLoginOtp);


module.exports = router;
