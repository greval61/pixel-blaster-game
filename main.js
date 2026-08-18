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
});

