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
        this.baseVerticalSpeed = 50;
        this.verticalSpeed = 50;

        this.nitroGauge = CONFIG.initialNitro;
        this.isNitroActive = false;
        this.nitroDuration = 0;
        this.isInvulnerable = false;
        this.invulnerableTimer = null;
        this.carConfig = null;
    }

    setCar(carConfig) {
        if (!carConfig) return;
        this.carConfig = carConfig;

        const handlingMult = carConfig.stats?.handlingMultiplier || 1.0;
        this.verticalSpeed = this.baseVerticalSpeed * handlingMult;

        if (this.element) {
            if (carConfig.svg) {
                this.element.style.backgroundImage = `url('${carConfig.svg}')`;
            }
            // Better handling = snappier, faster lane change reaction
            const steerSpeed = Math.max(0.06, 0.10 / handlingMult);
            this.element.style.transition = `left ${steerSpeed.toFixed(3)}s ease-out`;
        }
    }

    initialize(element, carConfig = null) {
        this.element = element;
        if (carConfig) {
            this.setCar(carConfig);
        }
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

    getNitroMaxDuration() {
        const mult = this.carConfig?.stats?.nitroMultiplier || 1.0;
        return CONFIG.nitroMaxDuration * mult;
    }

    activateNitro() {
        if (this.nitroGauge < 20 || this.isNitroActive) return false;

        this.isNitroActive = true;
        const maxDuration = this.getNitroMaxDuration();
        this.nitroDuration = (this.nitroGauge / 100) * maxDuration;

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
        const nitroMult = this.carConfig?.stats?.nitroMultiplier || 1.0;
        this.nitroGauge = Math.min(100, this.nitroGauge + amount * nitroMult);
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
            const maxDuration = this.getNitroMaxDuration();
            this.nitroGauge = Math.max(0, (this.nitroDuration / maxDuration) * 100);

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

        // Starting nitro scales with car's nitro capacity
        const nitroMult = this.carConfig?.stats?.nitroMultiplier || 1.0;
        this.nitroGauge = Math.min(100, CONFIG.initialNitro * nitroMult);

        if (this.element) {
            this.element.classList.remove("invulnerable", "collision");
            if (this.carConfig && this.carConfig.svg) {
                this.element.style.backgroundImage = `url('${this.carConfig.svg}')`;
            }
            const handlingMult = this.carConfig?.stats?.handlingMultiplier || 1.0;
            const steerSpeed = Math.max(0.06, 0.10 / handlingMult);
            this.element.style.transition = `left ${steerSpeed.toFixed(3)}s ease-out`;
        }
        this.updatePosition();
    }
}

export const player = new Player();
export const lanes = CONFIG.lanes;
