// Wires up the landing page buttons + screen transitions, plus
// lobby navigation to individual games.

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("play-btn");
  const infoBtn = document.getElementById("info-btn");
  const landingContent = document.querySelector(".landing-content");
  const landingScreen = document.getElementById("landing-screen");
  const lobbyScreen = document.getElementById("lobby-screen");
  const flashOverlay = document.getElementById("flash-overlay");

  function showScreen(screenEl) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    screenEl.classList.add("active");
  }

  playBtn.addEventListener("click", () => {
    landingContent.classList.add("erupting");
    LavaAnimation.eruptBurst();

    flashOverlay.classList.add("flash");
    setTimeout(() => {
      flashOverlay.classList.remove("flash");
    }, 500);

    setTimeout(() => {
      showScreen(lobbyScreen);
    }, 700);
  });

  infoBtn.addEventListener("click", () => {
    alert("Information page coming soon!");
  });

  document.querySelectorAll(".lobby-game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const game = card.dataset.game;
      const targetScreen = document.getElementById(`${game}-screen`);
      if (targetScreen) showScreen(targetScreen);
    });
  });

  document.querySelectorAll(".back-to-lobby-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(lobbyScreen);
    });
  });
});