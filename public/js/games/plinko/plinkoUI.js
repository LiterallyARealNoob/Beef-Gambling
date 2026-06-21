const PlinkoUI = (() => {
  let dropBtn, betInput, riskSelect, rowSelect;
  let multEl, payoutEl, statusEl, autoBtn;
  let autoActive   = false;
  let autoInterval = null;
  let pendingDrops = 0;
  const MAX_BALLS  = 12;

  function init() {
    PlinkoRenderer.init();

    dropBtn    = document.getElementById("plinko-drop-btn");
    betInput   = document.getElementById("plinko-bet-input");
    riskSelect = document.getElementById("plinko-risk-select");
    rowSelect  = document.getElementById("plinko-row-select");
    multEl     = document.getElementById("plinko-multiplier");
    payoutEl   = document.getElementById("plinko-payout");
    statusEl   = document.getElementById("plinko-status");
    autoBtn    = document.getElementById("plinko-auto-btn");

    // populate risk
    PlinkoGame.getRiskOptions().forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      if (r === "high") opt.selected = true;
      riskSelect.appendChild(opt);
    });

    // populate rows
    PlinkoGame.getRowOptions().forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = `${r} Rows`;
      if (r === 16) opt.selected = true;
      rowSelect.appendChild(opt);
    });

    riskSelect.addEventListener("change", updateBoard);
    rowSelect.addEventListener("change",  updateBoard);
    dropBtn.addEventListener("click", () => dropBall());
    if (autoBtn) autoBtn.addEventListener("click", toggleAuto);

    // spacebar to drop
    document.addEventListener("keydown", e => {
      if (e.code === "Space" && document.getElementById("plinko-tab").classList.contains("active")) {
        e.preventDefault();
        dropBall();
      }
    });

    // wager shortcuts
    document.querySelectorAll(".game-wager-shortcuts button[data-target='plinko']").forEach(btn => {
      btn.addEventListener("click", () => {
        const cur = parseFloat(betInput.value) || 0;
        switch (btn.dataset.action) {
          case "min":    betInput.value = 1; break;
          case "half":   betInput.value = Math.max(1, cur / 2).toFixed(2); break;
          case "double": betInput.value = Math.min(cur * 2, BalanceManager.getBalance()).toFixed(2); break;
          case "max":    betInput.value = BalanceManager.getBalance(); break;
        }
      });
    });

    // board gets set when tab is clicked — see main.js
  }

  function updateBoard() {
    const rows = parseInt(rowSelect.value);
    const risk = riskSelect.value;
    PlinkoRenderer.setBoard(rows, risk);
  }

  async function dropBall() {
    const rows      = parseInt(rowSelect.value);
    const risk      = riskSelect.value;
    const betAmount = parseFloat(betInput.value);

    if (!betAmount || betAmount <= 0)            { setStatus("Enter a valid bet amount", "loss"); return; }
    if (betAmount > BalanceManager.getBalance()) { setStatus("Insufficient balance!", "loss");    return; }
    if (pendingDrops >= MAX_BALLS)               return;

    pendingDrops++;

    try {
      const result = await PlinkoGame.drop({ risk, rows, betAmount });

      PlinkoRenderer.animateDrop(rows, risk, result.bucket, () => {
        pendingDrops--;
        multEl.textContent   = `${result.multiplier}x`;
        payoutEl.textContent = `$${result.payout.toFixed(2)}`;

        const isWin = result.multiplier >= 1;
        setStatus(
          isWin
            ? `🔥 ${result.multiplier}x — Won $${result.payout.toFixed(2)}!`
            : `💀 ${result.multiplier}x — Lost`,
          isWin ? "win" : "loss"
        );

        PlinkoVFX.addHistory(result.multiplier, result.payout, result.betAmount);
        if (result.multiplier >= 10) PlinkoVFX.flash(result.multiplier);
      });

    } catch (err) {
      pendingDrops--;
      setStatus(err.message, "loss");
    }
  }

  function toggleAuto() {
    autoActive = !autoActive;
    if (autoActive) {
      autoBtn.textContent = "Stop Auto";
      autoBtn.classList.add("active");
      autoInterval = setInterval(() => {
        if (BalanceManager.getBalance() >= parseFloat(betInput.value)) {
          dropBall();
        } else {
          toggleAuto();
          setStatus("Out of balance — auto stopped", "loss");
        }
      }, 300);
    } else {
      autoBtn.textContent = "Auto Bet";
      autoBtn.classList.remove("active");
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className   = "status-text " + type;
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("plinko-canvas")) PlinkoUI.init();
});