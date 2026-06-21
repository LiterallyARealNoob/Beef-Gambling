// Plinko renderer — draws the lava-themed board: magma rock pegs,
// glowing multiplier slots, and the ball as it bounces down and
// progressively melts/glows hotter the further it falls.

const PlinkoRenderer = (() => {
  let canvas, ctx;
  let dpr = 1;
  let width, height;
  let pegRows = [];
  let slotPositions = [];
  let currentRows = 12;
  let activeBalls = [];
  let rafId = null;

  function init() {
    canvas = document.getElementById("plinko-canvas");
    ctx = canvas.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    resize();
    window.addEventListener("resize", resize);
    loop();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentRows) setRows(currentRows);
  }

  function setRows(rows) {
    currentRows = rows;
    pegRows = PlinkoPhysics.calculatePegPositions(rows, width, height);

    const slotCount = rows + 1;
    const slotWidth = width / slotCount;
    slotPositions = Array.from({ length: slotCount }, (_, i) => ({
      x: slotWidth * i + slotWidth / 2,
      width: slotWidth
    }));
  }

  function drawBoardBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#1a0d05");
    grad.addColorStop(0.6, "#120802");
    grad.addColorStop(1, "#0a0400");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width / 2, height, 0,
      width / 2, height, height * 0.7
    );
    glow.addColorStop(0, "rgba(255,90,0,0.18)");
    glow.addColorStop(1, "rgba(255,90,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPegs() {
    const pegRadius = Math.max(3, width / (currentRows * 7));

    pegRows.forEach((row) => {
      row.forEach((peg) => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
        const rockGrad = ctx.createRadialGradient(
          peg.x, peg.y, 0, peg.x, peg.y, pegRadius
        );
        rockGrad.addColorStop(0, "#3a1c08");
        rockGrad.addColorStop(1, "#1a0d05");
        ctx.fillStyle = rockGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,110,20,0.85)";
        ctx.fill();

        const glow = ctx.createRadialGradient(
          peg.x, peg.y, pegRadius * 0.3, peg.x, peg.y, pegRadius * 2
        );
        glow.addColorStop(0, "rgba(255,90,0,0.3)");
        glow.addColorStop(1, "rgba(255,90,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function drawSlots(highlightSlot = null) {
    const table = PlinkoGame.getMultiplierTable(currentRows);
    const slotY = height * 0.92;
    const slotH = height * 0.07;

    slotPositions.forEach((slot, i) => {
      const mult = table[i];
      const heat = Math.min(mult / 30, 1);
      const isHighlighted = highlightSlot === i;

      const r = 255;
      const g = Math.floor(60 + heat * 130);
      const b = Math.floor(heat * 20);

      ctx.fillStyle = isHighlighted
        ? `rgba(${r},${Math.min(g + 60, 255)},${b + 40},1)`
        : `rgba(${r},${g},${b},0.9)`;
      ctx.fillRect(slot.x - slot.width / 2 + 2, slotY, slot.width - 4, slotH);

      if (isHighlighted) {
        ctx.save();
        ctx.shadowColor = "rgba(255,200,80,0.9)";
        ctx.shadowBlur = 20;
        ctx.fillRect(slot.x - slot.width / 2 + 2, slotY, slot.width - 4, slotH);
        ctx.restore();
      }

      ctx.fillStyle = "#1a0d05";
      ctx.font = `bold ${Math.max(8, slot.width * 0.22)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${mult}x`, slot.x, slotY + slotH / 2 + 4);
    });
  }

  function drawBall(ball) {
    const fallProgress = ball.currentRow / currentRows;
    const heat = fallProgress;

    const baseRadius = Math.max(4, width / (currentRows * 5));
    const meltRadius = baseRadius * (1 + heat * 0.35);

    const r = 255;
    const g = Math.floor(30 + heat * 180);
    const b = Math.floor(heat * 100);

    const glow = ctx.createRadialGradient(
      ball.x, ball.y, 0, ball.x, ball.y, meltRadius * (2 + heat * 1.5)
    );
    glow.addColorStop(0, `rgba(${r},${g},${b},${0.5 + heat * 0.3})`);
    glow.addColorStop(1, "rgba(255,60,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, meltRadius * (2 + heat * 1.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, meltRadius, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(
      ball.x - meltRadius * 0.3, ball.y - meltRadius * 0.3, 0,
      ball.x, ball.y, meltRadius
    );
    bodyGrad.addColorStop(0, `rgba(255,${Math.min(g + 80, 255)},${b + 60},1)`);
    bodyGrad.addColorStop(1, `rgba(${r},${g},${b},1)`);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    drawBoardBackground();
    drawPegs();

    const highlightSlot = activeBalls.length > 0 && activeBalls[0].landed
      ? activeBalls[0].finalSlot
      : null;
    drawSlots(highlightSlot);

    activeBalls.forEach(drawBall);

    rafId = requestAnimationFrame(loop);
  }

  function animateDrop(path, finalSlot, onLanded) {
    const slotWidth = width / (currentRows + 1);

    const ball = {
      x: width / 2,
      y: height * 0.04,
      currentRow: 0,
      finalSlot: null,
      landed: false
    };
    activeBalls = [ball];

    let rightCount = 0;
    let rowIndex = 0;

    function stepToNextRow() {
      if (rowIndex >= path.length) {
        const targetX = slotWidth * finalSlot + slotWidth / 2;
        animateTo(ball, targetX, height * 0.92, 220, () => {
          ball.landed = true;
          ball.finalSlot = finalSlot;
          setTimeout(() => {
            activeBalls = [];
            onLanded(finalSlot);
          }, 260);
        });
        return;
      }

      const goesRight = path[rowIndex];
      if (goesRight) rightCount++;

      const rowPegs = pegRows[rowIndex];
      const targetPeg = rowPegs[Math.min(rightCount, rowPegs.length - 1)];
      const targetY = targetPeg ? targetPeg.y : height * (rowIndex / currentRows);
      const targetX = targetPeg ? targetPeg.x : ball.x;

      rowIndex++;
      ball.currentRow = rowIndex;

      animateTo(ball, targetX, targetY, 120, stepToNextRow);
    }

    stepToNextRow();
  }

  function animateTo(ball, targetX, targetY, duration, callback) {
    const startX = ball.x;
    const startY = ball.y;
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * (2 - t);

      ball.x = startX + (targetX - startX) * eased;
      ball.y = startY + (targetY - startY) * eased;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        ball.x = targetX;
        ball.y = targetY;
        callback();
      }
    }
    requestAnimationFrame(frame);
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    activeBalls = [];
  }

  return { init, setRows, animateDrop, destroy };
})();