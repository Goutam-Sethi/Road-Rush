import { game } from './game.js';
import { player } from './player.js';
import { keys } from './input.js';

const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');

const scoreDisplay = document.querySelector('.score');
const coinsDisplay = document.querySelector('.coins-count');
const speedDisplay = document.querySelector('.speed');
const livesDisplay = document.querySelector('.lives');

const nitroBarFill = document.getElementById('nitroBarFill');
const nitroPercent = document.querySelector('.nitro-percent');
const nitroActionBtn = document.getElementById('nitroActionBtn');
const mobileNitroBtn = document.getElementById('mobileNitroBtn');
const steerLeftBtn = document.getElementById('steerLeftBtn');
const steerRightBtn = document.getElementById('steerRightBtn');

const pauseBtn = document.getElementById('pauseBtn');
const retryBtn = document.getElementById('retryBtn');
const homeBtn = document.getElementById('homeBtn');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');

const finalScoreDisplay = document.querySelector('.final-score');
const finalCoinsDisplay = document.querySelector('.final-coins');
const distanceDisplay = document.querySelector('.distance');
const topSpeedDisplay = document.querySelector('.top-speed');

const playerCarElement = document.getElementById('playerCar');
const roadElement = document.getElementById('roadElement');

const playerInitialized = () => {
    player.initialize(playerCarElement);
};

const showGameOverScreen = () => {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    finalScoreDisplay.textContent = Math.floor(game.score);
    finalCoinsDisplay.textContent = `🪙 ${game.coins}`;
    distanceDisplay.textContent = Math.floor((game.score / 10) * 20) + 'm';
    topSpeedDisplay.textContent = Math.round(game.topSpeed);
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

const handleNitroTrigger = (e) => {
    if (e) e.preventDefault();
    if (!game.running || game.paused) return;
    player.activateNitro();
};

const startGame = () => {
    playerInitialized();
    game.initialize(roadElement);
    game.showGameOverScreen = showGameOverScreen;
    game.start();
    updateHUD();
};

const updateHUD = () => {
    if (!game.running) return;

    scoreDisplay.textContent = Math.floor(game.score);
    if (coinsDisplay) coinsDisplay.textContent = game.coins;
    speedDisplay.textContent = Math.round(game.speed);

    // Update Nitro bar and button indicators
    const nitroVal = Math.round(player.nitroGauge);
    if (nitroBarFill) {
        nitroBarFill.style.width = `${nitroVal}%`;
    }
    if (nitroPercent) {
        nitroPercent.textContent = `${nitroVal}%`;
    }

    if (player.isNitroActive) {
        if (nitroBarFill) nitroBarFill.classList.add('active-burning');
        if (nitroActionBtn) {
            nitroActionBtn.classList.add('boosting');
            nitroActionBtn.textContent = '🔥 BOOSTING';
        }
        if (mobileNitroBtn) {
            mobileNitroBtn.classList.add('boosting');
            mobileNitroBtn.textContent = '🔥 ACTIVE';
        }
    } else {
        if (nitroBarFill) nitroBarFill.classList.remove('active-burning');
        if (nitroActionBtn) {
            nitroActionBtn.classList.remove('boosting');
            if (nitroVal >= 20) {
                nitroActionBtn.classList.add('ready');
                nitroActionBtn.textContent = '⚡ BOOST';
            } else {
                nitroActionBtn.classList.remove('ready');
                nitroActionBtn.textContent = '⚡ NEED NOS';
            }
        }
        if (mobileNitroBtn) {
            mobileNitroBtn.classList.remove('boosting');
            if (nitroVal >= 20) {
                mobileNitroBtn.classList.add('ready');
            } else {
                mobileNitroBtn.classList.remove('ready');
            }
        }
    }

    // Update lives display
    const lifeElements = livesDisplay.querySelectorAll('.life');
    lifeElements.forEach((life, index) => {
        if (index < game.lives) {
            life.classList.remove('lost');
        } else {
            life.classList.add('lost');
        }
    });

    requestAnimationFrame(updateHUD);
};

// Event Listeners
if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
if (retryBtn) retryBtn.addEventListener('click', retryGame);
if (homeBtn) homeBtn.addEventListener('click', goHome);
if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
if (quitBtn) quitBtn.addEventListener('click', goHome);

if (nitroActionBtn) {
    nitroActionBtn.addEventListener('click', handleNitroTrigger);
    nitroActionBtn.addEventListener('touchstart', handleNitroTrigger, { passive: false });
}

if (mobileNitroBtn) {
    mobileNitroBtn.addEventListener('click', handleNitroTrigger);
    mobileNitroBtn.addEventListener('touchstart', handleNitroTrigger, { passive: false });
}

if (steerLeftBtn) {
    const handleSteerLeft = (e) => {
        if (e) e.preventDefault();
        keys.ArrowLeft = true;
        setTimeout(() => { keys.ArrowLeft = false; }, 80);
    };
    steerLeftBtn.addEventListener('click', handleSteerLeft);
    steerLeftBtn.addEventListener('touchstart', handleSteerLeft, { passive: false });
}

if (steerRightBtn) {
    const handleSteerRight = (e) => {
        if (e) e.preventDefault();
        keys.ArrowRight = true;
        setTimeout(() => { keys.ArrowRight = false; }, 80);
    };
    steerRightBtn.addEventListener('click', handleSteerRight);
    steerRightBtn.addEventListener('touchstart', handleSteerRight, { passive: false });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && game.running) {
        togglePause();
    }
});

// Start game on load
startGame();
