const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPost",
    required: true
  },

  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RecruiterProfile",
    required: true
  },

  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },

  interviewTitle: {
    type: String
  },

  interviewType: {
    type: String,
    enum: ["Video", "Phone", "In-person"],
    default: "Video"
  },

  meetingPlatform: {
    type: String,
    enum: ["SkillPort Meet", "Google Meet", "Zoom"],
    default: "SkillPort Meet"
  },

  meetingLink: {
    type: String
  },

  interviewDate: {
    type: Date,
    required: true
  },

  interviewTime: {
    type: String,
    required: true
  },

  duration: {
    type: Number
  },

  notes: {
    type: String
  },

  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled" , "Upcoming"],
    default: "Upcoming"
  },

  result: {
    type: String,
    enum: ["Pending", "Selected", "Rejected", "On Hold", "Next Round"],
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Meeting", meetingSchema);
