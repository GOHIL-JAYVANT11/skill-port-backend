const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    projectId: {
        type: String,
        unique: true,
        sparse: true
    },
    projectName: {
        type: String,
        required: true,
        trim: true
    },
    project: {
        type: String,
        required: false,
        trim: true
    },
    startDate: {
        type: String,
        required: false
    },
    endDate: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: false,
        trim: true
    },
    projectSkills: [
        {
            type: String,
            trim: true
        }
    ],
    projectURL: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save hook to generate projectId
ProjectSchema.pre('save', async function() {
    if (!this.projectId) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'PRO';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.projectId = result;
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
