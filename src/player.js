// Usar variables globales

// Hacer que las clases estén disponibles globalmente
window.Bullet = class Bullet {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.w = 4;
    this.h = 6;
    this.size = 4;
    this.color = COLORS.neonCyan;
    this.fromPlayer = true;
    this.damage = 1;
    this.active = false;
  }

  fire(x, y, vy, fromPlayer, color, damage = 1, vx = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.color = color;
    this.damage = damage;
    this.size = fromPlayer ? 4 : 5;
    this.w = this.size;
    this.h = this.size + 2;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -10 || this.y > GAME_HEIGHT + 10 || this.x < -10 || this.x > GAME_WIDTH + 10) {
      this.active = false;
    }
  }

  getBounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }
}

window.BulletPool = class BulletPool {
  constructor(size = 100) {
    this.bullets = Array.from({ length: size }, () => new Bullet());
  }

  spawn(x, y, vy, fromPlayer, color, damage = 1, vx = 0) {
    const b = this.bullets.find(b => !b.active);
    if (b) b.fire(x, y, vy, fromPlayer, color, damage, vx);
    return b;
  }

  update(dt) {
    for (const b of this.bullets) b.update(dt);
  }

  getActive() {
    return this.bullets.filter(b => b.active);
  }

  clear() {
    for (const b of this.bullets) b.reset();
  }
}

window.Player = class Player {
  constructor() {
    this.w = 24;
    this.h = 24;
    this.x = GAME_WIDTH / 2 - this.w / 2;
    this.y = GAME_HEIGHT - this.h - 30;
    this.speed = 220;
    this.baseSpeed = 220;
    this.lives = 3;
    this.alive = true;
    this.invincible = 0;
    this.fireTimer = 0;
    this.fireRate = 0.15;
    this.engineFrame = 0;
    this.engineTimer = 0;
    this.doubleShot = false;
    this.doubleShotTimer = 0;
    this.shield = false;
    this.shieldTimer = 0;
    this.speedBoost = false;
    this.speedBoostTimer = 0;
    this.moving = false;
  }

  reset() {
    this.x = GAME_WIDTH / 2 - this.w / 2;
    this.y = GAME_HEIGHT - this.h - 30;
    this.lives = 3;
    this.alive = true;
    this.invincible = 0;
    this.fireTimer = 0;
    this.doubleShot = false;
    this.doubleShotTimer = 0;
    this.shield = false;
    this.shieldTimer = 0;
    this.speedBoost = false;
    this.speedBoostTimer = 0;
    this.speed = this.baseSpeed;
  }

  getBounds() {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
  }

  getCenter() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  update(dt, input) {
    if (!this.alive) return;

    if (this.invincible > 0) this.invincible -= dt;
    if (this.doubleShotTimer > 0) {
      this.doubleShotTimer -= dt;
      if (this.doubleShotTimer <= 0) this.doubleShot = false;
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) this.shield = false;
    }
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.speedBoost = false;
        this.speed = this.baseSpeed;
      }
    }

    const targetX = input.getTargetX();
    if (targetX !== null) {
      const center = this.x + this.w / 2;
      const diff = targetX - center;
      if (Math.abs(diff) > 2) {
        this.x += Math.sign(diff) * this.speed * dt;
      }
      this.moving = Math.abs(diff) > 2;
    } else {
      const dir = input.getMoveDirection();
      this.x += dir * this.speed * dt;
      this.moving = dir !== 0;
    }

    this.x = clamp(this.x, 0, GAME_WIDTH - this.w);

    this.engineTimer += dt;
    if (this.engineTimer > 0.08) {
      this.engineTimer = 0;
      this.engineFrame = (this.engineFrame + 1) % 3;
    }

    this.fireTimer -= dt;
  }

  canFire() {
    return this.alive && this.fireTimer <= 0;
  }

  onFire() {
    this.fireTimer = this.fireRate;
  }

  takeDamage() {
    if (this.invincible > 0 || !this.alive) return false;
    if (this.shield) {
      this.shield = false;
      this.shieldTimer = 0;
      this.invincible = 1;
      return false;
    }
    this.lives--;
    this.invincible = 2;
    if (this.lives <= 0) {
      this.alive = false;
    }
    return true;
  }

  applyPowerUp(type) {
    switch (type) {
      case 'double':
        this.doubleShot = true;
        this.doubleShotTimer = 10;
        break;
      case 'shield':
        this.shield = true;
        this.shieldTimer = 8;
        break;
      case 'speed':
        this.speedBoost = true;
        this.speedBoostTimer = 6;
        this.speed = this.baseSpeed * 1.6;
        break;
    }
  }

  draw(renderer) {
    if (!this.alive) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return;

    const sprites = renderer.sprites;
    renderer.drawSprite(sprites.player[this.engineFrame], this.x, this.y, this.w, this.h);

    if (this.shield) {
      const center = this.getCenter();
      renderer.drawShield(center.x, center.y, 20, 0.5 + Math.sin(Date.now() * 0.005) * 0.2);
    }
  }
}

window.PowerUp = class PowerUp {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vy = 60;
    this.type = 'double';
    this.w = 16;
    this.h = 16;
    this.active = false;
  }

  spawn(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.y += this.vy * dt;
    if (this.y > GAME_HEIGHT + 20) this.active = false;
  }

  getBounds() {
    return { x: this.x - 8, y: this.y - 8, w: 16, h: 16 };
  }
}

window.PowerUpManager = class PowerUpManager {
  constructor() {
    this.items = Array.from({ length: 10 }, () => new PowerUp());
    this.types = ['double', 'shield', 'speed'];
  }

  spawn(x, y) {
    const item = this.items.find(i => !i.active);
    if (!item) return;
    const type = this.types[Math.floor(Math.random() * this.types.length)];
    item.spawn(x, y, type);
  }

  update(dt) {
    for (const item of this.items) item.update(dt);
  }

  getActive() {
    return this.items.filter(i => i.active);
  }

  clear() {
    for (const item of this.items) item.reset();
  }
}

// Hacer que las funciones estén disponibles globalmente
window.checkPlayerEnemyCollision = function(player, enemy) {
  if (!player.alive || !enemy.alive) return false;
  return rectOverlap(player.getBounds(), enemy.getBounds());
}

window.checkBulletCollision = function(bullet, target) {
  if (!bullet.active || !target.alive) return false;
  return rectOverlap(bullet.getBounds(), target.getBounds());
}

window.checkPowerUpCollision = function(player, powerUp) {
  if (!powerUp.active || !player.alive) return false;
  return rectOverlap(player.getBounds(), powerUp.getBounds());
}
