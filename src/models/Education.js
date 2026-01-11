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
        required: true,
        trim: true
    },
    courseType: {
        type: String,
        enum: ["Full Time", "Part Time", "Distance", "Online"],
        required: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    universityInstitute: {
        type: String,
        required: true,
        trim: true
    },
    startingYear: {
        type: Number,
        required: true,
        min: 1950
    },
    passingYear: {
        type: Number,
        required: true
    },
    gradingSystem: {
        type: String,
        enum: [
            "Scale 10 Grading System",
            "Scale 4 Grading System",
            "Percentage",
            "CGPA"
        ],
        required: true
    },
    cgpa: {
        type: Number,
        required: true
    },
    cgpaOutOf: {
        type: Number,
        enum: [4, 10, 100],
        required: true
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
