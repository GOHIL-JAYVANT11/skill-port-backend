const mongoose = require("mongoose");

const freelanceProjectSchema = new mongoose.Schema({

  recId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RecruiterProfile",
    required: true
  },

  companyName: {
    type: String
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  skillsRequired: [{
    type: String
  }],

  budget: {
    min: Number,
    max: Number
  },

  duration: {
    type: String
  },

  experienceLevel: {
    type: String,
    enum: ["Beginner","Intermediate","Expert"]
  },

  attachments: [{
    fileName: String,
    fileUrl: String
  }],

  milestonePlan: [{
    title: String,
    amount: Number,
    status: {
      type: String,
      enum:["Pending","InProgress","Completed"],
      default:"Pending"
    }
  }],

  proposalsCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum:["Open","Closed","Completed"],
    default:"Open"
  }

}, {timestamps:true});

module.exports = mongoose.model("FreelanceProject", freelanceProjectSchema);