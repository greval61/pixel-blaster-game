// Usar variables globales

// Hacer que la clase WaveManager esté disponible globalmente
window.WaveManager = class WaveManager {
  constructor(enemyPool) {
    this.enemyPool = enemyPool;
    this.wave = 0;
    this.spawning = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnDelay = 0.4;
    this.waveComplete = false;
    this.betweenWavesTimer = 0;
    this.betweenWavesDelay = 2;
    this.speedMult = 1;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.onWaveStart = null;
    this.onBossSpawn = null;
    this.onBossDefeat = null;
  }

  reset() {
    this.wave = 0;
    this.spawning = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveComplete = false;
    this.betweenWavesTimer = 0;
    this.speedMult = 1;
    this.bossSpawned = false;
    this.bossDefeated = false;
  }

  startNextWave() {
    this.wave++;
    this.waveComplete = false;
    this.bossDefeated = false;
    this.speedMult = 1 + (this.wave - 1) * 0.12;
    this.spawnDelay = Math.max(0.15, 0.5 - this.wave * 0.03);
    this.spawnQueue = this._buildWave(this.wave);
    this.spawning = true;
    this.spawnTimer = 0;

    if (this.onWaveStart) this.onWaveStart(this.wave);

    if (this.wave === 10 && !this.bossSpawned) {
      this.bossSpawned = true;
    }
  }

  _buildWave(wave) {
    const queue = [];

    if (wave === 10) {
      queue.push({ type: 'boss', x: GAME_WIDTH / 2 - 24, y: -60, isBoss: true });
      return queue;
    }

    const count = 4 + wave * 2;
    const types = this._getTypesForWave(wave);

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const cols = Math.min(6, Math.ceil(Math.sqrt(count)));
      const col = i % cols;
      const row = Math.floor(i / cols);
      const spacing = GAME_WIDTH / (cols + 1);
      queue.push({
        type,
        x: spacing * (col + 1) - ENEMY_TYPES[type].w / 2 + randInt(-10, 10),
        y: -40 - row * 35,
        isBoss: false,
      });
    }

    return queue;
  }

  _getTypesForWave(wave) {
    if (wave <= 2) return ['drone'];
    if (wave <= 5) return ['drone', 'insect'];
    if (wave <= 8) return ['drone', 'insect', 'ghost'];
    return ['insect', 'ghost', 'drone'];
  }

  update(dt) {
    if (this.betweenWavesTimer > 0) {
      this.betweenWavesTimer -= dt;
      if (this.betweenWavesTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    if (this.spawning) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        const entry = this.spawnQueue.shift();
        this.enemyPool.spawn(entry.type, entry.x, entry.y, this.speedMult, entry.isBoss);
        this.spawnTimer = this.spawnDelay;

        if (entry.isBoss && this.onBossSpawn) {
          this.onBossSpawn();
        }
      }

      if (this.spawnQueue.length === 0) {
        this.spawning = false;
      }
    }

    if (!this.spawning && this.enemyPool.countAlive() === 0) {
      if (!this.waveComplete) {
        this.waveComplete = true;
        this.betweenWavesTimer = this.betweenWavesDelay;
      }
    }
  }

  notifyBossDefeated() {
    this.bossDefeated = true;
    if (this.onBossDefeat) this.onBossDefeat();
  }

  isBossWave() {
    return this.wave === 10;
  }
}
