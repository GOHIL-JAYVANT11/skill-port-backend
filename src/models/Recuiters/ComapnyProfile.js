const mongoose = require("mongoose");

const CompanyProfileSchema = new mongoose.Schema({
    recId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RecruiterProfile",
        required: true
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
    }
}, { timestamps: true });

module.exports = mongoose.model("CompanyProfile", CompanyProfileSchema);
