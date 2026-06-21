// Tracks force-win toggle state per game. Simple in-memory store
// for now — admin panel flips these on/off, and controllers check
// them before running game logic.

const forceWinState = {
  mines: false,
  plinko: false,
  dice: false,
  plane: false,
  crash: false
};

function isForceWinActive(gameName) {
  return !!forceWinState[gameName];
}

function setForceWin(gameName, isActive) {
  if (!(gameName in forceWinState)) {
    throw new Error(`Unknown game: ${gameName}`);
  }
  forceWinState[gameName] = isActive;
  return forceWinState[gameName];
}

function getAllStates() {
  return { ...forceWinState };
}

module.exports = { isForceWinActive, setForceWin, getAllStates };