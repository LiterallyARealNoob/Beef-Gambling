const PlinkoRenderer = (() => {
  let canvas, ctx, dpr;
  let W, H;
  let pegRows     = [];
  let slots       = [];
  let currentRows = 16;
  let currentRisk = "high";
  let activeBalls = [];
  let litSlots    = {};
  let rafId;

  function init() {
    canvas = document.getElementById("plinko-canvas");
    ctx    = canvas.getContext("2d");
    dpr    = Math.min(window.devicePixelRatio || 1, 2);
    resize();
    window.addEventListener("resize", () => { resize(); setBoard(currentRows, currentRisk); });
    loop();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setBoard(rows, risk) {
    currentRows = rows;
    currentRisk = risk;
    pegRows     = PlinkoPhysics.calculatePegPositions(rows, W, H);
    buildSlots(rows, risk);
  }

  function buildSlots(rows, risk) {
    const count  = rows + 1;
    const sw     = W / count;
    const colors = PlinkoGame.getColorTable(risk, rows);
    const mults  = PlinkoGame.getMultiplierTable(risk, rows);
    slots = Array.from({ length: count }, (_, i) => ({
      x: sw * i, w: sw, cx: sw * i + sw / 2,
      color: colors[i], mult: mults[i]
    }));
  }

  // ── Draw ──────────────────────────────────────────────────
  function drawBg() {
    ctx.fillStyle = "#0b0700";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W/2, H*0.5, 0, W/2, H*0.5, W*0.7);
    g.addColorStop(0, "rgba(255,70,0,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function getPegRadius() {
    return Math.max(3, W / (currentRows * 7));
  }

  function drawPegs() {
    const pr = getPegRadius();
    pegRows.forEach(row => {
      row.forEach(peg => {
        // glow
        const grd = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, pr*3);
        grd.addColorStop(0, "rgba(255,130,40,0.2)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pr*3, 0, Math.PI*2);
        ctx.fill();

        // white peg dot
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pr, 0, Math.PI*2);
        ctx.fillStyle = "#d0c0a0";
        ctx.fill();
      });
    });
  }

  function drawSlots() {
    const sy    = H * 0.855;
    const sh    = H * 0.11;
    const gap   = 2;
    const fsize = Math.max(7, Math.min(W / (currentRows * 2.2), 14));

    slots.forEach((slot, i) => {
      const isLit = litSlots[i] > 0;

      ctx.save();
      ctx.fillStyle   = slot.color;
      ctx.globalAlpha = isLit ? 1 : 0.88;
      if (isLit) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur  = 18;
      }
      ctx.beginPath();
      ctx.roundRect(slot.x + gap, sy, slot.w - gap*2, sh, 4);
      ctx.fill();

      if (isLit) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.roundRect(slot.x + gap, sy, slot.w - gap*2, sh, 4);
        ctx.fill();
        litSlots[i]--;
      }
      ctx.restore();

      ctx.fillStyle    = "#ffffff";
      ctx.font         = `bold ${fsize}px sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${slot.mult}x`, slot.cx, sy + sh / 2);
    });
  }

  function drawBall(ball) {
    const br   = Math.max(5, W / (currentRows * 5));
    const heat = Math.min(ball.y / H, 1);
    const g2   = Math.floor(80 + heat * 160);

    // trail
    ball.trail.forEach((pt, i) => {
      const a  = (i / ball.trail.length) * 0.5;
      const tr = br * (i / ball.trail.length) * 0.7;
      const tg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, tr*2);
      tg.addColorStop(0, `rgba(255,${g2},0,${a})`);
      tg.addColorStop(1, "rgba(255,20,0,0)");
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, tr*2, 0, Math.PI*2);
      ctx.fill();
    });

    // outer glow
    const og = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, br*3.5);
    og.addColorStop(0, `rgba(255,${g2},0,${0.4+heat*0.2})`);
    og.addColorStop(1, "rgba(255,20,0,0)");
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, br*3.5, 0, Math.PI*2);
    ctx.fill();

    // ball body
    const bg = ctx.createRadialGradient(
      ball.x - br*0.35, ball.y - br*0.35, 0,
      ball.x, ball.y, br
    );
    bg.addColorStop(0,   `rgba(255,${Math.min(g2+90,255)},90,1)`);
    bg.addColorStop(0.6, `rgba(255,${g2},0,1)`);
    bg.addColorStop(1,   "rgba(180,20,0,1)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, br, 0, Math.PI*2);
    ctx.fill();
  }

  // ── Physics loop ──────────────────────────────────────────
  // Each ball is a real physics object with continuous velocity
  function physicsStep() {
    const pr       = getPegRadius();
    const ballR    = Math.max(5, W / (currentRows * 5));
    const gravity  = H * 0.0008;   // gravity per frame
    const bounce   = 0.42;          // energy kept on peg bounce
    const friction = 0.995;         // horizontal damping
    const slotY    = H * 0.855;

    activeBalls.forEach(ball => {
      if (ball.done) return;

      // gravity
      ball.vy += gravity;
      ball.vx *= friction;
      ball.x  += ball.vx;
      ball.y  += ball.vy;

      // trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 16) ball.trail.shift();

      // wall bounce
      if (ball.x < ballR)     { ball.x = ballR;     ball.vx =  Math.abs(ball.vx) * 0.5; }
      if (ball.x > W - ballR) { ball.x = W - ballR; ball.vx = -Math.abs(ball.vx) * 0.5; }

      // peg collision
      for (let r = 0; r < pegRows.length; r++) {
        for (let c = 0; c < pegRows[r].length; c++) {
          const peg  = pegRows[r][c];
          const dist = Math.hypot(ball.x - peg.x, ball.y - peg.y);
          const minD = pr + ballR;

          if (dist < minD && dist > 0.01) {
            // push ball out of peg
            const nx   = (ball.x - peg.x) / dist;
            const ny   = (ball.y - peg.y) / dist;
            const overlap = minD - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            // reflect velocity off peg normal
            const dot  = ball.vx * nx + ball.vy * ny;
            ball.vx    = (ball.vx - 2 * dot * nx) * bounce;
            ball.vy    = (ball.vy - 2 * dot * ny) * bounce;

            // add small random horizontal nudge so ball doesn't get stuck
            ball.vx   += (Math.random() - 0.5) * H * 0.003;

            // ensure ball always moves downward after bounce
            if (ball.vy < 0) ball.vy = Math.abs(ball.vy) * 0.3;
          }
        }
      }

      // landed in slot
      if (ball.y >= slotY && !ball.done) {
        ball.done = true;
        ball.y    = slotY;

        // figure out which slot
        const slotW  = W / (currentRows + 1);
        const bucket = Math.min(
          Math.max(Math.floor(ball.x / slotW), 0),
          currentRows
        );

        litSlots[bucket] = 45;

        setTimeout(() => {
          activeBalls = activeBalls.filter(b => b !== ball);
          if (ball.onLanded) ball.onLanded(bucket);
        }, 250);
      }
    });
  }

  function loop() {
    physicsStep();
    ctx.clearRect(0, 0, W, H);
    drawBg();
    drawPegs();
    drawSlots();
    activeBalls.forEach(drawBall);
    rafId = requestAnimationFrame(loop);
  }

  // ── Drop a ball with real physics ─────────────────────────
  function animateDrop(rows, risk, bucket, onLanded) {
    // Seed vx so ball trends toward the target bucket
    // but physics determines final resting place
    const centerX   = W / 2;
    const slotW     = W / (rows + 1);
    const targetX   = slotW * bucket + slotW / 2;
    const nudge     = (targetX - centerX) / W * H * 0.012;

    activeBalls.push({
      x:        centerX + (Math.random() - 0.5) * 4,
      y:        H * 0.02,
      vx:       nudge + (Math.random() - 0.5) * H * 0.002,
      vy:       H * 0.002,
      trail:    [],
      done:     false,
      onLanded
    });
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    activeBalls = [];
  }

  return { init, resize, setBoard, animateDrop, destroy };
})();