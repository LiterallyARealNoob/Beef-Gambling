const MinesUI = (() => {
  let gridSelect, mineSelect, betInput, startBtn, cashOutBtn;

  function init() {
    MinesRenderer.init();

    gridSelect  = document.getElementById("mines-grid-select");
    mineSelect  = document.getElementById("mines-mine-select");
    betInput    = document.getElementById("global-bet-input");
    startBtn    = document.getElementById("mines-start-btn");
    cashOutBtn  = document.getElementById("mines-cashout-btn");

    populateGridOptions();
    gridSelect.addEventListener("change", populateMineOptions);
    populateMineOptions();

    startBtn.addEventListener("click", handleStart);
    cashOutBtn.addEventListener("click", handleCashOut);
    MinesRenderer.setTileClickHandler(handleTileClick);

    setControlsEnabled(true);
    cashOutBtn.disabled = true;
  }

  function populateGridOptions() {
    const options = MinesGame.getGridOptions();
    gridSelect.innerHTML = "";
    Object.keys(options).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key;
      gridSelect.appendChild(opt);
    });
  }

  function populateMineOptions() {
    const options = MinesGame.getGridOptions();
    const { mineOptions } = options[gridSelect.value];
    mineSelect.innerHTML = "";
    mineOptions.forEach(count => {
      const opt = document.createElement("option");
      opt.value = count;
      opt.textContent = `${count} mine${count > 1 ? "s" : ""}`;
      mineSelect.appendChild(opt);
    });
  }

  function setControlsEnabled(enabled) {
    gridSelect.disabled = !enabled;
    mineSelect.disabled = !enabled;
    startBtn.disabled   = !enabled;
  }

  async function handleStart() {
    const gridKey   = gridSelect.value;
    const mineCount = parseInt(mineSelect.value, 10);
    const betAmount = parseFloat(betInput.value);

    if (!betAmount || betAmount <= 0) {
      MinesRenderer.setStatusText("Enter a valid bet amount", "loss");
      return;
    }
    if (betAmount > BalanceManager.getBalance()) {
      MinesRenderer.setStatusText("Insufficient balance!", "loss");
      return;
    }

    try {
      const state      = await MinesGame.startGame({ gridKey, mineCount, betAmount });
      const gridConfig = MinesGame.getGridOptions()[gridKey];

      MinesRenderer.resetGrid();
      MinesRenderer.buildGrid(gridConfig.size, state.totalTiles);
      MinesRenderer.setStatusText("Pick a tile!", "");

      setControlsEnabled(false);
      cashOutBtn.disabled = true;
    } catch (err) {
      MinesRenderer.setStatusText(err.message, "loss");
    }
  }

  async function handleTileClick(tileIndex) {
    try {
      const result  = await MinesGame.revealTile(tileIndex);
      const state   = MinesGame.getState();
      const options = MinesGame.getGridOptions();
      const totalSafe = options[state.gridKey].totalTiles - state.mineCount;

      if (result.hitMine) {
        MinesRenderer.markTileMine(tileIndex, true);
        (result.mineTiles || []).forEach(idx => {
          if (idx !== tileIndex) MinesRenderer.markTileMine(idx, false);
        });
        MinesRenderer.disableAllTiles();
        MinesRenderer.setStatusText("💥 Busted! You hit a mine.", "loss");
        MinesGame.recordLoss();
        cashOutBtn.disabled = true;
        setControlsEnabled(true);
      } else {
        MinesRenderer.markTileSafe(tileIndex, state.revealedTiles.length, totalSafe);
        MinesRenderer.updateMultiplier(result.multiplier);
        MinesRenderer.updatePayout(result.payout);
        MinesRenderer.setStatusText("🔥 Safe! Keep going or cash out.", "");
        cashOutBtn.disabled = false;
      }
    } catch (err) {
      MinesRenderer.setStatusText(err.message, "loss");
    }
  }

  async function handleCashOut() {
    try {
      const result = await MinesGame.cashOut();
      MinesRenderer.disableAllTiles();
      MinesRenderer.setStatusText(
        `✅ Cashed out $${result.payout.toFixed(2)} at ${result.multiplier.toFixed(2)}x`, "win"
      );
      cashOutBtn.disabled = true;
      setControlsEnabled(true);
    } catch (err) {
      MinesRenderer.setStatusText(err.message, "loss");
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mines-grid")) MinesUI.init();
});