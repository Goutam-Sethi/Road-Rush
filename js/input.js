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
    ' ': 'Space',
    'Space': 'Space',
    'ArrowDown': 'ArrowDown',
    's': 'ArrowDown',
    'S': 'ArrowDown'
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
            // Swiped left
            keys.ArrowLeft = true;
            setTimeout(() => { keys.ArrowLeft = false; }, 80);
        } else {
            // Swiped right
            keys.ArrowRight = true;
            setTimeout(() => { keys.ArrowRight = false; }, 80);
        }
    } else if (Math.abs(diffY) > swipeThreshold && diffY < 0) {
        // Swiped up -> Nitro
        keys.Space = true;
        setTimeout(() => { keys.Space = false; }, 100);
    }
}

export { keys };