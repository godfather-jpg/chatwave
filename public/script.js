const socket = io();

// Force user to enter a non-empty username
let username = sessionStorage.getItem("username");

if (!username) {
  while (!username || username.trim() === "") {
    username = prompt("Enter your username (cannot be empty):");
  }
  sessionStorage.setItem("username", username);
}

socket.emit("join", username);

const form = document.querySelector("form");
const input = document.querySelector("#messageInput");
const chatBox = document.querySelector(".chat-box");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    // Check if the message is a private message
    if (text.startsWith("/pm")) {
      const parts = text.split(" ");
      const receiver = parts[1];
      const privateMessage = parts.slice(2).join(" ");

      if (receiver && privateMessage) {
        socket.emit("send-private-message", { receiver, text: privateMessage });
      } else {
        alert("Invalid private message format. Use /pm username message");
      }
    } else {
      // Send as a regular message
      socket.emit("send-message", { text });
    }

    input.value = ""; // Clear input field
  }
});

// Listen for the server to send messages
socket.on("load-messages", (history) => {
  history.forEach((msg) => {
    appendMessage(msg);
  });
});

socket.on("receive-message", (msg) => {
  appendMessage(msg);
});

function appendMessage({ username, text, time, isPrivate, isSystem }) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");

  // Apply appropriate styling
  if (isSystem) {
    msgDiv.classList.add("system");
  } else if (username === sessionStorage.getItem("username")) {
    msgDiv.classList.add("you");
  } else {
    msgDiv.classList.add("others");
  }

  if (isPrivate) {
    msgDiv.classList.add("private-message");
  }

  msgDiv.innerHTML = `<strong>${username}</strong> <span style="font-size: 0.8em; color: gray;">[${time}]</span>: ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
