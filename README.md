# Road Rush

A fast-paced 2D infinite car arcade racing game built entirely with **HTML5, CSS3, and Vanilla JavaScript**, with zero external frameworks or runtime dependencies.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=flat&logo=vercel)](https://road-rush-self.vercel.app/)
![Version](https://img.shields.io/badge/Version-v1.2.0-blue.svg)
![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JavaScript-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Live Demo

**[Play Road Rush](https://road-rush-self.vercel.app/)**

Experience the game directly in your browser without installing any additional software.

## Features

- **Player Movement and Handling:** Navigate a three-lane highway with responsive steering and acceleration.
- **Dynamic Enemy Traffic:** Procedurally spawned traffic with Easy, Medium, and Hard difficulty levels.
- **Collision and Damage System:** Hitbox-based collision detection, temporary invulnerability after damage, and visual collision feedback.
- **Persistent Coin Vault:** Save coins earned during races using the browser's LocalStorage API.
- **Interactive Garage and Car Showroom:** Purchase and equip four unique vehicles using accumulated coins.
- **Vehicle Performance Customization:** Different vehicles offer distinct top speeds, acceleration, nitro capacity, and handling characteristics.
- **Nitro Boost and Traffic Smash:** Activate nitro for temporary invulnerability and destroy traffic for bonus points.
- **Career Statistics:** Track your all-time high score, best coins in a single run, total coin balance, distance traveled, and top speed.
- **Dynamic HUD and Speedometer:** Monitor speed in KM/H, score, nitro gauge, and remaining health.
- **Custom Audio System:** Background music, engine ignition countdown, dynamic engine sounds, nitro audio, and mute controls.
- **Cross-Platform Controls:** Keyboard controls for desktop and touch-based steering for mobile devices.

## Car Roster and Specifications

Each vehicle has distinct performance characteristics and gameplay advantages.

| Vehicle | Class | Price | Top Speed | Nitro Duration | Handling | Specialty |
|---|---|---:|---:|---:|---:|---|
| Cobalt Phantom | Street Racer | Free | 256 KM/H | 3.50s (40% tank) | 100 ms | Balanced starter vehicle |
| Crimson Fury | GT Hypercar | 100 Coins | 288 KM/H | 3.68s (42% tank) | 105 ms | High acceleration and top speed |
| Cyber Valkyrie | Synth Prototype | 250 Coins | 273 KM/H | 4.73s (54% tank) | 91 ms | High-capacity nitro tank and fast recharge |
| Void Sovereign | Apex Ultra | 500 Coins | 310 KM/H | 4.38s (50% tank) | 83 ms | Highest top speed and responsive steering |

## How to Play

### Objective

Navigate through three lanes of traffic, survive for as long as possible, collect coins, use nitro strategically, and aim for the highest possible score.

### Desktop Controls

| Action | Primary Key | Alternative |
|---|---|---|
| Steer Left | Left Arrow | A |
| Steer Right | Right Arrow | D |
| Accelerate | Up Arrow | W |
| Brake | Down Arrow | S |
| Activate Nitro | Spacebar | — |
| Open or Close Garage | G | — |
| Pause or Resume | Escape | — |
| Toggle Audio | M | — |
| Navigate Garage | Left / Right Arrows | — |
| Buy or Equip Vehicle | Enter | — |

### Mobile Controls

- **Left and Right Buttons:** Steer between lanes.
- **Nitro Button:** Activate nitro when the gauge is at least 20%.
- **Swipe Gestures:** Swipe left or right across the road to change lanes.

## Gameplay Mechanics

### 1. Health and Lives

- Start each run with three lives.
- Collisions with standard traffic deduct one life.
- Temporary invulnerability prevents repeated damage immediately after a collision.
- The run ends when all lives are lost.

### 2. Nitro Overdrive

- Collect cyan nitro pickups to recharge the nitro gauge.
- Each pickup adds 40% to the gauge.
- Activate nitro when the gauge reaches at least 20%.
- While boosting, the player becomes invulnerable and can destroy traffic.
- Destroying traffic during a boost awards a **150-point smash bonus**.

### 3. Coin Vault Economy

- Collecting a gold coin awards **30 points** during a race.
- Coins earned during a run are deposited into the persistent career wallet at the end of the run.
- Spend accumulated coins in the garage to unlock and equip new vehicles.
- Your saved coin balance and career records persist between browser sessions on the same browser and origin.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic markup and game structure |
| CSS3 | Layout, animations, visual effects, and responsive styling |
| Vanilla JavaScript (ES6+) | Game logic, state management, and interactions |
| SVG | Scalable game graphics |
| `requestAnimationFrame` | Rendering loop and frame updates |
| Web Audio API | Dynamic sound effects and audio controls |
| LocalStorage API | Persistent game data and career records |
| Vercel | Deployment and hosting |

### Development Highlights

This project demonstrates practical use of:

- Object-oriented programming with JavaScript classes.
- Delta-time-based game updates.
- Procedural enemy spawning and difficulty management.
- Collision detection and game-state management.
- Keyboard and touch event handling.
- Browser storage and audio APIs.
- Responsive interface design and static-site deployment.

## Run Locally

Road Rush does not require a build process, package installation, or a JavaScript framework. A local development server is recommended.

### 1. Clone the Repository

```bash
git clone https://github.com/Goutam-Sethi/Road-Rush.git
cd Road_Rush
```

### 2. Start a Local Server

Using Python 3:

```bash
python -m http.server 8000
```

Alternatively, if Node.js is installed:

```bash
npx serve .
```

### 3. Open the Game

For the Python server, visit:

```text
http://localhost:8000
```

If you use `npx serve .`, open the local URL displayed in your terminal.

## Deployment on Vercel

Road Rush can be deployed as a static website.

1. Push the project to your GitHub repository.
2. Open the [Vercel Dashboard](https://road-rush-self.vercel.app/).
3. Select **Add New Project** and import the `Road-Rush` repository.
4. Choose **Other** as the framework preset, if prompted.
5. Leave the build command and output directory empty when your project uses plain static files at the repository root.
6. Click **Deploy**.
7. Copy your deployment URL and replace `https://road-rush-self.vercel.app/` in the README links.

No backend server or build pipeline is required for the described frontend implementation.

## License

This project is licensed under the **MIT License**.

Copyright (c) 2026 Goutam Sethi.

See the [`LICENSE`](LICENSE) file for the complete license terms.
