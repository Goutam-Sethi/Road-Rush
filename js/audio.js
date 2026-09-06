// =============================================================================
// ROAD RUSH HYBRID SOUND ENGINE
// - Uses Web Audio procedural synthesis for arcade SFX (Coins, Nitro, Crash, etc.)
// - Uses real audio files from assets/sounds/ (supports .wav & .mp3)
// - Car running sound is ONLY played from your custom audio file (no annoying hum)
// - Car engine start sound (engine_start.wav / engine_start.mp3) plays for 3s during countdown
// =============================================================================

export const SOUND_PATHS = {
    COIN: './assets/sounds/coin.wav',
    NITRO: './assets/sounds/nitro.wav',
    BOOST: './assets/sounds/booster.mp3',
    CRASH: './assets/sounds/crash.wav',
    SMASH: './assets/sounds/smash.wav',
    GAMEOVER: './assets/sounds/gameover.wav',
    ENGINE: './assets/sounds/car_engine.mp3',
    ENGINE_START: './assets/sounds/engine_start.wav',
    BGM: './assets/sounds/background_music.mp3'
};

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.noiseBuffer = null;

        this.isMuted = false;
        this.isEnginePlaying = false;
        this.engineAudio = null;
        this.engineAvailable = true;
        this.engineStartAudio = null;
        this.engineStartTimeout = null;

        // Custom booster sound support
        this.boostAudio = null;
        this.boostCandidates = [
            './assets/sounds/booster.mp3',
            './assets/sounds/booster.wav',
            './assets/sounds/boost.mp3',
            './assets/sounds/boost.wav',
            './assets/sounds/nitro_boost.mp3',
            './assets/sounds/nitro_boost.wav',
            './assets/sounds/nitro.mp3',
            './assets/sounds/nitro.wav'
        ];
        this.boostCandidateIndex = 0;
        this.boostAvailable = true;
        this.activeBoostSynth = null;

        // Web Audio gapless BGM support (with trailing silence auto-trim)
        this.bgMusicAudio = null;
        this.bgMusicBuffer = null;
        this.bgMusicSourceNode = null;
        this.bgMusicGainNode = null;
        this.bgMusicLoopStart = 0;
        this.bgMusicLoopEnd = 0;
        this.bgMusicStartTime = 0;
        this.bgMusicPauseOffset = 0;
        this.bgMusicLoading = false;
        this.bgMusicPlaying = false;
        this.bgMusicAvailable = true;

        // Load mute state from localStorage
        try {
            this.isMuted = localStorage.getItem('road_rush_muted') === 'true';
        } catch {
            this.isMuted = false;
        }

        this.initEngineAudio();
        this.initBoosterAudio();
        this.initBackgroundMusic();
    }

    /**
     * Lazy initialize Web Audio API context for procedural SFX
     */
    initAudioContext() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        try {
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.95, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Generate white noise buffer for crash & boost effects
            const bufferSize = this.ctx.sampleRate;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            this.noiseBuffer = buffer;
        } catch (e) {
            console.warn('Web Audio initialization error:', e);
        }
    }

    /**
     * Initialize looping engine audio from file (NO synthetic buzzing)
     * Prioritizes custom car_engine.mp3 / car_engine.wav
     */
    initEngineAudio() {
        if (typeof Audio === 'undefined') return;

        const candidatePaths = [
            './assets/sounds/car_engine.mp3',
            './assets/sounds/car_engine.wav',
            './assets/sounds/car-engine.mp3',
            './assets/sounds/car-engine.wav',
            './assets/sounds/engine.mp3',
            './assets/sounds/engine.wav'
        ];

        const tryLoadCandidate = (index) => {
            if (index >= candidatePaths.length) {
                this.engineAvailable = false;
                this.engineAudio = null;
                return;
            }

            const audio = new Audio(candidatePaths[index]);
            audio.loop = true;
            audio.volume = 0.85;
            audio.preload = 'auto';

            // Loop safeguard across browsers to guarantee uninterrupted playback
            audio.addEventListener('ended', () => {
                if (this.isEnginePlaying && !this.isMuted) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            });

            audio.addEventListener('error', () => {
                tryLoadCandidate(index + 1);
            });

            this.engineAudio = audio;
            this.engineAvailable = true;

            // If game is already running, play immediately
            if (this.isEnginePlaying && !this.isMuted) {
                audio.play().catch(() => {});
            }
        };

        tryLoadCandidate(0);
    }

    /**
     * Initialize booster audio from file (booster.mp3, boost.mp3, etc.)
     */
    initBoosterAudio() {
        if (typeof Audio === 'undefined') return;

        const candidatePaths = this.boostCandidates || [
            './assets/sounds/booster.mp3',
            './assets/sounds/booster.wav',
            './assets/sounds/boost.mp3',
            './assets/sounds/boost.wav',
            './assets/sounds/nitro_boost.mp3',
            './assets/sounds/nitro_boost.wav',
            './assets/sounds/nitro.mp3',
            './assets/sounds/nitro.wav'
        ];

        const tryLoadCandidate = (index) => {
            if (index >= candidatePaths.length) {
                this.boostAvailable = false;
                this.boostAudio = null;
                return;
            }

            const audio = new Audio(candidatePaths[index]);
            audio.volume = 0.95;
            audio.preload = 'auto';

            audio.addEventListener('error', () => {
                tryLoadCandidate(index + 1);
            });

            this.boostAudio = audio;
            this.boostCandidateIndex = index;
            this.boostAvailable = true;
        };

        tryLoadCandidate(0);
    }

    /**
     * Initialize background music loader for index.html (background_music.mp3)
     * Uses Web Audio API buffer looping with trailing silence auto-trim for true gapless looping.
     */
    initBackgroundMusic() {
        this.loadBackgroundMusicBuffer();

        if (typeof Audio === 'undefined') return;

        const candidatePaths = [
            './assets/sounds/background_music.mp3',
            './assets/sounds/background_music.wav',
            './assets/sounds/bg_music.mp3',
            './assets/sounds/bg_music.wav',
            './assets/sounds/music.mp3',
            './assets/sounds/music.wav'
        ];

        const tryLoadCandidate = (index) => {
            if (index >= candidatePaths.length) {
                this.bgMusicAvailable = false;
                this.bgMusicAudio = null;
                return;
            }

            const audio = new Audio(candidatePaths[index]);
            audio.loop = true;
            audio.volume = 0.6;
            audio.preload = 'auto';

            // Loop safeguard
            audio.addEventListener('ended', () => {
                if (this.bgMusicPlaying && !this.isMuted && !this.bgMusicBuffer) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            });

            audio.addEventListener('error', () => {
                tryLoadCandidate(index + 1);
            });

            this.bgMusicAudio = audio;
            this.bgMusicAvailable = true;

            if (this.bgMusicPlaying && !this.isMuted && !this.bgMusicBuffer) {
                audio.play().catch(() => {});
            }
        };

        tryLoadCandidate(0);
    }

    /**
     * Load, decode and trim audio buffer for true sample-accurate gapless looping
     */
    async loadBackgroundMusicBuffer() {
        if (this.bgMusicBuffer || this.bgMusicLoading) return;
        this.bgMusicLoading = true;

        this.initAudioContext();
        if (!this.ctx) {
            this.bgMusicLoading = false;
            return;
        }

        const candidatePaths = [
            './assets/sounds/background_music.mp3',
            './assets/sounds/background_music.wav',
            './assets/sounds/bg_music.mp3',
            './assets/sounds/bg_music.wav',
            './assets/sounds/music.mp3',
            './assets/sounds/music.wav'
        ];

        for (const path of candidatePaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) continue;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

                // Auto-detect and trim trailing silence so there is ZERO silence/delay between loops
                const chan0 = audioBuffer.getChannelData(0);
                const chan1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
                const silenceThreshold = 0.003; // -50 dB

                let firstAudible = 0;
                while (firstAudible < audioBuffer.length - 1) {
                    const s0 = Math.abs(chan0[firstAudible]);
                    const s1 = chan1 ? Math.abs(chan1[firstAudible]) : 0;
                    if (s0 > silenceThreshold || s1 > silenceThreshold) break;
                    firstAudible++;
                }

                let lastAudible = audioBuffer.length - 1;
                while (lastAudible > firstAudible) {
                    const s0 = Math.abs(chan0[lastAudible]);
                    const s1 = chan1 ? Math.abs(chan1[lastAudible]) : 0;
                    if (s0 > silenceThreshold || s1 > silenceThreshold) break;
                    lastAudible--;
                }

                const sampleRate = audioBuffer.sampleRate;
                const loopStart = firstAudible / sampleRate;
                // Add 25ms safe tail to preserve natural decay
                const loopEnd = Math.min(audioBuffer.duration, (lastAudible + sampleRate * 0.025) / sampleRate);

                this.bgMusicBuffer = audioBuffer;
                this.bgMusicLoopStart = loopStart;
                this.bgMusicLoopEnd = loopEnd;
                this.bgMusicLoading = false;

                // If BGM is playing, switch seamlessly from HTML5 audio to gapless Web Audio buffer
                if (this.bgMusicPlaying && !this.isMuted) {
                    if (this.bgMusicAudio) {
                        try {
                            this.bgMusicAudio.pause();
                            this.bgMusicAudio.currentTime = 0;
                        } catch {}
                    }
                    this.startBgMusicSource();
                }
                return;
            } catch (err) {
                // Try next candidate
            }
        }

        this.bgMusicLoading = false;
    }

    startBgMusicSource() {
        if (!this.ctx || !this.bgMusicBuffer) return;
        this.stopBgMusicSource();

        try {
            const source = this.ctx.createBufferSource();
            source.buffer = this.bgMusicBuffer;
            source.loop = true;
            source.loopStart = this.bgMusicLoopStart || 0;
            source.loopEnd = this.bgMusicLoopEnd || this.bgMusicBuffer.duration;

            if (!this.bgMusicGainNode) {
                this.bgMusicGainNode = this.ctx.createGain();
                this.bgMusicGainNode.connect(this.masterGain || this.ctx.destination);
            }
            this.bgMusicGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);

            source.connect(this.bgMusicGainNode);

            const loopSpan = (this.bgMusicLoopEnd || this.bgMusicBuffer.duration) - (this.bgMusicLoopStart || 0);
            const offset = (this.bgMusicLoopStart || 0) + (this.bgMusicPauseOffset % (loopSpan || 1));
            source.start(0, offset);
            this.bgMusicStartTime = this.ctx.currentTime - offset;
            this.bgMusicSourceNode = source;
        } catch (e) {
            console.warn('Error starting gapless Web Audio BGM:', e);
        }
    }

    stopBgMusicSource() {
        if (this.bgMusicSourceNode) {
            try {
                this.bgMusicSourceNode.stop();
                this.bgMusicSourceNode.disconnect();
            } catch {}
            this.bgMusicSourceNode = null;
        }
    }

    playBackgroundMusic() {
        this.bgMusicPlaying = true;
        if (this.isMuted) return;

        this.initAudioContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        if (this.bgMusicBuffer) {
            this.startBgMusicSource();
        } else {
            this.loadBackgroundMusicBuffer();

            // Immediate playback fallback while buffer decodes
            if (typeof Audio !== 'undefined' && !this.bgMusicAudio) {
                this.initBackgroundMusic();
            }
            if (this.bgMusicAudio && this.bgMusicAudio.paused) {
                const playPromise = this.bgMusicAudio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        const onFirstInteraction = () => {
                            if (this.bgMusicPlaying && !this.isMuted) {
                                this.playBackgroundMusic();
                            }
                            window.removeEventListener('click', onFirstInteraction);
                            window.removeEventListener('keydown', onFirstInteraction);
                            window.removeEventListener('touchstart', onFirstInteraction);
                        };
                        window.addEventListener('click', onFirstInteraction, { once: true });
                        window.addEventListener('keydown', onFirstInteraction, { once: true });
                        window.addEventListener('touchstart', onFirstInteraction, { once: true });
                    });
                }
            }
        }
    }

    stopBackgroundMusic() {
        this.bgMusicPlaying = false;
        this.bgMusicPauseOffset = 0;
        this.stopBgMusicSource();
        if (this.bgMusicAudio) {
            try {
                this.bgMusicAudio.pause();
                this.bgMusicAudio.currentTime = 0;
            } catch {}
        }
    }

    pauseBackgroundMusic() {
        if (this.ctx && this.bgMusicSourceNode && this.bgMusicBuffer) {
            const loopSpan = (this.bgMusicLoopEnd || this.bgMusicBuffer.duration) - (this.bgMusicLoopStart || 0);
            this.bgMusicPauseOffset = (this.ctx.currentTime - this.bgMusicStartTime) % (loopSpan || 1);
            this.stopBgMusicSource();
        }
        if (this.bgMusicAudio && !this.bgMusicAudio.paused) {
            try {
                this.bgMusicAudio.pause();
            } catch {}
        }
    }

    resumeBackgroundMusic() {
        if (this.bgMusicPlaying && !this.isMuted) {
            this.playBackgroundMusic();
        }
    }

    resume() {
        this.initAudioContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        if (this.isEnginePlaying && !this.isMuted && this.engineAudio) {
            this.engineAudio.play().catch(() => {});
        }
        if (this.bgMusicPlaying && !this.isMuted) {
            if (this.bgMusicBuffer) {
                if (!this.bgMusicSourceNode) {
                    this.startBgMusicSource();
                }
            } else if (this.bgMusicAudio) {
                this.bgMusicAudio.play().catch(() => {});
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        try {
            localStorage.setItem('road_rush_muted', String(this.isMuted));
        } catch {}

        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.95, this.ctx.currentTime);
        }

        if (this.engineAudio) {
            if (this.isMuted) {
                this.engineAudio.pause();
            } else if (this.isEnginePlaying) {
                this.engineAudio.play().catch(() => {});
            }
        }

        if (this.bgMusicGainNode && this.ctx) {
            this.bgMusicGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
        }

        if (this.bgMusicAudio) {
            if (this.isMuted) {
                this.bgMusicAudio.pause();
            } else if (this.bgMusicPlaying && !this.bgMusicBuffer) {
                this.bgMusicAudio.play().catch(() => {});
            }
        }

        if (this.engineStartAudio && this.isMuted) {
            this.stopEngineStart();
        }

        if (this.isMuted) {
            this.stopNitroBoost();
        }

        return this.isMuted;
    }

    /**
     * Play custom sound file with fallback to procedural synth
     */
    playWithFallback(url, fallbackSynth, volume = 0.95) {
        if (this.isMuted) return;

        if (typeof Audio !== 'undefined') {
            const altUrl = url.endsWith('.wav') ? url.replace(/\.wav$/, '.mp3') : url.replace(/\.mp3$/, '.wav');
            const candidate = new Audio(url);
            candidate.volume = volume;

            const playPromise = candidate.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Try alternative extension
                    const altCandidate = new Audio(altUrl);
                    altCandidate.volume = volume;
                    const altPromise = altCandidate.play();
                    if (altPromise !== undefined) {
                        altPromise.catch(() => {
                            // Run procedural synth fallback
                            fallbackSynth();
                        });
                    } else {
                        fallbackSynth();
                    }
                });
                return;
            }
        }

        fallbackSynth();
    }

    // =========================================================================
    // ENGINE RUNNING (FILE-BASED ONLY — USER'S AUDIO)
    // =========================================================================

    startEngine() {
        this.isEnginePlaying = true;
        if (this.isMuted) return;

        if (!this.engineAudio) {
            this.initEngineAudio();
        }

        if (this.engineAudio) {
            try {
                this.engineAudio.loop = true;
                this.engineAudio.currentTime = 0;
                const playPromise = this.engineAudio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn('Engine sound play blocked or waiting for user interaction:', err);
                    });
                }
            } catch (e) {
                console.warn('Engine sound error:', e);
            }
        }
    }

    setEnginePitch(speed = 5, isNitro = false) {
        if (!this.engineAudio || this.isMuted) return;

        try {
            // Dynamically scale playback speed with car speed (0.8x to 1.8x)
            const rate = Math.min(1.8, Math.max(0.8, 0.95 + (speed - 5) * 0.04 + (isNitro ? 0.25 : 0)));
            this.engineAudio.playbackRate = rate;
        } catch {}
    }

    pauseEngine() {
        if (this.engineAudio && !this.engineAudio.paused) {
            try {
                this.engineAudio.pause();
            } catch {}
        }
    }

    resumeEngine() {
        if (this.isEnginePlaying && !this.isMuted && this.engineAudio) {
            try {
                this.engineAudio.play().catch(() => {});
            } catch {}
        }
    }

    stopEngine() {
        this.isEnginePlaying = false;
        if (this.engineAudio) {
            try {
                this.engineAudio.pause();
                this.engineAudio.currentTime = 0;
            } catch {}
        }
    }

    // =========================================================================
    // 3-SECOND COUNTDOWN CAR ENGINE START SOUND
    // =========================================================================

    playEngineStart(duration = 3) {
        if (this.isMuted || typeof Audio === 'undefined') return;

        this.stopEngineStart(false);

        const candidatePaths = [
            './assets/sounds/engine_start.wav',
            './assets/sounds/engine_start.mp3',
            './assets/sounds/start.wav',
            './assets/sounds/start.mp3',
            './assets/sounds/engine-start.wav',
            './assets/sounds/engine-start.mp3',
            './assets/sounds/car_start.wav',
            './assets/sounds/car_start.mp3'
        ];

        const tryPlay = (index) => {
            if (index >= candidatePaths.length) return;

            const sound = new Audio(candidatePaths[index]);
            sound.volume = 1.0;
            sound.preload = 'auto';
            this.engineStartAudio = sound;

            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (this.engineStartTimeout) clearTimeout(this.engineStartTimeout);
                    this.engineStartTimeout = setTimeout(() => {
                        this.stopEngineStart(true);
                    }, duration * 1000);
                }).catch(() => {
                    tryPlay(index + 1);
                });
            }
        };

        tryPlay(0);
    }

    stopEngineStart(fade = true) {
        if (this.engineStartTimeout) {
            clearTimeout(this.engineStartTimeout);
            this.engineStartTimeout = null;
        }

        if (!this.engineStartAudio) return;

        const sound = this.engineStartAudio;
        this.engineStartAudio = null;

        if (fade && sound.volume > 0.05) {
            // Smooth 200ms fade out to avoid clicks
            const fadeStep = sound.volume / 4;
            const fadeInterval = setInterval(() => {
                if (sound.volume > fadeStep) {
                    sound.volume = Math.max(0, sound.volume - fadeStep);
                } else {
                    clearInterval(fadeInterval);
                    try {
                        sound.pause();
                        sound.currentTime = 0;
                    } catch {}
                }
            }, 50);
        } else {
            try {
                sound.pause();
                sound.currentTime = 0;
            } catch {}
        }
    }

    // =========================================================================
    // SOUND EFFECTS (WITH PROCEDURAL FALLBACKS)
    // =========================================================================

    /**
     * Coin collection chime: 2-tone bright arpeggio (B5 -> E6)
     */
    playCoin() {
        this.playWithFallback(SOUND_PATHS.COIN, () => {
            this.initAudioContext();
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

            gain.gain.setValueAtTime(0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.28);
        }, 0.95);
    }

    /**
     * Nitro bottle pickup sound: Energizing rising power tone
     */
    playNitroPickup() {
        this.playWithFallback(SOUND_PATHS.NITRO, () => {
            this.initAudioContext();
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(1046, now + 0.24);

            gain.gain.setValueAtTime(0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.26);
        }, 0.95);
    }

    /**
     * Nitro activation booster sound
     * Prioritizes custom audio files (booster.mp3, booster.wav, boost.mp3, nitro.mp3, etc.)
     * Falls back to continuous high-octane turbo-jet thruster roar
     */
    playNitroBoost() {
        if (this.isMuted) return;

        // Stop any running booster sound first
        this.stopNitroBoost();

        // 1. Try playing custom booster file from assets/sounds/
        if (typeof Audio !== 'undefined' && this.boostAvailable) {
            const tryPlayCandidate = (index) => {
                if (index >= this.boostCandidates.length) {
                    this.boostAvailable = false;
                    this.boostAudio = null;
                    this.playProceduralNitroBoost();
                    return;
                }

                const sound = new Audio(this.boostCandidates[index]);
                sound.volume = 0.95;
                sound.preload = 'auto';

                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.boostAudio = sound;
                        this.boostCandidateIndex = index;
                    }).catch(() => {
                        tryPlayCandidate(index + 1);
                    });
                } else {
                    this.boostAudio = sound;
                }
            };

            if (this.boostAudio && this.boostCandidateIndex < this.boostCandidates.length) {
                try {
                    this.boostAudio.currentTime = 0;
                    this.boostAudio.volume = 0.95;
                    const p = this.boostAudio.play();
                    if (p !== undefined) {
                        p.catch(() => {
                            tryPlayCandidate(this.boostCandidateIndex + 1);
                        });
                    }
                    return;
                } catch {
                    tryPlayCandidate(this.boostCandidateIndex + 1);
                    return;
                }
            }

            tryPlayCandidate(this.boostCandidateIndex || 0);
            return;
        }

        // 2. Procedural arcade turbo rocket boost
        this.playProceduralNitroBoost();
    }

    playProceduralNitroBoost() {
        this.initAudioContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const duration = 3.5;
        const activeNodes = [];

        const boostGain = this.ctx.createGain();
        boostGain.gain.setValueAtTime(0.95, now);
        boostGain.connect(this.masterGain);

        // Sub bass explosive rocket ignition punch
        const punchOsc = this.ctx.createOscillator();
        const punchGain = this.ctx.createGain();
        punchOsc.type = 'sawtooth';
        punchOsc.frequency.setValueAtTime(260, now);
        punchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

        punchGain.gain.setValueAtTime(0.9, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        punchOsc.connect(punchGain);
        punchGain.connect(boostGain);
        punchOsc.start(now);
        punchOsc.stop(now + 0.4);
        activeNodes.push(punchOsc);

        // Jet stream turbo exhaust whoosh
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            noise.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(400, now);
            bandpass.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
            bandpass.Q.setValueAtTime(2.5, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.7, now);
            noiseGain.gain.setValueAtTime(0.65, now + 0.3);

            noise.connect(bandpass);
            bandpass.connect(noiseGain);
            noiseGain.connect(boostGain);

            noise.start(now);
            noise.stop(now + duration);
            activeNodes.push(noise);
        }

        // Turbo turbine whine
        const turbineOsc = this.ctx.createOscillator();
        const turbineGain = this.ctx.createGain();
        turbineOsc.type = 'sine';
        turbineOsc.frequency.setValueAtTime(400, now);
        turbineOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
        turbineOsc.frequency.linearRampToValueAtTime(1900, now + duration);

        turbineGain.gain.setValueAtTime(0.15, now);
        turbineGain.gain.exponentialRampToValueAtTime(0.3, now + 0.35);
        turbineGain.gain.setValueAtTime(0.25, now + duration);

        turbineOsc.connect(turbineGain);
        turbineGain.connect(boostGain);

        turbineOsc.start(now);
        turbineOsc.stop(now + duration);
        activeNodes.push(turbineOsc);

        this.activeBoostSynth = {
            gainNode: boostGain,
            nodes: activeNodes
        };
    }

    stopNitroBoost() {
        if (this.boostAudio) {
            try {
                this.boostAudio.pause();
                this.boostAudio.currentTime = 0;
            } catch {}
        }

        if (this.activeBoostSynth) {
            try {
                const now = this.ctx ? this.ctx.currentTime : 0;
                if (this.activeBoostSynth.gainNode && this.ctx) {
                    this.activeBoostSynth.gainNode.gain.cancelScheduledValues(now);
                    this.activeBoostSynth.gainNode.gain.setValueAtTime(this.activeBoostSynth.gainNode.gain.value, now);
                    this.activeBoostSynth.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
                }
                const synthRef = this.activeBoostSynth;
                this.activeBoostSynth = null;
                setTimeout(() => {
                    if (synthRef && synthRef.nodes) {
                        synthRef.nodes.forEach(n => {
                            try { n.stop(); } catch {}
                            try { n.disconnect(); } catch {}
                        });
                    }
                }, 160);
            } catch {
                this.activeBoostSynth = null;
            }
        }
    }

    /**
     * Traffic collision crash sound
     */
    playCrash() {
        this.playWithFallback(SOUND_PATHS.CRASH, () => {
            this.initAudioContext();
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;

            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(900, now);
                filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.95, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                noise.start(now);
                noise.stop(now + 0.38);
            }

            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

            oscGain.gain.setValueAtTime(0.95, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            osc.connect(oscGain);
            oscGain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.32);
        }, 1.0);
    }

    /**
     * Nitro smash sound
     */
    playSmash() {
        this.playWithFallback(SOUND_PATHS.SMASH, () => {
            this.initAudioContext();
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;

            const ping = this.ctx.createOscillator();
            const pingGain = this.ctx.createGain();
            ping.type = 'sine';
            ping.frequency.setValueAtTime(1200, now);
            ping.frequency.exponentialRampToValueAtTime(180, now + 0.28);

            pingGain.gain.setValueAtTime(0.85, now);
            pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            ping.connect(pingGain);
            pingGain.connect(this.masterGain);
            ping.start(now);
            ping.stop(now + 0.28);

            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1100, now);
                filter.frequency.exponentialRampToValueAtTime(250, now + 0.3);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.95, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                noise.start(now);
                noise.stop(now + 0.32);
            }
        }, 1.0);
    }

    /**
     * Game over retro arcade tones
     */
    playGameOver() {
        this.playWithFallback(SOUND_PATHS.GAMEOVER, () => {
            this.initAudioContext();
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            const notes = [329.63, 293.66, 261.63, 196.00];

            notes.forEach((freq, idx) => {
                const noteStart = now + idx * 0.16;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteStart);

                gain.gain.setValueAtTime(0.85, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(noteStart);
                osc.stop(noteStart + 0.22);
            });
        }, 0.95);
    }
}

export const audio = new SoundEngine();
