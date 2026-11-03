// Shared props + stage setup for the Ultima scenes.
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSummit } from './summit.js';
export { THREE, guard };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);

/** Text on a canvas -> texture (any aspect). */
export function textTex(text, { w = 512, h = 256, bg = '#ffffff', fg = '#111', font = 'bold 150px Arial Black, Arial, sans-serif', border = null, bgAlpha = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  if (border) { x.strokeStyle = border; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = parseInt(font.match(/(\d+)px/)[1]);
  while (x.measureText(text).width > w * 0.9 && size > 20) { size -= 6; x.font = font.replace(/\d+px/, size + 'px'); }
  x.fillText(text, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Flat sign plane with text, facing +z. */
export function sign(parent, text, w, h, pos, opts = {}, rot = [0, 0, 0]) {
  const tex = textTex(text, { w: 512, h: Math.round(512 * h / w), ...opts });
  return add(parent, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }), pos, rot);
}

/** Silicon wafer: round disc, chip-grid top, flat notch. Faces +z when stood up (rotation.x = PI/2 lays it flat). */
export function wafer(r = 0.4, { label = null, tint = '#7f8fb8' } = {}) {
  const g = new THREE.Group(), N = 1024;
  const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
  const grad = x.createRadialGradient(N * .35, N * .3, 40, N / 2, N / 2, N / 2);
  grad.addColorStop(0, '#c9d4f2'); grad.addColorStop(1, tint); x.fillStyle = grad; x.fillRect(0, 0, N, N);
  const cell = N / 18;
  for (let i = 0; i < 18; i++) for (let j = 0; j < 18; j++) {
    const cx = (i + .5) * cell - N / 2, cy = (j + .5) * cell - N / 2;
    if (Math.hypot(Math.abs(cx) + cell / 2, Math.abs(cy) + cell / 2) > N * 0.46) continue;
    x.fillStyle = ['#3f5aa8', '#4f6dc0', '#5a3f9e', '#3b8fb0'][(i * 3 + j * 5) % 4];
    x.fillRect(i * cell + 4, j * cell + 4, cell - 8, cell - 8);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(i * cell + 8, j * cell + 8, cell - 22, 5);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const top = new THREE.MeshStandardMaterial({ map: t, metalness: 0.45, roughness: 0.28 });
  const side = mat('#aab4cc', { metalness: 0.6, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.07, 64), side, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CircleGeometry(r * 0.985, 64), top, [0, 0, r * 0.036]);
  add(g, new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * 0.045, 64), mat('#e8edf8', { metalness: .5, roughness: .25 }), [0, 0, -r * 0.01], [Math.PI / 2, 0, 0]).scale.set(1, 1, 1);
  if (label) sign(g, label, r * 1.1, r * 0.5, [0, -r * 0.05, r * 0.045], { bg: 'rgba(255,255,255,0)', fg: '#fff', bgAlpha: true });
  return g;
}

export function coin(r = 0.07) {
  const g = new THREE.Group(), gold = mat('#ffc928', { metalness: 0.7, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.22, 28), gold);
  add(g, new THREE.TorusGeometry(r * 0.78, r * 0.07, 8, 28), mat('#e29a10', { metalness: .6, roughness: .35 }), [0, r * 0.12, 0], [Math.PI / 2, 0, 0]);
  return g;
}

export function palm(h = 2) {
  const g = new THREE.Group(), bark = mat('#a47845'), leaf = mat('#2f9a47');
  for (let i = 0; i < 8; i++) add(g, new THREE.CylinderGeometry(h * .035 * (1 - i * .02), h * .04, h / 8 * 1.1, 10), bark, [Math.sin(i * .25) * h * 0.04, (i + .5) * h / 8, 0], [0, 0, -0.07 * i * 0.2]);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, f = new THREE.Group(); f.position.set(0.05 * h, h, 0); f.rotation.y = a; g.add(f);
    const l = add(f, new THREE.ConeGeometry(h * .08, h * .5, 6), leaf, [h * .22, -h * .06, 0], [0, 0, -Math.PI / 2 - 0.5], [1, 1, 0.25]);
  }
  return g;
}

export function flask(h = 0.5, color = '#38e0a0') {
  const g = new THREE.Group(), glass = new THREE.MeshStandardMaterial({ color: '#dff6ff', transparent: true, opacity: 0.4, roughness: 0.1, side: THREE.DoubleSide });
  const P = (a) => a.map(([x, y]) => new THREE.Vector2(x * h, y * h));
  add(g, new THREE.LatheGeometry(P([[0.001, 0], [0.4, 0], [0.42, 0.04], [0.14, 0.62], [0.11, 0.7], [0.11, 0.98], [0.14, 1.0]]), 32), glass);
  add(g, new THREE.LatheGeometry(P([[0.001, 0.01], [0.385, 0.01], [0.4, 0.045], [0.29, 0.26], [0.001, 0.26]]), 32), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
  return g;
}

/** Double-helix DNA, y up. */
export function dna(h = 1.2, r = 0.12) {
  const g = new THREE.Group(), n = 28, a = mat('#ff5a8a'), b = mat('#35a7ff');
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = t * h, ang = t * Math.PI * 4;
    const p1 = [Math.cos(ang) * r, y, Math.sin(ang) * r], p2 = [-p1[0], y, -p1[2]];
    blob(g, a, p1, [0.032, 0.032, 0.032]); blob(g, b, p2, [0.032, 0.032, 0.032]);
    if (i % 2 === 0) { const rung = add(g, new THREE.CylinderGeometry(0.012, 0.012, r * 2, 8), mat(['#ffd34a', '#7ee081'][i / 2 % 2]), [0, y, 0], [0, 0, 0]); rung.rotation.z = Math.PI / 2; rung.rotation.y = -ang; rung.rotation.order = 'YXZ'; }
  }
  return g;
}

export function solarPanel(w = 1.3, h = 0.85) {
  const g = new THREE.Group(), N = 512;
  const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
  x.fillStyle = '#0f2a6e'; x.fillRect(0, 0, N, N);
  const gl = x.createLinearGradient(0, 0, N, N); gl.addColorStop(0, '#2f67d0'); gl.addColorStop(1, '#16409a');
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.fillStyle = gl; x.fillRect(i * N / 6 + 5, j * N / 4 + 5, N / 6 - 10, N / 4 - 10); }
  x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.moveTo(0, N * .5); x.lineTo(N * .5, 0); x.lineTo(N * .7, 0); x.lineTo(0, N * .75); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  add(g, new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.05), mat('#d7dce6', { metalness: .5, roughness: .4 }));
  add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, metalness: .4, roughness: .25 }), [0, 0, 0.027]);
  return g;
}

export function sun(r = 0.5) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffd23a', toneMapped: false });
  add(g, new THREE.SphereGeometry(r, 32, 20), m);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(g, new THREE.ConeGeometry(r * .13, r * .5, 8), m, [Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4, 0], [0, 0, a - Math.PI / 2]); }
  return g;
}

/** Standard stage: meadow (or custom ground colour), summit, toonified, clouds. */
export function build({ ground = '#6fae45', sky = {}, el = 35, az = 150, fov = 40, summit = {}, clouds = true, stageOpts = {} } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.6, fog: { near: 120, far: 1500 }, ...stageOpts,
  });
  const scene = stage.scene;
  const g = add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const s = createSummit({ scale: summit.scale ?? 1.6 });
  s.position.set(...(summit.pos ?? [0, 0, 0])); s.rotation.y = summit.ry ?? 0; scene.add(s);
  return { stage, scene, s, num, P, ground: g, finish() {
    const pm = new Set(); s.traverse((o) => pm.add(o));
    stage.toonify(scene, (m) => pm.has(m));
    if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.finish();
  } };
}
export function cam(stage, num, pos, look) {
  stage.camera.position.set(num('cx', pos[0]), num('cy', pos[1]), num('cz', pos[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
}

/** Point summit's arm at a WORLD position. */
export function reachW(s, key, p) {
  s.updateMatrixWorld(true); const l = s.worldToLocal(new THREE.Vector3(...p)); s.userData.reach(key, [l.x, l.y, l.z]);
}
/** Simple chunky climber (faces +z), ~1.3 tall. bib text on chest. */
export function climber({ bib = 'UG 100', scale = 1 } = {}) {
  const g = new THREE.Group(), jacket = mat('#2f7fe0'), skin = mat('#ffe0c0'), pants = mat('#34405a');
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.08, 0.075, 0.5, 14), pants, [s * 0.1, 0.34, 0]);
    blob(g, mat('#c8483c'), [s * 0.1, 0.07, 0.04], [0.095, 0.07, 0.14]);
  }
  blob(g, jacket, [0, 0.82, 0], [0.3, 0.38, 0.22]);
  blob(g, mat('#e9573f'), [0, 0.86, -0.2], [0.22, 0.3, 0.12]);               // backpack
  blob(g, skin, [0, 1.38, 0], [0.26, 0.26, 0.25]);                           // head
  add(g, new THREE.SphereGeometry(0.28, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffb21e'), [0, 1.42, -0.01]);  // helmet
  for (const s of [-1, 1]) {
    blob(g, mat('#0b1022'), [s * 0.095, 1.37, 0.235], [0.042, 0.06, 0.02]);
    blob(g, mat('#fff'), [s * 0.085, 1.395, 0.25], [0.014, 0.014, 0.01]);
    blob(g, mat('#ff7f8f'), [s * 0.16, 1.29, 0.22], [0.045, 0.025, 0.015]);
    const arm = add(g, new THREE.CylinderGeometry(0.055, 0.05, 0.42, 12), jacket, [s * 0.36, 0.82, 0.05], [0, 0, s * 0.4]);
    blob(g, skin, [s * 0.46, 0.62, 0.08], [0.065, 0.065, 0.065]);
  }
  sign(g, bib, 0.42, 0.26, [0, 0.85, 0.225], { bg: '#ffffff', fg: '#d6202a', border: '#d6202a', font: 'bold 170px Arial Black, Arial' });
  g.scale.setScalar(scale); return g;
}
