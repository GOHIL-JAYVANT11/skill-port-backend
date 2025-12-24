// src/app.js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors(
  {
    origin: '*',
    // origin: "http://localhost:5173",
    allowedHeaders: false,
  }
));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello, I am Skill Port 🚀");
});

module.exports = app;
