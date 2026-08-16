const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function handleKeyDown(event) {
    if (keys.hasOwnProperty(event.key)) {
        event.preventDefault();
        keys[event.key] = true;
    }
}

function handleKeyUp(event) {
    if (keys.hasOwnProperty(event.key)) {
        event.preventDefault();
        keys[event.key] = false;
    }
}

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchend", handleTouchEnd);

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff < 0) {
            // Swiped left
            keys.ArrowLeft = true;
            setTimeout(() => {
                keys.ArrowLeft = false;
            }, 100);
        } else {
            // Swiped right
            keys.ArrowRight = true;
            setTimeout(() => {
                keys.ArrowRight = false;
            }, 100);
        }
    }
}

export { keys };