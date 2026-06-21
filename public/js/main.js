// Wires up the landing page transition + tab navigation in the
// dashboard-style lobby.

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("play-btn");
  const infoBtn = document.getElementById("info-btn");
  const landingContent = document.querySelector(".landing-content");
  const landingScreen = document.getElementById("landing-screen");
  const lobbyScreen = document.getElementById("lobby-screen");
  const flashOverlay = document.getElementById("flash-overlay");
  const magmaFlood = document.getElementById("magma-flood");

  playBtn.addEventListener("click", () => {
    // 1. content melts and collapses downward
    landingContent.classList.add("melting");
    LavaAnimation.eruptBurst();

    // 2. shortly after, the magma flood rises to swallow the screen
    setTimeout(() => {
      magmaFlood.classList.add("rising");
    }, 250);

    // 3. flash at the peak of the flood
    setTimeout(() => {
      flashOverlay.classList.add("flash");
      setTimeout(() => flashOverlay.classList.remove("flash"), 500);
    }, 1000);

    // 4. swap to lobby once the flood has fully covered the screen
    setTimeout(() => {
      landingScreen.classList.remove("active");
      lobbyScreen.classList.add("active");
      // reset for next time the landing screen is shown
      landingContent.classList.remove("melting");
      magmaFlood.classList.remove("rising");
    }, 1150);
  });

  infoBtn.addEventListener("click", () => {
    alert("Information page coming soon!");
  });

  // tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
    });
  });

  // wager shortcut buttons (placeholder behavior for now)
  const betInput = document.getElementById("global-bet-input");
  document.querySelectorAll(".wager-shortcuts button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = parseFloat(betInput.value) || 0;
      switch (btn.dataset.action) {
        case "min": betInput.value = 1; break;
        case "half": betInput.value = (current / 2).toFixed(2); break;
        case "double": betInput.value = (current * 2).toFixed(2); break;
        case "max": betInput.value = 1000; break;
      }
    });
  });
});