// Usar variables globales

const ENEMY_TYPES = {
  drone: {
    w: 20, h: 20,
    hp: 1,
    score: 100,
    speed: 60,
    pattern: 'straight',
    color: COLORS.explosiveRed,
    sprite: 'drone',
    fireRate: 0,
  },
  insect: {
    w: 22, h: 22,
    hp: 2,
    score: 200,
    speed: 45,
    pattern: 'zigzag',
    color: COLORS.phosphoGreen,
    sprite: 'insect',
    fireRate: 2.5,
  },
  ghost: {
    w: 20, h: 24,
    hp: 1,
    score: 150,
    speed: 50,
    pattern: 'wave',
    color: COLORS.electricMagenta,
    sprite: 'ghost',
    fireRate: 3,
  },
};

// Hacer que las clases estén disponibles globalmente
window.Enemy = class Enemy {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.type = 'drone';
    this.x = 0;
    this.y = 0;
    this.w = 20;
    this.h = 20;
    this.hp = 1;
    this.maxHp = 1;
    this.score = 100;
    this.speed = 60;
    this.pattern = 'straight';
    this.color = COLORS.explosiveRed;
    this.spriteKey = 'drone';
    this.alive = false;
    this.active = false;
    this.phase = 0;
    this.startX = 0;
    this.fireTimer = rand(1, 3);
    this.fireRate = 0;
    this.vx = 0;
    this.isBoss = false;
    this.bossPhase = 0;
    this.bossTimer = 0;
  }

  spawn(type, x, y, speedMult = 1, isBoss = false) {
    const cfg = isBoss ? this._bossConfig() : ENEMY_TYPES[type];
    if (!cfg && !isBoss) return;

    this.type = isBoss ? 'boss' : type;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.w = cfg.w;
    this.h = cfg.h;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.score = cfg.score;
    this.speed = cfg.speed * speedMult;
    this.pattern = cfg.pattern;
    this.color = cfg.color;
    this.spriteKey = cfg.sprite;
    this.fireRate = cfg.fireRate || 0;
    this.fireTimer = rand(1, 3);
    this.phase = rand(0, Math.PI * 2);
    this.alive = true;
    this.active = true;
    this.isBoss = isBoss;
    this.bossPhase = 0;
    this.bossTimer = 0;
    this.vx = 0;
  }

  _bossConfig() {
    return {
      w: 48, h: 48,
      hp: 30,
      score: 5000,
      speed: 40,
      pattern: 'boss',
      color: COLORS.explosiveRed,
      sprite: 'boss',
      fireRate: 1.2,
    };
  }

  getBounds() {
    const pad = this.isBoss ? 4 : 2;
    return { x: this.x + pad, y: this.y + pad, w: this.w - pad * 2, h: this.h - pad * 2 };
  }

  getCenter() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
      this.active = false;
      return true;
    }
    return false;
  }

  update(dt, wave) {
    if (!this.alive) return;

    this.phase += dt;

    switch (this.pattern) {
      case 'straight':
        this.y += this.speed * dt;
        break;
      case 'zigzag':
        this.y += this.speed * dt;
        this.x = this.startX + Math.sin(this.phase * 3) * 60;
        break;
      case 'wave':
        this.y += this.speed * dt;
        this.x = this.startX + Math.sin(this.phase * 2) * 80;
        break;
      case 'boss':
        this._updateBoss(dt);
        break;
    }

    this.x = clamp(this.x, 0, GAME_WIDTH - this.w);

    if (this.y > GAME_HEIGHT + 40) {
      this.alive = false;
      this.active = false;
    }

    if (this.fireRate > 0) {
      this.fireTimer -= dt;
    }
  }

  _updateBoss(dt) {
    this.bossTimer += dt;
    this.y += Math.sin(this.bossTimer * 0.5) * 30 * dt;

    switch (this.bossPhase) {
      case 0:
        this.x = GAME_WIDTH / 2 - this.w / 2 + Math.sin(this.bossTimer) * 100;
        if (this.bossTimer > 3) { this.bossPhase = 1; this.bossTimer = 0; }
        break;
      case 1:
        this.x += Math.sin(this.bossTimer * 4) * 120 * dt;
        if (this.bossTimer > 4) { this.bossPhase = 2; this.bossTimer = 0; }
        break;
      case 2:
        this.x = this.startX + Math.sin(this.bossTimer * 2) * 150;
        if (this.bossTimer > 5) { this.bossPhase = 0; this.bossTimer = 0; this.startX = this.x; }
        break;
    }
    this.x = clamp(this.x, 0, GAME_WIDTH - this.w);
  }

  canFire() {
    return this.alive && this.fireRate > 0 && this.fireTimer <= 0;
  }

  onFire() {
    this.fireTimer = this.fireRate;
  }

  draw(renderer) {
    if (!this.alive) return;
    const sprite = renderer.sprites[this.spriteKey];
    if (sprite) {
      renderer.drawSprite(sprite, this.x, this.y, this.w, this.h);
    }

    if (this.isBoss) {
      const ctx = renderer.ctx;
      const barW = 40;
      const barH = 4;
      const bx = this.x + this.w / 2 - barW / 2;
      const by = this.y - 10;
      ctx.fillStyle = COLORS.deepBlack;
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = COLORS.explosiveRed;
      ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    }
  }
}

window.EnemyPool = class EnemyPool {
  constructor(size = 60) {
    this.enemies = Array.from({ length: size }, () => new Enemy());
  }

  spawn(type, x, y, speedMult, isBoss = false) {
    const e = this.enemies.find(e => !e.active);
    if (e) e.spawn(type, x, y, speedMult, isBoss);
    return e;
  }

  update(dt, wave) {
    for (const e of this.enemies) {
      if (e.active) e.update(dt, wave);
    }
  }

  getActive() {
    return this.enemies.filter(e => e.active && e.alive);
  }

  getAllActive() {
    return this.enemies.filter(e => e.active);
  }

  countAlive() {
    return this.getActive().length;
  }

  clear() {
    for (const e of this.enemies) e.reset();
  }

  hasBoss() {
    return this.enemies.some(e => e.active && e.isBoss && e.alive);
  }
}

// Hacer que las constantes estén disponibles globalmente
window.ENEMY_TYPES = ENEMY_TYPES;
