// Shared helpers for the remix_therapeutics scenes: materials, mesh helpers, stage, kitchen, text sprites, small props.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createMixer } from './mixer.js';

export { THREE, createMixer };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Canvas text plane. opts: { w, h, bg, fg, font, px } ; returns a Mesh sized w x h world units. */
export function textPlane(text, { w = 1, h = 0.4, bg = '#ffffff', fg = '#222', font = 'bold', px = 0.7, border = null } = {}) {
  const W = 1024, H = Math.round(1024 * h / w);
  const tex = canvasTexture(W, (ctx) => {}, {}); // placeholder to keep kit import used
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 16; ctx.strokeRect(8, 8, W - 16, H - 16); }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${font} ${Math.round(H * px)}px "Arial Black", Arial, sans-serif`;
  ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, transparent: !bg, alphaTest: bg ? 0 : 0.05 }));
  m.castShadow = m.receiveShadow = true; return m;
}

/** Sunny kitchen: stage + tiled floor + warm back wall + counter. Returns { stage, scene, P, num, finishScene }. */
export function kitchenStage(opts = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: num('el', 40), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: 1.5, seed: 5, towerTop: 0.5, puffCover: 1.5 },
    rim: { color: '#fff3dc', strength: 1.2, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#fff0e0', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.5, fog: null, ...opts.stage,
  });
  const scene = stage.scene;
  const tiles = canvasTexture(512, (ctx, s) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff6e6' : '#f2c9a0'; ctx.fillRect(i * s / 8, j * s / 8, s / 8, s / 8); }
  }, { repeat: 6 });
  add(scene, new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.5 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  if (!opts.noWall) {
    add(scene, new THREE.PlaneGeometry(40, 12), mat(opts.wall ?? '#ffe3a8'), [0, 6, -2.6]);
    box(scene, mat('#fff8ee'), [0, 0.07, -2.58], [40, 0.14, 0.05]);
  }
  return { stage, scene, P, num };
}

export function frame(stage, num, d = {}) {
  stage.camera.position.set(num('cx', d.cx ?? 0), num('cy', d.cy ?? 0.8), num('cz', d.cz ?? 3.3));
  stage.camera.lookAt(num('tx', d.tx ?? 0), num('ty', d.ty ?? 0.6), num('tz', d.tz ?? 0));
  stage.finish();
}

/** Finish: toonify everything outside the character predicate set. */
export function toon(stage, scene, chars) {
  const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
  stage.toonify(scene, (m) => pm.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [187, 1000, 120, 1.6]]);
}

// ---- small props ----
export function nose({ s = 1 } = {}) {
  const g = new THREE.Group(), skin = mat('#ffc4a0');
  blob(g, skin, [0, 0, 0], [0.34 * s, 0.5 * s, 0.3 * s]);                       // bridge/body
  blob(g, skin, [0, -0.3 * s, 0.12 * s], [0.28 * s, 0.2 * s, 0.22 * s]);         // ball
  for (const sx of [-1, 1]) {
    blob(g, skin, [sx * 0.2 * s, -0.36 * s, 0.05 * s], [0.12 * s, 0.1 * s, 0.12 * s]);
    blob(g, mat('#5a2a22'), [sx * 0.08 * s, -0.42 * s, 0.22 * s], [0.1 * s, 0.075 * s, 0.06 * s]);
  }
  return g;
}
export function tank({ s = 1 } = {}) {
  const g = new THREE.Group(), steel = mat('#4da3d8', { metalness: 0.2 });
  cyl(g, steel, [0, 0.9 * s, 0], 0.7 * s, 1.5 * s);
  blob(g, steel, [0, 1.65 * s, 0], [0.7 * s, 0.35 * s, 0.7 * s]);
  for (const y of [0.4, 1.0, 1.5]) add(g, new THREE.TorusGeometry(0.71 * s, 0.03 * s, 8, 40), mat('#2a6a9a'), [0, y * s, 0], [Math.PI / 2, 0, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, mat('#556'), [sx * 0.45 * s, 0.1 * s, sz * 0.45 * s], 0.05 * s, 0.4 * s);
  return g;
}
export function drop(parent, pos, s = 1, color = '#58b8ff') {
  const g = new THREE.Group(); blob(g, mat(color, { roughness: 0.2 }), [0, 0, 0], [0.08 * s, 0.08 * s, 0.08 * s]);
  add(g, new THREE.ConeGeometry(0.08 * s, 0.14 * s, 20), mat(color, { roughness: 0.2 }), [0, 0.1 * s, 0]);
  g.position.set(...pos); parent.add(g); return g;
}
/** Wavy RNA ribbon along x: returns Group. segments of two-tone like a ladder-less strip. */
export function ribbon({ len = 1.6, color = '#7ad07a', amp = 0.1, phase = 0, w = 0.07, bases = true } = {}) {
  const g = new THREE.Group(), n = 60;
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector3((t - 0.5) * len, Math.sin(t * Math.PI * 4 + phase) * amp, 0)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, w, 10), mat(color, { roughness: 0.4 }));
  if (bases) for (let i = 2; i < n; i += 4) { const p = pts[i]; blob(g, mat(['#ff7a8a', '#ffd23c', '#6ac0ff', '#b48aff'][(i / 4 | 0) % 4]), [p.x, p.y - w * 1.8, 0], [w * 0.8, w * 0.8, w * 0.8]); }
  return g;
}
export function bib({ s = 1, label = null } = {}) {
  const g = new THREE.Group(), cloth = mat('#fff5d6');
  const sh = new THREE.Shape(); sh.moveTo(-0.3, 0.35); sh.lineTo(0.3, 0.35); sh.lineTo(0.3, -0.05); sh.quadraticCurveTo(0.3, -0.4, 0, -0.4);
  sh.quadraticCurveTo(-0.3, -0.4, -0.3, -0.05); sh.lineTo(-0.3, 0.35);
  const hole = new THREE.Path(); hole.absarc(0, 0.35, 0.12, 0, Math.PI * 2, true); sh.holes.push(hole);
  const gg = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  add(g, gg, cloth, [0, 0, 0], [0, 0, 0], [s, s, s]);
  add(g, new THREE.TorusGeometry(0.2 * s, 0.025 * s, 8, 30, Math.PI), mat('#ff7a8a'), [0, 0.3 * s, 0.02], [0, 0, 0]);
  for (let i = 0; i < 5; i++) blob(g, mat(['#ff7a8a', '#6ac0ff', '#ffd23c'][i % 3]), [(-0.16 + i * 0.08) * s, (-0.2 + (i % 2) * 0.1) * s, 0.04], [0.025 * s, 0.025 * s, 0.01]);
  if (label) { const t = textPlane(label, { w: 0.5 * s, h: 0.2 * s, bg: '#fff5d6', fg: '#c0182a', px: 0.8 }); t.position.set(0, -0.05 * s, 0.07); g.add(t); }
  return g;
}
