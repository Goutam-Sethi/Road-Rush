import { player } from "./player.js";
import { enemyManager } from "./enemy.js";
import { collectiblesManager } from "./collectibles.js";

const game = {
    running: false,
    paused: false,
    score: 0,
    coins: 0,
    baseSpeed: 5,
    speed: 5,
    lives: 3,
    maxLives: 3,
    topSpeed: 5,

    animationId: null,
    previousTime: 0,

    roadLines: [],
    roadOffset: 0,

    initialize(roadElement) {
        this.roadElement = roadElement || document.querySelector(".road");
        this.roadLines = [];
        this.roadOffset = 0;

        if (this.roadElement) {
            this.roadElement.style.setProperty('--road-shift', '0px');
            this.roadElement.querySelectorAll(".road-line").forEach(line => line.remove());
        }

        this.createRoadLines();
    },

    start() {
        this.running = true;
        this.paused = false;

        this.score = 0;
        this.coins = 0;
        this.baseSpeed = 5;
        this.speed = 5;
        this.lives = this.maxLives;
        this.topSpeed = 5;

        this.previousTime = performance.now();

        player.reset();

        enemyManager.clear();
        enemyManager.start();

        collectiblesManager.clear();
        collectiblesManager.start();

        this.animationId = requestAnimationFrame(
            this.loop.bind(this)
        );
    },

    stop() {
        this.running = false;

        enemyManager.stop();
        collectiblesManager.stop();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    pause() {
        this.paused = true;
        collectiblesManager.stop();
        enemyManager.stop();
    },

    resume() {
        this.paused = false;
        this.previousTime = performance.now();
        collectiblesManager.start();
        enemyManager.start();
        this.animationId = requestAnimationFrame(
            this.loop.bind(this)
        );
    },

    loop(currentTime) {
        if (!this.running || this.paused) {
            if (this.running && this.paused) {
                this.animationId = requestAnimationFrame(
                    this.loop.bind(this)
                );
            }
            return;
        }

        const deltaTime = Math.min(0.1, (currentTime - this.previousTime) / 1000);
        this.previousTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame(
            this.loop.bind(this)
        );
    },

    update(deltaTime) {
        player.update(deltaTime);

        // Calculate dynamic speed based on difficulty & nitro state
        this.baseSpeed = 5 + (this.score / 400);
        if (this.baseSpeed > 18) this.baseSpeed = 18;

        const effectiveSpeed = player.isNitroActive 
            ? this.baseSpeed * player.nitroSpeedMultiplier 
            : this.baseSpeed;
            
        this.speed = effectiveSpeed;

        if (this.speed > this.topSpeed) {
            this.topSpeed = this.speed;
        }

        const road = document.querySelector(".road");
        const roadHeight = road ? road.clientHeight : 600;

        this.updateRoad(deltaTime);

        enemyManager.update(
            this.speed,
            roadHeight,
            deltaTime
        );

        collectiblesManager.update(
            this.speed,
            roadHeight,
            deltaTime
        );

        // Collectibles collision check
        collectiblesManager.checkCollisions(
            player.element,
            () => {
                this.coins++;
                this.score += 30;
            },
            () => {
                player.addNitro(40);
                this.score += 50;
            }
        );

        // Score accrual (2x multiplier in nitro)
        const scoreMultiplier = player.isNitroActive ? 2.5 : 1.0;
        this.score += deltaTime * this.speed * 2 * scoreMultiplier;

        this.checkCollisions();
    },

    render() {
        this.updateRoadDisplay();
    },

    checkCollisions() {
        if (!player.element) return;
        const playerRect = player.element.getBoundingClientRect();

        enemyManager.enemies.forEach((enemy, index) => {
            const enemyRect = enemy.element.getBoundingClientRect();

            if (this.isColliding(playerRect, enemyRect)) {
                this.handleCollision(enemy, index);
            }
        });
    },

    isColliding(rect1, rect2) {
        const margin = 8;
        return !(
            rect1.right - margin < rect2.left + margin ||
            rect1.left + margin > rect2.right - margin ||
            rect1.bottom - margin < rect2.top + margin ||
            rect1.top + margin > rect2.bottom - margin
        );
    },

    handleCollision(enemy, index) {
        if (player.isNitroActive) {
            // Nitro Smash! Destroy enemy without losing life
            enemy.element.classList.add("smashed");
            this.score += 150;

            const road = document.querySelector(".road");
            const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
            const enemyRect = enemy.element.getBoundingClientRect();
            
            collectiblesManager.showFloatingEffect(
                "+150 SMASH!", 
                enemyRect.left - roadRect.left + enemyRect.width / 2, 
                enemyRect.top - roadRect.top, 
                "smash-pickup"
            );

            setTimeout(() => {
                enemy.element.remove();
            }, 300);

            enemyManager.enemies.splice(index, 1);
            return;
        }

        // Standard crash
        this.lives--;
        player.element.classList.add("collision");
        
        setTimeout(() => {
            if (player.element) {
                player.element.classList.remove("collision");
            }
        }, 400);

        enemy.element.remove();
        enemyManager.enemies.splice(index, 1);

        if (this.lives <= 0) {
            this.gameOver();
        }
    },

    gameOver() {
        this.running = false;
        enemyManager.stop();
        collectiblesManager.stop();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (typeof this.showGameOverScreen === 'function') {
            this.showGameOverScreen();
        }
    },

    createRoadLines() {
        const road = this.roadElement || document.querySelector(".road");
        if (!road) return;

        for (let i = 0; i < 7; i++) {
            const line = document.createElement("div");
            line.classList.add("road-line");
            line.style.top = `${i * 100}px`;
            road.appendChild(line);

            this.roadLines.push({
                element: line,
                y: i * 100
            });
        }
    },

    updateRoad(deltaTime) {
        const road = document.querySelector(".road");
        if (!road) return;
        const roadHeight = road.clientHeight;

        this.roadOffset = (this.roadOffset + this.speed * 50 * deltaTime) % 80;
        road.style.setProperty('--road-shift', `${this.roadOffset}px`);

        this.roadLines.forEach(line => {
            line.y += this.speed * 30 * deltaTime;
            if (line.y >= roadHeight) {
                line.y -= roadHeight;
            }
        });
    },

    updateRoadDisplay() {
        this.roadLines.forEach(line => {
            line.element.style.top = `${line.y}px`;
        });

        document.querySelectorAll('.lane-marking').forEach(marking => {
            marking.style.backgroundPositionY = `${this.roadOffset}px`;
        });
    }
};

export { game };