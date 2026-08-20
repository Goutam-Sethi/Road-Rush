// =============================================================================
// COLLECTIBLE CLASSES, PROTOTYPES & COIN GENERATOR
// Manages Collectibles (Coins & Nitro Boost NOS bottles)
// =============================================================================

import { CONFIG } from "./config.js";

// -----------------------------------------------------------------------------
// 1. BASE COLLECTIBLE CLASS & PROTOTYPES
// -----------------------------------------------------------------------------
export class Collectible {
    constructor(lane = 0, y = -50, element = null, type = "generic") {
        this.lane = lane;
        this.y = y;
        this.element = element;
        this.type = type;
    }
}

// Attach shared methods to Collectible.prototype
Collectible.prototype.updatePosition = function () {
    if (this.element) {
        this.element.style.left = `${CONFIG.lanes[this.lane]}%`;
        this.element.style.top = `${this.y}px`;
    }
};

Collectible.prototype.remove = function () {
    if (this.element && this.element.parentNode) {
        this.element.remove();
    }
};

Collectible.prototype.isColliding = function (otherElement, margin = 6) {
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

// -----------------------------------------------------------------------------
// 2. SUBCLASSES: COIN & NITRO ITEM
// -----------------------------------------------------------------------------
export class Coin extends Collectible {
    constructor(lane, y = -50) {
        const element = document.createElement("div");
        element.className = "collectible-coin";
        element.innerHTML = `<div class="coin-inner"><span class="coin-symbol">$</span></div>`;

        super(lane, y, element, "coin");
        this.updatePosition();
    }
}

export class NitroItem extends Collectible {
    constructor(lane, y = -70) {
        const element = document.createElement("div");
        element.className = "collectible-nitro";
        element.innerHTML = `
            <div class="nitro-bottle">
                <span class="nitro-flame">⚡</span>
                <span class="nitro-text">NOS</span>
            </div>
        `;

        super(lane, y, element, "nitro");
        this.updatePosition();
    }
}

// -----------------------------------------------------------------------------
// 3. GENERATOR FUNCTION (Coin Streak Generator)
// Uses function* and yield to yield 3 sequential coin placements in a line
// -----------------------------------------------------------------------------
export function* coinStreakGenerator(lane) {
    for (let i = 0; i < 3; i++) {
        yield {
            lane: lane,
            yOffset: -50 - (i * 70)
        };
    }
}

// -----------------------------------------------------------------------------
// 4. COLLECTIBLES MANAGER
// -----------------------------------------------------------------------------
export const collectiblesManager = {
    items: [],
    coinSpawnTimer: null,
    nitroSpawnTimer: null,
    coinInterval: 1800,
    nitroInterval: 8000,

    start() {
        this.scheduleCoinSpawn();
        this.scheduleNitroSpawn();
    },

    stop() {
        if (this.coinSpawnTimer) clearTimeout(this.coinSpawnTimer);
        if (this.nitroSpawnTimer) clearTimeout(this.nitroSpawnTimer);
        this.coinSpawnTimer = null;
        this.nitroSpawnTimer = null;
    },

    scheduleCoinSpawn() {
        const nextTime = Math.random() * 800 + this.coinInterval;
        this.coinSpawnTimer = setTimeout(() => {
            if (!this.coinSpawnTimer) return;

            // 40% chance to spawn a 3-coin streak using the Generator function
            if (Math.random() < 0.4) {
                this.spawnCoinStreak();
            } else {
                this.spawnSingleCoin();
            }

            this.scheduleCoinSpawn();
        }, nextTime);
    },

    scheduleNitroSpawn() {
        const nextTime = Math.random() * 4000 + this.nitroInterval;
        this.nitroSpawnTimer = setTimeout(() => {
            if (!this.nitroSpawnTimer) return;
            this.spawnNitro();
            this.scheduleNitroSpawn();
        }, nextTime);
    },

    spawnSingleCoin(laneIndex = null, yOffset = -50) {
        const road = document.querySelector(".road");
        if (!road) return;

        const lane = laneIndex !== null ? laneIndex : Math.floor(Math.random() * CONFIG.lanes.length);
        const coin = new Coin(lane, yOffset);

        road.appendChild(coin.element);
        this.items.push(coin);
    },

    // Uses the Generator function to yield and spawn coins in a row
    spawnCoinStreak() {
        const lane = Math.floor(Math.random() * CONFIG.lanes.length);
        const streakGen = coinStreakGenerator(lane);

        let step = streakGen.next();
        let index = 0;

        while (!step.done) {
            const coinData = step.value;
            setTimeout(() => {
                if (this.coinSpawnTimer) {
                    this.spawnSingleCoin(coinData.lane, coinData.yOffset);
                }
            }, index * 180);

            index++;
            step = streakGen.next();
        }
    },

    spawnNitro() {
        const road = document.querySelector(".road");
        if (!road) return;

        const lane = Math.floor(Math.random() * CONFIG.lanes.length);
        const nitro = new NitroItem(lane, -70);

        road.appendChild(nitro.element);
        this.items.push(nitro);
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += speed * 60 * deltaTime;
            item.element.style.top = `${item.y}px`;

            // Remove when off-screen
            if (item.y > roadHeight + 60) {
                item.remove(); // Inherited from Collectible.prototype
                this.items.splice(i, 1);
            }
        }
    },

    checkCollisions(playerInstance, onCollectCoin, onCollectNitro) {
        if (!playerInstance || !playerInstance.element) return;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            // Use prototype collision check
            if (item.isColliding(playerInstance.element)) {
                const road = document.querySelector(".road");
                const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
                const itemRect = item.element.getBoundingClientRect();
                const pickupX = itemRect.left - roadRect.left + itemRect.width / 2;
                const pickupY = itemRect.top - roadRect.top;

                if (item.type === "coin") {
                    this.showFloatingEffect("+1 COIN", pickupX, pickupY, "coin-pickup");
                    if (onCollectCoin) onCollectCoin();
                } else if (item.type === "nitro") {
                    this.showFloatingEffect("+NITRO!", pickupX, pickupY, "nitro-pickup");
                    if (onCollectNitro) onCollectNitro();
                }

                item.element.classList.add("collected");
                setTimeout(() => {
                    item.remove(); // Inherited from Collectible.prototype
                }, 200);

                this.items.splice(i, 1);
            }
        }
    },

    showFloatingEffect(text, x, y, className) {
        const road = document.querySelector(".road");
        if (!road) return;

        const popup = document.createElement("div");
        popup.className = `floating-pickup ${className}`;
        popup.textContent = text;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        road.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 800);
    },

    clear() {
        this.items.forEach(item => item.remove());
        this.items = [];
        this.stop();
    }
};
