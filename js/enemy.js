const lanes = [26.67, 50, 73.33];

const enemyManager = {
    enemies: [],
    spawnTimer: null,
    spawnInterval: 1000,

    start() {
        this.spawnEnemy();
    },

    stop() {
        clearTimeout(this.spawnTimer);
        this.spawnTimer = null;
    },

    spawnEnemy() {
        this.create();
        
        // Gradually increase spawn rate (min 500ms)
        this.spawnInterval = Math.max(500, 1000 - (this.spawnInterval - 500) * 0.05);
        
        this.spawnTimer = setTimeout(() => {
            if (this.spawnTimer) {
                this.spawnEnemy();
            }
        }, this.spawnInterval);
    },

    create() {
        const road = document.querySelector(".road");

        const enemy = document.createElement("div");

        enemy.classList.add("enemy-car");

        const lane = Math.floor(Math.random() * lanes.length);

        enemy.style.left = `${lanes[lane]}%`;
        enemy.style.top = "-100px";

        road.appendChild(enemy);

        this.enemies.push({
            element: enemy,
            lane: lane,
            y: -100
        });
    },

    update(speed, roadHeight, deltaTime = 0.016) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            enemy.y += speed * 60 * deltaTime;

            enemy.element.style.top = `${enemy.y}px`;

            if (enemy.y > roadHeight) {
                enemy.element.remove();

                this.enemies.splice(i, 1);
            }
        }
    },

    clear() {
        this.enemies.forEach(enemy => {
            enemy.element.remove();
        });

        this.enemies = [];
        this.spawnInterval = 1000;
    }
};

export { enemyManager };