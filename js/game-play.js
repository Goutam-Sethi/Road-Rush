import { game } from './game.js';
import { player } from './player.js';

const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const scoreDisplay = document.querySelector('.score');
const speedDisplay = document.querySelector('.speed');
const livesDisplay = document.querySelector('.lives');
const pauseBtn = document.querySelector('.pause-btn');
const retryBtn = document.getElementById('retryBtn');
const homeBtn = document.getElementById('homeBtn');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');
const finalScoreDisplay = document.querySelector('.final-score');
const distanceDisplay = document.querySelector('.distance');
const topSpeedDisplay = document.querySelector('.top-speed');
const playerCarElement = document.querySelector('.player-car');
const roadElement = document.querySelector('.road');

const playerInitialized = () => {
    player.initialize(playerCarElement);
};

const showGameOverScreen = () => {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = Math.floor(game.score);
    distanceDisplay.textContent = Math.floor((game.score / 10) * 20) + 'm';
    topSpeedDisplay.textContent = Math.floor(game.topSpeed);
};


const hideGameOverScreen = () => {
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
};

const showPauseScreen = () => {
    gameScreen.classList.add('hidden');
    pauseScreen.classList.remove('hidden');
};

const hidePauseScreen = () => {
    pauseScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
};

const togglePause = () => {
    if (!game.running) return;
    
    if (game.paused) {
        resumeGame();
    } else {
        game.pause();
        showPauseScreen();
    }
};

const resumeGame = () => {
    hidePauseScreen();
    game.resume();
    updateHUD();
};

const retryGame = () => {
    hideGameOverScreen();
    startGame();
};

const goHome = () => {
    game.stop();
    window.location.href = './index.html';
};

const startGame = () => {
    playerInitialized();
    game.initialize(roadElement);
    game.start();
    updateHUD();
};

const updateHUD = () => {
    if (!game.running) return;

    scoreDisplay.textContent = `Score: ${Math.floor(game.score)}`;
    speedDisplay.textContent = `Speed: ${Math.floor(game.speed)}`;

    // Update lives display
    const lifeElements = livesDisplay.querySelectorAll('.life');
    lifeElements.forEach((life, index) => {
        if (index < game.lives) {
            life.classList.remove('lost');
        } else {
            life.classList.add('lost');
        }
    });

    // Expose game functions for game.js
    game.showGameOverScreen = showGameOverScreen;

    requestAnimationFrame(updateHUD);
};

pauseBtn.addEventListener('click', togglePause);
retryBtn.addEventListener('click', retryGame);
homeBtn.addEventListener('click', goHome);
resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', goHome);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && game.running && !game.paused) {
        togglePause();
    }
});

startGame();
