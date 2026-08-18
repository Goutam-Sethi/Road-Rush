import { keys } from "./input.js";

const lanes = [26.67, 50, 73.33];

const player = {
    lane: 1,
    speed: 5,
    element: null,
    
    // Nitro System
    nitroGauge: 50,          // Percentage: 0 to 100
    isNitroActive: false,
    nitroDuration: 0,
    nitroMaxDuration: 3.5,   // Seconds of boost per full charge
    nitroSpeedMultiplier: 1.8,

    initialize(element) {
        this.element = element;
        this.updatePosition();
    },

    update(deltaTime = 0.016) {
        // Lateral Steering
        if (keys.ArrowLeft && this.lane > 0) {
            this.lane--;
            keys.ArrowLeft = false;
        }

        if (keys.ArrowRight && this.lane < lanes.length - 1) {
            this.lane++;
            keys.ArrowRight = false;
        }

        // Nitro Activation Trigger via Key
        if ((keys.ArrowUp || keys.Space) && !this.isNitroActive && this.nitroGauge >= 25) {
            this.activateNitro();
            keys.ArrowUp = false;
            keys.Space = false;
        }

        // Update Nitro Status
        if (this.isNitroActive) {
            this.nitroDuration -= deltaTime;
            this.nitroGauge = Math.max(0, (this.nitroDuration / this.nitroMaxDuration) * 100);

            if (this.nitroDuration <= 0) {
                this.deactivateNitro();
            }
        }

        this.updatePosition();
    },

    activateNitro() {
        if (this.nitroGauge < 20 || this.isNitroActive) return false;

        this.isNitroActive = true;
        this.nitroDuration = (this.nitroGauge / 100) * this.nitroMaxDuration;

        if (this.element) {
            this.element.classList.add("nitro-active");
        }

        const road = document.querySelector(".road");
        if (road) {
            road.classList.add("nitro-speed-mode");
        }

        return true;
    },

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
    },

    addNitro(amount = 35) {
        this.nitroGauge = Math.min(100, this.nitroGauge + amount);
    },

    updatePosition() {
        if (this.element) {
            this.element.style.left = `${lanes[this.lane]}%`;
        }
    },

    reset() {
        this.lane = 1;
        this.nitroGauge = 40;
        this.deactivateNitro();
        this.updatePosition();
    }
};

export { player, lanes };