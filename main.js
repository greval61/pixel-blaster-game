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
    btnSound.addEventListener('click', () => {
      if (game.sound) {
        game.sound.toggleMute();
        updateIcon();
      }
    });
    // start music according to saved state
    if (game.sound && !game.sound.muted) game.sound.playMusic();
  }
});

