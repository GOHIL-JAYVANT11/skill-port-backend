const mongoose = require("mongoose");

const JobPostSchema = new mongoose.Schema({
    recId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RecruiterProfile",
        required: true
    },
    companyName: {
        type: String,
        required: false
    },  
    jobtitle: {
        type: String,
        required: true
    },
    EmploymentType: {
        type: String,
        required: true
    },
    WorkMode: {
        type: String,
        required: true
    },
    Department: {
        type: String,
        required: true
    },
    Industry: {
        type: String,
        required: true
    },
    Openings: {
        type: Number,
        required: true
    },
    Deadline: {
        type: Date,
        required: false
    },
    Country: {
        type: String,
        required: true
    },
    State: {
        type: String,
        required: true
    },
    City: {
        type: String,
        required: true
    },
    OfficeAddress: {
        type: String,
        required: false
    },
    Salary: {
        minSalary: {
            type: Number,
            required: false
        },
        maxSalary: {
            type: Number,
            required: false
        }
    },
    SalaryType: {
        type: String,
        required: true
    },
    Experience: {
        type: String,
        required: true
    },
    Skill: {
        type: [String],
        required: true
    },
    Qualification: {
        type: String,
        required: true
    },
    DegreeRequired: {
        type: String,
        required: true
    },
    JobDescription: {
        type: String,
        required: true
    },
    Benefits: {
        type: [String],
        default: []
    },
    InterviewMode: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("JobPost", JobPostSchema);
