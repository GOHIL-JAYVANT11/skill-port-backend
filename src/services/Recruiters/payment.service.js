const Payment = require('../../models/Recuiters/Payment');
const razorpayInstance = require('../../config/razorpay');
const calculateCommission = require('../../utils/calculateCommission');
const crypto = require('crypto');

class PaymentService {
    /**
     * Creates a new payment record when a recruiter selects "Hired".
     * Calculates the commission (8% of yearly salary for jobs, or 8% of total project amount for freelance).
     */
    async createPaymentRecord(data) {
        const { recruiterId, jobId, freelanceProjectId, postType, candidateId, meetingId, monthlySalary, totalAmount } = data;
        
        let yearlySalary, commission, finalMonthlySalary, finalTotalAmount;

        if (postType === 'FREELANCE') {
            const amountNum = parseFloat(totalAmount);
            if (isNaN(amountNum) || amountNum <= 0) {
                throw new Error('totalAmount must be a valid positive number for freelance projects');
            }
            finalTotalAmount = amountNum;
            commission = finalTotalAmount * 0.08; // Defaulting to 8% for freelance projects
        } else {
            // Default to JOB if postType is not specified or set to JOB
            const salaryNum = parseFloat(monthlySalary);
            if (isNaN(salaryNum) || salaryNum <= 0) {
                throw new Error('monthlySalary must be a valid positive number for job posts');
            }
            finalMonthlySalary = salaryNum;
            const calc = calculateCommission(finalMonthlySalary);
            yearlySalary = calc.yearlySalary;
            commission = calc.commission;
        }

        const payment = new Payment({
            recruiterId,
            postType: postType || 'JOB',
            jobId: (postType === 'FREELANCE') ? undefined : jobId,
            freelanceProjectId: (postType === 'FREELANCE') ? freelanceProjectId : undefined,
            candidateId,
            meetingId,
            monthlySalary: finalMonthlySalary,
            yearlySalary,
            totalProjectAmount: finalTotalAmount,
            commissionAmount: commission,
            status: 'PENDING'
        });

        return await payment.save();
    }

    /**
     * Fetches a payment record and creates a Razorpay order.
     */
    async createOrder(paymentId) {
        if (!razorpayInstance) {
            throw new Error('Razorpay configuration is missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment record not found');
        }

        const options = {
            amount: Math.round(payment.commissionAmount * 100), // Razorpay expects amount in paise
            currency: "INR",
            receipt: `receipt_${payment._id}`,
        };

        const order = await razorpayInstance.orders.create(options);
        
        // Update payment record with razorpay_order_id
        payment.razorpay_order_id = order.id;
        await payment.save();

        return order;
    }

    /**
     * Verifies the Razorpay payment signature and updates status to PAID.
     */
    async verifyPayment(data) {
        if (!razorpayInstance) {
            throw new Error('Razorpay configuration is missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            const payment = await Payment.findOneAndUpdate(
                { razorpay_order_id },
                {
                    status: 'PAID',
                    razorpay_payment_id,
                    paidAt: new Date()
                },
                { new: true }
            );
            return payment;
        } else {
            throw new Error('Payment verification failed');
        }
    }

    /**
     * Returns all payment records for a specific recruiter.
     */
    async getRecruiterPayments(recruiterId) {
        return await Payment.find({ recruiterId }).sort({ createdAt: -1 });
    }
}

module.exports = new PaymentService();
