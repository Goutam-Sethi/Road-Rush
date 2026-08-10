const startScreen = document.querySelector(".start-screen");
const gameScreen = document.querySelector(".game-screen");
const startButton = document.querySelector(".start-btn");

startButton.addEventListener("click", startGame);

function startGame() {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
}