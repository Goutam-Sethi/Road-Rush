import { game } from './game.js';
import { player } from './player.js';
import { keys } from './input.js';
import { storage } from './storage.js';
import { audio } from './audio.js';

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
const audioBtn = document.getElementById('audioBtn');
const retryBtn = document.getElementById('retryBtn');
const homeBtn = document.getElementById('homeBtn');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');

const finalScoreDisplay = document.querySelector('.final-score');
const finalCoinsDisplay = document.querySelector('.final-coins');
const distanceDisplay = document.querySelector('.distance');
const topSpeedDisplay = document.querySelector('.top-speed');
const bestScoreDisplay = document.querySelector('.best-score');
const bestCoinsDisplay = document.querySelector('.best-coins');
const newRecordBadge = document.getElementById('newRecordBadge');

const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');

let countdownInterval = null;
let isCountingDown = false;

const playerCarElement = document.getElementById('playerCar');
const roadElement = document.getElementById('roadElement');

const playerInitialized = () => {
    player.initialize(playerCarElement);
};

const showGameOverScreen = () => {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    const finalScore = Math.floor(game.score);
    const finalCoins = game.coins;
    const distanceMeters = Math.floor((game.score / 10) * 20);
    const topSpeedVal = Math.round(game.topSpeed);

    // Save race result to localStorage
    const record = storage.recordRaceResult({
        score: finalScore,
        coins: finalCoins,
        distance: distanceMeters,
        topSpeed: topSpeedVal
    });

    finalScoreDisplay.textContent = finalScore.toLocaleString();
    finalCoinsDisplay.textContent = `🪙 ${finalCoins.toLocaleString()}`;
    distanceDisplay.textContent = `${distanceMeters.toLocaleString()}m`;
    topSpeedDisplay.textContent = topSpeedVal;

    if (bestScoreDisplay) {
        bestScoreDisplay.textContent = record.career.highScore.toLocaleString();
    }
    if (bestCoinsDisplay) {
        bestCoinsDisplay.textContent = `🪙 ${record.career.maxCoins.toLocaleString()}`;
    }

    if (newRecordBadge) {
        if (record.isNewHighScore && record.isNewMaxCoins) {
            newRecordBadge.textContent = '🏆 NEW ALL-TIME RECORD!';
            newRecordBadge.classList.remove('hidden');
        } else if (record.isNewHighScore) {
            newRecordBadge.textContent = '🏆 NEW HIGH SCORE!';
            newRecordBadge.classList.remove('hidden');
        } else if (record.isNewMaxCoins) {
            newRecordBadge.textContent = '🪙 NEW COIN RECORD!';
            newRecordBadge.classList.remove('hidden');
        } else {
            newRecordBadge.classList.add('hidden');
        }
    }
};

const hideGameOverScreen = () => {
    gameOverScreen.classList.add('hidden');
    if (newRecordBadge) {
        newRecordBadge.classList.add('hidden');
    }
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

const cancelCountdown = () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    isCountingDown = false;
    if (countdownOverlay) countdownOverlay.classList.add('hidden');
    audio.stopEngineStart();
};

const togglePause = () => {
    if (isCountingDown || !game.running) return;
    
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
    cancelCountdown();
    game.stop();
    window.location.href = './index.html';
};

const handleNitroTrigger = (e) => {
    if (e) e.preventDefault();
    if (isCountingDown || !game.running || game.paused) return;
    player.activateNitro();
};

const updateAudioButtonUI = () => {
    if (!audioBtn) return;
    audioBtn.textContent = audio.isMuted ? '🔇' : '🔊';
    audioBtn.classList.toggle('muted', audio.isMuted);
    audioBtn.setAttribute('title', audio.isMuted ? 'Unmute audio (M)' : 'Mute audio (M)');
};

const toggleAudio = (e) => {
    if (e) e.preventDefault();
    audio.toggleMute();
    updateAudioButtonUI();
};

const startCountdown = (onComplete) => {
    cancelCountdown();
    isCountingDown = true;

    playerInitialized();
    game.initialize(roadElement);
    game.showGameOverScreen = showGameOverScreen;

    if (!countdownOverlay || !countdownNumber) {
        isCountingDown = false;
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    countdownOverlay.classList.remove('hidden');

    // Play car engine start sound immediately
    audio.playEngineStart();

    let count = 3;
    const updateCountdownDisplay = (val, className) => {
        countdownNumber.textContent = val;
        countdownNumber.className = `countdown-number ${className}`;
        // Re-trigger animation
        countdownNumber.style.animation = 'none';
        void countdownNumber.offsetWidth; // Reflow
        countdownNumber.style.animation = '';
    };

    updateCountdownDisplay(count, `count-${count}`);

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            updateCountdownDisplay(count, `count-${count}`);
        } else if (count === 0) {
            // "GO!" hits at exactly 3 seconds
            updateCountdownDisplay('GO!', 'count-go');

            clearInterval(countdownInterval);
            countdownInterval = null;
            isCountingDown = false;

            // Stop engine start sound right at 3 seconds as the race starts
            audio.stopEngineStart(true);

            // Start race immediately on GO!
            if (typeof onComplete === 'function') {
                onComplete();
            }

            // Fade countdown overlay away smoothly while cars launch
            setTimeout(() => {
                if (countdownOverlay) {
                    countdownOverlay.classList.add('hidden');
                }
            }, 600);
        }
    }, 1000);
};

const startGame = () => {
    startCountdown(() => {
        game.start();
        updateHUD();
    });
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

if (audioBtn) {
    updateAudioButtonUI();
    audioBtn.addEventListener('click', toggleAudio);
    audioBtn.addEventListener('touchstart', toggleAudio, { passive: false });
}

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
        if (isCountingDown || !game.running || game.paused) return;
        keys.ArrowLeft = true;
        setTimeout(() => { keys.ArrowLeft = false; }, 80);
    };
    steerLeftBtn.addEventListener('click', handleSteerLeft);
    steerLeftBtn.addEventListener('touchstart', handleSteerLeft, { passive: false });
}

if (steerRightBtn) {
    const handleSteerRight = (e) => {
        if (e) e.preventDefault();
        if (isCountingDown || !game.running || game.paused) return;
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
    if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
    }
});

// Resume Web Audio Context & trigger start audio on first player gesture
const unlockAudio = () => {
    audio.resume();
    if (isCountingDown && (!audio.engineStartAudio || audio.engineStartAudio.paused)) {
        audio.playEngineStart();
    }
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
};
window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });

// Start game on load
startGame();
