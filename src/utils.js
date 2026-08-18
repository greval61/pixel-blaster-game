// Hacer que las constantes y funciones estén disponibles globalmente
window.COLORS = {
  deepBlack: '#0D0D0D',
  spaceBlue: '#1A1A40',
  neonCyan: '#00E5FF',
  electricMagenta: '#FF00C8',
  laserYellow: '#FFE600',
  explosiveRed: '#FF3A3A',
  phosphoGreen: '#00FF7A',
  brightWhite: '#FFFFFF',
};
window.GAME_WIDTH = 480;
window.GAME_HEIGHT = 640;
window.WAVE_BG_COLORS = [
  '#0D0D0D',
  '#0D1020',
  '#101028',
  '#0A0A30',
  '#120820',
  '#0D1525',
  '#101030',
  '#150A20',
  '#0A1028',
  '#180818',
];
window.clamp = function(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
window.rand = function(min, max) {
  return Math.random() * (max - min) + min;
}
window.randInt = function(min, max) {
  return Math.floor(rand(min, max + 1));
}
window.dist = function(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
window.rectOverlap = function(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
window.circleRectOverlap = function(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  return dist(cx, cy, closestX, closestY) < cr;
}
