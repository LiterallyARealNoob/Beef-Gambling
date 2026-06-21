const LavaAnimation = (() => {
  let canvas, ctx;
  let dpr = 1;
  let glowPulse = 0;
  let emberPool = [];
  let burstPool = [];
  let volcanoTime = 0;
  let rafId = null;
  let destroyed = false;

  const VOLCANOES = [
    { x: 0.12, peakY: 0.38, halfW: 0.10, eruptTimer: 0,  eruptInterval: 240, particles: [] },
    { x: 0.88, peakY: 0.42, halfW: 0.09, eruptTimer: 120, eruptInterval: 280, particles: [] },
    { x: 0.50, peakY: 0.28, halfW: 0.13, eruptTimer: 60, eruptInterval: 220, particles: [] },
  ];

  const LAVA_POOLS = [
    { x: 0.25, y: 0.88, rx: 0.09, ry: 0.025 },
    { x: 0.68, y: 0.91, rx: 0.07, ry: 0.020 },
    { x: 0.45, y: 0.95, rx: 0.12, ry: 0.022 },
  ];

  const SHAPE_VARIANTS = [];
  function buildShapeVariants() {
    for (let v = 0; v < 6; v++) {
      const spikes = 5 + Math.floor(Math.random() * 3);
      const points = [];
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (Math.PI * 2 / (spikes * 2)) * i;
        const radiusMult = i % 2 === 0
          ? 0.8 + Math.random() * 0.4
          : 0.35 + Math.random() * 0.25;
        points.push({ angle, radiusMult });
      }
      SHAPE_VARIANTS.push(points);
    }
  }

  function init() {
    canvas = document.getElementById("lava-canvas");
    if (!canvas) return;
    destroyed = false;
    ctx = canvas.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    resize();
    window.addEventListener("resize", resize);
    if (SHAPE_VARIANTS.length === 0) buildShapeVariants();
    seedEmbers();
    loop();
  }

  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    emberPool = [];
    burstPool = [];
    VOLCANOES.forEach(v => v.particles = []);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function W() { return canvas.width  / dpr; }
  function H() { return canvas.height / dpr; }

  function drawSky() {
    glowPulse += 0.007;
    const pulse = 0.5 + Math.sin(glowPulse) * 0.5;
    const grad = ctx.createLinearGradient(0, 0, 0, H());
    grad.addColorStop(0,   "rgba(3,0,0,1)");
    grad.addColorStop(0.5, "rgba(35,8,0,1)");
    grad.addColorStop(1,   "rgba(100,20,0,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W(), H());

    const glow = ctx.createRadialGradient(W()/2, H(), 0, W()/2, H(), H()*0.9);
    glow.addColorStop(0, `rgba(200,55,0,${0.20+pulse*0.08})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W(), H());
  }

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
  }

  // ── Lava monster eyes: glowing sclera + pupil that slides
  // left-right on a 2-second cycle (1s each direction) ───────
  function drawLavaEyes() {
    const cycleMs = 2000;
    const now = performance.now();
    const t = (now % (cycleMs * 2)) / cycleMs; // 0..2
    const pingPong = t < 1 ? t : 2 - t;          // 0..1..0
    const pupilOffset = (pingPong - 0.5) * 2;     // -1..1

    LAVA_POOLS.forEach((pool) => {
      const px = pool.x * W(), py = pool.y * H();
      const rx = pool.rx * W();
      const ry = pool.ry * H() * 1.6; // taller, more eye-shaped

      // outer glow
      const glow = ctx.createRadialGradient(px, py, rx * 0.7, px, py, rx * 1.7);
      glow.addColorStop(0, "rgba(255,100,0,0.25)");
      glow.addColorStop(1, "rgba(255,60,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(px, py, rx * 1.7, ry * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // sclera
      const grad = ctx.createRadialGradient(px, py, 0, px, py, rx);
      grad.addColorStop(0,   "rgba(255,215,130,0.97)");
      grad.addColorStop(0.55,"rgba(255,140,30,0.93)");
      grad.addColorStop(1,   "rgba(120,30,0,0.88)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // pupil sliding left-right
      const pupilX = px + pupilOffset * (rx * 0.45);
      ctx.beginPath();
      ctx.ellipse(pupilX, py, rx * 0.30, ry * 0.62, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8,2,0,0.95)";
      ctx.fill();

      // tiny highlight in pupil
      ctx.beginPath();
      ctx.ellipse(pupilX - rx*0.08, py - ry*0.2, rx*0.07, ry*0.12, 0, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,230,150,0.5)";
      ctx.fill();
    });
  }

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

    const cg = ctx.createRadialGradient(vx, peakY, 0, vx, peakY, hw*0.32);
    cg.addColorStop(0,   `rgba(255,155,0,${0.6+Math.sin(volcanoTime*0.05+v.x*10)*0.15})`);
    cg.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(vx, peakY+4, hw*0.20, hw*0.09, 0, 0, Math.PI*2);
    ctx.fill();
  }

  function drawJaggedEmber(x, y, r, alpha, heat, shapeIndex) {
    const g = Math.floor(60 + heat * 150);
    const shape = SHAPE_VARIANTS[shapeIndex % SHAPE_VARIANTS.length];

    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,${g},0,${alpha * 0.18})`;
    ctx.fill();

    ctx.beginPath();
    shape.forEach((pt, i) => {
      const px2 = x + Math.cos(pt.angle) * r * pt.radiusMult;
      const py2 = y + Math.sin(pt.angle) * r * pt.radiusMult;
      i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    });
    ctx.closePath();
    ctx.fillStyle = `rgba(255,${g},0,${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r*0.35, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,230,100,${alpha*0.75})`;
    ctx.fill();
  }

  function updateVolcanoes() {
    volcanoTime++;
    VOLCANOES.forEach(v => {
      v.eruptTimer++;
      if (v.eruptTimer >= v.eruptInterval) {
        v.eruptTimer = 0;
        const cx = v.x * W(), cy = v.peakY * H();
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI/2 + (Math.random()-0.5)*1.2;
          const speed = 2.5 + Math.random() * 6;
          v.particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed,
            gravity: 0.14 + Math.random()*0.08,
            r:    2 + Math.random()*5,
            life: 1,
            decay: 0.014 + Math.random()*0.016,
            heat: 0.5 + Math.random()*0.5,
            shapeIndex: Math.floor(Math.random() * SHAPE_VARIANTS.length)
          });
        }
      }

      v.particles = v.particles.filter(p => p.life > 0);
      v.particles.forEach(p => {
        p.vy  += p.gravity;
        p.x   += p.vx;
        p.y   += p.vy;
        p.life -= p.decay;
        if (p.life > 0) drawJaggedEmber(p.x, p.y, p.r, p.life * 0.9, p.heat, p.shapeIndex);
      });
    });
  }

  function seedEmbers() {
    emberPool = [];
    const count = Math.min(16, Math.floor((window.innerWidth * window.innerHeight) / 38000));
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
      shapeIndex: Math.floor(Math.random() * SHAPE_VARIANTS.length)
    };
  }

  function drawEmbers() {
    emberPool.forEach(p => {
      p.y       += p.vy;
      p.x       += p.vx;
      p.flicker += 0.08;
      if (p.y < -20) Object.assign(p, makeEmber(), { x: Math.random() * W() });

      const flicker = 0.6 + Math.sin(p.flicker) * 0.4;
      drawJaggedEmber(p.x, p.y, p.r, 0.85 * flicker, p.heat, p.shapeIndex);
    });
  }

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
      decay: 0.013 + Math.random()*0.015,
      heat: 0.5 + Math.random()*0.5,
      shapeIndex: Math.floor(Math.random() * SHAPE_VARIANTS.length)
    };
  }

  function drawBurst() {
    burstPool.forEach(p => {
      p.vy += p.gravity;
      p.x  += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) return;
      drawJaggedEmber(p.x, p.y, p.r, p.life, p.heat, p.shapeIndex);
    });
    burstPool = burstPool.filter(p => p.life > 0);
  }

  function loop() {
    if (destroyed) return;
    ctx.clearRect(0, 0, W(), H());
    drawSky();
    VOLCANOES.forEach(drawVolcano);
    drawGround();
    drawLavaEyes();
    updateVolcanoes();
    drawEmbers();
    drawBurst();
    rafId = requestAnimationFrame(loop);
  }

  function eruptBurst() {
    const cx = W()/2, cy = H()/2;
    for (let i = 0; i < 30; i++) burstPool.push(makeBurstChunk(cx, cy));
  }

  return { init, eruptBurst, destroy };
})();

document.addEventListener("DOMContentLoaded", LavaAnimation.init);