const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration (Added private room pins)
const PUBLIC_PIN = "2411";
const ADMIN_PIN = "123345"; // NEW
const MAX_ROOMS = 10; // NEW

// Data storage (Added private rooms)
const publicChat = {
  users: new Set(),
  messages: [],
};

const privateRooms = new Map(); // NEW: roomName -> {pin, users, messages}

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  let currentUser = null;
  let currentRoom = null;

  // Original public chat handlers
  socket.on("public-auth", ({ username, pin }, callback) => {
    if (pin !== PUBLIC_PIN)
      return callback({ success: false, error: "Invalid PIN" });

    currentUser = username;
    currentRoom = "public";
    publicChat.users.add(username);
    socket.join("public");

    callback({
      success: true,
      messages: publicChat.messages.slice(-50),
    });

    socket.to("public").emit("user-joined", username);
  });

  // NEW: Private room handlers
  socket.on("private-auth", (pin, callback) => {
    callback({ success: pin === ADMIN_PIN });
  });

  socket.on("create-room", ({ roomName, roomPin }, callback) => {
    if (privateRooms.size >= MAX_ROOMS) {
      return callback({ success: false, error: "Room limit reached" });
    }
    if (privateRooms.has(roomName)) {
      return callback({ success: false, error: "Room exists" });
    }

    privateRooms.set(roomName, {
      pin: roomPin,
      users: new Set(),
      messages: [],
    });

    callback({ success: true, roomName });
  });

  socket.on("join-private", ({ roomName, pin, username }, callback) => {
    const room = privateRooms.get(roomName);
    if (!room || room.pin !== pin) {
      return callback({ success: false, error: "Invalid room/PIN" });
    }

    currentUser = username;
    currentRoom = roomName;
    room.users.add(username);
    socket.join(roomName);

    callback({
      success: true,
      messages: room.messages.slice(-50),
    });

    socket.to(roomName).emit("user-joined", username);
  });

  // Original message handler (updated for private rooms)
  socket.on("send-message", (message) => {
    if (!currentUser || !currentRoom) return;

    const msgData = {
      user: currentUser,
      text: message,
      timestamp: new Date().toISOString(),
    };

    if (currentRoom === "public") {
      publicChat.messages.push(msgData);
      io.to("public").emit("new-message", msgData);
    } else {
      const room = privateRooms.get(currentRoom);
      if (room) {
        room.messages.push(msgData);
        io.to(currentRoom).emit("new-message", msgData);
      }
    }
  });

  // Original disconnect handler (updated for private rooms)
  socket.on("disconnect", () => {
    if (currentUser && currentRoom) {
      if (currentRoom === "public") {
        publicChat.users.delete(currentUser);
        socket.to("public").emit("user-left", currentUser);
      } else {
        const room = privateRooms.get(currentRoom);
        if (room) {
          room.users.delete(currentUser);
          socket.to(currentRoom).emit("user-left", currentUser);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public PIN: ${PUBLIC_PIN} | Admin PIN: ${ADMIN_PIN}`); // Updated
});
