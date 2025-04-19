const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messages = []; // Stores chat history
let users = {}; // To track connected users and their sockets

app.use(express.static("public"));

io.on("connection", (socket) => {
  let username;

  // Listen for the join event and store the username
  socket.on("join", (name) => {
    username = name;
    users[username] = socket.id; // Track the user's socket ID

    io.emit("receive-message", {
      username: "System",
      text: `${username} has joined the chat.`,
      time: new Date().toLocaleTimeString(),
      isPrivate: false,
    });

    socket.emit("load-messages", messages); // Load previous messages
  });

  // Listen for send-message event (public message)
  socket.on("send-message", (msgData) => {
    const time = new Date().toLocaleTimeString();
    const message = {
      username,
      text: msgData.text,
      time,
      isPrivate: false,
    };
    messages.push(message); // Store the message in history
    io.emit("receive-message", message); // Broadcast the message to all users
  });

  // Listen for private message event
  socket.on("send-private-message", (data) => {
    const time = new Date().toLocaleTimeString();
    const message = {
      username,
      text: data.text,
      time,
      isPrivate: true,
    };

    const receiverSocketId = users[data.receiver]; // Get the socket ID of the receiver

    if (receiverSocketId) {
      // If the receiver is connected, send the private message
      io.to(receiverSocketId).emit("receive-message", message);
    } else {
      // If receiver is not found, you can notify the sender that the user is offline
      socket.emit("receive-message", {
        username: "System",
        text: `User ${data.receiver} is not online.`,
        time: new Date().toLocaleTimeString(),
        isPrivate: false,
      });
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    delete users[username]; // Remove user from the active users list
    io.emit("receive-message", {
      username: "System",
      text: `${username} has left the chat.`,
      time: new Date().toLocaleTimeString(),
      isPrivate: false,
    });
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
