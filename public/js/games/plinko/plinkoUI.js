const PlinkoUI = (() => {
  let rowSelect, betInput, dropBtn, multiplierEl, payoutEl, statusEl, historyList, bigwinPanel;
  let dropsInFlight = 0;

  function init() {
    PlinkoRenderer.init();

    rowSelect    = document.getElementById("plinko-risk-select");
    betInput     = document.getElementById("plinko-bet-input");
    dropBtn      = document.getElementById("plinko-drop-btn");
    multiplierEl = document.getElementById("plinko-multiplier");
    payoutEl     = document.getElementById("plinko-payout");
    statusEl     = document.getElementById("plinko-status");
    historyList  = document.getElementById("plinko-history-list");
    bigwinPanel  = document.getElementById("plinko-bigwin-panel");

    populateRowOptions();
    rowSelect.addEventListener("change", () => {
      PlinkoRenderer.setRows(parseInt(rowSelect.value, 10));
    });

    dropBtn.addEventListener("click", handleDrop);
    initWagerShortcuts();

    PlinkoRenderer.setRows(parseInt(rowSelect.value, 10));
  }

  function populateRowOptions() {
    const options = PlinkoGame.getRowOptions(); // [8, 12, 16]
    rowSelect.innerHTML = "";
    options.forEach(rows => {
      const opt = document.createElement("option");
      opt.value = rows;
      opt.textContent = `${rows} Rows`;
      if (rows === 12) opt.selected = true;
      rowSelect.appendChild(opt);
    });
  }

  function initWagerShortcuts() {
    document.querySelectorAll('.plinko-wager .game-wager-shortcuts button').forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = parseFloat(betInput.value) || 0;
        switch (btn.dataset.action) {
          case "min":
            betInput.value = 1;
            break;
          case "half":
            betInput.value = Math.max(1, current / 2).toFixed(2);
            break;
          case "max":
            betInput.value = BalanceManager.getBalance();
            break;
        }
      });
    });
  }

  // Drop balls as fast as you click — no cooldown, no single-ball lock.
  // Row count still can't change mid-air since the peg layout for a given
  // row count is shared by the renderer, so we lock the rows dropdown only
  // while at least one ball is in flight, not the drop button itself.
  async function handleDrop() {
    const rows      = parseInt(rowSelect.value, 10);
    const betAmount = parseFloat(betInput.value);

    try {
      dropsInFlight++;
      rowSelect.disabled = true;

      const result = await PlinkoGame.drop({ rows, betAmount });

      PlinkoRenderer.animateDrop(result.path, result.bucket, () => {
        finishDrop(result);
      });
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.className = "status-text loss";
      dropsInFlight = Math.max(0, dropsInFlight - 1);
      if (dropsInFlight === 0) rowSelect.disabled = false;
    }
  }

  function finishDrop(result) {
    const won = result.multiplier >= 1;

    multiplierEl.textContent = `${result.multiplier}x`;
    payoutEl.textContent = `$${result.payout.toFixed(2)}`;

    statusEl.textContent = won
      ? `🔥 Landed ${result.multiplier}x — won $${result.payout.toFixed(2)}!`
      : `Landed ${result.multiplier}x — better luck next drop.`;
    statusEl.className = `status-text ${won ? "win" : "loss"}`;

    addHistoryEntry(result);
    if (result.multiplier >= 10) updateBigWin(result);

    dropsInFlight = Math.max(0, dropsInFlight - 1);
    if (dropsInFlight === 0) rowSelect.disabled = false;
  }

  function addHistoryEntry(result) {
    const won = result.multiplier >= 1;
    const entry = document.createElement("div");
    entry.className = `plinko-history-entry ${won ? "win" : "loss"}`;
    entry.innerHTML = `
      <span class="history-mult">${result.multiplier}x</span>
      <span class="history-payout">$${result.payout.toFixed(2)}</span>
    `;
    historyList.prepend(entry);
    while (historyList.children.length > 12) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  function updateBigWin(result) {
    bigwinPanel.innerHTML = `
      <div class="bigwin-label">${result.rows} Rows</div>
      <div class="bigwin-mult ${result.multiplier >= 100 ? 'gold' : ''}">${result.multiplier}x</div>
      <div class="bigwin-payout">$${result.payout.toFixed(2)}</div>
      <div class="bigwin-time">${new Date().toLocaleTimeString()}</div>
    `;
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("plinko-canvas")) PlinkoUI.init();
});
