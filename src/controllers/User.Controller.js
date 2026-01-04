const jwt =  require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const User = require('../models/User');
const { getOtpTemplate } = require('../utils/emailTemplate');


async function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

class UserController{

  async register(req,res){
     try {
          const { Fullname, number,email, password, Role } = req.body;
    
          const existingUser = await User.findOne({ number  });
          if (existingUser)
            return res.status(400).json({ message: "User already exists" });
    
          if (!password) return res.status(400).json({ message: "Password required" });
          if (!Role) return res.status(400).json({ message: "Role required" });
    
          const hashedPassword = await bcrypt.hash(password, 12);
    
          const User = new User({
            Fullname,
            email,
            number,
            password: hashedPassword,
            Role
          });
    
          await User.save();
    
          return res.status(201).json({
            message: "User registered successfully",
            user: User
          });
    
        } catch (error) {
          return res.status(500).json({ message: "Server error", error: error.message });
        }
  }

}

module.exports = new UserController();