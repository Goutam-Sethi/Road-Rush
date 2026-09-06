import { storage } from './storage.js';
import { audio } from './audio.js';

document.addEventListener("DOMContentLoaded", () => {
    const allTimeHighEl = document.getElementById("all-time-high");
    const maxCoinsEl = document.getElementById("max-coins") || document.getElementById("total-coins");
    const audioBtn = document.getElementById("audioBtn");
    const playBtn = document.querySelector(".play-btn");

    const renderStats = () => {
        const stats = storage.getCareerStats();

        if (allTimeHighEl) {
            allTimeHighEl.textContent = stats.highScore.toLocaleString();
        }
        if (maxCoinsEl) {
            maxCoinsEl.textContent = stats.maxCoins.toLocaleString();
        }
    };

    const updateAudioButtonUI = () => {
        if (!audioBtn) return;
        audioBtn.textContent = audio.isMuted ? '🔇' : '🔊';
        audioBtn.classList.toggle('muted', audio.isMuted);
        audioBtn.setAttribute('title', audio.isMuted ? 'Unmute music & audio (M)' : 'Mute music & audio (M)');
    };

    const toggleAudio = (e) => {
        if (e) e.preventDefault();
        audio.toggleMute();
        updateAudioButtonUI();
    };

    if (audioBtn) {
        audioBtn.addEventListener('click', toggleAudio);
        audioBtn.addEventListener('touchstart', toggleAudio, { passive: false });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            toggleAudio();
        }
    });

    // Start background music when index.html opens
    audio.playBackgroundMusic();
    updateAudioButtonUI();

    // Ensure music unlocks on first user gesture if browser blocks initial autoplay
    const unlockAudio = () => {
        audio.resume();
        if (!audio.isMuted && (!audio.bgMusicAudio || audio.bgMusicAudio.paused)) {
            audio.playBackgroundMusic();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // Stop background music smoothly when moving to the race screen
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            audio.stopBackgroundMusic();
        });
    }

    renderStats();
});