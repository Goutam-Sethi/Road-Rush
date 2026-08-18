const lanes = [26.67, 50, 73.33];

const collectiblesManager = {
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
            
            // 40% chance of a coin streak (3 coins in a row)
            if (Math.random() < 0.4) {
                this.spawnCoinStreak();
            } else {
                this.spawnCoin();
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

    spawnCoin(laneIndex = null, yOffset = -50) {
        const road = document.querySelector(".road");
        if (!road) return;

        const lane = laneIndex !== null ? laneIndex : Math.floor(Math.random() * lanes.length);
        const coin = document.createElement("div");
        coin.className = "collectible-coin";
        coin.innerHTML = `<div class="coin-inner"><span class="coin-symbol">$</span></div>`;
        coin.style.left = `${lanes[lane]}%`;
        coin.style.top = `${yOffset}px`;

        road.appendChild(coin);

        this.items.push({
            type: "coin",
            element: coin,
            lane: lane,
            y: yOffset
        });
    },

    spawnCoinStreak() {
        const lane = Math.floor(Math.random() * lanes.length);
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.coinSpawnTimer) {
                    this.spawnCoin(lane, -50 - (i * 70));
                }
            }, i * 180);
        }
    },

    spawnNitro(laneIndex = null) {
        const road = document.querySelector(".road");
        if (!road) return;

        const lane = laneIndex !== null ? laneIndex : Math.floor(Math.random() * lanes.length);
        const nitro = document.createElement("div");
        nitro.className = "collectible-nitro";
        nitro.innerHTML = `
            <div class="nitro-bottle">
                <span class="nitro-flame">⚡</span>
                <span class="nitro-text">NOS</span>
            </div>
        `;
        nitro.style.left = `${lanes[lane]}%`;
        nitro.style.top = "-70px";

        road.appendChild(nitro);

        this.items.push({
            type: "nitro",
            element: nitro,
            lane: lane,
            y: -70
        });
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += speed * 60 * deltaTime;
            item.element.style.top = `${item.y}px`;

            // If item moves past bottom of road
            if (item.y > roadHeight + 60) {
                item.element.remove();
                this.items.splice(i, 1);
            }
        }
    },

    checkCollisions(playerElement, onCollectCoin, onCollectNitro) {
        if (!playerElement) return;
        const playerRect = playerElement.getBoundingClientRect();

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const itemRect = item.element.getBoundingClientRect();

            if (this.isColliding(playerRect, itemRect)) {
                // Collect item
                const road = document.querySelector(".road");
                const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
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
                    item.element.remove();
                }, 200);

                this.items.splice(i, 1);
            }
        }
    },

    isColliding(rect1, rect2) {
        const margin = 6; // slightly generous for fun arcade feel
        return !(
            rect1.right - margin < rect2.left + margin ||
            rect1.left + margin > rect2.right - margin ||
            rect1.bottom - margin < rect2.top + margin ||
            rect1.top + margin > rect2.bottom - margin
        );
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
        this.items.forEach(item => {
            if (item.element) item.element.remove();
        });
        this.items = [];
        this.stop();
    }
};

export { collectiblesManager };
