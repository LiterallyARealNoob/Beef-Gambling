// Handles the molten lava/magma canvas background + the "eruption"
// burst effect that plays when the Play button is clicked.

const LavaAnimation = (() => {
  let canvas, ctx;
  let emberPool = [];
  let burstPool = [];
  let glowPulse = 0;
  let dpr = 1;

  function init() {
    canvas = document.getElementById("lava-canvas");
    ctx = canvas.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
    window.addEventListener("resize", resize);
    seedEmbers();
    loop();
  }

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function w() { return canvas.width / dpr; }
  function h() { return canvas.height / dpr; }

  function seedEmbers() {
    emberPool = [];
    const count = Math.min(28, Math.floor((w() * h()) / 45000));
    for (let i = 0; i < count; i++) {
      emberPool.push(makeEmber());
    }
  }

  function makeEmber() {
    return {
      x: Math.random() * w(),
      y: h() + Math.random() * 120,
      vy: -(0.25 + Math.random() * 0.55),
      vx: (Math.random() - 0.5) * 0.3,
      size: 1.5 + Math.random() * 3.5,
      flicker: Math.random() * Math.PI * 2,
      heat: 0.4 + Math.random() * 0.6
    };
  }

  function heatColor(heat, alpha) {
    const r = 255;
    const g = Math.floor(60 + heat * 180);
    const b = Math.floor(heat * 90);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawEmber(p) {
    const flicker = 0.7 + Math.sin(p.flicker) * 0.3;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    grad.addColorStop(0, heatColor(p.heat, 0.9 * flicker));
    grad.addColorStop(0.5, heatColor(p.heat * 0.6, 0.35 * flicker));
    grad.addColorStop(1, "rgba(255,60,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackgroundHeat() {
    glowPulse += 0.012;
    const pulse = 0.5 + Math.sin(glowPulse) * 0.5;

    const grad = ctx.createRadialGradient(
      w() / 2, h() * 0.85, 0,
      w() / 2, h() * 0.85, Math.max(w(), h()) * 0.75
    );
    grad.addColorStop(0, `rgba(120, 20, 0, ${0.35 + pulse * 0.1})`);
    grad.addColorStop(0.5, "rgba(40, 5, 0, 0.25)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w(), h());
  }

  function makeBurstChunk(cx, cy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 13;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      gravity: 0.35 + Math.random() * 0.15,
      size: 3 + Math.random() * 7,
      life: 1,
      decay: 0.012 + Math.random() * 0.012,
      heat: 0.5 + Math.random() * 0.5,
      spin: (Math.random() - 0.5) * 0.2
    };
  }

  function drawBurstChunk(p) {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
    grad.addColorStop(0, heatColor(p.heat, p.life));
    grad.addColorStop(0.6, heatColor(p.heat * 0.5, p.life * 0.5));
    grad.addColorStop(1, "rgba(200,30,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * 2.2, p.size * 1.6, p.spin, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    ctx.clearRect(0, 0, w(), h());
    drawBackgroundHeat();

    emberPool.forEach((p) => {
      p.y += p.vy;
      p.x += p.vx;
      p.flicker += 0.08;
      if (p.y < -20) {
        Object.assign(p, makeEmber(), { y: h() + 20 });
      }
      drawEmber(p);
    });

    burstPool.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.spin += 0.01;
      if (p.life > 0) drawBurstChunk(p);
    });
    burstPool = burstPool.filter((p) => p.life > 0);

    requestAnimationFrame(loop);
  }

  function eruptBurst() {
    const cx = w() / 2;
    const cy = h() / 2;
    for (let i = 0; i < 45; i++) {
      burstPool.push(makeBurstChunk(cx, cy));
    }
  }

  return { init, eruptBurst };
})();

document.addEventListener("DOMContentLoaded", LavaAnimation.init);