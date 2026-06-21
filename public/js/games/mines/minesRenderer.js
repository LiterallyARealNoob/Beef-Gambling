// Mines renderer — builds the grid DOM, wires up click handling,
// and updates the on-screen multiplier/payout display.

const MinesRenderer = (() => {
  let gridEl, multiplierEl, payoutEl, statusEl;
  let onTileClick = () => {};

  function init() {
    gridEl = document.getElementById("mines-grid");
    multiplierEl = document.getElementById("mines-multiplier");
    payoutEl = document.getElementById("mines-payout");
    statusEl = document.getElementById("mines-status");
  }

  function setTileClickHandler(handler) {
    onTileClick = handler;
  }

  function buildGrid(size, totalTiles) {
    gridEl.innerHTML = "";
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for (let i = 0; i < totalTiles; i++) {
      const tile = document.createElement("button");
      tile.className = "mine-tile";
      tile.dataset.index = i;
      tile.addEventListener("click", () => onTileClick(i));
      gridEl.appendChild(tile);
    }
  }

  function getTileEl(index) {
    return gridEl.querySelector(`[data-index="${index}"]`);
  }

  function markTileSafe(index) {
    const tile = getTileEl(index);
    tile.classList.add("revealed-safe");
    tile.disabled = true;
  }

  function markTileMine(index, isTheOneClicked) {
    const tile = getTileEl(index);
    tile.classList.add("revealed-mine");
    if (isTheOneClicked) tile.classList.add("mine-triggered");
    tile.disabled = true;
  }

  function disableAllTiles() {
    gridEl.querySelectorAll(".mine-tile").forEach((t) => (t.disabled = true));
  }

  function updateMultiplier(multiplier) {
    multiplierEl.textContent = `${multiplier.toFixed(2)}x`;
  }

  function updatePayout(payout) {
    payoutEl.textContent = `$${payout.toFixed(2)}`;
  }

  function setStatusText(text) {
    statusEl.textContent = text;
  }

  function resetGrid() {
    gridEl.innerHTML = "";
    multiplierEl.textContent = "1.00x";
    payoutEl.textContent = "$0.00";
    statusEl.textContent = "";
  }

  return {
    init,
    setTileClickHandler,
    buildGrid,
    markTileSafe,
    markTileMine,
    disableAllTiles,
    updateMultiplier,
    updatePayout,
    setStatusText,
    resetGrid
  };
})();