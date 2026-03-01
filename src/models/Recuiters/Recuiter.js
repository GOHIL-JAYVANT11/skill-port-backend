const mongoose = require("mongoose");

const RecruiterProfileSchema = new mongoose.Schema({
   

    Fullname: {
        type: String,
        required: false
    },

    number: {
        type: String,
        required: false,
        unique: true
    },

    email: {
        type: String,
        required: false,
        unique: true
    },

    password: {
        type: String,
        required: false
    },

    Role: {
        type: [String],
        enum: ['Recruiter'],
        required: true
    },

    isGoogleUser: {
        type: Boolean,
        default: false
    },

    profilePic: {
        type: String
    },

    recruiterId: {
        type: String,
        unique: true,
        sparse: true
    },

    companyName: {
        type: String,
        required: false,
        trim: true
    },

    designation: {
        type: String,
        required: false
    },

    industry: {
        type: String,
        required: false
    },

    companySize: {
        type: String,
        enum: ["1-10", "10-50", "50-200", "200+"]
    },

    companyWebsite: {
        type: String
    },
    socialLinks: {
        linkedIn: {
            type: String,
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        twitter: {
            type: String,
            trim: true
        },
        facebook: {
            type: String,
            trim: true
        },
        instagram: {
            type: String,
            trim: true
        },
        youtube: {
            type: String,
            trim: true
        },
        
    },
    companyLocation: {
        type: String
    },

    companyDescription: {
        type: String
    },

    companyLogo: {
        type: String
    },

    isVerified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// Pre-save hook to generate projectId
RecruiterProfileSchema.pre('save', async function () {
    if (!this.recruiterId) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'REC';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.recruiterId = result;
    }
});

module.exports = mongoose.model("RecruiterProfile", RecruiterProfileSchema);
