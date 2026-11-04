// Shared scene helpers for the Cahira deck: stage, desert/ground, primitives, pyramid placement, camera.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createPyramid } from './pyramid.js';
export { THREE, guard, canvasTexture, rng, createPyramid };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const glow = (c, i = 1.5) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });

export function textTex(lines, { w = 512, h = 256, bg = null, fg = '#fff', font = 'bold 120px sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font;
  [].concat(lines).forEach((t, i, a) => x.fillText(t, w / 2, h * (i + 0.5) / a.length));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const sign = (parent, lines, size, pos, o = {}) =>
  add(parent, new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ map: textTex(lines, o), transparent: !o.bg }), pos);

/** Build stage; returns { stage, scene, pyr, finish(cam, look) }. Sky/ground options per scene. */
export function build({ ground = '#e9c47e', zenith, horizon, cover = 0.4, py = [0, 0, 0], ps = 1.15, pry = 0, fov = 40, el = 38, az = 200, sunI = 2.6 } = {}) {
  const sky = { cover, seed: 5, towerTop: 0.4, puffCover: cover };
  if (zenith) { sky.zenith = zenith; sky.horizon = horizon; }
  const stage = createAnimeStage({
    fov, sunElevation: el, sunAzimuth: az, sky, sunIntensity: sunI,
    ambient: { color: '#fff0e0', intensity: 2.2 }, rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const pyr = createPyramid({ scale: ps }); pyr.position.set(...py); pyr.rotation.y = pry; scene.add(pyr);
  return { stage, scene, pyr };
}

/** Toonify every mesh under `chars` (Object3D list), place the camera and finish. */
export function finish({ stage, scene }, chars, cam, look, clouds = true, hook = null) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  if (hook) hook();
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [180, 1100, 160, 1.8], [215, 950, 80, 1.0]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}

/** Pyramid-local arm reach to a world point. */
export function reachWorld(pyr, key, p) {
  pyr.updateMatrixWorld(true);
  const t = pyr.worldToLocal(new THREE.Vector3(...p)); pyr.userData.reach(key, [t.x, t.y, t.z]);
}

/** Cute little character helpers. */
export function eyes(parent, x, y, z, s = 1, sep = 0.06) {
  for (const sx of [-1, 1]) {
    blob(parent, mat('#fff', { roughness: 0.3 }), [x + sx * sep * s, y, z], [0.04 * s, 0.05 * s, 0.01 * s]);
    blob(parent, mat('#1c1030', { roughness: 0.3 }), [x + sx * sep * s, y - 0.003 * s, z + 0.007 * s], [0.026 * s, 0.038 * s, 0.01 * s]);
    blob(parent, mat('#fff'), [x + sx * sep * s - 0.008 * s, y + 0.014 * s, z + 0.016 * s], [0.01 * s, 0.01 * s, 0.004 * s]);
  }
}
export function html(title) { return title; }
export function chip(parent, pos, s = 1, c = '#2c3340') {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  box(g, mat(c, { metalness: 0.4, roughness: 0.4 }), [0, 0, 0], [0.14, 0.03, 0.14]);
  box(g, mat('#8fe7ff', { metalness: 0.6, roughness: 0.3 }), [0, 0.02, 0], [0.08, 0.012, 0.08]);
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
    box(g, mat('#e8c14a', { metalness: 0.7 }), [sd * 0.083, 0, -0.05 + i * 0.033], [0.026, 0.012, 0.014]);
    box(g, mat('#e8c14a', { metalness: 0.7 }), [-0.05 + i * 0.033, 0, sd * 0.083], [0.014, 0.012, 0.026]);
  }
  return g;
}
export function monk(parent, pos, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); g.rotation.y = ry; parent.add(g);
  const robe = mat('#8a5a2e'), skin = mat('#ffd9b8');
  add(g, new THREE.CylinderGeometry(0.1, 0.22, 0.5, 24), robe, [0, 0.27, 0]);
  add(g, new THREE.TorusGeometry(0.15, 0.015, 8, 24), mat('#e8d9b0'), [0, 0.28, 0], [Math.PI / 2, 0, 0]);
  blob(g, skin, [0, 0.62, 0], [0.13, 0.14, 0.13]);
  blob(g, mat('#4a3320'), [0, 0.64, -0.03], [0.14, 0.13, 0.13]); blob(g, skin, [0, 0.7, 0.0], [0.1, 0.09, 0.1]);
  eyes(g, 0, 0.625, 0.115, 1.3, 0.055);
  for (const sx of [-1, 1]) { blob(g, robe, [sx * 0.15, 0.4, 0.04], [0.045, 0.1, 0.045], [0.3, 0, sx * 0.4]); blob(g, skin, [sx * 0.19, 0.31, 0.08], [0.03, 0.03, 0.03]); }
  for (const sx of [-1, 1]) blob(g, mat('#5a3a1c'), [sx * 0.07, 0.02, 0.05], [0.05, 0.03, 0.08]);
  return g;
}
export function mouse(parent, pos, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); g.rotation.y = ry; parent.add(g);
  const fur = mat('#b9b3ad'), pink = mat('#f4a6b6');
  blob(g, fur, [0, 0.3, 0], [0.26, 0.28, 0.3]);
  blob(g, fur, [0, 0.62, 0.12], [0.2, 0.19, 0.2]);
  blob(g, pink, [0, 0.58, 0.31], [0.05, 0.045, 0.04]);
  for (const sx of [-1, 1]) {
    blob(g, fur, [sx * 0.16, 0.8, 0.08], [0.12, 0.12, 0.03]); blob(g, pink, [sx * 0.16, 0.8, 0.1], [0.085, 0.085, 0.02]);
    blob(g, mat('#fff'), [sx * 0.07, 0.65, 0.28], [0.045, 0.055, 0.02]);
    blob(g, mat('#1c1030'), [sx * 0.07, 0.65, 0.295], [0.03, 0.042, 0.015]);
    blob(g, mat('#fff'), [sx * 0.07 - 0.01, 0.665, 0.31], [0.011, 0.011, 0.008]);
    blob(g, fur, [sx * 0.14, 0.05, 0.12], [0.07, 0.05, 0.12]);
    for (const k of [-1, 1]) add(g, new THREE.CylinderGeometry(0.003, 0.003, 0.2, 4), mat('#ddd'), [sx * 0.15, 0.58 + k * 0.02, 0.3], [0, 0, Math.PI / 2 + k * 0.15]);
  }
  add(g, new THREE.TorusGeometry(0.2, 0.014, 8, 24, Math.PI * 1.2), pink, [0, 0.12, -0.3], [0, 0, 0.3]);
  return g;
}
export function brain(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const m = mat('#f4a0b4', { roughness: 0.55 }), d = mat('#c2506b');
  box(g, mat('#8a2a44'), [0, 0.15, 0], [0.012, 0.05, 0.4]);
  for (const sx of [-1, 1]) blob(g, m, [sx * 0.11, 0, 0], [0.19, 0.16, 0.24]);
  const r = rng(3);
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, b = (r() - 0.2) * 1.6; blob(g, i % 2 ? m : d, [Math.cos(a) * Math.cos(b) * 0.27, Math.sin(b) * 0.17, Math.sin(a) * Math.cos(b) * 0.21], [0.06, 0.045, 0.06]); }
  blob(g, m, [0, -0.13, -0.1], [0.1, 0.07, 0.1]);
  return g;
}
export function flame(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  [[0, 0, 0, 0.17, 0.5, '#ff4a1a'], [0.12, 0, 0.02, 0.11, 0.35, '#ff8a1a'], [-0.12, 0, -0.02, 0.11, 0.38, '#ff8a1a'], [0, 0.02, 0.03, 0.1, 0.32, '#ffd23a']].forEach(([x, y, z, r, h, c]) => {
    const f = add(g, new THREE.ConeGeometry(r, h, 14), glow(c, 1.2), [x, y + h / 2, z]); f.castShadow = false;
  });
  return g;
}

/** DEBIT card character: upright blue card with chip, stripe, big "DEBIT" text, face, arms, legs. ~0.9 tall. */
export function debitCard(parent, pos, s = 1, ry = 0, sit = false) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); g.rotation.y = ry; parent.add(g);
  const y0 = sit ? 0.16 : 0.3, W = 0.56, Hh = 0.8;
  const card = new THREE.Group(); card.position.y = y0 + Hh / 2; g.add(card);
  const cm = mat('#2b6fe0', { roughness: 0.4 });
  add(card, new THREE.BoxGeometry(W, Hh, 0.05), cm);
  add(card, new THREE.BoxGeometry(W + 0.02, 0.12, 0.052), mat('#1a1a2a'), [0, 0.2, 0]);
  add(card, new THREE.BoxGeometry(0.14, 0.1, 0.056), mat('#f1c64a', { metalness: 0.7, roughness: 0.3 }), [-0.17, 0.02, 0]);
  sign(card, 'DEBIT', [0.5, 0.17], [0, -0.3, 0.032], { w: 512, h: 170, font: 'bold 130px sans-serif', fg: '#ffffff' });
  eyes(card, 0.04, 0.0, 0.03, 1.5, 0.07);
  add(card, new THREE.TorusGeometry(0.035, 0.007, 8, 16, Math.PI), mat('#7a2a2a'), [0.04, -0.08, 0.03], [0, 0, Math.PI]);
  const skin = mat('#ffe0c0');
  for (const sx of [-1, 1]) {
    add(card, new THREE.CylinderGeometry(0.02, 0.02, 0.28, 10), skin, [sx * (W / 2 + 0.07), -0.05, 0.02], [0, 0, sx * 0.5]);
    blob(card, mat('#fff'), [sx * (W / 2 + 0.15), -0.17, 0.02], [0.05, 0.05, 0.045]);
    if (!sit) add(g, new THREE.CylinderGeometry(0.028, 0.028, 0.3, 10), skin, [sx * 0.13, 0.15, 0]);
    blob(g, mat('#c8483c'), [sx * 0.13, sit ? 0.12 : 0.02, 0.05], [0.06, 0.04, 0.1]);
  }
  if (sit) for (const sx of [-1, 1]) add(g, new THREE.CylinderGeometry(0.028, 0.028, 0.3, 10), skin, [sx * 0.13, 0.17, 0.12], [Math.PI / 2, 0, 0]);
  return g;
}

/** MIT Great Dome building: columned block + low dome. */
export function mitDome(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const stone = mat('#d9d4c8');
  box(g, stone, [0, 0.5, 0], [3.2, 1, 1.2]);
  box(g, mat('#c9c3b5'), [0, 1.0, 0], [3.4, 0.08, 1.3]);
  for (let i = 0; i < 8; i++) cyl(g, mat('#efe9dc'), [-1.05 + i * 0.3, 0.5, 0.7], 0.08, 1);
  box(g, mat('#efe9dc'), [0, 1.08, 0.7], [2.5, 0.16, 0.2]);
  cyl(g, stone, [0, 1.3, 0], 0.7, 0.5);
  add(g, new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9aa5ad', { metalness: 0.3 }), [0, 1.52, 0]);
  cyl(g, mat('#e8d9b0'), [0, 2.3, 0], 0.03, 0.2);
  sign(g, 'MIT', [0.8, 0.28], [0, 1.08, 0.82], { w: 256, h: 90, font: 'bold 70px serif', fg: '#a31f34' });
  return g;
}
