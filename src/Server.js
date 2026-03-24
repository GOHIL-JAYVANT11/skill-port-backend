// src/server.js
const http = require("http");
const app = require("./App");
const connectDB = require("./config/db.js");
const config = require("./Index.js");
const { Server } = require("socket.io");


const adminRoutes = require("./routes/Admin.Route");
const userRoutes = require("./routes/User.Route");
const authRoutes = require("./routes/Auth.Route");
const recruiterRoutes = require("./routes/Recuiters.route");
const paymentRoutes = require("./routes/Payment.Route");

app.use("/gknbvg/SkillPort-admin/ertqyuiok", adminRoutes);
app.use("/gknbvg/SkillPort-user/ertqyuiok", userRoutes);
app.use("/gknbvg/SkillPort-recruiter/ertqyuiok", recruiterRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);



async function startServer() {
  await connectDB(config.mongoUri);

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", ({ roomId, userId, userName }) => {
      socket.join(roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }
      rooms[roomId].push({ socketId: socket.id, userId, userName });
      console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit("user-joined", { socketId: socket.id, userId, userName });
      
      // Send current participants to the newly joined user
      socket.emit("room-participants", rooms[roomId].filter(p => p.socketId !== socket.id));
    });

    socket.on("offer", ({ roomId, offer, targetSocketId }) => {
      socket.to(targetSocketId).emit("offer", { offer, fromSocketId: socket.id });
    });

    socket.on("answer", ({ roomId, answer, targetSocketId }) => {
      socket.to(targetSocketId).emit("answer", { answer, fromSocketId: socket.id });
    });

    socket.on("ice-candidate", ({ roomId, candidate, targetSocketId }) => {
      socket.to(targetSocketId).emit("ice-candidate", { candidate, fromSocketId: socket.id });
    });

    socket.on("chat-message", ({ roomId, message, userName }) => {
      io.to(roomId).emit("chat-message", { message, userName, fromSocketId: socket.id, timestamp: new Date() });
    });

    socket.on("media-state", ({ roomId, isAudioMuted, isVideoOff }) => {
      socket.to(roomId).emit("media-state-changed", { socketId: socket.id, isAudioMuted, isVideoOff });
    });

    socket.on("reaction", ({ roomId, reaction }) => {
      io.to(roomId).emit("new-reaction", { socketId: socket.id, reaction });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
      socket.to(roomId).emit("user-left", socket.id);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const roomId in rooms) {
        if (rooms[roomId].some(p => p.socketId === socket.id)) {
          rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
          socket.to(roomId).emit("user-left", socket.id);
          if (rooms[roomId].length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} 🚀`);
  });
}

startServer();
