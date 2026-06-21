// Wires up the landing page buttons + screen transitions.

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("play-btn");
  const infoBtn = document.getElementById("info-btn");
  const landingContent = document.querySelector(".landing-content");
  const landingScreen = document.getElementById("landing-screen");
  const lobbyScreen = document.getElementById("lobby-screen");
  const flashOverlay = document.getElementById("flash-overlay");

  playBtn.addEventListener("click", () => {
    landingContent.classList.add("erupting");
    LavaAnimation.eruptBurst();

    flashOverlay.classList.add("flash");
    setTimeout(() => {
      flashOverlay.classList.remove("flash");
    }, 500);

    setTimeout(() => {
      landingScreen.classList.remove("active");
      lobbyScreen.classList.add("active");
    }, 700);
  });

  infoBtn.addEventListener("click", () => {
    alert("Information page coming soon!");
  });
});