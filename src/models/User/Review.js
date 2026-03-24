const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  reviewText: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "completed",
  }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);