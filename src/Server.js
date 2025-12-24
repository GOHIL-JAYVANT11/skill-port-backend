// src/server.js
const http = require("http");
const app = require("./App");
const connectDB = require("./config/db.js");
const config = require("./Index.js");


adminRoutes = require("./routes/AdminRoutes");

app.use("/gknbvg/SkillPort-admin/ertqyuiok", adminRoutes);

async function startServer() {
  await connectDB(config.mongoUri);

  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} 🚀`);
  });
}

startServer();
