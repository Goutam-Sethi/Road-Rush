import { Vehicle } from "./vehicle.js";
import { CONFIG } from "./config.js";
import { collectiblesManager } from "./collectibles.js";

export class Enemy extends Vehicle {
    constructor(lane, y, element) {
        super(lane, y, element);
    }

    smashed() {
        if (this.element) {
            this.element.classList.add("smashed");
            this.element.addEventListener("animationend", () => this.destroy(), { once: true });
        }
    }
    
    wrecked() {
        if (this.element) {
            this.element.classList.add("traffic-wrecked");
            this.element.addEventListener("animationend", () => this.destroy(), { once: true });
        }
    }
}

export function* trafficSpawner() {
    while (true) {
        yield {
            lane: Math.floor(Math.random() * CONFIG.lanes.length),
            delay: 1000
        };

        yield {
            lane: Math.floor(Math.random() * CONFIG.lanes.length),
            delay: 900
        };

        const lane1 = Math.floor(Math.random() * CONFIG.lanes.length);
        const lane2 = (lane1 + 1 + Math.floor(Math.random() * (CONFIG.lanes.length - 1))) % CONFIG.lanes.length;

        yield { lane: lane1, delay: 250 };
        yield { lane: lane2, delay: 1100 };
    }
}

export const enemyManager = {
    enemies: [],
    spawnTimer: null,
    trafficGen: null,

    start() {
        this.trafficGen = trafficSpawner();
        this.spawnNextWave();
    },

    stop() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
    },

    isLaneSafe(lane, targetY = -100, minDistance = 160) {
        if (collectiblesManager && Array.isArray(collectiblesManager.items)) {
            for (const item of collectiblesManager.items) {
                if (item.lane === lane && Math.abs(item.y - targetY) < minDistance) {
                    return false;
                }
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.lane === lane && Math.abs(enemy.y - targetY) < minDistance) {
                return false;
            }
        }

        return true;
    },

    getSafeLane(preferredLane, targetY = -100, minDistance = 160) {
        if (this.isLaneSafe(preferredLane, targetY, minDistance)) {
            return preferredLane;
        }

        const safeLanes = [];
        for (let lane = 0; lane < CONFIG.lanes.length; lane++) {
            if (this.isLaneSafe(lane, targetY, minDistance)) {
                safeLanes.push(lane);
            }
        }

        if (safeLanes.length > 0) {
            return safeLanes[Math.floor(Math.random() * safeLanes.length)];
        }

        return preferredLane;
    },

    spawnNextWave() {
        if (!this.trafficGen) return;

        const wave = this.trafficGen.next().value;
        this.createEnemy(wave.lane);

        this.spawnTimer = setTimeout(() => {
            if (this.spawnTimer) {
                this.spawnNextWave();
            }
        }, wave.delay);
    },

    createEnemy(laneIndex) {
        const road = document.querySelector(".road");
        if (!road) return;

        const safeLane = this.getSafeLane(laneIndex, -100, 160);

        const enemyElement = document.createElement("div");
        enemyElement.classList.add("enemy-car");

        const enemy = new Enemy(safeLane, -100, enemyElement);
        enemy.updatePosition();
        enemy.element.style.top = `${enemy.y}px`;

        road.appendChild(enemyElement);
        this.enemies.push(enemy);
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            enemy.y += speed * 60 * deltaTime;
            enemy.element.style.top = `${enemy.y}px`;

            if (enemy.y > roadHeight) {
                enemy.destroy();
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