const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

const users = {}; // socket.id -> username
const usernames = {}; // username -> socket.id

function broadcastUserList() {
  io.emit("user-list", Object.values(users));
}

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    users[socket.id] = username;
    usernames[username] = socket.id;

    socket.broadcast.emit("receive-message", {
      text: `🟢 ${username} has joined the chat!`,
      username: "System",
      time: new Date().toLocaleTimeString(),
    });

    broadcastUserList();
  });

  socket.on("send-message", (msgObj) => {
    const msg = msgObj.text.trim();

    if (msg.startsWith("/pm ")) {
      const parts = msg.split(" ");
      const recipient = parts[1];
      const privateMsg = parts.slice(2).join(" ");
      const toSocket = usernames[recipient];

      if (toSocket) {
        const formatted = {
          text: `(Private) ${privateMsg}`,
          username: users[socket.id],
          time: new Date().toLocaleTimeString(),
          isPrivate: true,
        };

        socket.to(toSocket).emit("receive-message", formatted);
        socket.emit("receive-message", formatted);
      } else {
        socket.emit("receive-message", {
          text: `❌ User "${recipient}" not found.`,
          username: "System",
          time: new Date().toLocaleTimeString(),
        });
      }
    } else {
      io.emit("receive-message", msgObj);
    }
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      delete usernames[username];
      socket.broadcast.emit("receive-message", {
        text: `🔴 ${username} has left the chat.`,
        username: "System",
        time: new Date().toLocaleTimeString(),
      });
    }
    delete users[socket.id];
    broadcastUserList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
