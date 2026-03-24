const paymentService = require('../../services/Recruiters/payment.service');

class PaymentController {
    /**
     * Controller to create a payment record when recruiter clicks "Hired".
     */
    async createRecordController(req, res) {
        try {
            const { recruiterId, jobId, freelanceProjectId, postType, candidateId, meetingId, monthlySalary, totalAmount } = req.body;
            const effectivePostType = postType || 'JOB';

            // Basic validation
            if (effectivePostType === 'JOB' && (!jobId || !monthlySalary)) {
                return res.status(400).json({
                    success: false,
                    message: "For job posts, jobId and monthlySalary are required."
                });
            }

            if (effectivePostType === 'FREELANCE' && (!freelanceProjectId || !totalAmount)) {
                return res.status(400).json({
                    success: false,
                    message: "For freelance projects, freelanceProjectId and totalAmount are required."
                });
            }

            const payment = await paymentService.createPaymentRecord({
                recruiterId,
                jobId,
                freelanceProjectId,
                postType: effectivePostType,
                candidateId,
                meetingId,
                monthlySalary: effectivePostType === 'JOB' ? Number(monthlySalary) : undefined,
                totalAmount: effectivePostType === 'FREELANCE' ? Number(totalAmount) : undefined
            });
            res.status(201).json({
                success: true,
                message: "Payment record created successfully",
                data: payment
            });
        } catch (error) {
            console.error("Create Record Controller Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create payment record",
                error: error.message
            });
        }
    }

    /**
     * Controller to create a Razorpay order.
     */
    async createOrderController(req, res) {
        try {
            const { paymentId } = req.body;
            const order = await paymentService.createOrder(paymentId);
            res.status(200).json({
                success: true,
                message: "Razorpay order created successfully",
                data: order
            });
        } catch (error) {
            console.error("Create Order Controller Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create Razorpay order",
                error: error.message
            });
        }
    }

    /**
     * Controller to verify the Razorpay payment.
     */
    async verifyPaymentController(req, res) {
        try {
            const data = req.body;
            const payment = await paymentService.verifyPayment(data);
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                data: payment
            });
        } catch (error) {
            console.error("Verify Payment Controller Error:", error);
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
                error: error.message
            });
        }
    }

    /**
     * Controller to get all payments for a specific recruiter.
     */
    async getPaymentsController(req, res) {
        try {
            const { id: recruiterId } = req.params;
            const payments = await paymentService.getRecruiterPayments(recruiterId);
            res.status(200).json({
                success: true,
                message: "Recruiter payments fetched successfully",
                data: payments
            });
        } catch (error) {
            console.error("Get Payments Controller Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch recruiter payments",
                error: error.message
            });
        }
    }

    /**
     * Controller to fetch all payments from the database.
     */
    async getAllPayments(req, res) {
        try {
            const Payment = require('../../models/Recuiters/Payment');
            // Ensure models are registered for population
            require('../../models/Recuiters/Recuiter');
            require('../../models/User/User');
            require('../../models/Recuiters/JobPost');
            require('../../models/Recuiters/Freelancing');

            const payments = await Payment.find()
                .populate('recruiterId', 'Fullname email')
                .populate('candidateId', 'Fullname email')
                .populate('jobId', 'jobtitle')
                .populate('freelanceProjectId', 'title')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                message: "All payments fetched successfully",
                count: payments.length,
                data: payments
            });
        } catch (error) {
            console.error("Get All Payments Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch all payments",
                error: error.message
            });
        }
    }
}

module.exports = new PaymentController();
