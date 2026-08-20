// =============================================================================
// BASE VEHICLE CLASS & PROTOTYPES
// Base class for all vehicles (Player and Enemy) on the road
// =============================================================================

import { CONFIG } from "./config.js";

export class Vehicle {
    constructor(lane = 1, y = 0, element = null) {
        this.lane = lane;       // Current lane index: 0 (left), 1 (center), 2 (right)
        this.y = y;             // Vertical position in pixels
        this.element = element; // DOM element reference
    }
}

// -----------------------------------------------------------------------------
// PROTOTYPE METHODS
// Attaching shared methods to Vehicle.prototype so all subclasses inherit them
// -----------------------------------------------------------------------------

// 1. Prototype method to update the vehicle's horizontal lane position on screen
Vehicle.prototype.updatePosition = function () {
    if (this.element) {
        this.element.style.left = `${CONFIG.lanes[this.lane]}%`;
    }
};

// 2. Prototype method to check AABB bounding box collision with another element
Vehicle.prototype.isColliding = function (otherElement, margin = 8) {
    if (!this.element || !otherElement) return false;

    const rect1 = this.element.getBoundingClientRect();
    const rect2 = otherElement.getBoundingClientRect();

    return !(
        rect1.right - margin < rect2.left + margin ||
        rect1.left + margin > rect2.right - margin ||
        rect1.bottom - margin < rect2.top + margin ||
        rect1.top + margin > rect2.bottom - margin
    );
};

// 3. Prototype method to remove the element from the DOM
Vehicle.prototype.destroy = function () {
    if (this.element && this.element.parentNode) {
        this.element.remove();
    }
};
