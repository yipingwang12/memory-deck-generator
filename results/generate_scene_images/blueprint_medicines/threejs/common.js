// Shared helpers for the Blueprint scenes: stage, primitives, props.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, rng, canvasTexture };

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);

export function makeStage(o = {}) {
  return createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: o.sunIntensity ?? 2.6, ambient: o.ambient ?? { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: o.flare ?? 0.7, fog: { near: 120, far: 1500 },
  });
}
export const clouds = (stage) => stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
export const ground = (scene, color = '#6fae45') => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
export function look(stage, cx, cy, cz, tx, ty, tz) {
  stage.camera.position.set(num('cx', cx), num('cy', cy), num('cz', cz)); stage.camera.lookAt(num('tx', tx), num('ty', ty), num('tz', tz));
}
// Toon-shade the given roots as "characters" (outlined), then finish.
export function finishScene(stage, chars) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m)); stage.finish();
}

const disc = (parent, rx, ry, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
// Big anime eyes on a creature facing +z. s = size.
export function eyes(parent, { x = 0.12, y = 0, z = 0, s = 1, iris = '#3a2416' } = {}) {
  for (const sx of [-1, 1]) {
    const ex = sx * x;
    disc(parent, 0.07 * s, 0.09 * s, '#ffffff', ex, y, z);
    disc(parent, 0.055 * s, 0.08 * s, iris, ex, y - 0.004 * s, z + 0.002);
    disc(parent, 0.03 * s, 0.045 * s, '#120a08', ex, y, z + 0.004);
    disc(parent, 0.02 * s, 0.02 * s, '#ffffff', ex - 0.02 * s, y + 0.03 * s, z + 0.006);
  }
}
export const smile = (parent, x, y, z, r, color = '#7a2a2a') => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 8, 20, Math.PI), mat(color));
  m.rotation.z = Math.PI; m.position.set(x, y, z); parent.add(m); return m;
};
export function textTex(text, { w = 512, h = 256, bg = '#f6efe0', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  return canvasTexture(w, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2);
  });
}
export function label(parent, text, pos, size, { bg = '#f6efe0', fg = '#222', rot = [0, 0, 0], font } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshStandardMaterial({ map: textTex(text, { bg, fg, font }), roughness: 0.8 }));
  m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
}

export function goldBar() {
  const g = new THREE.Group(), gold = mat('#f2b91c', { metalness: 0.7, roughness: 0.3 });
  const s = new THREE.Shape(); s.moveTo(-0.14, -0.05); s.lineTo(0.14, -0.05); s.lineTo(0.1, 0.05); s.lineTo(-0.1, 0.05); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }); geo.center();
  add(g, geo, gold); return g;
}
export function coin(r = 0.07) {
  const c = cyl(new THREE.Group(), mat('#f5c542', { metalness: 0.6, roughness: 0.3 }), [0, 0, 0], r, r * 0.18, [Math.PI / 2, 0, 0]);
  return c;
}
export function buildHorse() {
  const g = new THREE.Group(), coat = mat('#a0602d'), dark = mat('#3b2412'), pale = mat('#f2e6d0');
  blob(g, coat, [0, 0.72, 0], [0.55, 0.28, 0.24]); blob(g, coat, [0.4, 0.8, 0], [0.26, 0.3, 0.22]); blob(g, coat, [-0.42, 0.76, 0], [0.24, 0.28, 0.22]);
  cyl(g, coat, [0.6, 1.08, 0], 0.15, 0.5, [0, 0, -0.65], 0.1);
  const head = new THREE.Group(); head.position.set(0.86, 1.28, 0); head.rotation.z = -0.5; g.add(head);
  blob(head, coat, [0, 0, 0], [0.22, 0.12, 0.11]); blob(head, pale, [0.2, -0.02, 0], [0.1, 0.08, 0.075]);
  blob(head, dark, [0.29, -0.01, 0], [0.025, 0.035, 0.04]);
  for (const s of [-1, 1]) {
    blob(head, mat('#1a1210', { roughness: 0.3 }), [0.1, 0.05, s * 0.1], [0.03, 0.036, 0.016]);
    blob(head, mat('#fff'), [0.108, 0.06, s * 0.114], [0.009, 0.009, 0.006]);
    add(head, new THREE.ConeGeometry(0.035, 0.16, 12), coat, [-0.06, 0.15, s * 0.05], [s * 0.15, 0, 0.1]);
  }
  for (let i = 0; i < 8; i++) { const t = (i - 3.5) * 0.06; blob(g, dark, [0.6 + 0.65 * t - 0.14, 1.08 + 0.76 * t + 0.1, 0], [0.04, 0.08, 0.03], [0, 0, -0.65]); }
  for (const [x, z] of [[0.42, 0.14], [0.42, -0.14], [-0.42, 0.14], [-0.42, -0.14]]) {
    cyl(g, coat, [x, 0.34, z], 0.04, 0.62, [0, 0, 0], 0.06); cyl(g, dark, [x, 0.04, z], 0.06, 0.08);
  }
  cyl(g, dark, [-0.7, 0.6, 0], 0.02, 0.5, [0, 0, 0.4], 0.04); blob(g, dark, [-0.78, 0.4, 0], [0.06, 0.16, 0.05], [0, 0, 0.35]);
  return g;
}
export function buildBoot(s = 1) {
  const g = new THREE.Group(), leather = mat('#b5702f'), sole = mat('#2e1d10');
  box(g, leather, [0, 0.5, 0], [0.42, 1.0, 0.36]); box(g, leather, [0.24, 0.13, 0], [0.7, 0.26, 0.36]);
  blob(g, leather, [0.6, 0.15, 0], [0.18, 0.15, 0.18]); box(g, sole, [0.18, 0.03, 0], [0.98, 0.06, 0.38]);
  box(g, sole, [-0.14, 0.06, 0], [0.18, 0.12, 0.38]);
  cyl(g, mat('#e8d3a8'), [0, 0.93, 0], 0.27, 0.14, [0, 0, 0], 0.27);
  g.scale.setScalar(s); return g;
}
export function buildNail(len = 0.6, r = 0.03) {
  const g = new THREE.Group(), iron = mat('#c9cfd8', { metalness: 0.8, roughness: 0.3 });
  cyl(g, iron, [0, 0, 0], r, len, [Math.PI / 2, 0, 0]);
  cyl(g, iron, [0, 0, len / 2], r * 2.6, r * 0.7, [Math.PI / 2, 0, 0]);
  add(g, new THREE.ConeGeometry(r, r * 3, 12), iron, [0, 0, -len / 2 - r * 1.5], [-Math.PI / 2, 0, 0]);
  return g;
}
export function buildBox(color = '#c89a5a') {
  const g = new THREE.Group();
  box(g, mat(color), [0, 0.15, 0], [0.34, 0.3, 0.3]); box(g, mat('#e8d7b0'), [0, 0.305, 0], [0.34, 0.012, 0.06]);
  box(g, mat('#b08440'), [0, 0.15, 0.151], [0.1, 0.3, 0.004]); return g;
}
export function buildPadlock(color = '#d9b13a') {
  const g = new THREE.Group(), m = mat(color, { metalness: 0.6, roughness: 0.35 });
  add(g, new THREE.TorusGeometry(0.1, 0.028, 10, 24, Math.PI), mat('#c4c9d0', { metalness: 0.8, roughness: 0.3 }), [0, 0.12, 0]);
  box(g, m, [0, 0, 0], [0.3, 0.24, 0.1]);
  cyl(g, mat('#1c1410'), [0, 0.02, 0.055], 0.03, 0.01, [Math.PI / 2, 0, 0]); box(g, mat('#1c1410'), [0, -0.04, 0.055], [0.02, 0.07, 0.01]);
  return g;
}
export function buildBridge({ span = 7, h = 2.2 } = {}) {
  const g = new THREE.Group(), stone = mat('#b9b2a6'), dark = mat('#8c857a');
  box(g, stone, [0, h + 0.5, 0], [span, 0.7, 1.6]);
  for (const s of [-1, 1]) {
    box(g, stone, [s * (span / 2 - 0.5), h / 2, 0], [1.0, h, 1.6]);
    box(g, dark, [s * (span / 2 - 0.5), h + 1.2, 0], [1.1, 0.5, 1.7]);
    cyl(g, dark, [s * (span / 2 - 0.5), h + 1.8, 0], 0.45, 0.9, [0, 0, 0], 0.4);
    add(g, new THREE.ConeGeometry(0.5, 0.7, 20), mat('#7aa0a0'), [s * (span / 2 - 0.5), h + 2.5, 0]);
  }
  box(g, dark, [0, h + 0.98, 0.75], [span, 0.25, 0.1]);
  return g;
}
export function buildCat() {
  const g = new THREE.Group(), fur = mat('#f4efe6', { roughness: 0.95 }), pink = mat('#e7a0a8');
  blob(g, fur, [0, 0.3, 0], [0.32, 0.3, 0.3]);
  const head = new THREE.Group(); head.position.set(0, 0.7, 0.04); g.add(head);
  blob(head, fur, [0, 0, 0], [0.3, 0.26, 0.26]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; blob(head, fur, [Math.cos(a) * 0.27, Math.sin(a) * 0.23, 0.0], [0.1, 0.1, 0.12]); }
  for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.1, 0.18, 4), fur, [s * 0.2, 0.3, 0], [0, Math.PI / 4, -s * 0.2]);
  eyes(head, { x: 0.1, y: 0.03, z: 0.25, s: 0.9, iris: '#e08a1c' });
  blob(head, pink, [0, -0.06, 0.27], [0.035, 0.025, 0.02]); smile(head, 0, -0.11, 0.265, 0.03, '#7a3a3a');
  for (const s of [-1, 1]) blob(g, fur, [s * 0.15, 0.06, 0.2], [0.1, 0.08, 0.14]);
  blob(g, fur, [-0.3, 0.3, -0.2], [0.14, 0.14, 0.3], [0, 0.5, 0]);
  return g;
}
export function buildCart() {
  const g = new THREE.Group(), wood = mat('#9a6a38'), dk = mat('#5c3c1c');
  box(g, wood, [0, 0.4, 0], [1.2, 0.08, 0.7]);
  for (const z of [-0.35, 0.35]) box(g, wood, [0, 0.58, z], [1.2, 0.3, 0.05]);
  for (const x of [-0.6, 0.6]) box(g, wood, [x, 0.58, 0], [0.05, 0.3, 0.7]);
  for (const z of [-0.4, 0.4]) {
    const w = new THREE.Group(); w.position.set(-0.3, 0.26, z); g.add(w);
    add(w, new THREE.TorusGeometry(0.24, 0.035, 10, 28), dk, [0, 0, 0]); cyl(w, dk, [0, 0, 0], 0.045, 0.06, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 6; i++) box(w, dk, [0, 0, 0], [0.48, 0.025, 0.03], [0, 0, i * Math.PI / 6]);
  }
  box(g, dk, [0.95, 0.38, 0], [0.8, 0.04, 0.06]); return g;
}
export function buildHammer() {
  const g = new THREE.Group();
  cyl(g, mat('#a06a32'), [0, 0, 0], 0.025, 0.5); box(g, mat('#6b7078', { metalness: 0.7, roughness: 0.35 }), [0, 0.26, 0], [0.26, 0.11, 0.11]); return g;
}
