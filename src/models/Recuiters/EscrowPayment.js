const escrowPaymentSchema = new mongoose.Schema({

  projectId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"FreelanceProject"
  },

  milestoneId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Milestone"
  },

  recruiterId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"RecruiterProfile"
  },

  freelancerId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  amount:{
    type:Number
  },

  paymentStatus:{
    type:String,
    enum:["Pending","InEscrow","Released","Refunded"],
    default:"Pending"
  },

  transactionId:{
    type:String
  },

  paymentMethod:{
    type:String
  }

},{timestamps:true})

module.exports = mongoose.model("EscrowPayment",escrowPaymentSchema)