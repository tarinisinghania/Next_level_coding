const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('timeDisplay');
const deformationLevel = document.getElementById('deformationLevel');

canvas.width = 1500;
canvas.height = 800;

const gridSize = 25;
const squareSize = 20;

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

// Deformation logic
function getDeformation(hour) {
  if (hour < 6) return hour / 6 * 0.2;
  if (hour < 12) return 0.2 + (hour - 6) / 6 * 0.3;
  if (hour < 18) return 0.5 + (hour - 12) / 6 * 0.3;
  return 0.8 + (hour - 18) / 6 * 0.2;
}

// Restore *original deformation style*
function deformSquare(x, y, size, deformationFactor, seed) {
  const random = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const maxOffset = size * deformationFactor * 3.5;
  const maxRotation = Math.PI * deformationFactor * 0.8;
  const offsetX = (random(seed * 1.1) - 0.5) * maxOffset;
  const offsetY = (random(seed * 1.3) - 0.5) * maxOffset;
  const rotation = (random(seed * 1.7) - 0.5) * maxRotation;
  const scaleVar = 1 + deformationFactor * 1.5 + (random(seed * 1.9) - 0.5) * deformationFactor * 0.8;

  ctx.save();
  ctx.translate(x + offsetX, y + offsetY);
  ctx.rotate(rotation);

  if (deformationFactor > 0.5) {
    // blob-like shape when high deformation
    const points = 8;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = size / 1.5 * scaleVar * (0.8 + random(seed * (i + 2)) * 0.4);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // deformed square when low deformation
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
function getColorFromDeformation(deformation) {
  // deformation goes from 0 → 1
  const r = Math.round(255 * (1 - deformation));  // 255 → 0
  const g = 255;                                  // stays 255 for full brightness
  const b = Math.round(255 * (1 - deformation));  // 255 → 0
  return `rgb(${r}, ${g}, ${b})`;
}

// Draw grid + letters
function drawGrid(hour) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  const deformation = getDeformation(hour);
  ctx.fillStyle = getColorFromDeformation(deformation);

  letters.forEach((letter, letterIndex) => {
    letter.pattern.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 1) {
          const x = (letter.x + colIndex) * gridSize + gridSize / 2;
          const y = (letter.y + rowIndex) * gridSize + gridSize / 2;
          const seed = letterIndex * 1000 + rowIndex * 100 + colIndex * 10 + Math.floor(hour);
          deformSquare(x, y, squareSize, deformation, seed);
        }
      });
    });
  });
}

// Fetch time based on geolocation
async function fetchLocalTime(lat, lon) {
  try {
    const response = await fetch(`https://timeapi.io/api/Time/current/coordinate?latitude=${lat}&longitude=${lon}`);
    const data = await response.json();

    const currentTime = new Date(data.dateTime);
    const hour = currentTime.getHours() + currentTime.getMinutes() / 60;

    const deformation = getDeformation(hour);
    const displayHour = (hour % 12) || 12;
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const period = hour >= 12 ? 'PM' : 'AM';

    timeDisplay.textContent = `Local Time: ${displayHour}:${minutes} ${period}`;
    deformationLevel.textContent = `Molding: ${Math.round(deformation * 100)}%`;

    drawGrid(hour);
  } catch (err) {
    console.error("Time fetch error:", err);
    timeDisplay.textContent = "Error fetching time.";
  }
}

// Initialization
function init() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchLocalTime(latitude, longitude).then(() => {
          // Screenshot only after content is rendered
          takeScreenshot();

          // Repeat every 2 hours
          setInterval(takeScreenshot, 7200000);
        });

        setInterval(() => fetchLocalTime(latitude, longitude), 60000);
      },
      (err) => {
        console.error(err);
        timeDisplay.textContent = "Location access denied.";
      }
    );
  } else {
    timeDisplay.textContent = "Geolocation not supported.";
  }
}
function takeScreenshot() {
  html2canvas(document.body).then(canvas => {
    const link = document.createElement('a');
    link.download = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

init();
