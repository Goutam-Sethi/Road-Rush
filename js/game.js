// =============================================================================
// MAIN GAME ENGINE
// Manages the requestAnimationFrame loop, collision handling, and scoring
// =============================================================================

import { player } from "./player.js";
import { enemyManager } from "./enemy.js";
import { collectiblesManager } from "./collectibles.js";
import { CONFIG } from "./config.js";

export const game = {
    running: false,
    paused: false,
    score: 0,
    coins: 0,
    baseSpeed: CONFIG.initialSpeed,
    speed: CONFIG.initialSpeed,
    lives: CONFIG.maxLives,
    maxLives: CONFIG.maxLives,
    topSpeed: CONFIG.initialSpeed,

    animationId: null,
    previousTime: 0,
    roadOffset: 0,

    initialize(roadElement) {
        this.roadElement = roadElement || document.querySelector(".road");
        this.roadOffset = 0;

        if (this.roadElement) {
            this.roadElement.style.setProperty("--road-shift", "0px");
        }
    },

    start() {
        this.running = true;
        this.paused = false;

        this.score = 0;
        this.coins = 0;
        this.baseSpeed = CONFIG.initialSpeed;
        this.speed = CONFIG.initialSpeed;
        this.lives = this.maxLives;
        this.topSpeed = CONFIG.initialSpeed;
        this.previousTime = 0;

        player.reset();

        enemyManager.clear();
        enemyManager.start();

        collectiblesManager.clear();
        collectiblesManager.start();

        // Start the Browser requestAnimationFrame animation loop
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    stop() {
        this.running = false;

        enemyManager.stop();
        collectiblesManager.stop();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    pause() {
        this.paused = true;
        collectiblesManager.stop();
        enemyManager.stop();
    },

    resume() {
        this.paused = false;
        this.previousTime = 0;
        collectiblesManager.start();
        enemyManager.start();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    // -------------------------------------------------------------------------
    // Animation Frame Loop (currentTime provided automatically by browser)
    // -------------------------------------------------------------------------
    loop(currentTime) {
        if (!this.running || this.paused) return;

        if (!this.previousTime) {
            this.previousTime = currentTime;
        }

        // Calculate elapsed time in seconds (deltaTime)
        const deltaTime = Math.min(0.1, (currentTime - this.previousTime) / 1000);
        this.previousTime = currentTime;

        this.update(deltaTime);
        this.render();

        // Request next frame
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    update(deltaTime) {
        player.update(deltaTime);

        // Calculate dynamic speed
        this.baseSpeed = CONFIG.initialSpeed + this.score / 400;
        if (this.baseSpeed > CONFIG.maxSpeed) {
            this.baseSpeed = CONFIG.maxSpeed;
        }

        this.speed = player.isNitroActive
            ? this.baseSpeed * CONFIG.nitroSpeedMultiplier
            : this.baseSpeed;

        if (this.speed > this.topSpeed) {
            this.topSpeed = this.speed;
        }

        const road = document.querySelector(".road");
        const roadHeight = road ? road.clientHeight : 600;

        this.updateRoad(deltaTime);
        enemyManager.update(this.speed, roadHeight, deltaTime);
        collectiblesManager.update(this.speed, roadHeight, deltaTime);

        // Collectibles Collision Check
        collectiblesManager.checkCollisions(
            player,
            () => {
                this.coins++;
                this.score += CONFIG.coinScoreBonus;
            },
            () => {
                player.addNitro(CONFIG.nitroFillOnPickup);
                this.score += CONFIG.nitroScoreBonus;
            }
        );

        // Score increases faster during Nitro boost
        const scoreMultiplier = player.isNitroActive ? 2.5 : 1.0;
        this.score += deltaTime * this.speed * 2 * scoreMultiplier;

        // Check Traffic Collisions
        this.checkCollisions();
    },

    render() {
        this.updateRoadDisplay();
    },

    checkCollisions() {
        if (!player.element) return;

        for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
            const enemy = enemyManager.enemies[i];

            // Use the prototype collision detection method on player
            if (player.isColliding(enemy.element)) {
                this.handleCollision(enemy, i);
            }
        }
    },

    handleCollision(enemy, index) {
        if (player.isNitroActive) {
            // Nitro Smash! Destroy enemy without taking damage
            enemy.smashed();
            enemyManager.enemies.splice(index, 1);

            this.score += CONFIG.smashScoreBonus;

            const road = document.querySelector(".road");
            const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
            const enemyRect = enemy.element.getBoundingClientRect();

            collectiblesManager.showFloatingEffect(
                "+150 SMASH!",
                enemyRect.left - roadRect.left + enemyRect.width / 2,
                enemyRect.top - roadRect.top,
                "smash-pickup"
            );
            return;
        }

        // Standard crash: Player loses 1 life
        this.lives--;
        player.element.classList.add("collision");

        setTimeout(() => {
            if (player.element) {
                player.element.classList.remove("collision");
            }
        }, 400);

        enemy.destroy(); // Inherited from Vehicle.prototype
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
            this.animationId = null;
        }

        if (typeof this.showGameOverScreen === "function") {
            this.showGameOverScreen();
        }
    },

    updateRoad(deltaTime) {
        const road = document.querySelector(".road");
        if (!road) return;

        this.roadOffset = (this.roadOffset + this.speed * 50 * deltaTime) % 80;
        road.style.setProperty("--road-shift", `${this.roadOffset}px`);
    },

    updateRoadDisplay() {
        document.querySelectorAll(".lane-marking").forEach(marking => {
            marking.style.backgroundPositionY = `${this.roadOffset}px`;
        });
    }
};