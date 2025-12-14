// src/app.js
const express = require("express");
const app = express();

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello, I am Skill Port 🚀");
});

module.exports = app;
