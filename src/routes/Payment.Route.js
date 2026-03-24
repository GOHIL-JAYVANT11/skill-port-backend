const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/Recruiters/payment.controller');

// Create payment record when recruiter selects "Hired"
router.post('/create-record', paymentController.createRecordController);

// Create Razorpay order
router.post('/create-order', paymentController.createOrderController);

// Verify payment signature
router.post('/verify-payment', paymentController.verifyPaymentController);

// Get recruiter payments
router.get('/recruiter/:id', paymentController.getPaymentsController);

// Get all payments
router.get('/all-payments', paymentController.getAllPayments);

module.exports = router;
