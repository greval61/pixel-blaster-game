// Eliminar imports y usar variables globales

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.muted = (localStorage.getItem('pixelBlasterMuted') === 'true');
    this.masterGain = null;

    // simple synthesized ambient pad as fallback background music
    this.padOsc = null;
    this.padGain = null;
    this.musicPlaying = false;
    this._padTimer = null;
  }

  _createContext() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
      return;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0.0001 : 1.0; // avoid zero for exponential ramps
    this.masterGain.connect(this.ctx.destination);
    this._initMusicFallback();
  }

  _beep(freq, duration, type = 'square', volume = 0.08) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    // ramp down to a tiny value instead of zero to avoid exponential errors
    const minVal = 0.0001;
    gain.gain.exponentialRampToValueAtTime(minVal, now + Math.max(duration, 0.02));
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(now + duration + 0.02);
  }

  _initMusicFallback() {
    if (!this.ctx) return;
    if (this.padOsc) return;
    this.padOsc = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    this.padOsc.type = 'sine';
    this.padOsc.frequency.value = 110;
    this.padGain.gain.value = 0.00001; // near silent
    this.padOsc.connect(this.padGain);
    this.padGain.connect(this.masterGain);
    this.padOsc.start();

    // gentle periodic modulation
    this._padTimer = setInterval(() => {
      if (!this.padOsc || !this.padGain) return;
      const now = this.ctx.currentTime;
      const targetFreq = 80 + Math.random() * 240;
      this.padOsc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.5);
      this.padGain.gain.cancelScheduledValues(now);
      if (this.muted) {
        this.padGain.gain.setValueAtTime(0.00001, now);
      } else {
        this.padGain.gain.setValueAtTime(0.008, now);
        this.padGain.gain.exponentialRampToValueAtTime(0.016, now + 0.8);
        this.padGain.gain.exponentialRampToValueAtTime(0.008, now + 2.0);
      }
    }, 1800);
  }

  resume() {
    if (!this.ctx) this._createContext();
    if (this.ctx && this.ctx.state === 'suspended') return this.ctx.resume();
    return Promise.resolve();
  }

  playMusic() {
    if (!this.ctx) return;
    this.musicPlaying = true;
    const now = this.ctx.currentTime;
    if (this.padGain) this.padGain.gain.setValueAtTime(this.muted ? 0.00001 : 0.008, now);
  }

  stopMusic() {
    if (!this.ctx) return;
    this.musicPlaying = false;
    const now = this.ctx.currentTime;
    if (this.padGain) this.padGain.gain.setValueAtTime(0.00001, now);
  }

  setMuted(val) {
    this.muted = !!val;
    localStorage.setItem('pixelBlasterMuted', this.muted ? 'true' : 'false');
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // adjust master gain; avoid exact zero to prevent exponential ramp errors
    const target = this.muted ? 0.0001 : 1.0;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || target, now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.05);

    if (this.muted) this.stopMusic(); else this.playMusic();
  }

  toggleMute() { this.setMuted(!this.muted); }

  shoot() { this._beep(880, 0.05, 'square', 0.04); }
  enemyShoot() { this._beep(220, 0.08, 'sawtooth', 0.03); }
  explosion() { this._beep(110, 0.15, 'sawtooth', 0.06); }
  powerUp() { this._beep(660, 0.1, 'square', 0.05); this._beep(880, 0.1, 'square', 0.05); }
  playerHit() { this._beep(150, 0.2, 'sawtooth', 0.08); }
  bossDefeat() {
    this._beep(440, 0.15, 'square', 0.06);
    setTimeout(() => this._beep(550, 0.15, 'square', 0.06), 150);
    setTimeout(() => this._beep(660, 0.3, 'square', 0.08), 300);
  }
  waveStart() { this._beep(330, 0.1, 'triangle', 0.05); }
}

// Hacer que la clase Game esté disponible globalmente
window.Game = class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.particles = new ParticleSystem();
    this.explosions = [];
    this.player = new Player();
    this.bullets = new BulletPool();
    this.enemies = new EnemyPool();
    this.powerUps = new PowerUpManager();
    this.waveManager = new WaveManager(this.enemies);
    this.sound = new SoundManager();

    this.state = 'menu';
    this.score = 0;
    this.lastTime = 0;
    this.running = false;

    this._setupWaveCallbacks();
    this._bindUI();
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());
  }

  _setupWaveCallbacks() {
    this.waveManager.onWaveStart = (wave) => {
      this.sound.waveStart();
      const bgIndex = Math.min(wave - 1, WAVE_BG_COLORS.length - 1);
      this.renderer.setBgColor(WAVE_BG_COLORS[bgIndex]);
      updateWaveDisplay(wave);
    };

    this.waveManager.onBossSpawn = () => {
      this.renderer.setBgColor('#180818');
    };

    this.waveManager.onBossDefeat = () => {
      this.sound.bossDefeat();
      this.renderer.triggerShake(12, 0.8);
    };
  }

  _bindUI() {
    document.getElementById('btn-start').addEventListener('click', () => this.start());
    document.getElementById('btn-resume').addEventListener('click', () => this.resume());
    document.getElementById('btn-restart').addEventListener('click', () => this.restart());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restart());
    document.getElementById('btn-pause-mobile').addEventListener('click', () => this.togglePause());
  }

  _showScreen(id) {
    ['menu-screen', 'pause-screen', 'gameover-screen'].forEach(s => {
      document.getElementById(s).classList.add('hidden');
    });
    if (id) document.getElementById(id).classList.remove('hidden');
  }

  _setHUD(visible) {
    document.getElementById('hud').classList.toggle('hidden', !visible);
    document.getElementById('btn-pause-mobile').classList.toggle('hidden', !visible);
    document.getElementById('btn-fire-mobile').classList.toggle('hidden', !visible);
  }

  start() {
    this.sound.resume();
    this._resetGame();
    this.state = 'playing';
    this._showScreen(null);
    this._setHUD(true);
    this.waveManager.startNextWave();
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this._loop(t));
    }
  }

  restart() {
    this._resetGame();
    this.state = 'playing';
    this._showScreen(null);
    this._setHUD(true);
    this.waveManager.startNextWave();
  }

  _resetGame() {
    this.score = 0;
    this.player.reset();
    this.bullets.clear();
    this.enemies.clear();
    this.powerUps.clear();
    this.particles.clear();
    this.explosions = [];
    this.waveManager.reset();
    this.renderer.setBgColor(WAVE_BG_COLORS[0]);
    updateScoreDisplay(0);
    updateWaveDisplay(0);
    updateLivesDisplay(this.player.lives);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._showScreen('pause-screen');
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  resume() {
    this.state = 'playing';
    this._showScreen(null);
    this.lastTime = performance.now();
  }

  gameOver() {
    this.state = 'gameover';
    this._setHUD(false);
    this._showScreen('gameover-screen');
    document.getElementById('final-score').textContent = `Puntuación: ${this.score}`;
  }

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (this.state === 'playing') {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this._loop(t));
  }

  update(dt) {
    this.input.update(dt);
    if (this.input.consumePause()) this.togglePause();

    this.renderer.update(dt);
    this.player.update(dt, this.input);
    this._handlePlayerFire();
    this.bullets.update(dt);
    this.enemies.update(dt, this.waveManager.wave);
    this.waveManager.update(dt);
    this.powerUps.update(dt);
    this.particles.update(dt);

    for (const exp of this.explosions) exp.update(dt);
    this.explosions = this.explosions.filter(e => e.active);

    this._checkCollisions();
    this._handleEnemyFire();
    this._emitTrails(dt);

    updateLivesDisplay(this.player.lives);
    updateScoreDisplay(this.score);

    if (!this.player.alive) {
      this.gameOver();
    }
  }

  _handlePlayerFire() {
    if (!this.player.canFire() || !this.input.isFireDown()) return;

    const center = this.player.getCenter();
    this.bullets.spawn(center.x, center.y - 10, -400, true, COLORS.neonCyan);

    if (this.player.doubleShot) {
      this.bullets.spawn(center.x - 10, center.y - 5, -400, true, COLORS.electricMagenta);
      this.bullets.spawn(center.x + 10, center.y - 5, -400, true, COLORS.electricMagenta);
    }

    this.player.onFire();
    this.sound.shoot();
  }

  _handleEnemyFire() {
    for (const enemy of this.enemies.getActive()) {
      if (!enemy.canFire()) continue;
      const c = enemy.getCenter();
      this.bullets.spawn(c.x, c.y + enemy.h / 2, 200, false, COLORS.explosiveRed);
      enemy.onFire();
      this.sound.enemyShoot();

      if (enemy.isBoss) {
        for (let i = -1; i <= 1; i++) {
          this.bullets.spawn(c.x + i * 20, c.y + enemy.h / 2, 180, false, COLORS.laserYellow, 1, i * 40);
        }
      }
    }
  }

  _emitTrails(dt) {
    if (this.player.moving && this.player.alive) {
      const c = this.player.getCenter();
      this.particles.emitEngine(c.x, c.y + 14, COLORS.laserYellow);
    }

    for (const b of this.bullets.getActive()) {
      if (Math.random() < 0.3) {
        this.particles.emitTrail(b.x, b.y, b.color);
      }
    }
  }

  _checkCollisions() {
    const activeBullets = this.bullets.getActive();

    for (const bullet of activeBullets) {
      if (bullet.fromPlayer) {
        for (const enemy of this.enemies.getActive()) {
          if (checkBulletCollision(bullet, enemy)) {
            bullet.active = false;
            if (enemy.takeDamage(bullet.damage)) {
              this._onEnemyDestroyed(enemy);
            } else {
              this.particles.emit(enemy.getCenter().x, enemy.getCenter().y, 3, {
                speedMin: 10, speedMax: 30, lifeMin: 0.1, lifeMax: 0.2,
                color: enemy.color, glow: true,
              });
            }
            break;
          }
        }
      } else if (this.player.alive) {
        if (checkBulletCollision(bullet, this.player)) {
          bullet.active = false;
          if (this.player.takeDamage()) {
            this.sound.playerHit();
            this._spawnExplosion(this.player.getCenter().x, this.player.getCenter().y, 20, COLORS.neonCyan);
          }
        }
      }
    }

    if (this.player.alive) {
      for (const enemy of this.enemies.getActive()) {
        if (checkPlayerEnemyCollision(this.player, enemy)) {
          if (this.player.takeDamage()) {
            this.sound.playerHit();
            this._onEnemyDestroyed(enemy);
            this._spawnExplosion(this.player.getCenter().x, this.player.getCenter().y, 20, COLORS.neonCyan);
          }
        }
      }

      for (const pu of this.powerUps.getActive()) {
        if (checkPowerUpCollision(this.player, pu)) {
          pu.active = false;
          this.player.applyPowerUp(pu.type);
          this.sound.powerUp();
          this.particles.emit(pu.x, pu.y, 10, {
            speedMin: 20, speedMax: 60, color: COLORS.phosphoGreen, glow: true,
          });
        }
      }
    }
  }

  _onEnemyDestroyed(enemy) {
    const c = enemy.getCenter();
    this.score += enemy.score;
    this.sound.explosion();
    this._spawnExplosion(c.x, c.y, enemy.isBoss ? 50 : 25, enemy.color);
    this.particles.emitExplosion(c.x, c.y, enemy.color, enemy.isBoss ? 40 : 20);

    if (Math.random() < 0.15 && !enemy.isBoss) {
      this.powerUps.spawn(c.x, c.y);
    }

    if (enemy.isBoss) {
      this.waveManager.notifyBossDefeated();
    }
  }

  _spawnExplosion(x, y, radius, color) {
    const exp = new ExplosionEffect();
    exp.trigger(x, y, radius, color);
    this.explosions.push(exp);
  }

  render() {
    this.renderer.beginFrame();

    for (const enemy of this.enemies.getAllActive()) {
      enemy.draw(this.renderer);
    }

    for (const pu of this.powerUps.getActive()) {
      this.renderer.drawPowerUp(pu, this.renderer.sprites);
    }

    for (const b of this.bullets.getActive()) {
      this.renderer.drawBullet(b);
    }

    this.player.draw(this.renderer);
    this.particles.draw(this.renderer.ctx);

    for (const exp of this.explosions) {
      exp.draw(this.renderer.ctx);
    }

    this.renderer.endFrame();
  }
}
