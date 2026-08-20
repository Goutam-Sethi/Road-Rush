// =============================================================================
// CONFIGURATION OBJECT
// Stores game constants and settings in a single clean object
// =============================================================================

export const CONFIG = {
    // 3 lane center percentages inside the 70% road width
    lanes: [26.67, 50, 73.33],

    // Speed settings
    initialSpeed: 5,
    maxSpeed: 18,
    nitroSpeedMultiplier: 1.8,

    // Gameplay settings
    maxLives: 3,
    nitroMaxDuration: 3.5, // seconds
    nitroFillOnPickup: 40, // percent
    coinScoreBonus: 30,
    nitroScoreBonus: 50,
    smashScoreBonus: 150
};
