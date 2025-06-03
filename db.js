// db.js
const Database = require("better-sqlite3");
const db = new Database("chat.db");

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT,
    user TEXT,
    text TEXT,
    timestamp TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    room TEXT
  )
`).run();

module.exports = {
  saveMessage: (room, user, text, timestamp) => {
    db.prepare(
      "INSERT INTO messages (room, user, text, timestamp) VALUES (?, ?, ?, ?)"
    ).run(room, user, text, timestamp);
  },

  getMessages: (room, limit = 50) => {
    return db.prepare(
      "SELECT user, text, timestamp FROM messages WHERE room = ? ORDER BY id DESC LIMIT ?"
    ).all(room, limit).reverse();
  },

  addUser: (room, username) => {
    db.prepare("INSERT INTO users (room, username) VALUES (?, ?)").run(room, username);
  },

  removeUser: (room, username) => {
    db.prepare("DELETE FROM users WHERE room = ? AND username = ?").run(room, username);
  },

  getUsers: (room) => {
    return db.prepare("SELECT username FROM users WHERE room = ?").all(room).map(row => row.username);
  }
};
