const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: function() { return !this.isGoogleUser; },
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() { return !this.isGoogleUser; }
    },
    Role: {
        type: [String],
        enum: ['Job Seeker', 'Freelancer'],
        required: function() { return !this.isGoogleUser; }
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    SocialLinks: [

        {
           github: {
                type: String,
                required: false,
                trim: true
            },
            linkdIn: {
                type: String,
                required: false,
                trim: true
            },
            portfolio: {
                type: String,
                required: false
            }
        }
    ],
    profilePic: {
        type: String,
        default: ""
    },
    resume: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    userstatus: {
        type: String,
        default: "Fresher"
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
