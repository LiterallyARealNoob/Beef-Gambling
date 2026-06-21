const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/test-user", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username required" });
  }

  let user = User.getUserByUsername(username);
  if (!user) {
    user = User.createUser(username);
  }
  res.json(user);
});

module.exports = router;