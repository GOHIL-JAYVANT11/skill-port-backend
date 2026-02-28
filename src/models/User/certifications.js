const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    certificationId: {
        type: String,
        unique: true,
        sparse: true
    },
    certificationName: {
        type: String,
        required: true,
        trim: true
    },
    certificationCompletionID: {
        type: String,
        required: false,
        trim: true
    },
    certificationURL: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save hook to generate certificationId
CertificationSchema.pre('save', async function() {
    if (!this.certificationId) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'CRT'; // Changed prefix for certification
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.certificationId = result;
    }
});

module.exports = mongoose.model('Certification', CertificationSchema);
