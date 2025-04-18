const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

const users = {}; // Stores users by socket ID

io.on("connection", (socket) => {
  console.log("A user connected");

  // When a user joins
  socket.on("join", (username) => {
    users[socket.id] = username;

    // Notify everyone else
    socket.broadcast.emit("receive-message", {
      username: "System",
      text: `🟢 ${username} has joined the chat.`,
      time: new Date().toLocaleTimeString(),
    });
  });

  // Handle message sending
  socket.on("send-message", (msgObj) => {
    io.emit("receive-message", msgObj);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      socket.broadcast.emit("receive-message", {
        username: "System",
        text: `🔴 ${username} left the chat.`,
        time: new Date().toLocaleTimeString(),
      });
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
