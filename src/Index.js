// src/config/index.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 4518,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skillport",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret"
};
