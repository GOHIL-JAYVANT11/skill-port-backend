// src/config/db.js
const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    if (!uri) throw new Error("MongoDB URI is missing");

    await mongoose.connect(uri);

    console.log("MongoDB Connected ✔");
  } catch (error) {
    console.error("MongoDB Connection Error ❌:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
