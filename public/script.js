const socket = io();
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const chatContainer = document.querySelector(".chat-container");
const form = document.querySelector("form");
const input = document.querySelector("#messageInput");
const chatBox = document.querySelector(".chat-box");
const chatHeader = document.querySelector(".chat-header");

// Show auth modal when page loads
authModal.style.display = "flex";

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("authUsername").value.trim();
  const pin = document.getElementById("authPin").value;

  if (!username) {
    alert("Please enter a username");
    return;
  }

  if (pin !== "2411") {
    // Change this PIN if you want
    alert("Wrong PIN! The correct PIN is 1234");
    return;
  }

  // Hide auth modal and show chat
  authModal.style.display = "none";
  chatContainer.style.display = "flex";

  // Store username and connect to chat
  sessionStorage.setItem("username", username);
  socket.emit("join", username);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    socket.emit("send-message", { text });
    input.value = "";
  }
});

socket.on("receive-message", (msg) => {
  appendMessage(msg);
});

socket.on("user-joined", (username) => {
  appendMessage({
    username: "System",
    text: `${username} joined the chat`,
    time: new Date().toLocaleTimeString(),
    isSystem: true,
  });
});

socket.on("user-left", (username) => {
  appendMessage({
    username: "System",
    text: `${username} left the chat`,
    time: new Date().toLocaleTimeString(),
    isSystem: true,
  });
});

function appendMessage({ username, text, time, isSystem }) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");

  if (isSystem) {
    msgDiv.classList.add("system");
  } else if (username === sessionStorage.getItem("username")) {
    msgDiv.classList.add("you");
  } else {
    msgDiv.classList.add("others");
  }

  msgDiv.innerHTML = `<strong>${username}</strong> <span style="font-size: 0.8em; color: gray;">[${time}]</span>: ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
