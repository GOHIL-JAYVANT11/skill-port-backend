const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FreelanceProject"
  },

  recId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RecruiterProfile"
  },

  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  coverLetter: {
    type: String
  },

  proposedBudget: {
    type: Number
  },

  deliveryDays: {
    type: Number
  },

  attachments: [{
    fileUrl: String
  }],

  status: {
    type: String,
    enum:["Pending","Accepted","Rejected"],
    default:"Pending"
  }

},{timestamps:true});

module.exports = mongoose.model("Proposal",proposalSchema);