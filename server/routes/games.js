const express = require("express");
const router = express.Router();
const minesController = require("../controllers/minesController");

router.post("/mines/start", minesController.startGame);
router.post("/mines/reveal", minesController.revealTile);
router.post("/mines/cashout", minesController.cashOut);

module.exports = router;