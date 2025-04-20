const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messages = [];
const users = {};

// The PIN everyone needs to enter (change this if you want)
const CHAT_PIN = "2411";

app.use(express.static("public"));

io.on("connection", (socket) => {
  let username;

  socket.on("join", (name) => {
    username = name;
    users[username] = socket.id;

    // Notify everyone
    io.emit("user-joined", username);

    // Send chat history
    socket.emit("load-messages", messages);
  });

  socket.on("send-message", (msgData) => {
    const time = new Date().toLocaleTimeString();
    const message = {
      username,
      text: msgData.text,
      time,
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

server.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log(`Chat PIN is: ${CHAT_PIN}`);
});
