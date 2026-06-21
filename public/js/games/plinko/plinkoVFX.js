const PlinkoVFX = (() => {
  function flash(multiplier) {
    if (multiplier < 10) return;
    const panel = document.getElementById("plinko-bigwin-panel");
    if (!panel) return;
    panel.innerHTML = "";
    const el = document.createElement("div");
    el.className = "plinko-bigwin-entry";
    el.innerHTML = `<span class="bw-mult">${multiplier}x</span><span class="bw-label">🔥 BIG WIN</span>`;
    el.style.animation = "bigWinPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards";
    panel.appendChild(el);
  }

  function addHistory(multiplier, payout, betAmount) {
    const list = document.getElementById("plinko-history-list");
    if (!list) return;
    const isWin = multiplier >= 1;
    const el    = document.createElement("div");
    el.className = "plinko-history-item";
    el.innerHTML = `
      <span class="ph-mult ${isWin ? "win":"loss"}">${multiplier}x</span>
      <span class="ph-payout ${isWin ? "win":"loss"}">$${payout.toFixed(2)}</span>
    `;
    list.insertBefore(el, list.firstChild);
    while (list.children.length > 15) list.removeChild(list.lastChild);
  }

  return { flash, addHistory };
})();