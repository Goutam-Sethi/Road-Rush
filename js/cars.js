// =============================================================================
// CAR CATALOG MODULE
// Defines all purchasable and drivable vehicles in Road Rush
// =============================================================================

export const CARS = [
    {
        id: 'cobalt_phantom',
        name: 'Cobalt Phantom',
        tagline: 'STREET RACER',
        price: 0,
        svg: './assets/cars/player_car.svg',
        accentColor: '#00f3ff',
        description: 'Balanced city performer with nimble responsive handling and reliable boost timing.',
        stats: {
            speed: 70,      // Display 0-100
            nitro: 70,
            handling: 75,
            speedMultiplier: 1.0,
            nitroMultiplier: 1.0,
            handlingMultiplier: 1.0
        }
    },
    {
        id: 'crimson_fury',
        name: 'Crimson Fury',
        tagline: 'GT HYPERCAR',
        price: 100,
        svg: './assets/cars/car_crimson.svg',
        accentColor: '#ff2a2a',
        description: 'Twin-turbocharged beast with raw top speed and aggressive acceleration on the straightaway.',
        stats: {
            speed: 85,
            nitro: 75,
            handling: 70,
            speedMultiplier: 1.15,
            nitroMultiplier: 1.05,
            handlingMultiplier: 0.95
        }
    },
    {
        id: 'cyber_valkyrie',
        name: 'Cyber Valkyrie',
        tagline: 'SYNTH PROTOTYPE',
        price: 250,
        svg: './assets/cars/car_neon.svg',
        accentColor: '#00e676',
        description: 'High-tech electric experimental equipped with a supercharged NOS capacitor and rapid recharge.',
        stats: {
            speed: 80,
            nitro: 95,
            handling: 85,
            speedMultiplier: 1.08,
            nitroMultiplier: 1.35,
            handlingMultiplier: 1.10
        }
    },
    {
        id: 'void_sovereign',
        name: 'Void Sovereign',
        tagline: 'APEX ULTRA',
        price: 500,
        svg: './assets/cars/car_shadow.svg',
        accentColor: '#ffd54f',
        description: 'Stealth carbon hypercar trimmed in 24K gold. Unrivaled aerodynamic balance and pinnacle performance.',
        stats: {
            speed: 95,
            nitro: 90,
            handling: 90,
            speedMultiplier: 1.25,
            nitroMultiplier: 1.25,
            handlingMultiplier: 1.20
        }
    }
];

export const getDefaultCar = () => CARS[0];

export const getCarById = (id) => {
    return CARS.find(car => car.id === id) || getDefaultCar();
};

export const getAllCars = () => CARS;
