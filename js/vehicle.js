import { CONFIG } from "./config.js";

export class Vehicle {
    constructor(lane = 1, y = 0, element = null) {
        this.lane = lane;
        this.y = y;
        this.element = element;
    }

    updatePosition() {
        if (this.element) {
            this.element.style.left = `${CONFIG.lanes[this.lane]}%`;
        }
    }

    isColliding(otherElement, margin = 8) {
        if (!this.element || !otherElement) return false;

        const rect1 = this.element.getBoundingClientRect();
        const rect2 = otherElement.getBoundingClientRect();

        return !(
            rect1.right - margin < rect2.left + margin ||
            rect1.left + margin > rect2.right - margin ||
            rect1.bottom - margin < rect2.top + margin ||
            rect1.top + margin > rect2.bottom - margin
        );
    }

    destroy() {
        if (this.element) {
            if (this.element.parentNode) {
                this.element.remove();
            }
            this.element = null;
        }
    }
}
