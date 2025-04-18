const socket = io();
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const userName = prompt("Enter your username:") || "Anonymous";
const userColor = getRandomColor();

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = msgInput.value.trim();
  if (msg !== "") {
    const timestamp = new Date().toLocaleTimeString();
    socket.emit("send-message", {
      text: msg,
      user: userName,
      color: userColor,
      timestamp: timestamp,
    });
    msgInput.value = "";
  }
}

socket.on("receive-message", (msgObj) => {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message");

  const formattedText = msgObj.text; // basic formatting, emoji later
  msgEl.innerHTML = `<strong style="color:${msgObj.color}">[${msgObj.user}]:</strong> ${formattedText} <span style="font-size: 0.8em; color: gray;">[${msgObj.timestamp}]</span>`;

  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}
