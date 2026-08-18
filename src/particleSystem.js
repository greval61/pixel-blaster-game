// Usar variables globales

// Hacer que las clases estén disponibles globalmente
window.Particle = class Particle {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.size = 2;
    this.color = COLORS.neonCyan;
    this.gravity = 0;
    this.shrink = true;
    this.glow = false;
    this.active = false;
  }

  init(x, y, vx, vy, life, size, color, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.gravity = opts.gravity || 0;
    this.shrink = opts.shrink !== false;
    this.glow = opts.glow || false;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = this.life / this.maxLife;
    const s = this.shrink ? this.size * alpha : this.size;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.glow) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
    }
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.floor(this.x - s / 2), Math.floor(this.y - s / 2), Math.ceil(s), Math.ceil(s));
    ctx.restore();
  }
}

window.ParticleSystem = class ParticleSystem {
  constructor(maxParticles = 500) {
    this.pool = Array.from({ length: maxParticles }, () => new Particle());
  }

  _spawn() {
    return this.pool.find(p => !p.active) || null;
  }

  emit(x, y, count, opts = {}) {
    const {
      speedMin = 20, speedMax = 80,
      angleMin = 0, angleMax = Math.PI * 2,
      lifeMin = 0.3, lifeMax = 0.8,
      sizeMin = 1, sizeMax = 3,
      color = COLORS.neonCyan,
      gravity = 0,
      shrink = true,
      glow = false,
    } = opts;

    for (let i = 0; i < count; i++) {
      const p = this._spawn();
      if (!p) return;
      const angle = rand(angleMin, angleMax);
      const speed = rand(speedMin, speedMax);
      p.init(
        x + rand(-2, 2), y + rand(-2, 2),
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        rand(lifeMin, lifeMax),
        rand(sizeMin, sizeMax),
        color,
        { gravity, shrink, glow }
      );
    }
  }

  emitTrail(x, y, color) {
    const p = this._spawn();
    if (!p) return;
    p.init(x, y, rand(-10, 10), rand(20, 40), rand(0.15, 0.35), rand(1, 2), color, { glow: true });
  }

  emitExplosion(x, y, color, count = 20) {
    this.emit(x, y, count, {
      speedMin: 40, speedMax: 160,
      lifeMin: 0.3, lifeMax: 0.9,
      sizeMin: 2, sizeMax: 5,
      color,
      gravity: 30,
      glow: true,
    });
  }

  emitEngine(x, y, color) {
    this.emit(x, y, 1, {
      speedMin: 30, speedMax: 60,
      angleMin: Math.PI * 0.4, angleMax: Math.PI * 0.6,
      lifeMin: 0.1, lifeMax: 0.25,
      sizeMin: 1, sizeMax: 2,
      color,
      glow: true,
    });
  }

  update(dt) {
    for (const p of this.pool) p.update(dt);
  }

  draw(ctx) {
    for (const p of this.pool) p.draw(ctx);
  }

  clear() {
    for (const p of this.pool) p.reset();
  }
}

window.ExplosionEffect = class ExplosionEffect {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.maxRadius = 30;
    this.life = 0;
    this.maxLife = 0.4;
    this.color = COLORS.explosiveRed;
    this.flash = false;
  }

  trigger(x, y, maxRadius = 30, color = COLORS.explosiveRed) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = maxRadius;
    this.life = this.maxLife;
    this.color = color;
    this.flash = true;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    this.radius = this.maxRadius * (1 - this.life / this.maxLife);
    if (this.flash && this.life < this.maxLife * 0.7) this.flash = false;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = this.life / this.maxLife;

    if (this.flash) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = COLORS.brightWhite;
      ctx.fillRect(this.x - 8, this.y - 8, 16, 16);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = this.radius + (i % 2 === 0 ? 0 : 3);
      const px = this.x + Math.cos(angle) * r;
      const py = this.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
