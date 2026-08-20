// =============================================================================
// ENEMY CLASS & GENERATOR FUNCTION
// Handles enemy traffic cars and procedural traffic spawning via Generators
// =============================================================================

import { Vehicle } from "./vehicle.js";
import { CONFIG } from "./config.js";

// -----------------------------------------------------------------------------
// 1. ENEMY CLASS (Extends Vehicle)
// -----------------------------------------------------------------------------
export class Enemy extends Vehicle {
    constructor(lane, y, element) {
        super(lane, y, element);
    }

    // Play smash animation when hit by player in Nitro mode
    smashed() {
        if (this.element) {
            this.element.classList.add("smashed");
            setTimeout(() => {
                this.destroy(); // Inherited from Vehicle.prototype
            }, 300);
        }
    }
}

// -----------------------------------------------------------------------------
// 2. GENERATOR FUNCTION (Traffic Wave Generator)
// Uses function* and yield to procedurally generate intelligent traffic waves
// -----------------------------------------------------------------------------
export function* trafficSpawner() {
    while (true) {
        // Pattern 1: Single car in random lane
        yield {
            lane: Math.floor(Math.random() * CONFIG.lanes.length),
            delay: 1000
        };

        // Pattern 2: Single car in another lane
        yield {
            lane: Math.floor(Math.random() * CONFIG.lanes.length),
            delay: 900
        };

        // Pattern 3: Double-car challenge (two cars in different lanes)
        const lane1 = Math.floor(Math.random() * CONFIG.lanes.length);
        const lane2 = (lane1 + 1 + Math.floor(Math.random() * (CONFIG.lanes.length - 1))) % CONFIG.lanes.length;

        yield { lane: lane1, delay: 250 };
        yield { lane: lane2, delay: 1100 };
    }
}

// -----------------------------------------------------------------------------
// 3. ENEMY MANAGER
// Manages spawning, moving, and removing enemy vehicles
// -----------------------------------------------------------------------------
export const enemyManager = {
    enemies: [],
    spawnTimer: null,
    trafficGen: null,

    start() {
        // Initialize the Generator
        this.trafficGen = trafficSpawner();
        this.spawnNextWave();
    },

    stop() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
    },

    spawnNextWave() {
        if (!this.trafficGen) return;

        // Advance the generator to get the next wave parameters
        const wave = this.trafficGen.next().value;
        this.createEnemy(wave.lane);

        // Schedule next wave according to the generator's yielded delay
        this.spawnTimer = setTimeout(() => {
            if (this.spawnTimer) {
                this.spawnNextWave();
            }
        }, wave.delay);
    },

    createEnemy(laneIndex) {
        const road = document.querySelector(".road");
        if (!road) return;

        const enemyElement = document.createElement("div");
        enemyElement.classList.add("enemy-car");

        const enemy = new Enemy(laneIndex, -100, enemyElement);
        enemy.updatePosition(); // Inherited from Vehicle.prototype
        enemy.element.style.top = `${enemy.y}px`;

        road.appendChild(enemyElement);
        this.enemies.push(enemy);
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Move enemy down the road
            enemy.y += speed * 60 * deltaTime;
            enemy.element.style.top = `${enemy.y}px`;

            // Remove enemy once it passes the bottom of the road
            if (enemy.y > roadHeight) {
                enemy.destroy(); // Inherited from Vehicle.prototype
                this.enemies.splice(i, 1);
            }
        }
    },

    clear() {
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        this.stop();
        this.trafficGen = null;
    }
};