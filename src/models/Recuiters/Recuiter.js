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

    recId: {
        type: String,
        unique: true,
        sparse: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    SavedCandidates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]

}, { timestamps: true });

// Pre-save hook to generate projectId
RecruiterProfileSchema.pre('save', async function () {
    if (!this.recId) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'REC';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.recId = result;
    }
});

module.exports = mongoose.model("RecruiterProfile", RecruiterProfileSchema); 









// Waah! 🔥 Tera model bahut smart hai — "Hire hone pe hi commission" — bilkul LinkedIn/Naukri se alag!
// Chalo main batata hoon ki Company/Recruiter Registration mein kya-kya collect karna chahiye:

// 🏢 Company Registration — Kya Collect Karein?
// 1. 🔐 Account & Login Info

// Full Name (HR/Recruiter ka)
// Work Email Address
// Password
// Designation (HR Manager, Talent Acquisition, Founder, etc.)
// Phone Number (OTP verify ke liye)

// 2. 🏗️ Basic Company Info

// Company Name
// Company Logo (upload)
// Company Type (Startup / SME / MNC / Agency / NGO)
// Industry / Sector (IT, Finance, Healthcare, etc.)
// Company Size (1-10, 11-50, 51-200, 200-500, 500+)
// Founded Year
// Company Website URL
// Company LinkedIn / Social Links

// 3. 📍 Location Details

// Headquarters City & Country
// Other Office Locations (multiple add kar sake)
// Pin Code / Zip Code

// 4. 📜 Legal & Verification (Trust ke liye — Naukri/LinkedIn bhi karta hai)

// Company Registration Number (CIN / GSTIN)
// PAN Number
// Type of Entity (Pvt Ltd / LLP / Partnership / Proprietorship)
// Upload: Certificate of Incorporation (optional but trusted badge milega)

// 5. 💼 Hiring Preferences

// Roles they usually hire for (Developer, Designer, Sales, etc.)
// Work modes they offer (Remote / Hybrid / On-site)
// Hiring volume per year (1-5 / 5-20 / 20-50 / 50+)
// Countries they hire in

// 6. 💰 Billing & Commission Setup (Tera unique model)

// Billing Contact Name
// Billing Email
// Bank Account / UPI for refund scenarios
// GST Number (invoice ke liye)
// Agree to: "8% of first-year salary on successful hire" (checkbox + e-sign)
// Preferred payment mode (Net Banking / UPI / Card)

// 7. 🤝 Freelancing Module (kyunki tune yeh feature bhi rakha hai)

// Do you also hire Freelancers? (Yes/No)
// Freelance budget range
// Preferred freelance engagement (Project-based / Hourly / Retainer)

// 8. 📅 Meeting / Interview Scheduling Preferences

// Preferred interview modes (Video Call / Phone / In-person)
// Available time slots (Morning / Afternoon / Evening)
// Calendar integration (Google Calendar / Outlook — future mein)
// Time Zone

// 9. 📝 Company Description (Profile ke liye)

// About Company (short bio — 150-300 words)
// Company Culture / Values
// Awards / Recognitions (optional)
// Employee Testimonials / Photos (optional)
