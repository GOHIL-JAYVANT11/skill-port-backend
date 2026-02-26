const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    Role: {
        type: [String],
        enum: ['Job Seeker', 'Freelancer'],
        required: true
    },
    resume: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "active"
    },
    userimage: {
        type: String,
        default: ""
    },
    resumeHeadline: {
        type: String,
        default: ""
    },
    skill: {
        type: [String],
        default: []
    }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
