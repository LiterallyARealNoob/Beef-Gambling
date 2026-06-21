const BalanceManager = (() => {
  let balance   = 1000;
  let wagered   = 0;
  let totalWins = 0;
  let totalLoss = 0;

  function getBalance() { return balance; }

  function deduct(amount) {
    balance = parseFloat((balance - amount).toFixed(2));
    wagered = parseFloat((wagered + amount).toFixed(2));
    updateUI();
  }

  function add(amount) {
    balance = parseFloat((balance + amount).toFixed(2));
    updateUI();
  }

  function recordWin(payout, bet) {
    totalWins = parseFloat((totalWins + payout).toFixed(2));
    updateProfileUI();
  }

  function recordLoss(bet) {
    totalLoss = parseFloat((totalLoss + bet).toFixed(2));
    updateProfileUI();
  }

  function updateUI() {
    const el = document.getElementById("balance-amount");
    if (el) el.textContent = balance.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }

  function updateProfileUI() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `$${Math.abs(val).toFixed(2)}`;
    };
    set("profile-wagered",  wagered);
    set("profile-wins",     totalWins);
    set("profile-losses",   totalLoss);
    set("profile-networth", balance);
  }

  return { getBalance, deduct, add, recordWin, recordLoss };
})();

// ── Lava Crack Transition ──────────────────────────────────────
const LavaTransition = (() => {
  let canvas, ctx, animId;
  let t = 0;
  let phase = "idle";
  let cracks = [];
  let drips  = [];
  let lavaY  = null;
  let dropY  = null;
  let onDone = null;

  function init() {
    canvas = document.getElementById("transition-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "transition-canvas";
      canvas.style.cssText = `
        position:fixed;top:0;left:0;
        width:100%;height:100%;
        z-index:9999;pointer-events:none;
        display:none;
      `;
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function W() { return canvas.width; }
  function H() { return canvas.height; }

  function generateCracks() {
    cracks = [];
    const cx = W() / 2, cy = H() / 2;
    const count = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const len   = 0.55 + Math.random() * 0.5;
      const diag  = Math.sqrt(W()*W() + H()*H()) * 0.5;
      const pts   = [{ x: cx, y: cy }];
      let   px = cx, py = cy;
      const steps = 5 + Math.floor(Math.random() * 5);
      for (let s = 0; s < steps; s++) {
        const frac = (s + 1) / steps;
        const jitter = (Math.random() - 0.5) * 40 * frac;
        px = cx + Math.cos(angle) * diag * len * frac + Math.cos(angle + Math.PI/2) * jitter;
        py = cy + Math.sin(angle) * diag * len * frac + Math.sin(angle + Math.PI/2) * jitter;
        pts.push({ x: px, y: py });
        if (Math.random() < 0.45) {
          const bAngle = angle + (Math.random() - 0.5) * 1.2;
          const bLen   = diag * len * (0.2 + Math.random() * 0.25);
          const bSteps = 3;
          const branch = [{ x: px, y: py }];
          let bx = px, by = py;
          for (let b = 0; b < bSteps; b++) {
            bx += Math.cos(bAngle) * bLen / bSteps + (Math.random()-0.5)*20;
            by += Math.sin(bAngle) * bLen / bSteps + (Math.random()-0.5)*20;
            branch.push({ x: bx, y: by });
          }
          cracks.push({ pts: branch, progress: 0, width: 1 + Math.random(), glow: 0 });
        }
      }
      cracks.push({ pts, progress: 0, width: 1.5 + Math.random() * 1.5, glow: 0 });
    }
  }

  function spawnDrip(x, y) {
    drips.push({
      x: x + (Math.random()-0.5)*10,
      y,
      vy: 1.5 + Math.random() * 2.5,
      vx: (Math.random()-0.5) * 0.8,
      r:  3 + Math.random() * 5,
      heat: 0.5 + Math.random() * 0.5,
      trail: [],
      life: 1
    });
  }

  function drawDrip(d) {
    const g = Math.floor(60 + d.heat * 140);
    const col = `rgba(255,${g},0,${d.life})`;

    d.trail.forEach((pt, i) => {
      const a = (i / d.trail.length) * 0.35 * d.life;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, d.r * (i / d.trail.length) * 0.5, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,${g},0,${a})`;
      ctx.fill();
    });

    const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r*3);
    grd.addColorStop(0, `rgba(255,${g},0,${d.life*0.4})`);
    grd.addColorStop(1, "rgba(255,40,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r*3, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(d.x, d.y - d.r*1.5);
    ctx.bezierCurveTo(d.x+d.r*1.1, d.y-d.r*0.3, d.x+d.r, d.y+d.r*0.9, d.x, d.y+d.r*1.5);
    ctx.bezierCurveTo(d.x-d.r, d.y+d.r*0.9, d.x-d.r*1.1, d.y-d.r*0.3, d.x, d.y-d.r*1.5);
    ctx.fillStyle = col;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(d.x, d.y-d.r*0.2, d.r*0.4, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,220,80,${d.life*0.7})`;
    ctx.fill();
  }

  function drawLavaFill(topY) {
    ctx.beginPath();
    ctx.moveTo(0, H());
    ctx.lineTo(0, topY);
    for (let x = 0; x <= W(); x += 6) {
      const wave = Math.sin(x / W() * Math.PI * 5 + t * 0.07) * 12
                 + Math.sin(x / W() * Math.PI * 9 + t * 0.11) * 5;
      ctx.lineTo(x, topY + wave);
    }
    ctx.lineTo(W(), H());
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, topY, 0, H());
    grad.addColorStop(0,   `rgba(255,${140+Math.floor(Math.sin(t*0.05)*30)},0,0.97)`);
    grad.addColorStop(0.25, "rgba(255,70,0,0.98)");
    grad.addColorStop(0.6,  "rgba(180,25,0,0.99)");
    grad.addColorStop(1,    "rgba(60,8,0,1)");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x <= W(); x += 6) {
      const wave = Math.sin(x / W() * Math.PI * 5 + t * 0.07) * 12
                 + Math.sin(x / W() * Math.PI * 9 + t * 0.11) * 5;
      x === 0 ? ctx.moveTo(x, topY+wave) : ctx.lineTo(x, topY+wave);
    }
    ctx.strokeStyle = `rgba(255,200,50,${0.6+Math.sin(t*0.08)*0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function loop() {
    t++;
    ctx.clearRect(0, 0, W(), H());

    if (phase === "cracking") {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W(), H());

      let allDone = true;
      cracks.forEach(c => {
        if (c.progress < 1) {
          c.progress = Math.min(1, c.progress + 0.045);
          allDone = false;
        }
        c.glow = 0.5 + Math.sin(t * 0.12) * 0.3;

        const end = Math.floor(c.progress * (c.pts.length - 1));
        if (end < 1) return;

        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(255,80,0,${c.glow})`;
        ctx.beginPath();
        ctx.moveTo(c.pts[0].x, c.pts[0].y);
        for (let i = 1; i <= end; i++) ctx.lineTo(c.pts[i].x, c.pts[i].y);
        ctx.strokeStyle = `rgba(255,120,0,${c.glow * 0.8})`;
        ctx.lineWidth = c.width * 3;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(c.pts[0].x, c.pts[0].y);
        for (let i = 1; i <= end; i++) ctx.lineTo(c.pts[i].x, c.pts[i].y);
        ctx.strokeStyle = `rgba(255,200,50,${0.85})`;
        ctx.lineWidth = c.width;
        ctx.stroke();

        if (c.progress > 0.3 && Math.random() < 0.06) {
          const tip = c.pts[end];
          spawnDrip(tip.x, tip.y);
        }
      });

      drips.forEach(d => {
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 10) d.trail.shift();
        d.x  += d.vx;
        d.y  += d.vy;
        d.vy += 0.15;
        drawDrip(d);
      });
      drips = drips.filter(d => d.y < H() + 20);

      if (allDone) {
        phase = "filling";
        lavaY = H();
      }
    }

    if (phase === "filling") {
      cracks.forEach(c => {
        ctx.shadowBlur = 14;
        ctx.shadowColor = `rgba(255,80,0,${0.5 + Math.sin(t*0.1)*0.3})`;
        ctx.beginPath();
        ctx.moveTo(c.pts[0].x, c.pts[0].y);
        c.pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "rgba(255,160,0,0.7)";
        ctx.lineWidth = c.width;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      lavaY -= 28;
      drawLavaFill(lavaY);

      drips.forEach(d => {
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 10) d.trail.shift();
        d.x += d.vx; d.y += d.vy; d.vy += 0.15;
        if (d.y < lavaY) drawDrip(d);
      });
      drips = drips.filter(d => d.y < lavaY + 20);

      if (Math.random() < 0.3) {
        const c = cracks[Math.floor(Math.random() * cracks.length)];
        if (c) {
          const pt = c.pts[Math.floor(Math.random() * c.pts.length)];
          if (pt && pt.y > lavaY) spawnDrip(pt.x, pt.y);
        }
      }

      if (lavaY <= 0) {
        phase  = "dropping";
        dropY  = 0;
        if (onDone) onDone();
      }
    }

    if (phase === "dropping") {
      const speed = 20 + dropY * 0.08;
      dropY += speed;

      if (dropY < H()) {
        const topY = dropY;
        ctx.beginPath();
        ctx.moveTo(0, topY);
        for (let x = 0; x <= W(); x += 6) {
          const wave = Math.sin(x / W() * Math.PI * 5 + t * 0.07) * 10
                     + Math.sin(x / W() * Math.PI * 9 + t * 0.11) * 4;
          ctx.lineTo(x, topY + wave);
        }
        ctx.lineTo(W(), H() + dropY);
        ctx.lineTo(0, H() + dropY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, topY, 0, topY + H());
        grad.addColorStop(0,    `rgba(255,${120+Math.floor(Math.sin(t*0.05)*40)},0,0.97)`);
        grad.addColorStop(0.2,  "rgba(255,60,0,0.98)");
        grad.addColorStop(0.55, "rgba(160,20,0,0.99)");
        grad.addColorStop(1,    "rgba(40,5,0,1)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        for (let x = 0; x <= W(); x += 6) {
          const wave = Math.sin(x / W() * Math.PI * 5 + t * 0.07) * 10
                     + Math.sin(x / W() * Math.PI * 9 + t * 0.11) * 4;
          x === 0 ? ctx.moveTo(x, topY+wave) : ctx.lineTo(x, topY+wave);
        }
        ctx.strokeStyle = `rgba(255,200,50,${0.7+Math.sin(t*0.1)*0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        phase = "idle";
        canvas.style.display = "none";
        cancelAnimationFrame(animId);
        return;
      }
    }

    animId = requestAnimationFrame(loop);
  }

  function play(callback) {
    onDone = callback;
    phase  = "cracking";
    lavaY  = null;
    dropY  = null;
    drips  = [];
    t      = 0;
    generateCracks();
    canvas.style.display = "block";
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  return { init, play };
})();

document.addEventListener("DOMContentLoaded", () => {
  LavaTransition.init();

  const playBtn        = document.getElementById("play-btn");
  const infoBtn        = document.getElementById("info-btn");
  const landingContent = document.querySelector(".landing-content");
  const landingScreen  = document.getElementById("landing-screen");
  const lobbyScreen    = document.getElementById("lobby-screen");

  playBtn.addEventListener("click", () => {
    landingContent.classList.add("melting");
    LavaAnimation.eruptBurst();

    setTimeout(() => {
      LavaTransition.play(() => {
        landingScreen.classList.remove("active");
        lobbyScreen.classList.add("active");

        // Landing screen is now hidden behind the lobby. Give the
        // lava-drop animation 3 seconds to fully clear, then kill
        // the ambient volcano canvas loop and remove the landing
        // screen from the DOM entirely so nothing keeps rendering
        // behind the scenes.
        setTimeout(() => {
          LavaAnimation.destroy();
          landingScreen.remove();
        }, 3000);
      });
    }, 350);
  });

  infoBtn.addEventListener("click", () => {
    alert("Information page coming soon!");
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
    });
  });

  const betInput = document.getElementById("global-bet-input");
  document.querySelectorAll(".wager-shortcuts button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = parseFloat(betInput.value) || 0;
      switch (btn.dataset.action) {
        case "min":    betInput.value = 1; break;
        case "half":   betInput.value = (current / 2).toFixed(2); break;
        case "double": betInput.value = (current * 2).toFixed(2); break;
        case "max":    betInput.value = BalanceManager.getBalance(); break;
      }
    });
  });
});