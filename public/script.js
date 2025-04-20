// Initialize Socket.io
const socket = io();
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const chatContainer = document.querySelector(".chat-container");
const chatBox = document.getElementById("chatBox");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const statusIndicator = document.getElementById("statusIndicator");

// Check for existing session
const storedUsername = sessionStorage.getItem("username");
if (storedUsername) {
  authModal.style.display = "none";
  chatContainer.style.display = "flex";
  socket.emit("join", storedUsername);
}

// Login Handler
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("authUsername").value.trim();
  const pin = document.getElementById("authPin").value;

  if (!username) {
    alert("Please enter a username");
    return;
  }

  if (pin !== "2411") {
    alert("Incorrect PIN. Please try again.");
    return;
  }

  sessionStorage.setItem("username", username);
  authModal.style.display = "none";
  chatContainer.style.display = "flex";
  socket.emit("join", username);
});

// Message Handler
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  const username = sessionStorage.getItem("username");

  if (message && username) {
    socket.emit("send-message", {
      username,
      text: message,
    });
    messageInput.value = "";
  }
});

// Socket Events
socket.on("connect", () => {
  statusIndicator.style.color = "#4CAF50";
});

socket.on("disconnect", () => {
  statusIndicator.style.color = "#F44336";
});

socket.on("receive-message", (msg) => {
  appendMessage(msg, false);
});

socket.on("user-joined", (username) => {
  appendSystemMessage(`${username} joined the chat`);
});

socket.on("user-left", (username) => {
  appendSystemMessage(`${username} left the chat`);
});

// Helper Functions
function appendMessage(msg, isYou) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(isYou ? "you" : "others");

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  messageDiv.innerHTML = `
    <strong>${msg.username}</strong>
    <span class="message-time">${time}</span>
    <div>${msg.text}</div>
  `;

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add("system");
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
