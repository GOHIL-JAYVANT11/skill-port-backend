const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecruiterProfile', // Updated to match Recuiter.js model name
        required: false
    },
    postType: {
        type: String,
        enum: ['JOB', 'FREELANCE'],
        required: true,
        default: 'JOB'
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPost', // Updated to JobPost
        required: false
    },
    freelanceProjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FreelanceProject',
        required: false
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model for candidates
        required: false
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    monthlySalary: {
        type: Number,
        required: false
    },
    yearlySalary: {
        type: Number,
        required: false
    },
    totalProjectAmount: {
        type: Number,
        required: false
    },
    commissionAmount: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID'],
        default: 'PENDING'
    },
    razorpay_order_id: {
        type: String,
        required: false
    },
    razorpay_payment_id: {
        type: String,
        required: false
    },
    paidAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
