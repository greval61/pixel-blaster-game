const Game = window.Game;

// Inicializar el juego cuando el DOM esté cargado
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);

  // Asignar el juego a una variable global para depuración
  window.__pixelBlaster = game;

  // Vincular el botón de sonido
  const btnSound = document.getElementById('btn-sound');
  if (btnSound) {
    const updateIcon = () => { btnSound.textContent = (game.sound && game.sound.muted) ? '🔇' : '🔊'; };
    updateIcon();
    btnSound.addEventListener('click', async () => {
      if (game.sound) {
        // ensure audio context is created/resumed after a user gesture
        await game.sound.resume();
        game.sound.toggleMute();
        updateIcon();
      }
    });
    // Do not auto-start music until user gesture (e.g., pressing JUGAR).
  }

  // Ensure starting the game resumes audio (required by some browsers)
  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      if (game.sound) {
        await game.sound.resume();
        if (!game.sound.muted) game.sound.playMusic();
      }
    });
  }
});

