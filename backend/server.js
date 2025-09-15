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
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/uploads", express.static("uploads"));
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  } else {
    console.log("User null joined room");
  }

  socket.on("sendMessage", (data) => {
    const { sender, receiver, message } = data;
    // deliver to receiver in realtime
    io.to(receiver).emit("receiveMessage", { sender, receiver, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
