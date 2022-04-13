const canvas = document.querySelector('canvas');
const scoreEl = document.getElementById('score');
const startEl = document.getElementById('start');
const gameOverScore = document.getElementById('go-score');
const c = canvas.getContext('2d');
const startGameEl = document.getElementById('startGame');

canvas.width = innerWidth;
canvas.height = innerHeight;

const CenterX = canvas.width / 2;
const CenterY = canvas.height / 2;
const bulletSpeed = 6;
const friction = 0.99;

var animationID;
var projectiles = [];
var enemies = [];
var particles = [];
var score = 0;
var isMobile = false;

if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    )
) {
    isMobile = true;
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}
const player = new Player(CenterX, CenterY, 15, 'white');

function initGame() {
    animationID;
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
}

function spawnEnemies() {
    let interval = isMobile ? 2800 : 1000;
    setInterval(() => {
        let x;
        let y;
        let randomRadius = 50 * Math.random();
        let radius = randomRadius < 10 ? 20 : randomRadius;

        if (Math.random() > 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const angle = Math.atan2(CenterY - y, CenterX - x);
        let color = `rgb(${Math.random() * 255},${Math.random() * 255},${
            Math.random() * 255
        })`;
        let random = Math.random() * 3;
        var enemySpeed = random < 2 ? 2 : random;
        const velocity = {
            x: Math.cos(angle) * enemySpeed,
            y: Math.sin(angle) * enemySpeed,
        };
        const enemy = new Enemy(x, y, radius, color, velocity);
        enemies.push(enemy);
    }, interval);
}
function animate() {
    console.log(particles.length);
    animationID = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, particleI) => {
        if (particle.alpha <= 0) {
            particles.splice(particleI, 1);
        } else {
            particle.update();
        }
    });
    projectiles.forEach((projectile, pIndex) => {
        projectile.update();
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            projectiles.splice(pIndex, 1);
        }
    });
    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        let dist = Math.hypot(CenterX - enemy.x, CenterY - enemy.y);
        if (dist - player.radius - enemy.radius < 1) {
            gameOverScore.innerText = score;
            startGameEl.style.display = 'flex';
            cancelAnimationFrame(animationID);
        }
        projectiles.forEach((projectile, pIndex) => {
            let dist = Math.hypot(
                projectile.x - enemy.x,
                projectile.y - enemy.y
            );
            if (dist - enemy.radius - projectile.radius < 0) {
                playHitSound();
                score += 10;
                scoreEl.innerText = score;

                for (let i = 0; i < enemy.radius * 0.5; i++) {
                    let velocity = {
                        x: (Math.random() - 0.5) * 5,
                        y: (Math.random() - 0.5) * 5,
                    };
                    let particle = new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 6,
                        enemy.color,
                        velocity
                    );
                    particles.push(particle);
                }

                if (enemy.radius - 15 > 10) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 10,
                    });
                    setTimeout(() => {
                        projectiles.splice(pIndex, 1);
                    }, 1);
                } else {
                    setTimeout(() => {
                        enemies.splice(eIndex, 1);
                        projectiles.splice(pIndex, 1);
                    }, 1);
                }
            }
        });
    });
}

function playHitSound() {
    let hit = new Audio('hit2.mp3');
    hit.volume = 0.01;
    hit.play();
}
start.addEventListener('click', () => {
    initGame();
    animate();
    spawnEnemies();
    startGameEl.style.display = 'none';
});

addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - CenterY, event.clientX - CenterX);

    const velocity = {
        x: Math.cos(angle) * bulletSpeed,
        y: Math.sin(angle) * bulletSpeed,
    };

    const projectile = new Projectile(CenterX, CenterY, 5, 'white', velocity);
    projectiles.push(projectile);
});
