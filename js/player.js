import { Vehicle } from "./vehicle.js";
import { CONFIG } from "./config.js";
import { keys } from "./input.js";
import { audio } from "./audio.js";

export class Player extends Vehicle {
    constructor() {
        super(1, 0, null);

        this.bottomPercent = 12;
        this.minBottom = 10;
        this.maxBottom = 75;
        this.verticalSpeed = 50;

        this.nitroGauge = CONFIG.initialNitro;
        this.isNitroActive = false;
        this.nitroDuration = 0;
        this.isInvulnerable = false;
        this.invulnerableTimer = null;
    }

    initialize(element) {
        this.element = element;
        this.updatePosition();
    }

    updatePosition() {
        if (this.element) {
            this.element.style.left = `${CONFIG.lanes[this.lane]}%`;
            this.element.style.bottom = `${this.bottomPercent}%`;
        }
    }

    steerLeft() {
        if (this.lane > 0) {
            this.lane--;
            this.updatePosition();
        }
    }

    steerRight() {
        if (this.lane < CONFIG.lanes.length - 1) {
            this.lane++;
            this.updatePosition();
        }
    }

    moveUp(deltaTime = 0.016) {
        this.bottomPercent = Math.min(this.maxBottom, this.bottomPercent + this.verticalSpeed * deltaTime);
        this.updatePosition();
    }

    moveDown(deltaTime = 0.016) {
        this.bottomPercent = Math.max(this.minBottom, this.bottomPercent - this.verticalSpeed * deltaTime);
        this.updatePosition();
    }

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

        audio.playNitroBoost();

        return true;
    }

    deactivateNitro() {
        this.isNitroActive = false;
        this.nitroDuration = 0;

        if (this.element) {
            this.element.classList.remove("nitro-active");
        }

        const road = document.querySelector(".road");
        if (road) {
            road.classList.remove("nitro-speed-mode");
        }

        audio.stopNitroBoost();
    }

    setInvulnerable(duration = 1.2) {
        this.isInvulnerable = true;
        if (this.element) {
            this.element.classList.add("invulnerable");
        }

        if (this.invulnerableTimer) {
            clearTimeout(this.invulnerableTimer);
        }

        this.invulnerableTimer = setTimeout(() => {
            this.isInvulnerable = false;
            if (this.element) {
                this.element.classList.remove("invulnerable");
            }
            this.invulnerableTimer = null;
        }, duration * 1000);
    }

    addNitro(amount = CONFIG.nitroFillOnPickup) {
        this.nitroGauge = Math.min(100, this.nitroGauge + amount);
    }

    update(deltaTime = 0.016) {
        if (keys.ArrowLeft) {
            this.steerLeft();
            keys.ArrowLeft = false;
        }

        if (keys.ArrowRight) {
            this.steerRight();
            keys.ArrowRight = false;
        }

        if (keys.ArrowUp) {
            this.moveUp(deltaTime);
        }

        if (keys.ArrowDown) {
            this.moveDown(deltaTime);
        }

        if (keys.Space && !this.isNitroActive && this.nitroGauge >= 20) {
            this.activateNitro();
            keys.Space = false;
        }

        if (this.isNitroActive) {
            this.nitroDuration -= deltaTime;
            this.nitroGauge = Math.max(0, (this.nitroDuration / CONFIG.nitroMaxDuration) * 100);

            if (this.nitroDuration <= 0) {
                this.deactivateNitro();
            }
        }
    }

    reset() {
        this.lane = 1;
        this.bottomPercent = 12;
        this.isInvulnerable = false;
        if (this.invulnerableTimer) {
            clearTimeout(this.invulnerableTimer);
            this.invulnerableTimer = null;
        }
        this.deactivateNitro();
        this.nitroGauge = CONFIG.initialNitro;
        if (this.element) {
            this.element.classList.remove("invulnerable", "collision");
        }
        this.updatePosition();
    }
}

export const player = new Player();
export const lanes = CONFIG.lanes;