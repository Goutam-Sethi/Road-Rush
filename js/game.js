// =============================================================================
// MAIN GAME ENGINE
// Manages the requestAnimationFrame loop, collision handling, and scoring
// =============================================================================

import { player } from "./player.js";
import { enemyManager } from "./enemy.js";
import { collectiblesManager } from "./collectibles.js";
import { CONFIG } from "./config.js";
import { audio } from "./audio.js";
import { storage } from "./storage.js";

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

        this.difficulty = storage.getDifficulty();

        this.score = 0;
        this.coins = 0;
        this.baseSpeed = CONFIG.initialSpeed;
        this.speed = CONFIG.initialSpeed;
        this.lives = this.maxLives;
        this.topSpeed = CONFIG.initialSpeed;
        this.previousTime = 0;

        player.reset();

        enemyManager.clear();
        enemyManager.start(this.difficulty);

        collectiblesManager.clear();
        collectiblesManager.start();

        // Start procedural engine sound
        audio.startEngine();

        // Start the Browser requestAnimationFrame animation loop
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    stop() {
        this.running = false;

        audio.stopEngine();
        audio.stopNitroBoost();
        enemyManager.stop();
        collectiblesManager.stop();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    pause() {
        this.paused = true;
        audio.pauseEngine();
        audio.stopNitroBoost();
        collectiblesManager.stop();
        enemyManager.stop();
    },

    resume() {
        this.paused = false;
        this.previousTime = 0;
        audio.resumeEngine();
        collectiblesManager.start();
        enemyManager.start(this.difficulty);
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
        let speedDivisor = 400; // Medium
        if (this.difficulty === "Easy") speedDivisor = 600;
        else if (this.difficulty === "Hard") speedDivisor = 200;

        this.baseSpeed = CONFIG.initialSpeed + this.score / speedDivisor;
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

        // Modulate procedural engine hum pitch & tone based on speed & nitro
        audio.setEnginePitch(this.speed, player.isNitroActive);

        this.updateRoad(deltaTime);
        enemyManager.update(this.speed, roadHeight, deltaTime);
        collectiblesManager.update(this.speed, roadHeight, deltaTime);

        // Collectibles Collision Check
        collectiblesManager.checkCollisions(
            player,
            () => {
                this.coins++;
                this.score += CONFIG.coinScoreBonus;
                audio.playCoin();
            },
            () => {
                player.addNitro(CONFIG.nitroFillOnPickup);
                this.score += CONFIG.nitroScoreBonus;
                audio.playNitroPickup();
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
        if (!player.element || player.isInvulnerable) return;

        for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
            const enemy = enemyManager.enemies[i];

            if (player.isColliding(enemy.element)) {
                this.handleCollision(enemy, i);
                break;
            }
        }
    },

    handleCollision(enemy, index) {
        const road = document.querySelector(".road");
        const roadRect = road ? road.getBoundingClientRect() : { left: 0, top: 0 };
        const playerRect = player.element ? player.element.getBoundingClientRect() : { left: 0, top: 0 };
        const impactX = playerRect.left - roadRect.left + playerRect.width / 2;
        const impactY = playerRect.top - roadRect.top;

        if (player.isNitroActive) {
            enemy.smashed();
            enemyManager.enemies.splice(index, 1);
            audio.playSmash();

            this.score += CONFIG.smashScoreBonus;

            if (road) {
                road.classList.add("smash-shake");
                setTimeout(() => road.classList.remove("smash-shake"), 400);
            }

            collectiblesManager.showFloatingEffect(
                "🔥 +150 SMASH!",
                impactX,
                impactY,
                "smash-pickup"
            );
            return;
        }

        this.lives--;
        player.setInvulnerable(1.6);
        audio.playCrash();

        if (player.element) {
            player.element.classList.add("player-wrecked");
            setTimeout(() => {
                if (player.element) player.element.classList.remove("player-wrecked");
            }, 850);
        }

        player.bottomPercent = Math.max(player.minBottom, player.bottomPercent - 8);
        player.updatePosition();

        if (road) {
            road.classList.add("crash-shake");
            setTimeout(() => road.classList.remove("crash-shake"), 550);
        }

        collectiblesManager.showFloatingEffect(
            "-1 HP",
            impactX,
            impactY - 15,
            "damage-pickup"
        );

        enemy.wrecked();
        enemyManager.enemies.splice(index, 1);

        if (this.lives <= 0) {
            setTimeout(() => {
                this.gameOver();
            }, 600);
        }
    },

    gameOver() {
        this.running = false;
        audio.stopEngine();
        audio.stopNitroBoost();
        audio.playGameOver();
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

        this.roadOffset = (this.roadOffset + this.speed * 55 * deltaTime) % 3696;
        road.style.setProperty("--road-shift", `${this.roadOffset}px`);
    },

    updateRoadDisplay() {
        document.querySelectorAll(".lane-marking, .road-curb").forEach(marking => {
            marking.style.backgroundPositionY = `${this.roadOffset}px`;
        });
    }
};