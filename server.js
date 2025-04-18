const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = 3000;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("send-message", (msgObj) => {
    io.emit("receive-message", msgObj);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
