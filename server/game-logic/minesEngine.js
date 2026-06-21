function createGame({ totalTiles, mines, betAmount }) {
  if (mines >= totalTiles) throw new Error("Too many mines for this grid");

  return {
    totalTiles,
    mines,
    betAmount,
    status: "active",
    mineTiles: [],
    revealedTiles: [],
    minesPlaced: false
  };
}

function placeMines(totalTiles, mineCount, excludeIndex) {
  const positions = [];
  while (positions.length < mineCount) {
    const r = Math.floor(Math.random() * totalTiles);
    if (r !== excludeIndex && !positions.includes(r)) {
      positions.push(r);
    }
  }
  return positions;
}

function calcMultiplier(totalTiles, mineCount, revealedCount) {
  const safeTiles = totalTiles - mineCount;
  let multiplier = 1;
  for (let i = 0; i < revealedCount; i++) {
    multiplier *= safeTiles / (safeTiles - i);
  }
  return parseFloat((multiplier * 0.97).toFixed(4));
}

function revealTile(game, tileIndex, forceWin = false) {
  if (game.status !== "active") throw new Error("No active game");
  if (game.revealedTiles.includes(tileIndex)) throw new Error("Tile already revealed");

  // Place mines on first reveal, never on the clicked tile
  if (!game.minesPlaced) {
    game.mineTiles = placeMines(game.totalTiles, game.mines, tileIndex);
    game.minesPlaced = true;
  }

  const hitMine = !forceWin && game.mineTiles.includes(tileIndex);

  if (hitMine) {
    game.status = "busted";
    return {
      hitMine: true,
      tileIndex,
      mineTiles: game.mineTiles,
      status: "busted"
    };
  }

  game.revealedTiles.push(tileIndex);
  const multiplier = calcMultiplier(game.totalTiles, game.mines, game.revealedTiles.length);
  const payout = parseFloat((game.betAmount * multiplier).toFixed(2));

  return {
    hitMine: false,
    tileIndex,
    multiplier,
    payout,
    revealedCount: game.revealedTiles.length,
    status: "active"
  };
}

function cashOut(game) {
  if (game.status !== "active") throw new Error("No active game");

  const multiplier = calcMultiplier(game.totalTiles, game.mines, game.revealedTiles.length);
  const payout = parseFloat((game.betAmount * multiplier).toFixed(2));

  game.status = "cashed_out";

  return {
    multiplier,
    payout,
    status: "cashed_out"
  };
}

module.exports = { createGame, revealTile, cashOut };