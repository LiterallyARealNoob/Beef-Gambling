const db = require("../db/database");

function createUser(username) {
  const stmt = db.prepare(
    "INSERT INTO users (username) VALUES (?)"
  );
  const result = stmt.run(username);
  return getUserById(result.lastInsertRowid);
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getUserByUsername(username) {
  return db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
}

module.exports = { createUser, getUserById, getUserByUsername };