const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const db = require("./db"); // ✅ SQLite

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration
const PUBLIC_PIN = "2411";
const ADMIN_PIN = "123345";
const MAX_ROOMS = 10;

// Data storage (for tracking current connections only)
const privateRooms = new Map(); // roomName -> { pin }

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  let currentUser = null;
  let currentRoom = null;

  function updateUserList(roomName) {
    const users = db.getUsers(roomName);
    io.to(roomName).emit("update-users", users);
  }

  // Public room auth
  socket.on("public-auth", ({ username, pin }, callback) => {
    if (pin !== PUBLIC_PIN) {
      return callback({ success: false, error: "Invalid PIN" });
    }

    currentUser = username;
    currentRoom = "public";
    socket.join("public");

    db.addUser("public", username);

    callback({
      success: true,
      messages: db.getMessages("public"),
    });

    socket.to("public").emit("user-joined", username);
    updateUserList("public");
  });

  // Private room auth (PIN check only)
  socket.on("private-auth", (pin, callback) => {
    callback({ success: pin === ADMIN_PIN });
  });

  // Create private room
  socket.on("create-room", ({ roomName, roomPin }, callback) => {
    if (privateRooms.size >= MAX_ROOMS) {
      return callback({ success: false, error: "Room limit reached" });
    }
    if (privateRooms.has(roomName)) {
      return callback({ success: false, error: "Room already exists" });
    }

    privateRooms.set(roomName, { pin: roomPin });
    callback({ success: true, roomName });
  });

  // Join private room
  socket.on("join-private", ({ roomName, pin, username }, callback) => {
    const room = privateRooms.get(roomName);
    if (!room || room.pin !== pin) {
      return callback({ success: false, error: "Invalid room/PIN" });
    }

    currentUser = username;
    currentRoom = roomName;
    socket.join(roomName);

    db.addUser(roomName, username);

    callback({
      success: true,
      messages: db.getMessages(roomName),
    });

    socket.to(roomName).emit("user-joined", username);
    updateUserList(roomName);
  });

  socket.on("send-message", (message) => {
  if (!currentUser || !currentRoom) return;

  socket.username = currentUser; // Make sure this is set somewhere when user connects/join

  const whisperMatch = message.match(/^\/whisper to (\w+): (.+)$/);
  if (whisperMatch) {
    const targetUser = whisperMatch[1];
    const whisperMessage = whisperMatch[2];

    const targetSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.username === targetUser
    );

    if (targetSocket) {
      const timestamp = new Date().toISOString();
      db.saveMessage(currentRoom, currentUser, whisperMessage, timestamp); // Save whisper message

      targetSocket.emit("new-message", {
        user: currentUser,
        text: `(whisper to ${targetUser}): ${whisperMessage}`,
        timestamp,
      });
    }
  } else {
    const timestamp = new Date().toISOString();
    const msgData = {
      user: currentUser,
      text: message,
      timestamp,
    };

    db.saveMessage(currentRoom, currentUser, message, timestamp);

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
  }
});

  // Handle disconnect
  socket.on("disconnect", () => {
    if (currentUser && currentRoom) {
      socket.to(currentRoom).emit("user-left", currentUser);
      db.removeUser(currentRoom, currentUser);
      updateUserList(currentRoom);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public PIN: ${PUBLIC_PIN} | Admin PIN: ${ADMIN_PIN}`);
});
