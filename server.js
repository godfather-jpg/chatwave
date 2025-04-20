const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messages = [];
const users = {};

app.use(express.static("public"));

io.on("connection", (socket) => {
  let username;

  socket.on("join", (name) => {
    username = name;
    users[username] = socket.id;

    // Send chat history
    socket.emit("load-messages", messages);

    // Notify others
    socket.broadcast.emit("user-joined", username);
  });

  socket.on("send-message", (msg) => {
    if (!username) return;

    const message = {
      username,
      text: msg.text,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);
    io.emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    if (username) {
      delete users[username];
      io.emit("user-left", username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JoyChat server running on port ${PORT}`);
  console.log("System PIN: 2411");
});
