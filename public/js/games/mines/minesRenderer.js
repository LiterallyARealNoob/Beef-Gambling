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

  function updateCrackLevel(revealedCount, totalSafe) {
    const ratio = revealedCount / totalSafe;
    const cls   = ratio < 0.35 ? "danger-low"
                : ratio < 0.65 ? "danger-mid"
                : "danger-high";
    gridEl.querySelectorAll(".mine-tile:not(.revealed-safe):not(.revealed-mine)").forEach(t => {
      t.classList.remove("danger-low","danger-mid","danger-high");
      t.classList.add(cls);
    });
  }

  // ── Steak drop VFX ────────────────────────────────────────
  function dropSteak(tileEl, onComplete) {
    const rect = tileEl.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;

    const steak = document.createElement("div");
    steak.textContent = "🥩";
    steak.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: -60px;
      font-size: ${Math.max(rect.width * 0.7, 22)}px;
      transform: translateX(-50%) rotate(-15deg);
      z-index: 9998;
      pointer-events: none;
      transition: none;
      filter: drop-shadow(0 0 8px rgba(255,80,0,0.9));
    `;
    document.body.appendChild(steak);

    const targetY  = rect.top + rect.height * 0.2;
    const startTime = performance.now();
    const duration  = 320;

    function fall(now) {
      const elapsed = now - startTime;
      const prog    = Math.min(elapsed / duration, 1);
      // ease in (accelerate)
      const eased   = prog * prog;
      const currentY = -60 + (targetY + 60) * eased;

      steak.style.top       = `${currentY}px`;
      steak.style.transform = `translateX(-50%) rotate(${-15 + eased * 25}deg)`;

      if (prog < 1) {
        requestAnimationFrame(fall);
      } else {
        // impact
        steak.style.transform = `translateX(-50%) rotate(10deg) scale(1.2)`;
        impactShake();
        spawnImpactParticles(cx, targetY + rect.height * 0.3);

        setTimeout(() => {
          steak.style.transition = "opacity 0.25s, transform 0.25s";
          steak.style.opacity    = "0";
          steak.style.transform  = `translateX(-50%) rotate(10deg) scale(0.5) translateY(15px)`;
          setTimeout(() => {
            steak.remove();
            if (onComplete) onComplete();
          }, 260);
        }, 180);
      }
    }

    requestAnimationFrame(fall);
  }

  function impactShake() {
    // shake the grid AND neighboring tiles
    gridEl.classList.add("shake");
    gridEl.addEventListener("animationend", () => gridEl.classList.remove("shake"), { once: true });
  }

  function spawnImpactParticles(cx, cy) {
    const colors = ["#ff6b1a","#ffae42","#ff3d00","#ffd060"];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const angle = (Math.PI * 2 / 14) * i + Math.random() * 0.4;
      const dist  = 25 + Math.random() * 45;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.className = "lava-particle";
      p.style.cssText = `
        position: fixed;
        left: ${cx}px; top: ${cy}px;
        background: ${color};
        width: 7px; height: 7px;
        border-radius: 50%;
        --tx: ${Math.cos(angle)*dist}px;
        --ty: ${Math.sin(angle)*dist}px;
        --dur: ${0.38 + Math.random()*0.3}s;
      `;
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  // ── Lava particles (mine hit) ──────────────────────────────
  function spawnParticles(tileEl, color) {
    const rect = tileEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    for (let i = 0; i < 12; i++) {
      const p     = document.createElement("div");
      const angle = (Math.PI*2/12)*i + Math.random()*0.5;
      const dist  = 28 + Math.random()*42;
      p.className = "lava-particle";
      p.style.cssText = `
        position: fixed;
        left: ${cx}px; top: ${cy}px;
        background: ${color};
        width: 7px; height: 7px;
        border-radius: 50%;
        --tx: ${Math.cos(angle)*dist}px;
        --ty: ${Math.sin(angle)*dist}px;
        --dur: ${0.4+Math.random()*0.35}s;
      `;
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  // ── Public tile actions ────────────────────────────────────
  function markTileSafe(index, revealedCount, totalSafe, onAnimDone) {
    const tile = getTileEl(index);
    // steak drops first, THEN tile flips safe
    dropSteak(tile, () => {
      tile.classList.add("revealed-safe");
      tile.disabled = true;
      updateCrackLevel(revealedCount, totalSafe);
      if (onAnimDone) onAnimDone();
    });
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

  function updateMultiplier(m)  { multiplierEl.textContent = `${m.toFixed(2)}x`; }
  function updatePayout(p)      { payoutEl.textContent     = `$${p.toFixed(2)}`; }

  function setStatusText(text, type = "") {
    statusEl.textContent = text;
    statusEl.className   = "status-text " + type;
  }

  function resetGrid() {
    gridEl.innerHTML         = "";
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