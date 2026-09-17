// =============================================================================
// STORAGE MANAGER MODULE
// Handles persistent career records (localStorage)
// Tracks: All-Time High Score, Max Coins in a Game, Max Distance, Top Speed
// =============================================================================

const STORAGE_KEYS = {
    HIGH_SCORE: 'road_rush_high_score',
    MAX_COINS: 'road_rush_max_coins',
    MAX_DISTANCE: 'road_rush_max_distance',
    TOP_SPEED: 'road_rush_top_speed',
    DIFFICULTY: 'road_rush_difficulty'
};

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
     * @returns {{ highScore: number, maxCoins: number, maxDistance: number, topSpeed: number }}
     */
    getCareerStats() {
        return {
            highScore: parseInt(getLocalItem(STORAGE_KEYS.HIGH_SCORE, '0'), 10) || 0,
            maxCoins: parseInt(getLocalItem(STORAGE_KEYS.MAX_COINS, '0'), 10) || 0,
            maxDistance: parseInt(getLocalItem(STORAGE_KEYS.MAX_DISTANCE, '0'), 10) || 0,
            topSpeed: parseInt(getLocalItem(STORAGE_KEYS.TOP_SPEED, '0'), 10) || 0
        };
    },

    /**
     * Record the results of a finished race into localStorage.
     * Updates All-Time High score and Max Coins in a single game record.
     * @param {{ score: number, coins: number, distance: number, topSpeed: number }} result
     * @returns {{ isNewHighScore: boolean, isNewMaxCoins: boolean, career: object }}
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

        // Update Career records
        const updatedCareer = {
            highScore: Math.max(career.highScore, finalScore),
            maxCoins: Math.max(career.maxCoins, finalCoins),
            maxDistance: Math.max(career.maxDistance, finalDistance),
            topSpeed: Math.max(career.topSpeed, finalTopSpeed)
        };

        setLocalItem(STORAGE_KEYS.HIGH_SCORE, updatedCareer.highScore);
        setLocalItem(STORAGE_KEYS.MAX_COINS, updatedCareer.maxCoins);
        setLocalItem(STORAGE_KEYS.MAX_DISTANCE, updatedCareer.maxDistance);
        setLocalItem(STORAGE_KEYS.TOP_SPEED, updatedCareer.topSpeed);

        return {
            isNewHighScore,
            isNewMaxCoins,
            career: updatedCareer
        };
    },

    /**
     * Clear all persistent career statistics.
     */
    resetCareerStats() {
        [
            STORAGE_KEYS.HIGH_SCORE,
            STORAGE_KEYS.MAX_COINS,
            STORAGE_KEYS.MAX_DISTANCE,
            STORAGE_KEYS.TOP_SPEED,
            'road_rush_total_coins',
            'road_rush_times_played'
        ].forEach(key => {
            try {
                if (hasLocalStorage) localStorage.removeItem(key);
            } catch (e) {
                console.warn(e);
            }
            delete memoryStore[key];
        });

        // Clean up legacy session storage if present
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
