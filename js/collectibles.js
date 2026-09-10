import { CONFIG } from "./config.js";
import { enemyManager } from "./enemy.js";

export class Collectible {
    constructor(lane = 0, y = -50, element = null, type = "generic") {
        this.lane = lane;
        this.y = y;
        this.element = element;
        this.type = type;
    }

    updatePosition() {
        if (this.element) {
            this.element.style.left = `${CONFIG.lanes[this.lane]}%`;
            this.element.style.top = `${this.y}px`;
        }
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
    }

    isColliding(otherElement, margin = 6) {
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
}

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

export function* coinStreakGenerator(lane) {
    for (let i = 0; i < 3; i++) {
        yield {
            lane,
            yOffset: -50 - (i * 70)
        };
    }
}

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

    isLaneSafe(lane, targetY = -50, minDistance = 160) {
        if (enemyManager && Array.isArray(enemyManager.enemies)) {
            for (const enemy of enemyManager.enemies) {
                if (enemy.lane === lane && Math.abs(enemy.y - targetY) < minDistance) {
                    return false;
                }
            }
        }
        return true;
    },

    getSafeLane(targetY = -50, minDistance = 160) {
        const safeLanes = [];
        for (let lane = 0; lane < CONFIG.lanes.length; lane++) {
            if (this.isLaneSafe(lane, targetY, minDistance)) {
                safeLanes.push(lane);
            }
        }

        if (safeLanes.length > 0) {
            return safeLanes[Math.floor(Math.random() * safeLanes.length)];
        }

        return Math.floor(Math.random() * CONFIG.lanes.length);
    },

    scheduleCoinSpawn() {
        const nextTime = Math.random() * 800 + this.coinInterval;
        this.coinSpawnTimer = setTimeout(() => {
            if (!this.coinSpawnTimer) return;

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

        const lane = (laneIndex !== null && this.isLaneSafe(laneIndex, yOffset, 160))
            ? laneIndex
            : this.getSafeLane(yOffset, 160);

        const coin = new Coin(lane, yOffset);
        road.appendChild(coin.element);
        this.items.push(coin);
    },

    spawnCoinStreak() {
        const lane = this.getSafeLane(-100, 220);
        let index = 0;

        for (const coinData of coinStreakGenerator(lane)) {
            const currentIndex = index;
            setTimeout(() => {
                if (this.coinSpawnTimer) {
                    this.spawnSingleCoin(coinData.lane, coinData.yOffset);
                }
            }, currentIndex * 180);
            index++;
        }
    },

    spawnNitro() {
        const road = document.querySelector(".road");
        if (!road) return;

        const lane = this.getSafeLane(-70, 180);
        const nitro = new NitroItem(lane, -70);

        road.appendChild(nitro.element);
        this.items.push(nitro);
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += speed * 60 * deltaTime;
            item.element.style.top = `${item.y}px`;

            if (enemyManager && Array.isArray(enemyManager.enemies)) {
                let removed = false;
                for (const enemy of enemyManager.enemies) {
                    if (enemy.lane === item.lane && Math.abs(enemy.y - item.y) < 110) {
                        const altLane1 = (item.lane + 1) % CONFIG.lanes.length;
                        const altLane2 = (item.lane + 2) % CONFIG.lanes.length;

                        if (this.isLaneSafe(altLane1, item.y, 110)) {
                            item.lane = altLane1;
                            item.updatePosition();
                        } else if (this.isLaneSafe(altLane2, item.y, 110)) {
                            item.lane = altLane2;
                            item.updatePosition();
                        } else {
                            item.remove();
                            this.items.splice(i, 1);
                            removed = true;
                        }
                        break;
                    }
                }
                if (removed) continue;
            }

            if (item.y > roadHeight + 60) {
                item.remove();
                this.items.splice(i, 1);
            }
        }
    },

    checkCollisions(playerInstance, onCollectCoin, onCollectNitro) {
        if (!playerInstance || !playerInstance.element) return;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            if (item.isColliding(playerInstance.element)) {
                const road = document.querySelector(".road");
                const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
                const itemRect = item.element.getBoundingClientRect();
                const pickupX = itemRect.left - roadRect.left + itemRect.width / 2;
                const pickupY = itemRect.top - roadRect.top;

                if (item.type === "coin") {
                    this.showFloatingEffect(
                        '<span class="bonus-score">+50</span><span class="bonus-sub">+1 COIN</span>',
                        pickupX,
                        pickupY,
                        "coin-pickup",
                        true
                    );
                    if (onCollectCoin) onCollectCoin();
                } else if (item.type === "nitro") {
                    this.showFloatingEffect("+NITRO!", pickupX, pickupY, "nitro-pickup");
                    if (onCollectNitro) onCollectNitro();
                }

                item.element.classList.add("collected");
                setTimeout(() => {
                    item.remove();
                }, 200);

                this.items.splice(i, 1);
            }
        }
    },

    showFloatingEffect(content, x, y, className, isHTML = false) {
        const road = document.querySelector(".road");
        if (!road) return;

        const popup = document.createElement("div");
        popup.className = `floating-pickup ${className}`;
        if (isHTML) {
            popup.innerHTML = content;
        } else {
            popup.textContent = content;
        }
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        road.appendChild(popup);

        popup.addEventListener("animationend", () => popup.remove(), { once: true });
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 1300);
    },

    clear() {
        this.items.forEach(item => item.remove());
        this.items = [];
        this.stop();
    }
};
