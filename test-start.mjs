import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

await page.goto('http://localhost:3456/', { waitUntil: 'networkidle' });

const hasGame = await page.evaluate(() => !!window.__pixelBlaster);
const menuVisible = await page.evaluate(() => !document.getElementById('menu-screen').classList.contains('hidden'));

await page.click('#btn-start');
await page.waitForTimeout(500);

const after = await page.evaluate(() => ({
  state: window.__pixelBlaster?.state,
  running: window.__pixelBlaster?.running,
  menuHidden: document.getElementById('menu-screen').classList.contains('hidden'),
  hudVisible: !document.getElementById('hud').classList.contains('hidden'),
}));

console.log(JSON.stringify({ hasGame, menuVisible, after, errors }, null, 2));
await browser.close();
