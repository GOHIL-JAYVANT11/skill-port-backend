const express = require('express');
const router = express.Router();
const userController = require('../controllers/User/User.Controller');
const recruiterController = require('../controllers/Recuiters/Recuiters.controller');
const Recruiter = require('../models/Recuiters/Recuiter');

// Helper function to dispatch to correct controller based on Role
const dispatch = (method) => async (req, res) => {
    try {
        const role = req.body.Role || req.body.role;
        
        // Check if role is explicitly Recruiter
        if (role === 'Recruiter' || (Array.isArray(role) && role.includes('Recruiter'))) {
            return recruiterController[method](req, res);
        }

        // For methods where role might be missing, try to detect if it's a recruiter
        if (!role && (method === 'login' || method === 'verifyOtp' || method === 'resendOtp' || method === 'googleLogin')) {
            const email = req.body.email;
            if (email) {
                const isRecruiter = await Recruiter.findOne({ email });
                if (isRecruiter) {
                    return recruiterController[method](req, res);
                }
            }
        }

        // Default to userController
        return userController[method](req, res);
    } catch (error) {
        console.error(`Dispatch Error for ${method}:`, error);
        return res.status(500).json({ message: "Internal Server Error during auth dispatch" });
    }
};

router.post('/register', userController.register);
router.post('/login', dispatch('login'));
router.post('/google', userController.googleLogin);
router.post('/verify-otp', dispatch('verifyOtp'));
router.post('/resend-otp', dispatch('resendOtp'));

module.exports = router;
