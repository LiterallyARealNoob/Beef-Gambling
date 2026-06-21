// Mines controller — handles incoming requests for starting games,
// revealing tiles, and cashing out. Talks to minesEngine for logic
// and forceWinManager for the admin override state.

const minesEngine = require("../game-logic/minesEngine");
const forceWinManager = require("../game-logic/forceWinManager");

// In-memory store of active game sessions, keyed by session ID.
const activeSessions = new Map();

function generateSessionId() {
  return `mines_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function startGame(req, res) {
  try {
    const { totalTiles, mines, betAmount } = req.body;

    if (!totalTiles || !mines || !betAmount) {
      return res.status(400).json({
        error: "totalTiles, mines, and betAmount are required"
      });
    }

    const game = minesEngine.createGame({ totalTiles, mines, betAmount });
    const sessionId = generateSessionId();
    activeSessions.set(sessionId, game);

    res.json({
      sessionId,
      totalTiles: game.totalTiles,
      mines: game.mines,
      betAmount: game.betAmount,
      status: game.status
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function revealTile(req, res) {
  try {
    const { sessionId, tileIndex } = req.body;

    const game = activeSessions.get(sessionId);
    if (!game) {
      return res.status(404).json({ error: "Game session not found" });
    }

    if (typeof tileIndex !== "number") {
      return res.status(400).json({ error: "tileIndex must be a number" });
    }

    const forceWinActive = forceWinManager.isForceWinActive("mines");
    const result = minesEngine.revealTile(game, tileIndex, forceWinActive);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function cashOut(req, res) {
  try {
    const { sessionId } = req.body;

    const game = activeSessions.get(sessionId);
    if (!game) {
      return res.status(404).json({ error: "Game session not found" });
    }

    const result = minesEngine.cashOut(game);
    activeSessions.delete(sessionId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { startGame, revealTile, cashOut };