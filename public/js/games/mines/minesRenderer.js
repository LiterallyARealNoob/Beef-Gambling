const MinesRenderer = (() => {
  let gridEl, multiplierEl, payoutEl, statusEl;
  let onTileClick = () => {};

  function init() {
    gridEl       = document.getElementById("mines-grid");
    multiplierEl = document.getElementById("mines-multiplier");
    payoutEl     = document.getElementById("mines-payout");
    statusEl     = document.getElementById("mines-status");
  }

  function setTileClickHandler(fn) { onTileClick = fn; }

  function buildGrid(size, totalTiles) {
    gridEl.innerHTML = "";
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for (let i = 0; i < totalTiles; i++) {
      const tile = document.createElement("button");
      tile.className = "mine-tile";
      tile.dataset.index = i;

      // crack overlay layers
      ["crack crack-1","crack crack-2","crack crack-3"].forEach(cls => {
        const d = document.createElement("div");
        d.className = cls;
        tile.appendChild(d);
      });

      tile.addEventListener("click", () => onTileClick(i));
      gridEl.appendChild(tile);
    }
  }

  function getTileEl(index) {
    return gridEl.querySelector(`[data-index="${index}"]`);
  }

  // update crack danger level on all unrevealed tiles
  function updateCrackLevel(revealedCount, totalSafe) {
    const ratio = revealedCount / totalSafe;
    const dangerClass = ratio < 0.35 ? "danger-low"
                      : ratio < 0.65 ? "danger-mid"
                      : "danger-high";

    gridEl.querySelectorAll(".mine-tile:not(.revealed-safe):not(.revealed-mine)").forEach(t => {
      t.classList.remove("danger-low", "danger-mid", "danger-high");
      t.classList.add(dangerClass);
    });
  }

  function spawnParticles(tileEl, color) {
    const rect = tileEl.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    for (let i = 0; i < 10; i++) {
      const p = document.createElement("div");
      p.className = "lava-particle";
      const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
      const dist  = 30 + Math.random() * 40;
      p.style.cssText = `
        left: ${cx}px; top: ${cy}px;
        background: ${color};
        --tx: ${Math.cos(angle) * dist}px;
        --ty: ${Math.sin(angle) * dist}px;
        --dur: ${0.4 + Math.random() * 0.3}s;
        position: fixed;
      `;
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  function markTileSafe(index, revealedCount, totalSafe) {
    const tile = getTileEl(index);
    tile.classList.add("revealed-safe");
    tile.disabled = true;
    spawnParticles(tile, "#ff6b1a");
    updateCrackLevel(revealedCount, totalSafe);
  }

  function markTileMine(index, isTriggered) {
    const tile = getTileEl(index);
    tile.classList.add("revealed-mine");
    if (isTriggered) {
      tile.classList.add("mine-triggered");
      spawnParticles(tile, "#ff0000");
      gridEl.classList.add("shake");
      gridEl.addEventListener("animationend", () => gridEl.classList.remove("shake"), { once: true });
    }
    tile.disabled = true;
  }

  function disableAllTiles() {
    gridEl.querySelectorAll(".mine-tile").forEach(t => t.disabled = true);
  }

  function updateMultiplier(multiplier) {
    multiplierEl.textContent = `${multiplier.toFixed(2)}x`;
  }

  function updatePayout(payout) {
    payoutEl.textContent = `$${payout.toFixed(2)}`;
  }

  function setStatusText(text, type = "") {
    statusEl.textContent = text;
    statusEl.className = "status-text " + type;
  }

  function resetGrid() {
    gridEl.innerHTML = "";
    multiplierEl.textContent = "1.00x";
    payoutEl.textContent     = "$0.00";
    statusEl.textContent     = "";
    statusEl.className       = "status-text";
  }

  return {
    init, setTileClickHandler, buildGrid,
    markTileSafe, markTileMine, disableAllTiles,
    updateMultiplier, updatePayout, setStatusText, resetGrid
  };
})();