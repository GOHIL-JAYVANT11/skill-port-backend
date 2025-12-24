// src/config/index.js
require("dotenv").config();


module.exports = {
  port: process.env.PORT || 4518,
  mongoUri: process.env.MONGO_URI ,
  jwtSecret: process.env.JWT_SECRET 
};
