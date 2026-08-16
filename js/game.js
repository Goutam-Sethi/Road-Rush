import { player } from "./player.js";
import { enemyManager } from "./enemy.js";

const game = {
    running: false,
    paused: false,
    score: 0,
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
        this.speed = 5;
        this.lives = this.maxLives;
        this.topSpeed = 5;

        this.previousTime = performance.now();

        player.reset();

        enemyManager.clear();
        enemyManager.start();

        this.animationId = requestAnimationFrame(
            this.loop.bind(this)
        );
    },

    stop() {
        this.running = false;

        enemyManager.stop();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    pause() {
        this.paused = true;
    },

    resume() {
        this.paused = false;
        this.previousTime = performance.now();
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

        const deltaTime =
            (currentTime - this.previousTime) / 1000;

        this.previousTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId =
            requestAnimationFrame(
                this.loop.bind(this)
            );
    },

    update(deltaTime) {
        player.update();

        this.updateRoad(deltaTime);

        enemyManager.update(
            this.speed,
            document.querySelector(".road").clientHeight,
            deltaTime
        );

        this.score += deltaTime * this.speed;

        this.speed = 5 + this.score / 500;
        if (this.speed > 20) this.speed = 20;

        if (this.speed > this.topSpeed) {
            this.topSpeed = this.speed;
        }

        this.checkCollisions();
    },

    render() {
        this.updateRoadDisplay();
    },

    checkCollisions() {
        const playerRect = player.element.getBoundingClientRect();
        const road = document.querySelector(".road");
        const roadRect = road.getBoundingClientRect();

        enemyManager.enemies.forEach((enemy, index) => {
            const enemyRect = enemy.element.getBoundingClientRect();

            if (this.isColliding(playerRect, enemyRect)) {
                this.handleCollision(enemy, index);
            }
        });
    },

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left ||
                 rect1.left > rect2.right ||
                 rect1.bottom < rect2.top ||
                 rect1.top > rect2.bottom);
    },

    handleCollision(enemy, index) {
        this.lives--;
        player.element.classList.add("collision");
        
        setTimeout(() => {
            player.element.classList.remove("collision");
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

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.showGameOverScreen();
    },

    showGameOverScreen() {
        const gameOverScreen = document.querySelector(".game-over-screen");
        const gameScreen = document.querySelector(".game-screen");
        
        document.querySelector(".final-score").textContent = Math.floor(this.score);
        document.querySelector(".distance").textContent = Math.floor(this.score / 10) + "m";
        document.querySelector(".top-speed").textContent = Math.round(this.topSpeed);

        gameScreen.classList.add("hidden");
        gameOverScreen.classList.remove("hidden");
    },

    createRoadLines() {
        const road = this.roadElement || document.querySelector(".road");

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