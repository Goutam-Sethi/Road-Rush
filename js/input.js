const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

const keyMap = {
    'ArrowLeft': 'ArrowLeft',
    'a': 'ArrowLeft',
    'A': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'd': 'ArrowRight',
    'D': 'ArrowRight',
    'ArrowUp': 'ArrowUp',
    'w': 'ArrowUp',
    'W': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    's': 'ArrowDown',
    'S': 'ArrowDown',
    ' ': 'Space',
    'Space': 'Space'
};

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function handleKeyDown(event) {
    const actionKey = keyMap[event.key];
    if (actionKey && keys.hasOwnProperty(actionKey)) {
        if (event.key === ' ' || event.key.startsWith('Arrow')) {
            event.preventDefault();
        }
        keys[actionKey] = true;
    }
}

function handleKeyUp(event) {
    const actionKey = keyMap[event.key];
    if (actionKey && keys.hasOwnProperty(actionKey)) {
        if (event.key === ' ' || event.key.startsWith('Arrow')) {
            event.preventDefault();
        }
        keys[actionKey] = false;
    }
}

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener("touchstart", handleTouchStart, { passive: true });
document.addEventListener("touchend", handleTouchEnd, { passive: true });

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 40;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
        if (diffX < 0) {
            keys.ArrowLeft = true;
            setTimeout(() => { keys.ArrowLeft = false; }, 80);
        } else {
            keys.ArrowRight = true;
            setTimeout(() => { keys.ArrowRight = false; }, 80);
        }
    } else if (Math.abs(diffY) > swipeThreshold) {
        if (diffY < 0) {
            keys.ArrowUp = true;
            setTimeout(() => { keys.ArrowUp = false; }, 120);
        } else {
            keys.ArrowDown = true;
            setTimeout(() => { keys.ArrowDown = false; }, 120);
        }
    }
}

export { keys };