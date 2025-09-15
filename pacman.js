const pacman = document.getElementById("pacman");
const ghost = document.getElementById("ghost");
const startBtn = document.getElementById("startBtn");

let isGameRunning = false;
let ghostSpeed = 6; // smoother speed
let ghostPosition = 600; // start from right side
let gameLoop;

function jump() {
    if (!pacman.classList.contains("jump")) {
        pacman.classList.add("jump");
        setTimeout(() => pacman.classList.remove("jump"), 400);
    }
}

function startGame() {
    isGameRunning = true;
    ghostPosition = 600;
    ghost.style.right = ghostPosition + "px";
    ghost.style.animation = "none"; // reset  CSS animation
    startBtn.disabled = true;

    gameLoop = setInterval(() => {
        // move ghost smoothly
        ghostPosition -= ghostSpeed;
        ghost.style.right = ghostPosition + "px";

        if (ghostPosition < -60) {
            ghostPosition = 600; // reset to right side
        }

        // collision detection
        let pacmanTop = parseInt(window.getComputedStyle(pacman).getPropertyValue("bottom"));
        if (ghostPosition < 130 && ghostPosition > 50 && pacmanTop <= 30) {
            endGame();
        }
    }, 20); // smoother interval
}

// function endGame() {
//     clearInterval(gameLoop);
//     isGameRunning = false;
//     startBtn.disabled = false;
//     alert("You've been caught!");
// }
function endGame() {
    clearInterval(gameLoop);
    // clearInterval(spawnLoop);
    isGameRunning = false;
    startBtn.disabled = false;

    // show fun game over message
    const gameOverMessage = document.getElementById("gameOverMessage");
    gameOverMessage.style.display = "block";
    const game = document.querySelector('.game');
    game.style.opacity = "50%";

    setTimeout(() => {
        gameOverMessage.style.display = "none"; // hide after 3 seconds
        game.style.opacity = "100%";
    }, 2000);
}
// event listeners
document.addEventListener("keydown", e => {
    if (e.code === "Space" && isGameRunning) {
        jump();
    }
});

startBtn.addEventListener("click", startGame);
