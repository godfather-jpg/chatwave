const socket = io();
let username = localStorage.getItem("username");

if (!username) {
  username = prompt("Enter your username:");
  localStorage.setItem("username", username);
}

socket.emit("join", username);

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const chatBox = document.getElementById("chat-box");
const userList = document.getElementById("user-list");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value;
  if (text.trim() === "") return;

  const msgObj = {
    text,
    username,
    time: new Date().toLocaleTimeString(),
  };

  socket.emit("send-message", msgObj);
  input.value = "";
});

socket.on("receive-message", (msg) => {
  const div = document.createElement("div");
  div.classList.add("message");

  if (msg.isPrivate) {
    div.classList.add("private");
  }

  div.innerHTML = `<strong>${msg.username}</strong> <em>${msg.time}</em><br/>${msg.text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("user-list", (usernames) => {
  userList.innerHTML = "";
  usernames.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    userList.appendChild(li);
  });
});
