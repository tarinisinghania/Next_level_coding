const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('hourSlider');
const timeDisplay = document.getElementById('timeDisplay');
const deformationLevel = document.getElementById('deformationLevel');

// Set canvas size
canvas.width = 1200;
canvas.height = 800;

// Grid settings
const gridSize = 20;
const squareSize = 15;

// FARE letter patterns (1 = filled, 0 = empty)
const letterF = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0]
];

const letterA = [
    [0,0,1,1,1,0,0],
    [0,1,0,0,0,1,0],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1]
];

const letterR = [
    [1,1,1,1,1,1,0],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,0],
    [1,0,0,1,0,0,0],
    [1,0,0,0,1,0,0],
    [1,0,0,0,0,1,0],
    [1,0,0,0,0,1,0],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1]
];

const letterE = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,0,0,0,0,0,0],
    [1,1,1,1,1,1,1]
];

// Position letters
const letters = [
    { pattern: letterF, x: 8, y: 11 },
    { pattern: letterA, x: 20, y: 11 },
    { pattern: letterR, x: 32, y: 11 },
    { pattern: letterE, x: 45, y: 11 }
];

// Calculate deformation based on hour
function getDeformation(hour) {
    if (hour < 6) return hour / 6 * 0.2; // 0-20% deformation (night to morning)
    if (hour < 12) return 0.2 + (hour - 6) / 6 * 0.3; // 20-50% (morning to noon)
    if (hour < 18) return 0.5 + (hour - 12) / 6 * 0.3; // 50-80% (noon to evening)
    return 0.8 + (hour - 18) / 6 * 0.2; // 80-100% (evening to night)
}

// Random deformation function
function deformSquare(x, y, size, deformationFactor, seed) {
    // Use seed for consistent randomness per square
    const random = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    const maxOffset = size * deformationFactor * 3.5;
    const maxRotation = Math.PI * deformationFactor * 0.8;
    
    const offsetX = (random(seed * 1.1) - 0.5) * maxOffset;
    const offsetY = (random(seed * 1.3) - 0.5) * maxOffset;
    const rotation = (random(seed * 1.7) - 0.5) * maxRotation;
    // Increased size growth with deformation
    const scaleVar = 1 + deformationFactor * 1.5 + (random(seed * 1.9) - 0.5) * deformationFactor * 0.8;

    ctx.save();
    ctx.translate(x + offsetX, y + offsetY);
    ctx.rotate(rotation);

    if (deformationFactor > 0.5) {
        // Draw blob-like shape
        const points = 8;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = size / 2 * scaleVar * (0.8 + random(seed * (i + 2)) * 0.4);
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    } else {
        // Draw deformed square
        const s = size * scaleVar / 2;
        ctx.beginPath();
        ctx.moveTo(-s + random(seed * 2.1) * maxOffset * 0.3, -s + random(seed * 2.3) * maxOffset * 0.3);
        ctx.lineTo(s + random(seed * 2.5) * maxOffset * 0.3, -s + random(seed * 2.7) * maxOffset * 0.3);
        ctx.lineTo(s + random(seed * 2.9) * maxOffset * 0.3, s + random(seed * 3.1) * maxOffset * 0.3);
        ctx.lineTo(-s + random(seed * 3.3) * maxOffset * 0.3, s + random(seed * 3.5) * maxOffset * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawGrid(hour) {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Get deformation level
    const deformation = getDeformation(hour);
    ctx.fillStyle = '#fff';

    // Draw letters
    letters.forEach((letter, letterIndex) => {
        letter.pattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === 1) {
                    const x = (letter.x + colIndex) * gridSize + gridSize / 2;
                    const y = (letter.y + rowIndex) * gridSize + gridSize / 2;
                    const seed = letterIndex * 1000 + rowIndex * 100 + colIndex * 10 + hour;
                    
                    deformSquare(x, y, squareSize, deformation, seed);
                }
            });
        });
    });
}

function updateTime() {
    const hour = parseFloat(slider.value);
    const hourInt = Math.floor(hour);
    const minutes = Math.floor((hour - hourInt) * 60);
    const period = hourInt >= 12 ? 'PM' : 'AM';
    const displayHour = hourInt === 0 ? 12 : hourInt > 12 ? hourInt - 12 : hourInt;
    
    timeDisplay.textContent = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    const deformation = getDeformation(hour);
    deformationLevel.textContent = `Deformation: ${Math.round(deformation * 100)}%`;
    
    drawGrid(hour);
}

slider.addEventListener('input', updateTime);

// Initial draw
updateTime();