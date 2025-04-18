const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

const users = {}; // Tracks users by socket ID

// When a user joins, send a welcome message
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle new users joining
  socket.on("join", (username) => {
    users[socket.id] = username; // Save the username

    // Send a message to all other users saying "X has joined"
    socket.broadcast.emit("receive-message", {
      text: `🟢 ${username} has joined the chat!`,
      username: "System",
      time: new Date().toLocaleTimeString(),
    });
  });

  // Handle receiving messages
  socket.on("send-message", (msgObj) => {
    io.emit("receive-message", msgObj); // Broadcast the message to all users
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
