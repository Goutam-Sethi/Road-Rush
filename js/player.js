// =============================================================================
// PLAYER CLASS (Extends Vehicle)
// Manages player movement, steering between lanes, and Nitro Boost state
// =============================================================================

import { Vehicle } from "./vehicle.js";
import { CONFIG } from "./config.js";
import { keys } from "./input.js";

export class Player extends Vehicle {
    constructor() {
        super(1, 0, null); // Start in middle lane (index 1)

        // Nitro Boost State
        this.nitroGauge = 50;        // 0 to 100%
        this.isNitroActive = false;  // Whether boost is currently active
        this.nitroDuration = 0;      // Remaining boost duration in seconds
    }

    // Connect the HTML element to this player instance
    initialize(element) {
        this.element = element;
        this.updatePosition(); // Inherited from Vehicle.prototype
    }

    // Steer left one lane
    steerLeft() {
        if (this.lane > 0) {
            this.lane--;
            this.updatePosition();
        }
    }

    // Steer right one lane
    steerRight() {
        if (this.lane < CONFIG.lanes.length - 1) {
            this.lane++;
            this.updatePosition();
        }
    }

    // Turn on Nitro Boost
    activateNitro() {
        if (this.nitroGauge < 20 || this.isNitroActive) return false;

        this.isNitroActive = true;
        this.nitroDuration = (this.nitroGauge / 100) * CONFIG.nitroMaxDuration;

        if (this.element) {
            this.element.classList.add("nitro-active");
        }

        const road = document.querySelector(".road");
        if (road) {
            road.classList.add("nitro-speed-mode");
        }

        return true;
    }

    // Turn off Nitro Boost
    deactivateNitro() {
        this.isNitroActive = false;
        this.nitroDuration = 0;
        this.nitroGauge = 0;

        if (this.element) {
            this.element.classList.remove("nitro-active");
        }

        const road = document.querySelector(".road");
        if (road) {
            road.classList.remove("nitro-speed-mode");
        }
    }

    // Add nitro charge (from collected NOS pickups)
    addNitro(amount = CONFIG.nitroFillOnPickup) {
        this.nitroGauge = Math.min(100, this.nitroGauge + amount);
    }

    // Update player steering and nitro state each frame
    update(deltaTime = 0.016) {
        // Handle Left Steering
        if (keys.ArrowLeft) {
            this.steerLeft();
            keys.ArrowLeft = false; // consume keypress
        }

        // Handle Right Steering
        if (keys.ArrowRight) {
            this.steerRight();
            keys.ArrowRight = false; // consume keypress
        }

        // Handle Nitro Trigger
        if ((keys.ArrowUp || keys.Space) && !this.isNitroActive && this.nitroGauge >= 20) {
            this.activateNitro();
            keys.ArrowUp = false;
            keys.Space = false;
        }

        // Drain Nitro while active
        if (this.isNitroActive) {
            this.nitroDuration -= deltaTime;
            this.nitroGauge = Math.max(0, (this.nitroDuration / CONFIG.nitroMaxDuration) * 100);

            if (this.nitroDuration <= 0) {
                this.deactivateNitro();
            }
        }
    }

    // Reset player back to starting state on new game
    reset() {
        this.lane = 1;
        this.nitroGauge = 40;
        this.deactivateNitro();
        this.updatePosition();
    }
}

// Create a single shared Player instance
export const player = new Player();
export const lanes = CONFIG.lanes;