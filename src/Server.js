// src/server.js
const http = require("http");
const app = require("./App");
const connectDB = require("./config/db.js");
const config = require("./Index.js");


const adminRoutes = require("./routes/Admin.Route");
const userRoutes = require("./routes/User.Route");
const authRoutes = require("./routes/Auth.Route");
const recruiterRoutes = require("./routes/Recuiters.route");

app.use("/gknbvg/SkillPort-admin/ertqyuiok", adminRoutes);
app.use("/gknbvg/SkillPort-user/ertqyuiok", userRoutes);
app.use("/gknbvg/SkillPort-recruiter/ertqyuiok", recruiterRoutes);
app.use("/api/auth", authRoutes);



async function startServer() {
  await connectDB(config.mongoUri);

  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} 🚀`);
  });
}

startServer();
