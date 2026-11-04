// Render a Three.js scene page headlessly to PNG.
// Usage: node render.mjs <scene.html> <out.png> [--w 1280] [--h 720] [--ss 2] [--q key=val ...]
// Run with NODE_PATH pointing at a node_modules holding three + playwright-core.
// Pages load from a fake origin; jsdelivr three URLs are served from local node_modules,
// so the same HTML also opens unchanged in a normal browser.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.env.NODE_PATH ?? '.', 'x.js'));
const { chromium } = require('playwright-core');
const THREE_DIR = path.join(process.env.NODE_PATH ?? 'node_modules', 'three');
const SCENE_DIR = path.dirname(new URL(import.meta.url).pathname);
const ORIGIN = 'http://scene.local/';
const CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)$/;
const CHROME = path.join(process.env.HOME,
  'Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' };

function parseArgs(argv) {
  const [scene, out, ...rest] = argv;
  const opts = { scene, out, w: 1280, h: 720, ss: 2, q: [] };
  for (let i = 0; i < rest.length; i += 2) {
    const k = rest[i].replace(/^--/, '');
    opts[k] = k === 'q' ? [...opts.q, rest[i + 1]] : Number(rest[i + 1]);
  }
  return opts;
}

async function serve(route, file) {
  const body = await readFile(file);
  await route.fulfill({ body, contentType: MIME[path.extname(file)] ?? 'application/octet-stream' });
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.ss });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error(`[page ${m.type()}]`, m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.route(CDN, (r) => serve(r, path.join(THREE_DIR, r.request().url().match(CDN)[1])));
  await page.route(`${ORIGIN}**`, (r) => serve(r, path.join(SCENE_DIR, new URL(r.request().url()).pathname)));
  const query = o.q.length ? `?${o.q.join('&')}` : '';
  const t0 = Date.now();
  await page.goto(`${ORIGIN}${o.scene}${query}`);
  await page.waitForFunction(() => window.__ready === true || window.__error, null, { timeout: 600_000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  console.error(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s; gl: ${await page.evaluate(() => window.__gl)}`);
  await page.locator('canvas').screenshot({ path: o.out });
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
