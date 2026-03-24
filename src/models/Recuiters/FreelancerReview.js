const mongoose = require("mongoose");

const freelancerReviewSchema = new mongoose.Schema({

  projectId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"FreelanceProject"
  },

  recruiterId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"RecruiterProfile"
  },

  freelancerId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  rating:{
    type:Number,
    min:1,
    max:5
  },

  review:{
    type:String
  }

},{timestamps:true})

module.exports = mongoose.model("FreelancerReview",freelancerReviewSchema)