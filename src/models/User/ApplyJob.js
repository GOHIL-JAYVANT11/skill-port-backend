const mongoose = require('mongoose');

const ApplyJobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPost",
        required: true,
        index: true
    },
    recId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RecruiterProfile",
        required: true,
        index: true
    },
    Fullname: {
        type: String,
        required: true,
        trim: true
    },
    number: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    jobtitle: {
        type: String,
        required: true,
        trim: true
    },
    Experience: {
        type: String,
        required: true,
        trim: true
    },
    Salary: {
        CurrentSalary: {
            type: String,
            required: true
        },
        ExpectedSalary: {
            type: String,
            required: true
        }
    },
    NoticePeriod: {
        type: String,
        required: true,
        trim: true
    },
    willing_to_relocate: {
        type: Boolean,
        default: false
    },
    Resume: {
        type: String,
        required: true // URL to the resume file
    },
    Description: {
        type: String,
        required: false,
        trim: true
    },
    SocialLinks: {
        Portfolio: {
            type: String,
            trim: true
        },
        LinkedIn: {
            type: String,
            trim: true
        },
        project_link: {
            type: String,
            trim: true
        }
    },
    Skill: {
        type: [String],
        default: []
    },
    has_required_skill: {
        type: Boolean,
        default: false
    },
    confirm_info_accurate: {
        type: Boolean,
        required: true
    },
    agree_data_share: {
        type: Boolean,
        required: true
    },
    read_job_description: {
        type: Boolean,
        required: true
    },
    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Rejected', 'Interviewing', 'Hired'],
        default: 'Applied'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ApplyJob', ApplyJobSchema);
