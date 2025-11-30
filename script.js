// CYBER SPACE - Continuous Space Shooter Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Game State
const game = {
    isRunning: false,
    isPaused: false,
    score: 0,
    wave: 1,
    lives: 3,
    wave_kills: 0,
    wave_enemies_required: 5
};

// Player
const player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    width: 30,
    height: 30,
    speed: 5,
    shootCooldown: 0
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let explosions = [];

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
    if (e.key === 'p' || e.key === 'P') togglePause();
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button handlers
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);

function startGame() {
    if (!game.isRunning) {
        game.isRunning = true;
        game.isPaused = false;
        game.score = 0;
        game.wave = 1;
        game.lives = 3;
        bullets = [];
        enemies = [];
        explosions = [];
        spawnEnemyWave();
        updateHUD();
        gameLoop();
    }
}

function togglePause() {
    if (game.isRunning) {
        game.isPaused = !game.isPaused;
        document.getElementById('status').textContent = game.isPaused ? 'PAUSED' : 'PLAYING';
    }
}

function resetGame() {
    game.isRunning = false;
    game.isPaused = false;
    game.score = 0;
    game.wave = 1;
    game.lives = 3;
    bullets = [];
    enemies = [];
    explosions = [];
    player.x = CANVAS_WIDTH / 2;
    player.shootCooldown = 0;
    document.getElementById('status').textContent = 'READY';
    updateHUD();
    drawGame();
}

function updateHUD() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('wave').textContent = game.wave;
    document.getElementById('lives').textContent = game.lives;
}

function spawnEnemyWave() {
    enemies = [];
    const enemyCount = 3 + game.wave;
    const spacing = CANVAS_WIDTH / (enemyCount + 1);
    
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: spacing * (i + 1),
            y: 30 + Math.random() * 50,
            width: 20,
            height: 20,
            speed: 1 + game.wave * 0.3,
            shootChance: 0.02,
            health: 1
        });
    }
    game.wave_kills = 0;
}

function spawnEnemyBullets() {
    enemies.forEach(enemy => {
        if (Math.random() < enemy.shootChance) {
            bullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height,
                width: 5,
                height: 10,
                speed: 3,
                isPlayerBullet: false
            });
        }
    });
}

function updatePlayer() {
    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(0, player.x - player.speed);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    
    // Shooting
    player.shootCooldown--;
    if ((keys[' '] || keys['w'] || keys['W']) && player.shootCooldown <= 0) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 6,
            isPlayerBullet: true
        });
        player.shootCooldown = 5;
    }
}

function updateEnemies() {
    enemies.forEach((enemy, idx) => {
        // Move side to side
        enemy.x += Math.sin(Date.now() / 2000 + idx) * 0.5;
        
        // Shoot randomly
        if (Math.random() < enemy.shootChance) {
            spawnEnemyBullets();
        }
    });
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= (bullet.isPlayerBullet ? bullet.speed : -bullet.speed);
        return bullet.y > -10 && bullet.y < CANVAS_HEIGHT + 10;
    });
}

function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].isPlayerBullet) continue;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (collision(bullets[i], enemies[j])) {
                // Create explosion
                explosions.push({
                    x: enemies[j].x,
                    y: enemies[j].y,
                    radius: 15,
                    life: 15
                });
                
                game.score += 100;
                game.wave_kills++;
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].isPlayerBullet) continue;
        
        if (collision(bullets[i], player)) {
            game.lives--;
            bullets.splice(i, 1);
            explosions.push({
                x: player.x + player.width / 2,
                y: player.y,
                radius: 20,
                life: 15
            });
            
            if (game.lives <= 0) {
                game.isRunning = false;
                document.getElementById('status').textContent = 'GAME OVER';
            }
            break;
        }
    }
}

function collision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function updateExplosions() {
    explosions = explosions.filter(exp => {
        exp.life--;
        return exp.life > 0;
    });
}

function checkWaveComplete() {
    if (enemies.length === 0 && game.wave_kills > 0) {
        game.wave++;
        game.wave_enemies_required = 5 + game.wave * 2;
        spawnEnemyWave();
        document.getElementById('status').textContent = `WAVE ${game.wave}`;
    }
}

function drawGame() {
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
    }
    
    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
    
    // Draw bullets
    bullets.forEach(bullet => {
        if (bullet.isPlayerBullet) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
        } else {
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
        }
        ctx.shadowBlur = 5;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    ctx.shadowBlur = 0;
    
    // Draw enemies
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
    });
    ctx.shadowBlur = 0;
    
    // Draw explosions
    explosions.forEach(exp => {
        const alpha = exp.life / 15;
        ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
        ctx.shadowColor = `rgba(255, 165, 0, ${alpha})`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!game.isRunning) {
        drawGame();
        return;
    }
    
    if (!game.isPaused) {
        updatePlayer();
        updateEnemies();
        updateBullets();
        checkCollisions();
        updateExplosions();
        checkWaveComplete();
        updateHUD();
    }
    
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
resetGame();
