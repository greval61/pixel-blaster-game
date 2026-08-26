// Usar variables globales

// Hacer que la clase InputManager esté disponible globalmente
window.InputManager = class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.touchActive = false;
    this.touchX = GAME_WIDTH / 2;
    this.firePressed = false;
    this.pausePressed = false;
    this._pauseCooldown = 0;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('touchstart', (e) => this._onTouch(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._onTouch(e), { passive: false });
    canvas.addEventListener('touchend', () => { this.touchActive = false; });
    canvas.addEventListener('touchcancel', () => { this.touchActive = false; });

    const fireBtn = document.getElementById('btn-fire-mobile');
    if (fireBtn) {
      fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.firePressed = true; });
      fireBtn.addEventListener('touchend', () => { this.firePressed = false; });
    }
  }

  _onTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    this.touchX = (touch.clientX - rect.left) * scaleX;
    this.touchActive = true;
  }

  update(dt) {
    if (this._pauseCooldown > 0) this._pauseCooldown -= dt;
    if (this.isPauseDown() && this._pauseCooldown <= 0) {
      this.pausePressed = true;
      this._pauseCooldown = 0.3;
    } else if (!this.isPauseDown()) {
      this.pausePressed = false;
    }
  }

  consumePause() {
    if (this.pausePressed) {
      this.pausePressed = false;
      return true;
    }
    return false;
  }

  isPauseDown() {
    return this.keys['KeyP'] || this.keys['Escape'];
  }

  getMoveDirection() {
    let dir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) dir -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) dir += 1;
    return dir;
  }

  getTargetX() {
    if (this.touchActive) return this.touchX;
    return null;
  }

  isMoving() {
    return this.getMoveDirection() !== 0 || this.touchActive;
  }

  isFireDown() {
    return this.keys['Space'] || this.firePressed;
  }
}
