const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db/db");
dotenv.config();
connectDB();
const app = express();
const httpServer = createServer(app);
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,              
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/uploads", express.static("uploads"));
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  }
});

// store which users are online
const onlineUsers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(userId);
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} joined room`);
    io.emit("update-online-users", Object.keys(onlineUsers));
  } else {
    console.log("User null joined room");
  }

  socket.on("sendMessage", (data) => {
    const { sender, receiver, message } = data;
    io.to(receiver).emit("receiveMessage", { sender, receiver, message });
  });

  socket.on("typing", ({ targetId, username, isGroup }) => {
    if (isGroup) {
      io.to(targetId).emit("typing", { username });
    } else {
      io.to(targetId).emit("typing", { username });
    }
  });

  socket.on("stop-typing", ({ targetId, username, isGroup }) => {
    if (isGroup) {
      io.to(targetId).emit("stop-typing", { username });
    } else {
      io.to(targetId).emit("stop-typing", { username });
    }
  });

  socket.on("joinGroup", (groupId) => {
    if (groupId) {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    }
  });

  socket.on("sendGroupMessage", (data) => {
    const { groupId, sender, text, fileUrl } = data;
    io.to(groupId).emit("receiveGroupMessage", {
      group: groupId,
      sender,
      text,
      fileUrl,
      createdAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit("user-offline", { userId });
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
