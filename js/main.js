import { game } from "./game.js";
import { player } from "./player.js";

const homeScreen = document.querySelector(".home-screen");
const startScreen = document.querySelector(".start-screen");
const gameScreen = document.querySelector(".game-screen");
const gameOverScreen = document.querySelector(".game-over-screen");
const pauseScreen = document.querySelector(".pause-screen");

const playBtn = document.querySelector(".play-btn");
const startButton = document.querySelector(".start-btn");
const backHomeBtn = document.querySelector(".back-home-btn");
const pauseBtn = document.querySelector(".pause-btn");
const retryBtn = document.querySelector(".retry-btn");
const homeBtn = document.querySelector(".home-btn");
const resumeBtn = document.querySelector(".resume-btn");
const quitBtn = document.querySelector(".quit-btn");

const playerCar = document.querySelector(".player-car");
const scoreDisplay = document.querySelector(".score");
const speedDisplay = document.querySelector(".speed");
const livesElements = document.querySelectorAll(".life");

player.initialize(playerCar);
game.initialize();

playBtn.addEventListener("click", goToStartScreen);
startButton.addEventListener("click", startGame);
backHomeBtn.addEventListener("click", goHome);
pauseBtn.addEventListener("click", togglePause);
retryBtn.addEventListener("click", retryGame);
homeBtn.addEventListener("click", goHome);
resumeBtn.addEventListener("click", resumeGame);
quitBtn.addEventListener("click", goHome);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && game.running && !game.paused) {
        togglePause();
    }
});

function goToStartScreen() {
    homeScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    updateHighScoreDisplay();
}

function startGame() {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    game.start();
    updateHUD();
}

function togglePause() {
    if (!game.running) return;

    if (game.paused) {
        resumeGame();
    } else {
        game.pause();
        pauseScreen.classList.remove("hidden");
    }
}

function resumeGame() {
    pauseScreen.classList.add("hidden");
    game.resume();
    updateHUD();
}

function retryGame() {
    gameOverScreen.classList.add("hidden");
    startGame();
}

function goHome() {
    homeScreen.classList.remove("hidden");
    startScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    game.stop();
}

function updateHighScoreDisplay() {
    const highScoreElement = document.querySelector(".high-score");
    if (highScoreElement) {
        highScoreElement.textContent = "0";
    }
}

function updateHUD() {
    scoreDisplay.textContent = `Score: ${Math.floor(game.score)}`;
    speedDisplay.textContent = `Speed: ${Math.round(game.speed)}`;

    // Update lives display
    livesElements.forEach((lifeElement, index) => {
        if (index < game.lives) {
            lifeElement.classList.remove("lost");
        } else {
            lifeElement.classList.add("lost");
        }
    });

    if (game.running) {
        requestAnimationFrame(updateHUD);
    }
}

document.getElementById("all-time-high").textContent = "0";
document.getElementById("times-played").textContent = "0";