// Accessing and setting up the canvas for the paint
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// Player class
class Player {
  constructor(game) {
    this.game = game;
    this.width = 140;
    this.height = 120;
    this.x = this.game.width / 2 - this.width / 2;
    this.y = this.game.height * 0.98 - this.height;
    this.playerFrameX = 0;
    this.playerJetsFrameX = 1;
    this.energyUsed = 0;
    this.maxEnergy = 255;
    this.cooldown = 200;
    this.cooldownTimer = 0;
    this.health = 100;
    this.maxHealth = 100;
  }

  draw(deltaTime) {
    /* The laser beam energy level bar */
    let currentEnergy = Math.floor(this.maxEnergy - this.energyUsed);

    /* The laser beam energy level bar outline */
    context.save();
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "red  ";
    context.strokeRect(9, 39, this.maxEnergy + 2, 22);
    context.restore();

    /* The laser beam energy level */
    context.save();
    context.beginPath();
    context.fillStyle = `rgb(${this.energyUsed},${currentEnergy},${0})`;
    context.fillRect(10, 40, currentEnergy, 20);
    context.fill();
    context.restore();

    /* Checking key inputs for attack */
    if (this.game.keys.includes(" ")) {
      this.playerFrameX = 1;
    } else if (this.game.keys.includes("2") && currentEnergy > 0) {
      this.playerFrameX = 2;
      this.game.SmallLaser.activated = true;
      this.game.SmallLaser.update();
      this.energyUsed += 0.7;
    } else if (this.game.keys.includes("3") && currentEnergy > 0) {
      this.playerFrameX = 3;
      this.game.LargeLaser.activated = true;
      this.game.LargeLaser.update();
      this.energyUsed += 1;
    } else {
      if (this.cooldownTimer > this.cooldown && this.energyUsed > 0) {
        this.energyUsed -= 1;
        this.cooldownTimer = 0;
      }
      this.playerFrameX = 0;
      this.game.SmallLaser.activated = false;
      this.game.LargeLaser.activated = false;
      this.cooldownTimer += deltaTime;
    }

    // Drawing the player object
    context.beginPath();
    context.drawImage(
      this.game.playerImg,
      this.playerFrameX * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    context.drawImage(
      this.game.playerjetImg,
      this.playerJetsFrameX * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  shoot() {
    const projectile = this.game.getProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y);
    }
  }

  update(deltaTime) {
    if (
      (this.game.keys.includes("a") || this.game.keys.includes("ArrowLeft")) &&
      this.x > 0
    ) {
      this.x -= 3;
      this.playerJetsFrameX = 0;
    } else if (
      (this.game.keys.includes("d") || this.game.keys.includes("ArrowRight")) &&
      this.x < canvas.width - this.width
    ) {
      this.x += 3;
      this.playerJetsFrameX = 2;
    } else {
      this.playerJetsFrameX = 1;
    }
    this.draw(deltaTime);
  }
}

// Projectile class
class Projectile {
  constructor(game, entity) {
    this.game = game;
    this.entity = entity;
    this.width = 3;
    this.height = 15;
    this.damage = 1;
    this.x = this.game.player.x + this.game.player.width / 2 - this.width / 2;
    this.y = this.game.player.y - this.height;
    this.free = true;
    this.animationTimer = 0;
    this.animationInterval = 1;
    this.color = entity === "player" ? "gold" : "white"; // Default colors
    this.isGuided = false; // For guided projectiles
    this.speedX = 0; // Horizontal speed for angled projectiles
    this.targetAngle = 0; // Angle for guided projectiles
  }

  draw() {
    if (!this.free) {
      context.beginPath();
      context.save();
      context.fillStyle = this.color;
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
    }
  }

  update(dy) {
    if (!this.free) {
      if (this.isGuided) {
        // Custom movement for guided projectiles
        this.y -= dy * 0.7; // Slower vertical speed
        this.x += this.speedX; // Horizontal movement
      } else {
        this.y -= dy; // Standard movement
      }
      
      if (this.y < 0 - this.height) {
        this.reset();
      }

      if (this.y > this.game.height) {
        this.reset();
      }

      // Check for horizontal boundaries
      if (this.x < 0 || this.x > this.game.width) {
        this.reset();
      }

      // Call to the collision_mechanism
      if (this.entity == "player") collision_mechanism(this, this.game, true);
      else collision_mechanism(this, this.game, false);
    }
  }

  start(x, y) {
    this.x = x - this.width / 2;
    this.y = y - this.height;
    this.free = false;
  }

  reset() {
    this.free = true;
    // Reset color to default based on entity type
    this.color = this.entity === "player" ? "gold" : "white";
    // Reset custom properties
    this.isGuided = false;
    this.speedX = 0;
    this.targetAngle = 0;
    this.width = 3; // Reset to default width
    this.height = 15; // Reset to default height
    this.damage = 1; // Reset to default damage
  }
}

class Laser {
  constructor(game) {
    this.game = game;
    this.y = 0;
    this.height = canvas.height - this.game.player.height / 2;
    this.activated = false;
    this.animationInterval = 5;
    this.animationTimer = 0;
  }
  update() {
    if (this.activated) {
      this.x = this.game.player.x + this.game.player.width / 2 - this.width / 2;

      context.save();
      context.fillStyle = "gold";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
      context.save();
      context.fillStyle = "yellow";
      context.fillRect(
        this.x + this.width / 4,
        this.y,
        this.width / 2,
        this.height
      );
      context.restore();
      context.save();
      context.fillStyle = "white";
      context.fillRect(
        this.x + this.width / 2.75,
        this.y,
        this.width / 4,
        this.height
      );
      context.restore();

      this.animationTimer++;
      // Call to the collision_mechanism
      collision_mechanism(this, this.game, true);
    }
  }
}

class SmallLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 5;
    this.damage = 0.1;
  }
  update() {
    super.update();
  }
}

class LargeLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 20;
    this.damage = 0.2;
  }
  update() {
    super.update();
  }
}

class Invaders {
  constructor(game, x, y, frameY, grid_height) {
    this.game = game;
    this.width = 80;
    this.height = 80;
    this.x = x;
    this.pseudoy = y;
    this.y = this.pseudoy - grid_height;
    this.frameX = 0;
    this.frameY = frameY;
    this.animationTimer = 0;
    this.animationInterval = 10;
    this.image = "";
  }

  draw() {
    // context.beginPath();
    // context.strokeStyle = "white";
    // context.strokeRect(this.x, this.y, this.width, this.height);
    // context.stroke();
    context.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  update(dx, dy) {
    if (this.y < this.pseudoy) this.y += 0.5; // Provides the drive in look.
    this.x += dx;
    this.y += dy;
    this.draw();
  }

  shoot() {
    const projectile = this.game.getEnemyProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y + this.height);
    }
  }

  explode(invader) {
    const explosion = this.game.getexplosions();
    if (explosion) {
      explosion.start(
        this.x + this.width / 2,
        this.y + this.height / 2,
        invader
      );
    }
  }
}

class Beetlemorph extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 1;
    this.maxLives = 1;
    this.type = "beetlemorph";
  }
  create() {
    this.image = this.game.beetlemorph;
  }
}

class Rhinomorph extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 4;
    this.maxLives = 4;
    this.type = "rhinomorph";
  }
  create() {
    this.image = this.game.rhinomorph;
  }
  update(dx, dy) {
    super.update(dx, dy);
    this.frameX = Math.round(this.maxLives - this.lives);
  }
}

class ShooterEnemy extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 2;
    this.maxLives = 2;
    this.type = "shooter";
    this.shootInterval = 800; // Shoots more frequently
    this.shootTimer = 0;
    this.projectileColor = "red";
    this.canFireDouble = true; // Can fire two projectiles at once
    this.frameY = frameY;
  }
  
  create() {
    this.image = this.game.invaderImg;
  }
  
  update(dx, dy, deltaTime) {
    super.update(dx, dy);
    
    // Independent shooting mechanism
    this.shootTimer += deltaTime;
    if (this.shootTimer > this.shootInterval) {
      if (Math.random() < 0.6) { // 60% chance to shoot
        this.shoot();
      }
      this.shootTimer = 0;
    }
    
    // Animation based on health
    this.frameX = Math.round(this.maxLives - this.lives);
  }
  
  shoot() {
    // First projectile (straight down)
    const projectile1 = this.game.getEnemyProjectiles();
    if (projectile1) {
      projectile1.start(this.x + this.width / 2, this.y + this.height);
      projectile1.color = this.projectileColor;
      projectile1.width = 5; // Wider projectile
      projectile1.damage = 2; // More damage
    }
    
    // Second projectile (if enabled, with a slight delay)
    if (this.canFireDouble && Math.random() < 0.3) {
      setTimeout(() => {
        const projectile2 = this.game.getEnemyProjectiles();
        if (projectile2) {
          // Aim toward player's current position
          const targetX = this.game.player.x + this.game.player.width / 2;
          const angle = Math.atan2(this.game.player.y - this.y, targetX - this.x);
          
          projectile2.start(this.x + this.width / 2, this.y + this.height);
          projectile2.color = "orange";
          projectile2.width = 4;
          
          // Store the angle for custom movement
          projectile2.targetAngle = angle;
          projectile2.isGuided = true;
          projectile2.speedX = Math.cos(angle) * 2;
        }
      }, 200);
    }
  }
}

class ZigZagEnemy extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 3;
    this.maxLives = 3;
    this.type = "zigzag";
    this.zigzagAmplitude = 3; // How wide the zigzag is
    this.zigzagTimer = 0;
    this.zigzagInterval = 50; // How fast it zigzags
    this.zigzagDirection = 1;
    this.verticalMovement = true; // Also move vertically
    this.verticalAmplitude = 1.5;
    this.verticalDirection = 1;
    this.verticalTimer = 0;
    this.verticalInterval = 80;
    this.originalY = 0; // To track original position
  }
  
  create() {
    this.image = this.game.invaderImg;
    // Store original Y position when first created
    if (this.originalY === 0) {
      this.originalY = this.y;
    }
  }
  
  update(dx, dy, deltaTime) {
    if (this.y < this.pseudoy) this.y += 0.5; // Provides the drive in look.
    
    // Basic horizontal movement from grid
    this.x += dx;
    this.y += dy;
    
    // Store the position after grid movement updates
    if (this.originalY === 0) {
      this.originalY = this.y;
    }
    
    // Add zigzag horizontal movement
    this.zigzagTimer += deltaTime;
    if (this.zigzagTimer > this.zigzagInterval) {
      this.x += this.zigzagDirection * this.zigzagAmplitude;
      this.zigzagDirection *= -1; // Reverse direction
      this.zigzagTimer = 0;
    }
    
    // Add vertical oscillation
    if (this.verticalMovement) {
      this.verticalTimer += deltaTime;
      if (this.verticalTimer > this.verticalInterval) {
        this.y += this.verticalDirection * this.verticalAmplitude;
        
        // Keep vertical movement within bounds
        const maxOffset = 30; // Maximum vertical travel distance
        if (Math.abs(this.y - this.originalY) > maxOffset) {
          this.verticalDirection *= -1;
        }
        
        this.verticalTimer = 0;
      }
    }
    
    // Animation based on health
    this.frameX = Math.round(this.maxLives - this.lives);
    
    this.draw();
  }
}

// Bosses
class Boss extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.y = y + 80;
    this.game = game;
    this.height = 200;
    this.width = 200;
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.animationInterval = 1000;
    this.animationTimer = 0;
    this.type = "boss";
    this.maxLives = 50;
    this.lives = 50;
  }
  create() {
    this.image = this.game.bossImg;
  }
  draw() {
    super.draw();
    // boss life status
    context.save();
    context.fillStyle = "white";
    context.font = "1.5rem impact";
    context.fillText(
      `${Math.round(this.lives)}`,
      this.x + this.width / 2 - 12.5,
      this.y + this.height / 2 + 2.5
    );
    context.restore();
  }
  update(dx, dy, deltaTime) {
    super.update(dx, dy, deltaTime);
    if (this.y < 0 + 80) this.y += 0.5;
    if (this.animationTimer > this.animationInterval) {
      this.frameX++;
      this.animationTimer = 0;
      if (this.frameX > 1) {
        this.frameX = 0;
      }
    }
    this.animationTimer += deltaTime;
    this.draw();
  }
}

// Enemy Waves - Grids
class Grid {
  constructor(game) {
    this.dx = 0.8;
    this.dy = 0;
    this.game = game;
    this.rows = Math.floor(Math.random() * 2) + 2;
    this.columns = Math.floor(Math.random() * 2) + 2;
    this.invaderArray = [];
    this.invaderType = [Beetlemorph, Rhinomorph, ShooterEnemy, ZigZagEnemy];

    if (!this.game.bossActivated) {
      this.width = 80 * this.rows;
      this.height = 80 * this.columns;
      this.x = 0;
      this.y = -this.height;

      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.columns; j++) {
          let type =
            this.invaderType[
              Math.floor(Math.random() * this.invaderType.length)
            ];
          let frameY = Math.floor(Math.random() * 4);
          this.invaderArray.push(
            new type(this.game, i * 80, (j + 1) * 80, frameY, this.height)
          );
        }
      }
    } else {
      this.width = 200;
      this.height = 200;
      this.x = 0;
      this.y = -this.height - 80;
      let frameY = Math.floor(Math.random() * 4);
      this.invaderArray.push(
        new Boss(this.game, this.x, this.y, frameY, this.height)
      );
    }

    let shootInterval = setInterval(() => {
      this.invaderArray.forEach((invader) => {
        // Only use this generic shooting for non-shooter enemies
        if (invader.type !== "shooter" && Math.random() < 0.3) {
          invader.shoot();
        }
      });
    }, 1500);
  }

  update(deltaTime) {
    this.dy = 0;

    if (this.y < 0) {
      this.y += 0.5;
    }

    if (this.x < 0 || this.x > canvas.width - this.width) {
      this.dx = -this.dx;
      this.dy = 20;
    }

    this.y += this.dy;
    this.x += this.dx;

    this.invaderArray.forEach((invader) => {
      invader.update(this.dx, this.dy, deltaTime);
    });
  }

  destroy() {
    clearInterval(this.shootInterval);
  }
}

class Explosions {
  constructor(game) {
    this.game = game;
    this.imgwidth = 300;
    this.imgheight = 300;
    this.width = this.imgwidth * 0.7; // Scaling the image.
    this.height = this.imgheight * 0.7; // Scaling the image.
    this.x = undefined;
    this.y = undefined;
    this.free = true;
    this.frameX = 0;
    this.frameY = undefined;
    this.dx = undefined;
    this.dy = undefined;
    this.animationTimer = 0;
    this.animationInterval = 25;
  }

  draw() {
    if (!this.free) {
      context.beginPath();
      context.drawImage(
        this.game.explosionsImg,
        this.frameX * this.imgwidth,
        this.frameY * this.imgheight,
        this.imgwidth,
        this.imgheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  update(deltaTime) {
    if (!this.free) {
      this.draw();
      if (this.animationTimer > this.animationInterval) {
        if (this.frameX < 20) {
          this.frameX++;
        } else {
          this.frameX = 0;
          this.reset();
        }
        this.animationTimer = 0;
      } else {
        this.animationTimer += deltaTime;
      }
    }
  }

  start(x, y, invader) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.free = false;
    if (invader.type == "rhinomorph") {
      this.frameY = 0;
      // this.scale = 0.5;
    } else if (invader.type == "beetlemorph") {
      this.frameY = 1;
      // this.scale = 0.5;
    } else {
      // for the boss
      this.frameY = 2;
      // this.scale = 1;
    }
  }

  reset() {
    this.free = true;
  }
}

// Main Game class or the brain of the game
class Game {
  constructor() {
    this.width = canvas.width;
    this.height = canvas.height;

    /* Grid and invaders data */
    this.gridArray = [new Grid(this)];

    /* Boss's data */
    this.bossArray = [new Boss(this)];
    this.bossActivated = false;

    /* Image accessing section in the main game class */
    this.playerImg = document.querySelector("#player");
    this.playerjetImg = document.querySelector("#player_jets");
    this.beetlemorph = document.querySelector("#beetlemorph");
    this.rhinomorph = document.querySelector("#rhinomorph");
    this.explosionsImg = document.querySelector("#explosions");
    this.bossImg = document.querySelector("#boss");
    this.invaderImg = document.querySelector("#invader");

    this.keys = [];
    this.player = new Player(this);

    /* Projectile handling */
    this.projectileArray = [];
    this.enemyProjectileArray = [];

    for (let i = 0; i < 10; i++) {
      this.projectileArray.push(new Projectile(this, "player"));
    }

    for (let i = 0; i < 10; i++) {
      this.enemyProjectileArray.push(new Projectile(this, "enemy"));
    }

    /* Explosions handling */
    this.explosionsArray = [];
    for (let i = 0; i < 10; i++) {
      this.explosionsArray.push(new Explosions(this));
    }

    /* Laser handling */
    this.LargeLaser = new LargeLaser(this);
    this.SmallLaser = new SmallLaser(this);

    /* Score Handling */
    this.score = 0;
    this.waveCount = 1;

    /* Event Listeners */
    window.addEventListener("keydown", (e) => {
      if (this.keys.indexOf(e.key) === -1) {
        // -1 index is returned only when the element is not present
        this.keys.push(e.key);
      }
      if (e.key === " ") {
        this.player.shoot();
        console.log("true");
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.keys.indexOf(e.key) > -1)
        this.keys.splice(this.keys.indexOf(e.key), 1);
    });
  }

  getProjectiles() {
    for (let i = 0; i < 10; i++) {
      if (this.projectileArray[i].free) return this.projectileArray[i];
    }
  }

  getEnemyProjectiles() {
    for (let i = 0; i < 10; i++) {
      if (this.enemyProjectileArray[i].free)
        return this.enemyProjectileArray[i];
    }
  }

  getexplosions() {
    for (let i = 0; i < 10; i++) {
      if (this.explosionsArray[i].free) return this.explosionsArray[i];
    }
  }

  draw() {
    // Display score
    context.save();
    context.fillStyle = "white";
    context.font = "1.5rem impact";
    context.fillText(`SCORE:  ${this.score}`, 10, 25);
    
    // Display wave count
    context.fillText(`WAVE:  ${this.waveCount}`, 10, 60);
    
    // Display health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPercentage = this.player.health / this.player.maxHealth;
    
    // Health bar outline
    context.strokeStyle = "white";
    context.strokeRect(this.width - healthBarWidth - 20, 20, healthBarWidth, healthBarHeight);
    
    // Health bar fill
    context.fillStyle = `rgb(${255 - healthPercentage * 255}, ${healthPercentage * 255}, 0)`;
    context.fillRect(this.width - healthBarWidth - 20, 20, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Health text
    context.fillStyle = "white";
    context.fillText(`HEALTH: ${Math.round(this.player.health)}`, this.width - healthBarWidth - 20, 60);
    
    context.restore();
  }

  render(deltaTime) {
    this.draw();
    this.player.update(deltaTime);

    this.projectileArray.forEach((projectile) => {
      projectile.draw();
      projectile.update(8.5);
    });

    this.enemyProjectileArray.forEach((projectile) => {
      projectile.draw();
      projectile.update(-8.5);
    });

    this.explosionsArray.forEach((explosion) => {
      explosion.update(deltaTime);
    });
    this.gridArray.forEach((grid) => {
      if (grid.invaderArray.length == 0) {
        game.gridArray.splice(game.gridArray.indexOf(grid), 1);
      } else {
        grid.invaderArray.forEach((invader) => {
          invader.create();
        });
        grid.update(deltaTime);
      }
    });

    if (!this.gridArray[0]) {
      if (this.waveCount % 5 == 0) {
        // call to the boss function
        this.bossActivated = true;
      } else {
        this.bossActivated = false;
      }
      this.gridArray = [new Grid(this)];
      this.waveCount++;
    }
  }
}

// Object instantiation
const game = new Game();
let lastTime = 0;

// Animation loop
function animate(timeStamp) {
  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;
  requestAnimationFrame(animate);
  context.clearRect(0, 0, canvas.width, canvas.height);
  game.render(deltaTime);
}

animate(0); // Initial call for the animate function

// Collision mechanism
function collision_mechanism(object, game, player) {
  if (player) {
    game.gridArray.forEach((grid) => {
      grid.invaderArray.forEach((invader) => {
        if (
          object.y < invader.y + invader.height &&
          object.y + object.height > invader.y &&
          object.x + object.width > invader.x &&
          object.x < invader.x + invader.width
        ) {
          if (invader.lives <= object.damage) {
            invader.explode(invader);
            game.score += invader.maxLives;
            grid.invaderArray.splice(grid.invaderArray.indexOf(invader), 1);
          } else {
            if (object.animationTimer % object.animationInterval == 0) {
              invader.lives -= object.damage;
              object.animationTimer = 0;
            }
          }
          if (object.damage == 1) {
            object.reset();
          }
          return true;
        }
      });
    });
  } else {
    if (
      object.y < game.player.y + game.player.height &&
      object.y + object.height > game.player.y &&
      object.x + object.width > game.player.x &&
      object.x < game.player.x + game.player.width
    ) {
      // Player takes damage based on projectile damage value
      game.player.health -= object.damage;
      
      // Check if player is defeated
      if (game.player.health <= 0) {
        // Game over logic here
        console.log("Game Over");
      }
      
      if (object.damage >= 1) {
        object.reset();
      }
      return true;
    }
  }
}
