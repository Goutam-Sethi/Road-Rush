import { storage } from './storage.js';
import { audio } from './audio.js';
import { CARS, getCarById } from './cars.js';

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements - Home Screen
    const allTimeHighEl = document.getElementById("all-time-high");
    const maxCoinsEl = document.getElementById("max-coins");
    const homeTotalCoinsEl = document.getElementById("home-total-coins");
    const topTotalCoinsEl = document.getElementById("top-total-coins");
    const audioBtn = document.getElementById("audioBtn");
    const playBtn = document.querySelector(".play-btn");

    const heroCarImg = document.getElementById("heroCarImg");
    const heroCarPreview = document.getElementById("heroCarPreview");

    // DOM Elements - Garage Modal
    const garageModal = document.getElementById("garageModal");
    const openGarageBtn = document.getElementById("openGarageBtn");
    const closeGarageBtn = document.getElementById("closeGarageBtn");
    const garageVaultCoins = document.getElementById("garageVaultCoins");

    const prevCarBtn = document.getElementById("prevCarBtn");
    const nextCarBtn = document.getElementById("nextCarBtn");
    const garageDotsContainer = document.getElementById("garageDots");

    const garageCarPreview = document.getElementById("garageCarPreview");
    const podiumAura = document.getElementById("podiumAura");

    const garageCarTag = document.getElementById("garageCarTag");
    const garageCarName = document.getElementById("garageCarName");
    const garageCarDesc = document.getElementById("garageCarDesc");

    const statSpeedVal = document.getElementById("statSpeedVal");
    const statSpeedFill = document.getElementById("statSpeedFill");
    const statNitroVal = document.getElementById("statNitroVal");
    const statNitroFill = document.getElementById("statNitroFill");
    const statHandlingVal = document.getElementById("statHandlingVal");
    const statHandlingFill = document.getElementById("statHandlingFill");

    const garagePriceVal = document.getElementById("garagePriceVal");
    const garageActionBtn = document.getElementById("garageActionBtn");

    let currentCarIndex = 0;

    // Initialize carousel dots
    const setupGarageDots = () => {
        if (!garageDotsContainer) return;
        garageDotsContainer.innerHTML = '';
        CARS.forEach((car, index) => {
            const dot = document.createElement('button');
            dot.className = `garage-dot ${index === currentCarIndex ? 'active' : ''}`;
            dot.setAttribute('aria-label', `View ${car.name}`);
            dot.addEventListener('click', () => {
                currentCarIndex = index;
                renderGarageCar(currentCarIndex);
            });
            garageDotsContainer.appendChild(dot);
        });
    };

    const updateDots = () => {
        if (!garageDotsContainer) return;
        const dots = garageDotsContainer.querySelectorAll('.garage-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentCarIndex);
        });
    };

    const renderWallet = () => {
        const total = storage.getTotalCoins();
        const formatted = total.toLocaleString();

        if (homeTotalCoinsEl) homeTotalCoinsEl.textContent = formatted;
        if (topTotalCoinsEl) topTotalCoinsEl.textContent = formatted;
        if (garageVaultCoins) garageVaultCoins.textContent = formatted;
    };

    const updateHeroCar = () => {
        const selectedId = storage.getSelectedCarId();
        const selectedCar = getCarById(selectedId);

        if (heroCarImg && selectedCar.svg) {
            heroCarImg.src = selectedCar.svg;
        }
    };

    const renderStats = () => {
        const stats = storage.getCareerStats();

        if (allTimeHighEl) {
            allTimeHighEl.textContent = stats.highScore.toLocaleString();
        }
        if (maxCoinsEl) {
            maxCoinsEl.textContent = stats.maxCoins.toLocaleString();
        }
        renderWallet();
        updateHeroCar();
    };

    const renderGarageCar = (index) => {
        const car = CARS[index];
        if (!car) return;

        // Image & Aura
        if (garageCarPreview) {
            garageCarPreview.src = car.svg;
            // Quick pop animation
            garageCarPreview.style.animation = 'none';
            void garageCarPreview.offsetWidth;
            garageCarPreview.style.animation = 'carPodiumFloat 3.5s ease-in-out infinite';
        }
        if (podiumAura) {
            const glow = car.accentColor || '#00f3ff';
            podiumAura.style.background = `radial-gradient(circle, ${glow}66 0%, transparent 70%)`;
        }

        // Details
        if (garageCarTag) garageCarTag.textContent = car.tagline || 'RACER';
        if (garageCarName) garageCarName.textContent = car.name;
        if (garageCarDesc) garageCarDesc.textContent = car.description;

        // Stats
        if (statSpeedVal) statSpeedVal.textContent = `${car.stats.speed}%`;
        if (statSpeedFill) statSpeedFill.style.width = `${car.stats.speed}%`;

        if (statNitroVal) statNitroVal.textContent = `${car.stats.nitro}%`;
        if (statNitroFill) statNitroFill.style.width = `${car.stats.nitro}%`;

        if (statHandlingVal) statHandlingVal.textContent = `${car.stats.handling}%`;
        if (statHandlingFill) statHandlingFill.style.width = `${car.stats.handling}%`;

        // Check ownership & selection
        const isOwned = storage.isCarOwned(car.id);
        const isSelected = storage.getSelectedCarId() === car.id;
        const totalCoins = storage.getTotalCoins();

        if (garageActionBtn && garagePriceVal) {
            garageActionBtn.className = 'garage-action-btn';

            if (isSelected) {
                garagePriceVal.textContent = 'ACTIVE';
                garagePriceVal.style.color = '#2ed573';
                garageActionBtn.textContent = 'EQUIPPED';
                garageActionBtn.classList.add('btn-equipped');
                garageActionBtn.disabled = true;
            } else if (isOwned) {
                garagePriceVal.textContent = 'OWNED';
                garagePriceVal.style.color = '#00e5ff';
                garageActionBtn.textContent = 'EQUIP CAR';
                garageActionBtn.classList.add('btn-equip');
                garageActionBtn.disabled = false;
            } else {
                garagePriceVal.textContent = `${car.price.toLocaleString()} COINS`;
                garagePriceVal.style.color = '#ffd700';

                if (totalCoins >= car.price) {
                    garageActionBtn.textContent = `BUY FOR ${car.price} COINS`;
                    garageActionBtn.classList.add('btn-buy');
                    garageActionBtn.disabled = false;
                } else {
                    const needed = car.price - totalCoins;
                    garageActionBtn.textContent = `NEED +${needed.toLocaleString()} COINS`;
                    garageActionBtn.classList.add('btn-locked');
                    garageActionBtn.disabled = true;
                }
            }
        }

        updateDots();
    };

    const handleGarageAction = () => {
        const car = CARS[currentCarIndex];
        if (!car) return;

        const isOwned = storage.isCarOwned(car.id);
        const isSelected = storage.getSelectedCarId() === car.id;

        if (isSelected) return;

        if (isOwned) {
            storage.setSelectedCarId(car.id);
            audio.playNitroPickup();
            renderGarageCar(currentCarIndex);
            updateHeroCar();
            return;
        }

        // Buy car
        const result = storage.buyCar(car.id, car.price);
        if (result.success) {
            audio.playCoin();
            renderWallet();
            renderGarageCar(currentCarIndex);
            updateHeroCar();
        }
    };

    const openGarage = () => {
        if (!garageModal) return;
        const selectedId = storage.getSelectedCarId();
        const foundIndex = CARS.findIndex(c => c.id === selectedId);
        currentCarIndex = foundIndex !== -1 ? foundIndex : 0;

        garageModal.classList.remove('hidden');
        renderWallet();
        renderGarageCar(currentCarIndex);
    };

    const closeGarage = () => {
        if (!garageModal) return;
        garageModal.classList.add('hidden');
        updateHeroCar();
    };

    const prevCar = () => {
        currentCarIndex = (currentCarIndex - 1 + CARS.length) % CARS.length;
        renderGarageCar(currentCarIndex);
    };

    const nextCar = () => {
        currentCarIndex = (currentCarIndex + 1) % CARS.length;
        renderGarageCar(currentCarIndex);
    };

    // Event Listeners for Garage
    if (openGarageBtn) openGarageBtn.addEventListener('click', openGarage);
    if (heroCarPreview) {
        heroCarPreview.style.cursor = 'pointer';
        heroCarPreview.addEventListener('click', openGarage);
    }
    if (closeGarageBtn) closeGarageBtn.addEventListener('click', closeGarage);

    if (garageModal) {
        garageModal.addEventListener('click', (e) => {
            if (e.target === garageModal) closeGarage();
        });
    }

    if (prevCarBtn) prevCarBtn.addEventListener('click', prevCar);
    if (nextCarBtn) nextCarBtn.addEventListener('click', nextCar);
    if (garageActionBtn) garageActionBtn.addEventListener('click', handleGarageAction);

    // Audio Controls
    const updateAudioButtonUI = () => {
        if (!audioBtn) return;
        audioBtn.classList.toggle('muted', audio.isMuted);
        audioBtn.setAttribute('title', audio.isMuted ? 'Unmute music & audio (M)' : 'Mute music & audio (M)');
        const unmutedIcon = audioBtn.querySelector('.unmuted-icon');
        const mutedIcon = audioBtn.querySelector('.muted-icon');
        if (unmutedIcon && mutedIcon) {
            unmutedIcon.classList.toggle('hidden', audio.isMuted);
            mutedIcon.classList.toggle('hidden', !audio.isMuted);
        }
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

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        const isGarageOpen = garageModal && !garageModal.classList.contains('hidden');

        if (e.key === 'Escape') {
            if (isGarageOpen) closeGarage();
            return;
        }

        if (e.key === 'g' || e.key === 'G') {
            if (isGarageOpen) closeGarage();
            else openGarage();
            return;
        }

        if (isGarageOpen) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevCar();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextCar();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleGarageAction();
            }
            return;
        }

        if (e.key === 'm' || e.key === 'M') {
            toggleAudio();
        }

        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            if (playBtn) window.location.href = playBtn.href;
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

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            audio.stopBackgroundMusic();
        });
    }

    // Difficulty buttons
    const diffBtns = document.querySelectorAll('.diff-btn');
    if (diffBtns.length > 0) {
        const currentDiff = storage.getDifficulty() || 'Medium';
        diffBtns.forEach(btn => {
            if (btn.dataset.diff === currentDiff) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            btn.addEventListener('click', () => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                storage.setDifficulty(btn.dataset.diff);
            });
        });
    }

    setupGarageDots();
    renderStats();

    // Support opening garage via query parameter (e.g. index.html?open=garage)
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('open') === 'garage') {
            openGarage();
        }
    } catch {}
});
