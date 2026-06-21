const LavaAnimation = (() => {
  let canvas, ctx;
  let dpr = 1;
  let glowPulse = 0;
  let emberPool = [];
  let burstPool = [];
  let volcanoTime = 0;

  const VOLCANOES = [
    { x: 0.12, peakY: 0.38, halfW: 0.10, eruptTimer: 0,  eruptInterval: 180, particles: [] },
    { x: 0.88, peakY: 0.42, halfW: 0.09, eruptTimer: 90, eruptInterval: 220, particles: [] },
    { x: 0.50, peakY: 0.28, halfW: 0.13, eruptTimer: 45, eruptInterval: 160, particles: [] },
  ];

  const LAVA_POOLS = [
    { x: 0.25, y: 0.88, rx: 0.09, ry: 0.025 },
    { x: 0.68, y: 0.91, rx: 0.07, ry: 0.020 },
    { x: 0.45, y: 0.95, rx: 0.12, ry: 0.022 },
  ];

  function init() {
    canvas = document.getElementById("lava-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
    window.addEventListener("resize", resize);
    seedEmbers();
    loop();
  }

  function resize() {
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function W() { return canvas.width  / dpr; }
  function H() { return canvas.height / dpr; }

  function heatColor(heat, alpha) {
    const r = 255;
    const g = Math.floor(50 + heat * 160);
    const b = Math.floor(heat * 30);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Sky ────────────────────────────────────────────────────
  function drawSky() {
    glowPulse += 0.007;
    const pulse = 0.5 + Math.sin(glowPulse) * 0.5;
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0,   "rgba(3,0,0,1)");
    grad.addColorStop(0.4, "rgba(18,4,0,1)");
    grad.addColorStop(0.7, "rgba(55,10,0,1)");
    grad.addColorStop(1,   "rgba(110,22,0,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());

    const glow = ctx.createRadialGradient(W()/2, H(), 0, W()/2, H(), H()*0.9);
    glow.addColorStop(0, `rgba(200,55,0,${0.22+pulse*0.10})`);
    glow.addColorStop(0.5, "rgba(70,12,0,0.12)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W(), H());
  }

  // ── Ground ─────────────────────────────────────────────────
  function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, H()*0.82);
    ctx.bezierCurveTo(W()*0.2,H()*0.78, W()*0.4,H()*0.84, W()*0.6,H()*0.80);
    ctx.bezierCurveTo(W()*0.75,H()*0.76, W()*0.9,H()*0.83, W(),H()*0.80);
    ctx.lineTo(W(), H()); ctx.lineTo(0, H()); ctx.closePath();
    const rg = ctx.createLinearGradient(0, H()*0.78, 0, H());
    rg.addColorStop(0, "rgba(32,12,3,1)");
    rg.addColorStop(1, "rgba(10,4,0,1)");
    ctx.fillStyle = rg; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, H());
    ctx.lineTo(0, H()*0.92);
    ctx.bezierCurveTo(W()*0.15,H()*0.88, W()*0.3,H()*0.94, W()*0.45,H()*0.90);
    ctx.bezierCurveTo(W()*0.6,H()*0.86,  W()*0.75,H()*0.93, W(),H()*0.89);
    ctx.lineTo(W(), H()); ctx.closePath();
    const fg = ctx.createLinearGradient(0, H()*0.88, 0, H());
    fg.addColorStop(0, "rgba(18,6,0,1)");
    fg.addColorStop(1, "rgba(4,1,0,1)");
    ctx.fillStyle = fg; ctx.fill();

    ctx.strokeStyle = "rgba(80,28,0,0.15)";
    ctx.lineWidth = 1;
    [[0.1,0.93,0.18,0.97],[0.3,0.91,0.38,0.96],[0.55,0.94,0.63,0.98],
     [0.72,0.90,0.80,0.94],[0.85,0.93,0.92,0.97]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath();
      ctx.moveTo(W()*x1,H()*y1);
      ctx.lineTo(W()*x2,H()*y2);
      ctx.stroke();
    });
  }

  // ── Lava pools ─────────────────────────────────────────────
  function drawLavaPools() {
    LAVA_POOLS.forEach((pool, i) => {
      const wave = Math.sin(volcanoTime * 0.04 + i * 1.2) * 0.003;
      const rx = (pool.rx + wave) * W();
      const ry = pool.ry * H();
      const px = pool.x * W(), py = pool.y * H();

      const glow = ctx.createRadialGradient(px, py, 0, px, py, rx*1.5);
      glow.addColorStop(0,   "rgba(255,100,0,0.3)");
      glow.addColorStop(0.6, "rgba(200,38,0,0.10)");
      glow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(px, py, rx*1.5, ry*2.8, 0, 0, Math.PI*2);
      ctx.fill();

      const grad = ctx.createRadialGradient(px, py-ry*0.3, 0, px, py, rx);
      grad.addColorStop(0,   `rgba(255,180,0,${0.9+Math.sin(volcanoTime*0.05+i)*0.07})`);
      grad.addColorStop(0.4, "rgba(255,75,0,0.95)");
      grad.addColorStop(0.8, "rgba(175,18,0,0.9)");
      grad.addColorStop(1,   "rgba(55,4,0,0.85)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "rgba(12,4,0,0.65)";
      ctx.beginPath();
      ctx.ellipse(px-rx*0.28, py, rx*0.16, ry*0.52, -0.3, 0, Math.PI*2);
      ctx.fill();
    });
  }

  // ── Volcano body ───────────────────────────────────────────
  function drawVolcano(v) {
    const vx   = v.x * W();
    const peakY = v.peakY * H();
    const baseY = H();
    const hw    = v.halfW * W();

    const grad = ctx.createLinearGradient(vx-hw, baseY, vx, peakY);
    grad.addColorStop(0,   "rgba(16,5,0,1)");
    grad.addColorStop(0.4, "rgba(32,10,1,1)");
    grad.addColorStop(1,   "rgba(9,3,0,1)");

    ctx.beginPath();
    ctx.moveTo(vx-hw, baseY);
    ctx.quadraticCurveTo(vx-hw*0.6, peakY+(baseY-peakY)*0.5, vx-hw*0.18, peakY+18);
    ctx.lineTo(vx-hw*0.10, peakY);
    ctx.lineTo(vx+hw*0.10, peakY);
    ctx.lineTo(vx+hw*0.18, peakY+18);
    ctx.quadraticCurveTo(vx+hw*0.6, peakY+(baseY-peakY)*0.5, vx+hw, baseY);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // lava streak
    const sg = ctx.createLinearGradient(vx, peakY, vx, baseY);
    sg.addColorStop(0,   "rgba(255,110,0,0.65)");
    sg.addColorStop(0.5, "rgba(255,55,0,0.25)");
    sg.addColorStop(1,   "rgba(200,28,0,0.04)");
    ctx.strokeStyle = sg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vx-hw*0.11, peakY+10);
    ctx.quadraticCurveTo(vx-hw*0.28, peakY+(baseY-peakY)*0.4, vx-hw*0.52, baseY);
    ctx.stroke();

    // crater glow
    const cg = ctx.createRadialGradient(vx, peakY, 0, vx, peakY, hw*0.32);
    cg.addColorStop(0,   `rgba(255,155,0,${0.65+Math.sin(volcanoTime*0.05+v.x*10)*0.18})`);
    cg.addColorStop(0.5, "rgba(255,55,0,0.35)");
    cg.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(vx, peakY+4, hw*0.20, hw*0.09, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // ── Jagged ember / rock chunk shape (NOT a circle) ─────────
  function drawJaggedEmber(x, y, r, alpha, heat) {
    const g = Math.floor(60 + heat * 150);
    const spikes = 5 + Math.floor(Math.random() * 3);

    // outer glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r*3.5);
    grd.addColorStop(0,   `rgba(255,${g},0,${alpha*0.45})`);
    grd.addColorStop(1,   "rgba(255,30,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r*3.5, 0, Math.PI*2);
    ctx.fill();

    // jagged polygon body
    ctx.beginPath();
    for (let i = 0; i < spikes*2; i++) {
      const angle  = (Math.PI*2 / (spikes*2)) * i;
      const radius = i % 2 === 0
        ? r * (0.8 + Math.random()*0.4)   // outer point
        : r * (0.35 + Math.random()*0.25); // inner notch
      const px2 = x + Math.cos(angle) * radius;
      const py2 = y + Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(255,${g},0,${alpha})`;
    ctx.fill();

    // bright molten core
    ctx.beginPath();
    ctx.arc(x, y, r*0.38, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,230,100,${alpha*0.8})`;
    ctx.fill();
  }

  // ── Volcano eruption particles ─────────────────────────────
  function updateVolcanoes() {
    volcanoTime++;
    VOLCANOES.forEach(v => {
      v.eruptTimer++;
      if (v.eruptTimer >= v.eruptInterval) {
        v.eruptTimer = 0;
        const cx = v.x * W(), cy = v.peakY * H();
        for (let i = 0; i < 20; i++) {
          const angle = -Math.PI/2 + (Math.random()-0.5)*1.2;
          const speed = 2.5 + Math.random() * 6;
          v.particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed,
            gravity: 0.14 + Math.random()*0.08,
            r:    2 + Math.random()*5,
            life: 1,
            decay: 0.010 + Math.random()*0.014,
            heat: 0.5 + Math.random()*0.5,
            // random rotation for jagged shape
            rot:  Math.random() * Math.PI * 2,
            rotV: (Math.random()-0.5) * 0.15
          });
        }
      }

      v.particles = v.particles.filter(p => p.life > 0);
      v.particles.forEach(p => {
        p.vy  += p.gravity;
        p.x   += p.vx;
        p.y   += p.vy;
        p.life -= p.decay;
        p.rot  += p.rotV;
        if (p.life > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          drawJaggedEmber(0, 0, p.r, p.life * 0.9, p.heat);
          ctx.restore();
        }
      });
    });
  }

  // ── Floating embers ────────────────────────────────────────
  function seedEmbers() {
    emberPool = [];
    const count = Math.min(30, Math.floor((window.innerWidth * window.innerHeight) / 22000));
    for (let i = 0; i < count; i++) emberPool.push(makeEmber(true));
  }

  function makeEmber(randomY = false) {
    return {
      x:       Math.random() * W(),
      y:       randomY ? Math.random() * H() : H() + Math.random() * 60,
      vy:      -(0.28 + Math.random() * 0.65),
      vx:      (Math.random()-0.5) * 0.35,
      r:       1 + Math.random() * 2.5,
      flicker: Math.random() * Math.PI * 2,
      heat:    0.4 + Math.random() * 0.6,
      rot:     Math.random() * Math.PI * 2,
      rotV:    (Math.random()-0.5) * 0.08
    };
  }

  function drawEmbers() {
    emberPool.forEach(p => {
      p.y       += p.vy;
      p.x       += p.vx;
      p.flicker += 0.08;
      p.rot     += p.rotV;
      if (p.y < -20) Object.assign(p, makeEmber(), { x: Math.random() * W() });

      const flicker = 0.6 + Math.sin(p.flicker) * 0.4;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      drawJaggedEmber(0, 0, p.r, 0.85 * flicker, p.heat);
      ctx.restore();
    });
  }

  // ── Burst on play click ────────────────────────────────────
  function makeBurstChunk(cx, cy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 14;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed - 7,
      gravity: 0.38 + Math.random()*0.15,
      r: 4 + Math.random() * 8,
      life: 1,
      decay: 0.009 + Math.random()*0.011,
      heat: 0.5 + Math.random()*0.5,
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random()-0.5) * 0.2
    };
  }

  function drawBurst() {
    burstPool.forEach(p => {
      p.vy += p.gravity;
      p.x  += p.vx; p.y += p.vy;
      p.life -= p.decay;
      p.rot  += p.rotV;
      if (p.life <= 0) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      drawJaggedEmber(0, 0, p.r, p.life, p.heat);
      ctx.restore();
    });
    burstPool = burstPool.filter(p => p.life > 0);
  }

  function loop() {
    ctx.clearRect(0, 0, W(), H());
    drawSky();
    VOLCANOES.forEach(drawVolcano);
    drawGround();
    drawLavaPools();
    updateVolcanoes();
    drawEmbers();
    drawBurst();
    requestAnimationFrame(loop);
  }

  function eruptBurst() {
    const cx = W()/2, cy = H()/2;
    for (let i = 0; i < 55; i++) burstPool.push(makeBurstChunk(cx, cy));
  }

  return { init, eruptBurst };
})();

document.addEventListener("DOMContentLoaded", LavaAnimation.init);