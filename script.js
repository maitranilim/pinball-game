// Game Constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

// Game Variables
let gameState = {
    isRunning: false,
    isAutoMode: false,
    score: 0,
    ballLaunched: false,
    ballInPlay: false
};

// Game Objects
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    vx: 0,
    vy: 0,
    radius: 5,
    friction: 0.99,
    gravity: 0.3
};

const leftFlipper = {
    x: CANVAS_WIDTH / 4,
    y: CANVAS_HEIGHT - 30,
    length: 60,
    width: 10,
    angle: -0.3,
    restAngle: -0.3,
    activeAngle: 0.3,
    isActive: false,
    rotationSpeed: 0.15
};

const rightFlipper = {
    x: (CANVAS_WIDTH * 3) / 4,
    y: CANVAS_HEIGHT - 30,
    length: 60,
    width: 10,
    angle: 0.3,
    restAngle: 0.3,
    activeAngle: -0.3,
    isActive: false,
    rotationSpeed: 0.15
};

const bumpers = [
    { x: 100, y: 100, radius: 20 },
    { x: 200, y: 80, radius: 20 },
    { x: 300, y: 100, radius: 20 },
    { x: 150, y: 200, radius: 20 },
    { x: 250, y: 200, radius: 20 },
    { x: 200, y: 320, radius: 20 }
];

const walls = [
    { x1: 10, y1: 0, x2: 10, y2: CANVAS_HEIGHT }, // left wall
    { x1: CANVAS_WIDTH - 10, y1: 0, x2: CANVAS_WIDTH - 10, y2: CANVAS_HEIGHT }, // right wall
    { x1: 10, y1: 10, x2: CANVAS_WIDTH - 10, y2: 10 } // top wall
];

// Key tracking
const keysPressed = {};

document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    
    if (gameState.isRunning && !gameState.isAutoMode) {
        if (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'a') {
            leftFlipper.isActive = true;
        }
        if (e.key.toLowerCase() === 'x' || e.key.toLowerCase() === 'd') {
            rightFlipper.isActive = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
    
    if (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'a') {
        leftFlipper.isActive = false;
    }
    if (e.key.toLowerCase() === 'x' || e.key.toLowerCase() === 'd') {
        rightFlipper.isActive = false;
    }
});

// Button event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('userModeBtn').addEventListener('click', setUserMode);
document.getElementById('autoModeBtn').addEventListener('click', setAutoMode);

function setUserMode() {
    if (!gameState.isRunning) {
        gameState.isAutoMode = false;
        document.getElementById('userModeBtn').classList.add('active');
        document.getElementById('autoModeBtn').classList.remove('active');
        document.getElementById('modeDisplay').textContent = 'User';
        document.getElementById('userControls').style.display = 'block';
        document.getElementById('autoControls').style.display = 'none';
    }
}

function setAutoMode() {
    if (!gameState.isRunning) {
        gameState.isAutoMode = true;
        document.getElementById('autoModeBtn').classList.add('active');
        document.getElementById('userModeBtn').classList.remove('active');
        document.getElementById('modeDisplay').textContent = 'Auto';
        document.getElementById('userControls').style.display = 'none';
        document.getElementById('autoControls').style.display = 'block';
    }
}

function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.score = 0;
        gameState.ballLaunched = false;
        gameState.ballInPlay = false;
        ball.x = CANVAS_WIDTH / 2;
        ball.y = CANVAS_HEIGHT - 80;
        ball.vx = 0;
        ball.vy = 0;
        document.getElementById('statusDisplay').textContent = 'Press SPACE to launch';
        gameLoop();
    }
}

function resetGame() {
    gameState.isRunning = false;
    gameState.score = 0;
    gameState.ballLaunched = false;
    gameState.ballInPlay = false;
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT - 80;
    ball.vx = 0;
    ball.vy = 0;
    leftFlipper.angle = leftFlipper.restAngle;
    rightFlipper.angle = rightFlipper.restAngle;
    document.getElementById('score').textContent = '0';
    document.getElementById('statusDisplay').textContent = 'Press START';
    drawGame();
}

function launchBall() {
    if (!gameState.ballLaunched) {
        gameState.ballLaunched = true;
        gameState.ballInPlay = true;
        ball.vx = (Math.random() - 0.5) * 4;
        ball.vy = -8;
        document.getElementById('statusDisplay').textContent = 'Playing...';
    }
}

function updateBall() {
    if (!gameState.ballInPlay) return;

    // Apply gravity
    ball.vy += ball.gravity;

    // Apply friction
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x - ball.radius < 10) {
        ball.x = 10 + ball.radius;
        ball.vx *= -0.8;
    }
    if (ball.x + ball.radius > CANVAS_WIDTH - 10) {
        ball.x = CANVAS_WIDTH - 10 - ball.radius;
        ball.vx *= -0.8;
    }
    if (ball.y - ball.radius < 10) {
        ball.y = 10 + ball.radius;
        ball.vy *= -0.8;
    }

    // Check if ball fell off
    if (ball.y > CANVAS_HEIGHT) {
        gameState.ballInPlay = false;
        gameState.ballLaunched = false;
        ball.x = CANVAS_WIDTH / 2;
        ball.y = CANVAS_HEIGHT - 80;
        ball.vx = 0;
        ball.vy = 0;
        document.getElementById('statusDisplay').textContent = 'Press SPACE to launch';
    }

    // Bumper collisions
    bumpers.forEach((bumper) => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + bumper.radius) {
            const angle = Math.atan2(dy, dx);
            ball.x = bumper.x + Math.cos(angle) * (ball.radius + bumper.radius);
            ball.y = bumper.y + Math.sin(angle) * (ball.radius + bumper.radius);
            ball.vx = Math.cos(angle) * 8;
            ball.vy = Math.sin(angle) * 8;
            gameState.score += 100;
            document.getElementById('score').textContent = gameState.score;
        }
    });

    // Flipper collisions
    checkFlipperCollision(leftFlipper);
    checkFlipperCollision(rightFlipper);
}

function checkFlipperCollision(flipper) {
    const flipperX2 = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const flipperY2 = flipper.y + Math.sin(flipper.angle) * flipper.length;

    const dx = flipperX2 - flipper.x;
    const dy = flipperY2 - flipper.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const udx = dx / len;
    const udy = dy / len;

    const ballX = ball.x - flipper.x;
    const ballY = ball.y - flipper.y;
    const proj = ballX * udx + ballY * udy;

    if (proj >= 0 && proj <= flipper.length) {
        const closestX = flipper.x + udx * proj;
        const closestY = flipper.y + udy * proj;

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < ball.radius + flipper.width) {
            const angle = Math.atan2(distY, distX);
            ball.x = closestX + Math.cos(angle) * (ball.radius + flipper.width);
            ball.y = closestY + Math.sin(angle) * (ball.radius + flipper.width);
            ball.vx = Math.cos(flipper.angle) * 10;
            ball.vy = Math.sin(flipper.angle) * 10;
            gameState.score += 50;
            document.getElementById('score').textContent = gameState.score;
        }
    }
}

function updateFlippers() {
    // Left flipper
    if (leftFlipper.isActive) {
        if (leftFlipper.angle < leftFlipper.activeAngle) {
            leftFlipper.angle += leftFlipper.rotationSpeed;
        }
    } else {
        if (leftFlipper.angle > leftFlipper.restAngle) {
            leftFlipper.angle -= leftFlipper.rotationSpeed;
        }
    }

    // Right flipper
    if (rightFlipper.isActive) {
        if (rightFlipper.angle > rightFlipper.activeAngle) {
            rightFlipper.angle -= rightFlipper.rotationSpeed;
        }
    } else {
        if (rightFlipper.angle < rightFlipper.restAngle) {
            rightFlipper.angle += rightFlipper.rotationSpeed;
        }
    }
}

function updateAutoMode() {
    if (!gameState.isAutoMode || !gameState.ballInPlay) return;

    // Simple AI: Move flippers towards the ball
    if (ball.x < CANVAS_WIDTH / 2) {
        leftFlipper.isActive = true;
        rightFlipper.isActive = false;
    } else {
        leftFlipper.isActive = false;
        rightFlipper.isActive = true;
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw walls
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    walls.forEach((wall) => {
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.stroke();
    });

    // Draw bumpers
    ctx.fillStyle = '#ff6b6b';
    bumpers.forEach((bumper) => {
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw flippers
    drawFlipper(leftFlipper, '#00ff00');
    drawFlipper(rightFlipper, '#0099ff');

    // Draw ball
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawFlipper(flipper, color) {
    const x2 = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const y2 = flipper.y + Math.sin(flipper.angle) * flipper.length;

    ctx.strokeStyle = color;
    ctx.lineWidth = flipper.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(flipper.x, flipper.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function gameLoop() {
    if (!gameState.isRunning) return;

    // Handle ball launch
    if (keysPressed[' '] && !gameState.ballInPlay) {
        launchBall();
    }

    updateBall();
    updateFlippers();
    updateAutoMode();

    drawGame();

    requestAnimationFrame(gameLoop);
}

// Initial draw
drawGame();
