// Usar variables globales

let _spriteCache = null;

function createOffscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawPlayerSprite(ctx, frame) {
  ctx.clearRect(0, 0, 24, 24);
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillRect(10, 2, 4, 4);
  ctx.fillRect(8, 6, 8, 4);
  ctx.fillRect(6, 10, 12, 6);
  ctx.fillRect(4, 16, 16, 4);
  ctx.fillStyle = COLORS.brightWhite;
  ctx.fillRect(11, 4, 2, 2);
  const flameH = frame === 0 ? 3 : frame === 1 ? 5 : 4;
  ctx.fillStyle = frame === 1 ? COLORS.laserYellow : COLORS.explosiveRed;
  ctx.fillRect(9, 20, 2, flameH);
  ctx.fillRect(13, 20, 2, flameH);
}

function drawDroneSprite(ctx) {
  ctx.clearRect(0, 0, 20, 20);
  ctx.fillStyle = COLORS.explosiveRed;
  ctx.fillRect(2, 6, 16, 8);
  ctx.fillRect(8, 2, 4, 4);
  ctx.fillStyle = COLORS.laserYellow;
  ctx.fillRect(4, 8, 3, 3);
  ctx.fillRect(13, 8, 3, 3);
  ctx.fillStyle = COLORS.brightWhite;
  ctx.fillRect(9, 4, 2, 2);
}

function drawInsectSprite(ctx) {
  ctx.clearRect(0, 0, 22, 22);
  ctx.fillStyle = COLORS.phosphoGreen;
  ctx.fillRect(8, 4, 6, 10);
  ctx.fillRect(2, 8, 6, 4);
  ctx.fillRect(14, 8, 6, 4);
  ctx.fillRect(6, 14, 4, 4);
  ctx.fillRect(12, 14, 4, 4);
  ctx.fillStyle = COLORS.electricMagenta;
  ctx.fillRect(9, 6, 2, 2);
  ctx.fillRect(11, 6, 2, 2);
  ctx.fillRect(4, 9, 2, 2);
  ctx.fillRect(16, 9, 2, 2);
}

function drawGhostSprite(ctx) {
  ctx.clearRect(0, 0, 20, 24);
  ctx.fillStyle = COLORS.electricMagenta;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(4, 2, 12, 14);
  ctx.fillRect(2, 8, 16, 8);
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(2 + i * 4, 16, 3, 6);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.brightWhite;
  ctx.fillRect(6, 6, 3, 3);
  ctx.fillRect(11, 6, 3, 3);
  ctx.fillStyle = COLORS.deepBlack;
  ctx.fillRect(7, 7, 1, 2);
  ctx.fillRect(12, 7, 1, 2);
}

function drawBossSprite(ctx) {
  ctx.clearRect(0, 0, 48, 48);
  ctx.fillStyle = COLORS.explosiveRed;
  ctx.fillRect(8, 8, 32, 28);
  ctx.fillRect(4, 16, 40, 12);
  ctx.fillRect(16, 4, 16, 8);
  ctx.fillStyle = COLORS.laserYellow;
  ctx.fillRect(10, 12, 8, 6);
  ctx.fillRect(30, 12, 8, 6);
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillRect(20, 16, 8, 8);
  ctx.fillStyle = COLORS.brightWhite;
  ctx.fillRect(12, 14, 4, 4);
  ctx.fillRect(32, 14, 4, 4);
  ctx.fillStyle = COLORS.electricMagenta;
  ctx.fillRect(18, 32, 4, 8);
  ctx.fillRect(26, 32, 4, 8);
}

function drawPowerUpSprite(ctx, type) {
  ctx.clearRect(0, 0, 16, 16);
  const colors = {
    double: COLORS.neonCyan,
    shield: COLORS.phosphoGreen,
    speed: COLORS.laserYellow,
  };
  ctx.fillStyle = colors[type] || COLORS.neonCyan;
  ctx.fillRect(2, 2, 12, 12);
  ctx.fillStyle = COLORS.brightWhite;
  if (type === 'double') {
    ctx.fillRect(4, 6, 3, 4);
    ctx.fillRect(9, 6, 3, 4);
  } else if (type === 'shield') {
    ctx.fillRect(6, 4, 4, 8);
    ctx.fillRect(4, 8, 8, 2);
  } else {
    ctx.fillRect(7, 3, 2, 10);
    ctx.fillRect(4, 6, 8, 2);
  }
}

// Hacer que las funciones estén disponibles globalmente
window.generateSprites = function() {
  if (_spriteCache) return _spriteCache;

  const player = [];
  for (let f = 0; f < 3; f++) {
    const c = createOffscreen(24, 24);
    drawPlayerSprite(c.getContext('2d'), f);
    player.push(c);
  }

  const drone = createOffscreen(20, 20);
  drawDroneSprite(drone.getContext('2d'));

  const insect = createOffscreen(22, 22);
  drawInsectSprite(insect.getContext('2d'));

  const ghost = createOffscreen(20, 24);
  drawGhostSprite(ghost.getContext('2d'));

  const boss = createOffscreen(48, 48);
  drawBossSprite(boss.getContext('2d'));

  const powerUps = {};
  for (const type of ['double', 'shield', 'speed']) {
    const c = createOffscreen(16, 16);
    drawPowerUpSprite(c.getContext('2d'), type);
    powerUps[type] = c;
  }

  _spriteCache = { player, drone, insect, ghost, boss, powerUps };
  return _spriteCache;
}

// Hacer que la clase Renderer esté disponible globalmente
window.Renderer = class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = generateSprites();
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.bgColor = COLORS.deepBlack;
    this.stars = this._initStars();
    this.nebulae = this._initNebulae();
  }

  _initStars() {
    const layers = [];
    for (let l = 0; l < 3; l++) {
      const stars = [];
      const count = 40 + l * 20;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * GAME_WIDTH,
          y: Math.random() * GAME_HEIGHT,
          size: l + 1,
          speed: 15 + l * 25,
          brightness: 0.3 + l * 0.25,
        });
      }
      layers.push(stars);
    }
    return layers;
  }

  _initNebulae() {
    return [
      { x: 80, y: 150, r: 60, color: COLORS.electricMagenta, alpha: 0.06 },
      { x: 350, y: 400, r: 80, color: COLORS.neonCyan, alpha: 0.05 },
      { x: 200, y: 500, r: 50, color: COLORS.phosphoGreen, alpha: 0.04 },
    ];
  }

  resize() {
    const aspect = GAME_WIDTH / GAME_HEIGHT;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let w, h;
    if (winW / winH > aspect) {
      h = winH;
      w = h * aspect;
    } else {
      w = winW;
      h = w / aspect;
    }
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  triggerShake(intensity = 8, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  setBgColor(color) {
    this.bgColor = color;
  }

  update(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    for (let l = 0; l < this.stars.length; l++) {
      for (const s of this.stars[l]) {
        s.y += s.speed * dt;
        if (s.y > GAME_HEIGHT) {
          s.y = 0;
          s.x = Math.random() * GAME_WIDTH;
        }
      }
    }
  }

  beginFrame() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);
    this._drawBackground(ctx);
  }

  endFrame() {
    this.ctx.restore();
  }

  _drawBackground(ctx) {
    for (const n of this.nebulae) {
      ctx.save();
      ctx.globalAlpha = n.alpha;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      ctx.restore();
    }

    for (let l = 0; l < this.stars.length; l++) {
      for (const s of this.stars[l]) {
        ctx.globalAlpha = s.brightness;
        ctx.fillStyle = l === 2 ? COLORS.brightWhite : COLORS.neonCyan;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawSprite(sprite, x, y, w, h, flipX = false) {
    const ctx = this.ctx;
    ctx.save();
    if (flipX) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, w, h);
    } else {
      ctx.drawImage(sprite, Math.floor(x), Math.floor(y), w, h);
    }
    ctx.restore();
  }

  drawBullet(bullet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = bullet.color;
    const s = bullet.size;
    ctx.fillRect(Math.floor(bullet.x - s / 2), Math.floor(bullet.y - s / 2), s, s);
    ctx.restore();
  }

  drawShield(x, y, radius, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS.phosphoGreen;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.phosphoGreen;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPowerUp(powerUp, sprites) {
    const sprite = sprites.powerUps[powerUp.type];
    if (sprite) {
      this.drawSprite(sprite, powerUp.x - 8, powerUp.y - 8, 16, 16);
    }
  }
}

window.updateLivesDisplay = function(lives) {
  const el = document.getElementById('lives-display');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    const icon = document.createElement('div');
    icon.className = 'life-icon';
    el.appendChild(icon);
  }
}

window.updateScoreDisplay = function(score) {
  const el = document.getElementById('score-display');
  if (el) el.textContent = score;
}

window.updateWaveDisplay = function(wave) {
  const el = document.getElementById('wave-display');
  if (el) el.textContent = wave;
}
