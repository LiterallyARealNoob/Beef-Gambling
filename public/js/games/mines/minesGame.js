// Mines game — core game logic and API wiring (no visuals yet,
// that's handled by minesRenderer.js and minesVFX.js)

const MinesGame = (() => {
  const GRID_OPTIONS = {
    "3x3": { size: 3, totalTiles: 9, mineOptions: [1, 2, 3] },
    "5x5": { size: 5, totalTiles: 25, mineOptions: [1, 2, 3] },
    "10x10": { size: 10, totalTiles: 100, mineOptions: [5, 10, 15] }
  };

  let state = {
    sessionId: null,
    gridKey: "5x5",
    mineCount: 1,
    betAmount: 10,
    totalTiles: 25,
    revealedTiles: [],
    currentMultiplier: 1,
    status: "idle" // idle | active | busted | cashed_out
  };

  function getGridOptions() {
    return GRID_OPTIONS;
  }

  function getState() {
    return { ...state };
  }

  async function startGame({ gridKey, mineCount, betAmount }) {
    const gridConfig = GRID_OPTIONS[gridKey];
    if (!gridConfig) throw new Error("Invalid grid size");
    if (!gridConfig.mineOptions.includes(mineCount)) {
      throw new Error("Invalid mine count for this grid size");
    }

    const response = await fetch("/api/games/mines/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalTiles: gridConfig.totalTiles,
        mines: mineCount,
        betAmount
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to start game");

    state = {
      sessionId: data.sessionId,
      gridKey,
      mineCount,
      betAmount,
      totalTiles: data.totalTiles,
      revealedTiles: [],
      currentMultiplier: 1,
      status: "active"
    };

    return state;
  }

  async function revealTile(tileIndex) {
    if (state.status !== "active") throw new Error("No active game");

    const response = await fetch("/api/games/mines/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId, tileIndex })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to reveal tile");

    state.revealedTiles.push(tileIndex);

    if (data.hitMine) {
      state.status = "busted";
    } else {
      state.currentMultiplier = data.multiplier;
    }

    return data;
  }

  async function cashOut() {
    if (state.status !== "active") throw new Error("No active game");

    const response = await fetch("/api/games/mines/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to cash out");

    state.status = "cashed_out";
    return data;
  }

  function resetState() {
    state = {
      sessionId: null,
      gridKey: state.gridKey,
      mineCount: state.mineCount,
      betAmount: state.betAmount,
      totalTiles: state.totalTiles,
      revealedTiles: [],
      currentMultiplier: 1,
      status: "idle"
    };
  }

  return {
    getGridOptions,
    getState,
    startGame,
    revealTile,
    cashOut,
    resetState
  };
})();