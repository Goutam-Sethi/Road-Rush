import { keys } from "./input.js";

const lanes = [26.67, 50, 73.33];

const player = {
    lane: 1,
    speed: 5,
    element: null,

    initialize(element) {
        this.element = element;
        this.updatePosition();
    },

    update() {
        if (keys.ArrowLeft && this.lane > 0) {
            this.lane--;
            keys.ArrowLeft = false;
        }

        if (keys.ArrowRight && this.lane < lanes.length - 1) {
            this.lane++;
            keys.ArrowRight = false;
        }

        this.updatePosition();
    },

    updatePosition() {
        if (this.element) {
            this.element.style.left = `${lanes[this.lane]}%`;
        }
    },

    reset() {
        this.lane = 1;
        this.updatePosition();
    }
};

export { player, lanes };