const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    // Highest level selected first (10th / 12th / Graduation / Masters / PhD)
    highestQualification: {
        type: String,
        enum: [
            "Below 10th",
            "10th",
            "12th",
            "Graduation/Diploma",
            "Masters/Post-Graduation",
            "Doctorate/PhD"
        ],
        required: true
    },
    // Course name (M.Tech, B.Tech, PhD, MBA, Diploma etc.)
    course: {
        type: String,
        required: false,
        trim: true
    },
    classXII: [
        {
            examinationBoard: {
                type: String,
                required: false,
                trim: true
            },
            mediumOfStudy: {
                type: String,
                required: false,
                trim: true
            },
            percentage: {
                type: String,
                required: false
            },
            passingYear: {
                type: Number,
                required: false
            }
        }
    ],
    classX: [
        {
            examinationBoard: {
                type: String,
                required: false,
                trim: true
            },
            mediumOfStudy: {
                type: String,
                required: false,
                trim: true
            },
            percentage: {
                type: String,
                required: false
            },
            passingYear: {
                type: Number,
                required: false
            }
        }
    ],
    courseType: {
        type: String,
        enum: ["Full Time", "Part Time", "Distance", "Online"],
        required: false
    },
    specialization: {
        type: String,
        required: false,
        trim: true
    },
    universityInstitute: {
        type: String,
        required: false,
        trim: true
    },
    medium: {
        type: String,
        trim: false
    },
    startingYear: {
        type: Number,
        required: false,
        min: 1950
    },
    passingYear: {
        type: Number,
        required: false
    },
    gradingSystem: {
        type: String,
        required: false
    },
    cgpa: {
        type: Number,
        required: false
    },
    percentage: {
        type: String,
        required: false
    },
    cgpaOutOf: {
        type: Number,
        enum: [4, 10, 100],
        required: false
    },
    keySkills: [
        {
            type: String,
            trim: true
        }
    ],
    isCurrentlyPursuing: {
        type: Boolean,
        default: false
    },
    isPrimary: {
        type: Boolean,
        default: false // highest education flag
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Education', EducationSchema);
