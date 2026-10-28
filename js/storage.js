// =============================================================================
// STORAGE MANAGER MODULE
// Handles persistent career records (localStorage)
// Tracks: All-Time High Score, Max Coins in a Game, Max Distance, Top Speed,
//         Total Accumulated Coins (Wallet), Owned Cars, and Selected Car
// =============================================================================

const STORAGE_KEYS = {
    HIGH_SCORE: 'road_rush_high_score',
    MAX_COINS: 'road_rush_max_coins',
    MAX_DISTANCE: 'road_rush_max_distance',
    TOP_SPEED: 'road_rush_top_speed',
    DIFFICULTY: 'road_rush_difficulty',
    TOTAL_COINS: 'road_rush_total_coins',
    OWNED_CARS: 'road_rush_owned_cars',
    SELECTED_CAR: 'road_rush_selected_car'
};

const DEFAULT_CAR_ID = 'cobalt_phantom';

// In-memory fallback if web storage is disabled / blocked
const memoryStore = {};

const isStorageAvailable = () => {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

const hasLocalStorage = isStorageAvailable();

const getLocalItem = (key, defaultValue = '0') => {
    try {
        if (hasLocalStorage) {
            const val = localStorage.getItem(key);
            return val !== null ? val : defaultValue;
        }
    } catch (e) {
        console.warn('LocalStorage read error:', e);
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : defaultValue;
};

const setLocalItem = (key, value) => {
    try {
        if (hasLocalStorage) {
            localStorage.setItem(key, String(value));
            return;
        }
    } catch (e) {
        console.warn('LocalStorage write error:', e);
    }
    memoryStore[key] = String(value);
};

export const storage = {
    getDifficulty() {
        return getLocalItem(STORAGE_KEYS.DIFFICULTY, 'Medium');
    },

    setDifficulty(diff) {
        setLocalItem(STORAGE_KEYS.DIFFICULTY, diff);
    },

    /**
     * Retrieve all persistent career statistics.
     * @returns {{ highScore: number, maxCoins: number, maxDistance: number, topSpeed: number, totalCoins: number }}
     */
    getCareerStats() {
        return {
            highScore: parseInt(getLocalItem(STORAGE_KEYS.HIGH_SCORE, '0'), 10) || 0,
            maxCoins: parseInt(getLocalItem(STORAGE_KEYS.MAX_COINS, '0'), 10) || 0,
            maxDistance: parseInt(getLocalItem(STORAGE_KEYS.MAX_DISTANCE, '0'), 10) || 0,
            topSpeed: parseInt(getLocalItem(STORAGE_KEYS.TOP_SPEED, '0'), 10) || 0,
            totalCoins: this.getTotalCoins()
        };
    },

    /**
     * Retrieve persistent total coin wallet balance.
     * @returns {number}
     */
    getTotalCoins() {
        return Math.max(0, parseInt(getLocalItem(STORAGE_KEYS.TOTAL_COINS, '0'), 10) || 0);
    },

    /**
     * Add coins to the total wallet balance.
     * @param {number} amount
     * @returns {number} New total balance
     */
    addCoins(amount) {
        const add = Math.max(0, Math.floor(amount || 0));
        const current = this.getTotalCoins();
        const updated = current + add;
        setLocalItem(STORAGE_KEYS.TOTAL_COINS, updated);
        return updated;
    },

    /**
     * Spend coins from wallet.
     * @param {number} amount
     * @returns {boolean} True if purchase successful, false if insufficient funds
     */
    spendCoins(amount) {
        const cost = Math.max(0, Math.floor(amount || 0));
        const current = this.getTotalCoins();
        if (current < cost) {
            return false;
        }
        setLocalItem(STORAGE_KEYS.TOTAL_COINS, current - cost);
        return true;
    },

    /**
     * Get array of unlocked car IDs.
     * @returns {string[]}
     */
    getOwnedCars() {
        try {
            const raw = getLocalItem(STORAGE_KEYS.OWNED_CARS, null);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (!parsed.includes(DEFAULT_CAR_ID)) {
                        parsed.unshift(DEFAULT_CAR_ID);
                    }
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Error reading owned cars:', e);
        }
        return [DEFAULT_CAR_ID];
    },

    /**
     * Check if a specific car ID is owned.
     * @param {string} carId
     * @returns {boolean}
     */
    isCarOwned(carId) {
        if (carId === DEFAULT_CAR_ID) return true;
        const owned = this.getOwnedCars();
        return owned.includes(carId);
    },

    /**
     * Purchase a car using accumulated coins.
     * Automatically equips car upon successful purchase.
     * @param {string} carId
     * @param {number} price
     * @returns {{ success: boolean, message: string, totalCoins: number }}
     */
    buyCar(carId, price = 0) {
        if (this.isCarOwned(carId)) {
            this.setSelectedCarId(carId);
            return { success: true, message: 'Already owned. Car equipped!', totalCoins: this.getTotalCoins() };
        }

        const cost = Math.max(0, Math.floor(price));
        if (this.getTotalCoins() < cost) {
            return { success: false, message: 'Not enough coins!', totalCoins: this.getTotalCoins() };
        }

        if (this.spendCoins(cost)) {
            const owned = this.getOwnedCars();
            if (!owned.includes(carId)) {
                owned.push(carId);
                setLocalItem(STORAGE_KEYS.OWNED_CARS, JSON.stringify(owned));
            }
            this.setSelectedCarId(carId);
            return { success: true, message: 'Car purchased & equipped!', totalCoins: this.getTotalCoins() };
        }

        return { success: false, message: 'Transaction failed', totalCoins: this.getTotalCoins() };
    },

    /**
     * Get currently equipped car ID.
     * @returns {string}
     */
    getSelectedCarId() {
        const id = getLocalItem(STORAGE_KEYS.SELECTED_CAR, DEFAULT_CAR_ID);
        return this.isCarOwned(id) ? id : DEFAULT_CAR_ID;
    },

    /**
     * Set equipped car ID (must be owned).
     * @param {string} carId
     * @returns {boolean}
     */
    setSelectedCarId(carId) {
        if (this.isCarOwned(carId)) {
            setLocalItem(STORAGE_KEYS.SELECTED_CAR, carId);
            return true;
        }
        return false;
    },

    /**
     * Record the results of a finished race into localStorage.
     * Updates High score, Max Coins in single run, and adds race coins to Total Coins wallet.
     * @param {{ score: number, coins: number, distance: number, topSpeed: number }} result
     * @returns {{ isNewHighScore: boolean, isNewMaxCoins: boolean, career: object, totalCoins: number }}
     */
    recordRaceResult({ score = 0, coins = 0, distance = 0, topSpeed = 0 }) {
        const finalScore = Math.max(0, Math.floor(score));
        const finalCoins = Math.max(0, Math.floor(coins));
        const finalDistance = Math.max(0, Math.floor(distance));
        const finalTopSpeed = Math.max(0, Math.round(topSpeed));

        const career = this.getCareerStats();

        // Check if records were broken
        const isNewHighScore = finalScore > career.highScore;
        const isNewMaxCoins = finalCoins > career.maxCoins;

        // Bank collected race coins into total persistent wallet
        const newTotalCoins = this.addCoins(finalCoins);

        // Update Career records
        const updatedCareer = {
            highScore: Math.max(career.highScore, finalScore),
            maxCoins: Math.max(career.maxCoins, finalCoins),
            maxDistance: Math.max(career.maxDistance, finalDistance),
            topSpeed: Math.max(career.topSpeed, finalTopSpeed),
            totalCoins: newTotalCoins
        };

        setLocalItem(STORAGE_KEYS.HIGH_SCORE, updatedCareer.highScore);
        setLocalItem(STORAGE_KEYS.MAX_COINS, updatedCareer.maxCoins);
        setLocalItem(STORAGE_KEYS.MAX_DISTANCE, updatedCareer.maxDistance);
        setLocalItem(STORAGE_KEYS.TOP_SPEED, updatedCareer.topSpeed);

        return {
            isNewHighScore,
            isNewMaxCoins,
            career: updatedCareer,
            totalCoins: newTotalCoins
        };
    },

    /**
     * Clear all persistent career statistics and garage data.
     */
    resetCareerStats() {
        [
            STORAGE_KEYS.HIGH_SCORE,
            STORAGE_KEYS.MAX_COINS,
            STORAGE_KEYS.MAX_DISTANCE,
            STORAGE_KEYS.TOP_SPEED,
            STORAGE_KEYS.TOTAL_COINS,
            STORAGE_KEYS.OWNED_CARS,
            STORAGE_KEYS.SELECTED_CAR,
            'road_rush_times_played'
        ].forEach(key => {
            try {
                if (hasLocalStorage) localStorage.removeItem(key);
            } catch (e) {
                console.warn(e);
            }
            delete memoryStore[key];
        });

        try {
            [
                'road_rush_session_runs',
                'road_rush_session_high_score',
                'road_rush_session_coins',
                'road_rush_last_run'
            ].forEach(k => sessionStorage.removeItem(k));
        } catch {}
    }
};
