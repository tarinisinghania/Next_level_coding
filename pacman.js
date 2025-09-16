const pacman = document.getElementById("pacman");
const ghost = document.getElementById("ghost");
const startBtn = document.getElementById("startBtn");
const aboutBtn = document.getElementById("about");
const output = document.getElementById("output");
const game = document.querySelector('.game');
const info = document.querySelector('.info');

let isGameRunning = false;
let ghostSpeed = 6.5; 
let ghostPosition = 600; 
let gameLoop;

function jump() {
    if (!pacman.classList.contains("jump")) {
        pacman.classList.add("jump");
        setTimeout(() => pacman.classList.remove("jump"), 400);
    }
}
function aboutPage() {
    output.textContent = "I tried showing two different aesthetics to explain two different cities, one being the pixelated loud orange aesthetic and the other is the cartoon world. The girl belongs in the cartoon world and the ghost from the other world is chasing her. (The ghost = homeless person)";
    output.style.opacity = "100%";
    output.style.backgroundColor = "orangered";
    output.style.borderRadius = "20px";
    game.style.opacity = "50%";
    startBtn.style.opacity = "50%";
    info.style.opacity = "50%";

    setTimeout(() => {
        output.style.display = "none";
        game.style.opacity = "100%";
        startBtn.style.opacity = "100%";
        info.style.opacity = "100%";
    }, 10000);
}

function startGame() {
    isGameRunning = true;
    ghostPosition = 600;
    ghost.style.right = ghostPosition + "px";
    ghost.style.animation = "none"; // reset  CSS animation
    startBtn.disabled = true;

    gameLoop = setInterval(() => {
        
        ghostPosition -= ghostSpeed;
        ghost.style.right = ghostPosition + "px";

        if (ghostPosition < -60) {
            ghostPosition = 600; // reset to right side
        }

        // pacman and ghost colliding- had to look up
        let pacmanTop = parseInt(window.getComputedStyle(pacman).getPropertyValue("bottom"));
        if (ghostPosition < 130 && ghostPosition > 50 && pacmanTop <= 30) {
            endGame();
        }
    }, 20); 
}

// function endGame() {
//     clearInterval(gameLoop);
//     isGameRunning = false;
//     startBtn.disabled = false;
//     alert("You've been caught!");
// } 

function endGame() {
    clearInterval(gameLoop);
    isGameRunning = false;
    startBtn.disabled = false;


    const gameOverMessage = document.getElementById("gameOverMessage");
    gameOverMessage.style.display = "block";
    // const game = document.querySelector('.game');
    game.style.opacity = "50%";
    startBtn.style.opacity = "50%";
    // const info = document.querySelector('.info');
    info.style.opacity = "50%";
    aboutBtn.style.opacity = "50%";

    setTimeout(() => {
        gameOverMessage.style.display = "none"; // hide after 3 seconds
        game.style.opacity = "100%";
        startBtn.style.opacity = "100%";
        info.style.opacity = "100%";
        aboutBtn.style.opacity = "100%";
    }, 2000);
}

document.addEventListener("keydown", e => {
    if (e.code === "Space" && isGameRunning) {
        jump();
    }
});

startBtn.addEventListener("click", startGame);
aboutBtn.addEventListener("click", aboutPage)
