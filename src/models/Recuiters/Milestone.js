const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({

  projectId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"FreelanceProject"
  },

  freelancerId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  title:{
    type:String
  },

  amount:{
    type:Number
  },

  dueDate:{
    type:Date
  },

  status:{
    type:String,
    enum:["Pending","Submitted","Approved","Rejected"],
    default:"Pending"
  }

},{timestamps:true})

module.exports = mongoose.model("Milestone",milestoneSchema)