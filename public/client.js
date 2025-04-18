const socket = io();
const username = localStorage.getItem("username") || "Anonymous";

// Notify server when user joins
socket.emit("join", username);

// Send chat message
function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (message) {
    const msgObj = {
      username,
      text: message,
      time: new Date().toLocaleTimeString(),
    };
    socket.emit("send-message", msgObj);
    input.value = "";
  }
}

// Display messages
socket.on("receive-message", (msgObj) => {
  const messagesDiv = document.getElementById("messages");
  const msgEl = document.createElement("div");
  msgEl.textContent = `${msgObj.time} - ${msgObj.username}: ${msgObj.text}`;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
