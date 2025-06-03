const socket = io();
let currentUser = null;
let currentRoom = null;

// DOM Elements
const elements = {
  authScreen: document.getElementById("authScreen"),
  chatInterface: document.getElementById("chatInterface"),
  publicAuth: document.getElementById("publicAuth"),
  privateAuth: document.getElementById("privateAuth"),
  privateAuthStep1: document.getElementById("privateAuthStep1"),
  privateAuthStep2: document.getElementById("privateAuthStep2"),
  joinPublicBtn: document.getElementById("joinPublicBtn"),
  verifyAdminBtn: document.getElementById("verifyAdminBtn"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinPrivateBtn: document.getElementById("joinPrivateBtn"),
  chatBox: document.getElementById("chatBox"),
  messageForm: document.getElementById("messageForm"),
  messageInput: document.getElementById("messageInput"),
  privateRoomsList: document.getElementById("privateRoomsList"),
  roomTitle: document.getElementById("roomTitle"),
};

// Initialize with proper event listeners
function init() {
  // Tab switching
  document.querySelectorAll(".auth-tabs button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(btn.dataset.tab);
    });
  });

  // Public chat join
  elements.joinPublicBtn.addEventListener("click", (e) => {
    e.preventDefault();
    joinPublicChat();
  });

  // Admin verification
  elements.verifyAdminBtn.addEventListener("click", (e) => {
    e.preventDefault();
    verifyAdmin();
  });

  // Create room
  elements.createRoomBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createRoom();
  });

  // Join private room
  elements.joinPrivateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    joinPrivateRoom();
  });

  // Send message
  elements.messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });
}

// Tab switching
function switchTab(tab) {
  document.querySelectorAll(".auth-tabs button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.querySelectorAll(".auth-form").forEach((form) => {
    form.classList.toggle("active", form.id === `${tab}Auth`);
  });
}

// Join public chat
function joinPublicChat() {
  const username = document.getElementById("publicUsername").value.trim();
  const pin = document.getElementById("publicPin").value;

  if (!username) {
    alert("Please enter a username");
    return;
  }

  socket.emit("public-auth", { username, pin }, (res) => {
    if (res.success) {
      currentUser = username;
      currentRoom = "public";
      elements.authScreen.style.display = "none";
      elements.chatInterface.style.display = "block";
      elements.roomTitle.textContent = "Public Chat";

      // Clear and load messages
      elements.chatBox.innerHTML = "";
      if (res.messages) {
        res.messages.forEach((msg) => addMessage(msg));
      }

      // Highlight public room
      document.querySelector(".room.public").classList.add("active");
    } else {
      alert(res.error || "Failed to join public chat");
    }
  });
}

// Verify admin
function verifyAdmin() {
  const pin = document.getElementById("adminPin").value;

  if (!pin) {
    alert("Please enter admin PIN");
    return;
  }

  socket.emit("private-auth", pin, (res) => {
    if (res.success) {
      elements.privateAuthStep1.style.display = "none";
      elements.privateAuthStep2.style.display = "block";
    } else {
      alert("Invalid Admin PIN");
    }
  });
}

// Create room
function createRoom() {
  const roomName = prompt("Enter room name:");
  if (!roomName) return;

  const roomPin = prompt("Set room PIN:");
  if (!roomPin) return;

  socket.emit("create-room", { roomName, roomPin }, (res) => {
    if (res.success) {
      addRoomToList(roomName);
      joinPrivateRoom(roomName, roomPin);
    } else {
      alert(res.error || "Failed to create room");
    }
  });
}

// Join private room
function joinPrivateRoom(roomName = null, roomPin = null) {
  if (!roomName) roomName = document.getElementById("roomName").value.trim();
  if (!roomPin) roomPin = document.getElementById("roomPin").value;
  const username = document.getElementById("privateUsername").value.trim();

  if (!roomName || !username) {
    alert("Please fill all fields");
    return;
  }

  socket.emit("join-private", { roomName, pin: roomPin, username }, (res) => {
    if (res.success) {
      currentUser = username;
      currentRoom = roomName;
      elements.authScreen.style.display = "none";
      elements.chatInterface.style.display = "block";
      elements.roomTitle.textContent = roomName;

      // Clear and load messages
      elements.chatBox.innerHTML = "";
      if (res.messages) {
        res.messages.forEach((msg) => addMessage(msg));
      }

      // Add to room list if new
      addRoomToList(roomName);

      // Highlight current room
      document.querySelectorAll(".room").forEach((room) => {
        room.classList.toggle("active", room.dataset.room === roomName);
      });
    } else {
      alert(res.error || "Failed to join private room");
    }
  });
}

// Add room to sidebar
function addRoomToList(roomName) {
  // Check if room already exists
  const existingRoom = document.querySelector(`.room[data-room="${roomName}"]`);
  if (existingRoom) return;

  const roomDiv = document.createElement("div");
  roomDiv.className = "room";
  roomDiv.dataset.room = roomName;
  roomDiv.textContent = roomName;

  roomDiv.addEventListener("click", () => {
    if (roomName !== currentRoom) {
      const pin = prompt(`Enter PIN for ${roomName}:`);
      if (pin) {
        joinPrivateRoom(roomName, pin);
      }
    }
  });

  elements.privateRoomsList.appendChild(roomDiv);
}

// Send message
function sendMessage() {
  const message = elements.messageInput.value.trim();

  if (message && currentUser && currentRoom) {
    socket.emit("send-message", message);
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }
}

// Add message to chat
function addMessage(msg) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";

  const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <strong>${msg.user}:</strong> ${msg.text}
    <span class="timestamp">${timestamp}</span>
  `;

  elements.chatBox.appendChild(messageDiv);
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
}

// Helper: Update user list display
function updateUserList(users) {
  const userListEl = document.getElementById("user-list");
  if (!userListEl) return;

  userListEl.innerHTML = ""; // Clear current list
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    userListEl.appendChild(li);
  });
}

// Socket events
socket.on("new-message", (msg) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message");

  // Check if the message is a whisper
  if (msg.text.includes("(whisper to")) {
    messageElement.classList.add("whisper");
  }

  messageElement.innerHTML = `<strong>${msg.user}</strong>: ${msg.text}`;
  chatBox.appendChild(messageElement);
});

// Handle user-joined event
socket.on("user-joined", (username) => {
  const systemMessage = {
    user: "System",
    text: `${username} joined the room`,
    timestamp: new Date().toISOString(),
  };
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", "system-message");
  messageElement.innerHTML = `<strong>${systemMessage.user}</strong>: ${systemMessage.text}`;
  chatBox.appendChild(messageElement);
});

socket.on("user-left", (username) => {
  addMessage({
    user: "System",
    text: `${username} left the room`,
    timestamp: new Date().toISOString(),
  });
});

// NEW: Listen for user list updates
socket.on("update-users", (users) => {
  updateUserList(users);
});

// Initialize
document.addEventListener("DOMContentLoaded", init);
