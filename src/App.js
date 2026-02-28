// src/app.js
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

app.use(cors(
  {
    origin: '*',
    // origin: "http://localhost:5173",
    allowedHeaders: false,
  }
));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Test route
app.get("/", (req, res) => {
  res.send("Hello, I am Skill Port 🚀");
});

module.exports = app;
