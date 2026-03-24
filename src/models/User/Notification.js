const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: [
      "JOB_MATCH",
      "APPLICATION",
      "INTERVIEW",
      "MESSAGE",
      "PAYMENT",
      "REVIEW",
      "SYSTEM"
    ],
    required: true,
  },

  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null, // jobId / applicationId / reviewId etc.
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  actionUrl: {
    type: String,
    default: null, // frontend redirect link (e.g. /jobs/123)
  },

  metadata: {
    type: Object,
    default: {}, // extra data (optional)
  }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);