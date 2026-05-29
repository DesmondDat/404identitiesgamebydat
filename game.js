// ============================================
// DIGITAL DEFENDER - Arcade Action Game
// ============================================

let gameState = {
    wave: 1,
    score: 0,
    lives: 3,
    health: 100,
    gameOver: false,
    paused: false,
    highScore: localStorage.getItem('digitalDefenderHighScore') ? parseInt(localStorage.getItem('digitalDefenderHighScore')) : 0
};

class Player {
    constructor() {
        this.x = 400;
        this.y = 550;
        this.size = 15;
        this.speed = 5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.bullets = [];
        this.fireRate = 0;
    }

    handleInput() {
        this.velocityX = 0;
        this.velocityY = 0;

        if (keyIsDown(87) || keyIsDown(UP_ARROW)) this.velocityY = -this.speed; // W or UP
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) this.velocityY = this.speed;  // S or DOWN
        if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) this.velocityX = -this.speed; // A or LEFT
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) this.velocityX = this.speed; // D or RIGHT

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep in bounds
        this.x = constrain(this.x, this.size, 800 - this.size);
        this.y = constrain(this.y, this.size, 600 - this.size);
    }

    shoot() {
        this.fireRate--;
        if (this.fireRate <= 0 && mouseIsPressed) {
            const angle = atan2(mouseY - this.y, mouseX - this.x);
            this.bullets.push(new Bullet(this.x, this.y, angle));
            this.fireRate = 5; // Fire rate delay
        }
    }

    display() {
        fill(0, 255, 255);
        stroke(0, 255, 255);
        strokeWeight(2);
        triangle(
            this.x, this.y - this.size,
            this.x - this.size, this.y + this.size,
            this.x + this.size, this.y + this.size
        );

        // Draw aim line
        stroke(0, 255, 255, 100);
        strokeWeight(1);
        const angle = atan2(mouseY - this.y, mouseX - this.x);
        const endX = this.x + cos(angle) * 100;
        const endY = this.y + sin(angle) * 100;
        line(this.x, this.y, endX, endY);
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            this.bullets[i].display();

            // Remove if out of bounds
            if (this.bullets[i].x < 0 || this.bullets[i].x > 800 || 
                this.bullets[i].y < 0 || this.bullets[i].y > 600) {
                this.bullets.splice(i, 1);
            }
        }
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 7;
        this.size = 4;
        this.vx = cos(angle) * this.speed;
        this.vy = sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    display() {
        fill(255, 255, 0);
        noStroke();
        circle(this.x, this.y, this.size);
    }

    hits(enemy) {
        const dist = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
        return dist < this.size + enemy.size;
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'basic' ? 12 : 18;
        this.speed = type === 'basic' ? 2 : 1.5;
        this.health = type === 'basic' ? 1 : 3;
        this.maxHealth = this.health;
        this.color = type === 'basic' ? [255, 50, 100] : [200, 50, 255];
        this.angle = 0;
    }

    update(playerX, playerY) {
        // Move toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.angle = atan2(dy, dx);
        }
    }

    display() {
        fill(...this.color);
        stroke(...this.color);
        strokeWeight(2);

        // Draw enemy shape
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        rect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        // Draw health bar
        pop();
        fill(255, 100, 0);
        const healthPercent = this.health / this.maxHealth;
        rect(this.x - this.size, this.y - this.size - 8, this.size * 2 * healthPercent, 4);
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class Wave {
    constructor(waveNumber) {
        this.waveNumber = waveNumber;
        this.enemies = [];
        this.generateEnemies();
    }

    generateEnemies() {
        const basicCount = 3 + this.waveNumber * 2;
        const bossCount = Math.floor(this.waveNumber / 3);

        for (let i = 0; i < basicCount; i++) {
            const x = Math.random() * 700 + 50;
            const y = Math.random() * 150 + 50;
            this.enemies.push(new Enemy(x, y, 'basic'));
        }

        for (let i = 0; i < bossCount; i++) {
            const x = Math.random() * 700 + 50;
            const y = Math.random() * 100 + 20;
            this.enemies.push(new Enemy(x, y, 'boss'));
        }
    }

    isComplete() {
        return this.enemies.length === 0;
    }
}

let player;
let wave;
let nextWaveTimer = 0;

function setup() {
    createCanvas(800, 600);
    player = new Player();
    wave = new Wave(gameState.wave);
}

function draw() {
    background(0);
    
    if (gameState.gameOver) {
        fill(255, 0, 255);
        textSize(40);
        textAlign(CENTER);
        text('SYSTEM FAILURE', 400, 300);
        return;
    }

    // Draw starfield background
    drawStarfield();

    // Update player
    player.handleInput();
    player.shoot();
    player.display();
    player.updateBullets();

    // Update enemies
    for (let i = wave.enemies.length - 1; i >= 0; i--) {
        const enemy = wave.enemies[i];
        enemy.update(player.x, player.y);
        enemy.display();

        // Check collision with bullets
        for (let j = player.bullets.length - 1; j >= 0; j--) {
            if (player.bullets[j].hits(enemy)) {
                if (enemy.takeDamage()) {
                    gameState.score += enemy.type === 'basic' ? 100 : 500;
                    wave.enemies.splice(i, 1);
                }
                player.bullets.splice(j, 1);
                break;
            }
        }

        // Check collision with player
        const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
        if (dist < enemy.size + player.size) {
            gameState.lives--;
            enemy.x = Math.random() * 700 + 50;
            enemy.y = Math.random() * 100 + 20;
            
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
            }
        }
    }

    // Wave complete - next wave
    if (wave.isComplete()) {
        nextWaveTimer--;
        if (nextWaveTimer <= 0) {
            gameState.wave++;
            gameState.health = Math.min(100, gameState.health + 20);
            wave = new Wave(gameState.wave);
            nextWaveTimer = 60;
        }
    }

    // Game over condition
    if (gameState.gameOver) {
        // Update high score if current score is higher
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('digitalDefenderHighScore', gameState.highScore);
        }
        showGameOver();
    }

    // Update UI
    updateUI();
}

function drawStarfield() {
    randomSeed(42); // Static seed for consistent starfield
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() * 800 + frameCount * 0.5) % 800;
        const y = Math.random() * 600;
        fill(200, 200, 255, 150);
        noStroke();
        point(x, y);
    }
}

function updateUI() {
    const waveDisplay = document.getElementById('waveDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    
    if (waveDisplay) waveDisplay.textContent = gameState.wave;
    if (livesDisplay) livesDisplay.textContent = gameState.lives;
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    if (highScoreDisplay) highScoreDisplay.textContent = gameState.highScore;
}

function showGameOver() {
    const gameOverDiv = document.getElementById('gameOver');
    const finalScore = document.getElementById('finalScore');
    const wavesSurvived = document.getElementById('wavesSurvived');
    const highScoreFinal = document.getElementById('highScoreFinal');
    
    finalScore.textContent = gameState.score;
    wavesSurvived.textContent = gameState.wave;
    highScoreFinal.textContent = gameState.highScore;
    
    gameOverDiv.classList.add('show');
}

function restartGame() {
    gameState = {
        wave: 1,
        score: 0,
        lives: 3,
        health: 100,
        gameOver: false,
        paused: false,
        highScore: gameState.highScore
    };
    
    player = new Player();
    wave = new Wave(gameState.wave);
    document.getElementById('gameOver').classList.remove('show');
    loop();
}

document.getElementById('restartBtn').addEventListener('click', restartGame);
