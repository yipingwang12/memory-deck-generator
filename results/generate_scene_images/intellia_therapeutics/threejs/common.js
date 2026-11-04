// Shared scene helpers for the Intellia owl scenes: stage, primitives, text, flags, animals, props.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createOwl } from './owl.js';
export { THREE, guard, rng, createOwl, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, color, pos, scl, rot, extra) =>
  add(parent, new THREE.SphereGeometry(1, 32, 20), typeof color === 'string' ? mat(color, extra) : color, pos, rot, scl);
export const cyl = (parent, color, r1, r2, h, pos, rot) => add(parent, new THREE.CylinderGeometry(r1, r2, h, 24), typeof color === 'string' ? mat(color) : color, pos, rot);
export const box = (parent, color, w, h, d, pos, rot) => add(parent, new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color) : color, pos, rot);

/** Stage + ground. Query params: cx cy cz tx ty tz fov el az. Returns { stage, scene, P, num }. */
export function makeStage({ ground = '#6fae45', sky = {}, el = 35, az = 150, cover = 2, seed = 5, fov = 40 } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: 1,
    sky: { cover, seed, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, P, num };
}

export function finish(ctx, characters, cam, look) {
  const { stage, num } = ctx, set = new Set();
  for (const c of characters) c.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0));
  stage.finish();
}

/** Flat label plane with canvas text. */
export function textPlane(text, w, h, { bg = '#101820', fg = '#7dffb0', font = 'bold 120px Arial', border = null } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  if (border) { g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, c.width - 14, c.height - 14); }
  g.fillStyle = fg; g.font = font.replace(/\d+px/, (m) => Math.round(parseInt(m) * c.width / 512 * (c.width / 512)) + 'px');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, side: THREE.DoubleSide }));
  return m;
}

/** Flag on a pole, base at y=0. */
export function flag(color = '#e63946', h = 1.1) {
  const g = new THREE.Group();
  cyl(g, '#e8e2d0', 0.018, 0.018, h, [0, h / 2, 0]);
  blob(g, '#f2c230', [0, h + 0.01, 0], [0.032, 0.032, 0.032]);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.5, 0.01); s.lineTo(0.42, -0.14); s.lineTo(0.5, -0.28); s.lineTo(0, -0.3); s.closePath();
  const cloth = add(g, new THREE.ShapeGeometry(s), new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide }), [0.02, h - 0.02, 0]);
  cloth.castShadow = false; g.userData.cloth = cloth;
  cone(g, '#555', 0.03, 0.08, [0, 0.0, 0], [Math.PI, 0, 0]);
  return g;
}
export const cone = (parent, color, r, h, pos, rot) => add(parent, new THREE.ConeGeometry(r, h, 20), typeof color === 'string' ? mat(color) : color, pos, rot);

function eyes(head, x, y, z, r = 0.03) {
  for (const s of [-1, 1]) {
    blob(head, mat('#1a1210', { roughness: 0.3 }), [x, y, s * z], [r, r * 1.15, r * 0.5]);
    blob(head, mat('#fff', { roughness: 0.3 }), [x + r * 0.35, y + r * 0.4, s * (z + r * 0.35)], [r * 0.3, r * 0.3, r * 0.2]);
  }
}
function legs(g, coat, hoof, xs, zs, h = 0.45, r = 0.045) {
  for (const x of xs) for (const z of zs) { cyl(g, coat, r, r * 0.75, h, [x, h / 2, z]); cyl(g, hoof, r * 1.05, r * 1.1, 0.05, [x, 0.025, z]); }
}

/** Caribou facing +x, ~1.3 tall with antlers. */
export function caribou() {
  const g = new THREE.Group(), coat = '#8b6a4a', pale = '#f1e8d8';
  blob(g, coat, [0, 0.72, 0], [0.5, 0.25, 0.22]); blob(g, pale, [0, 0.55, 0], [0.4, 0.1, 0.19]);
  cyl(g, coat, 0.1, 0.16, 0.42, [0.5, 0.98, 0], [0, 0, -0.65]);
  blob(g, pale, [0.56, 0.95, 0], [0.17, 0.2, 0.17], [0, 0, -0.65]);   // white mane
  const head = new THREE.Group(); head.position.set(0.76, 1.15, 0); head.rotation.z = -0.5; g.add(head);
  blob(head, coat, [0, 0, 0], [0.2, 0.115, 0.1]); blob(head, '#3d2a1c', [0.2, -0.02, 0], [0.09, 0.075, 0.08]);
  blob(head, '#1a1210', [0.285, -0.01, 0], [0.025, 0.03, 0.04]);
  eyes(head, 0.08, 0.04, 0.085, 0.026);
  for (const s of [-1, 1]) {
    blob(head, coat, [-0.08, 0.07, s * 0.07], [0.04, 0.09, 0.025], [s * 0.4, 0, 0.3]);
    const a = new THREE.Group(); a.position.set(-0.04, 0.09, s * 0.05); a.rotation.set(s * 0.25, 0, 0.35); head.add(a);
    const bone = '#e9dcc0';
    cyl(a, bone, 0.016, 0.022, 0.5, [0, 0.25, 0], [0, 0, 0.15]);
    for (const [y, l, tilt] of [[0.18, 0.2, 0.9], [0.32, 0.22, 0.8], [0.45, 0.18, 0.7]]) cyl(a, bone, 0.01, 0.016, l, [0.04 + 0.04 * y, y + 0.05, 0], [0, 0, -tilt]);
  }
  legs(g, coat, '#2b2523', [0.4, -0.4], [0.14, -0.14], 0.55);
  blob(g, pale, [-0.55, 0.75, 0], [0.07, 0.07, 0.07]);
  return g;
}

/** Fox facing +x, ~0.7 tall, big tail. */
export function fox() {
  const g = new THREE.Group(), coat = '#f06d1a', cream = '#fff4e2', dark = '#2a1a14';
  blob(g, coat, [0, 0.42, 0], [0.34, 0.17, 0.15]); blob(g, cream, [0.05, 0.34, 0], [0.26, 0.08, 0.13]);
  const head = new THREE.Group(); head.position.set(0.37, 0.56, 0); g.add(head);
  blob(head, coat, [0, 0, 0], [0.15, 0.12, 0.12]); blob(head, cream, [0.04, -0.06, 0], [0.12, 0.05, 0.1]);
  cone(head, coat, 0.07, 0.24, [0.2, -0.015, 0], [0, 0, -Math.PI / 2]); blob(head, dark, [0.32, -0.015, 0], [0.026, 0.026, 0.026]);
  eyes(head, 0.1, 0.035, 0.085, 0.026);
  for (const s of [-1, 1]) { cone(head, coat, 0.055, 0.17, [-0.04, 0.17, s * 0.07], [s * 0.15, 0, 0.1]); cone(head, dark, 0.03, 0.09, [-0.04, 0.16, s * 0.072], [s * 0.15, 0, 0.1]); }
  legs(g, dark, dark, [0.24, -0.24], [0.08, -0.08], 0.3, 0.032);
  const tail = new THREE.Group(); tail.position.set(-0.32, 0.46, 0); tail.rotation.z = 0.9; g.add(tail);
  blob(tail, coat, [-0.02, 0.2, 0], [0.09, 0.28, 0.09]); blob(tail, cream, [-0.02, 0.46, 0], [0.07, 0.09, 0.07]);
  return g;
}

/** Bear standing facing +z, ~1.5 tall. Optional shirt colours. */
export function bear({ shirt = '#1f4fa8', trim = '#f2b705' } = {}) {
  const g = new THREE.Group(), fur = '#8a5a34', snout = '#d9b48a';
  blob(g, fur, [0, 0.55, 0], [0.42, 0.5, 0.34]); blob(g, shirt, [0, 0.55, 0.06], [0.435, 0.4, 0.33]);
  blob(g, trim, [0, 0.62, 0.38], [0.2, 0.2, 0.04]);
  const head = new THREE.Group(); head.position.set(0, 1.2, 0.04); g.add(head);
  blob(head, fur, [0, 0, 0], [0.3, 0.27, 0.27]);
  for (const s of [-1, 1]) { blob(head, fur, [s * 0.22, 0.22, 0], [0.1, 0.1, 0.06]); blob(head, snout, [s * 0.22, 0.22, 0.03], [0.06, 0.06, 0.03]); }
  blob(head, snout, [0, -0.07, 0.2], [0.14, 0.11, 0.1]); blob(head, '#1a1210', [0, -0.03, 0.29], [0.04, 0.03, 0.03]);
  eyes(head, 0, 0.06, 0.1, 0.035);
  for (const s of [-1, 1]) { const e = head.children[head.children.length - 4 + (s > 0 ? 2 : 0)]; }
  for (const s of [-1, 1]) {
    cyl(g, fur, 0.09, 0.08, 0.5, [s * 0.46, 0.65, 0.05], [0, 0, s * 0.35]);
    blob(g, fur, [s * 0.18, 0.1, 0.05], [0.15, 0.1, 0.2]); cyl(g, fur, 0.12, 0.11, 0.3, [s * 0.18, 0.2, 0]);
  }
  return g;
}

/** Globe on a stand, ~0.9 tall. */
export function globe() {
  const g = new THREE.Group(), r = rng(3);
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#2f7fd6'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#69b94a';
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse(r() * s, s * (0.2 + r() * 0.6), 30 + r() * 50, 20 + r() * 40, r() * 3, 0, 7); ctx.fill(); }
  });
  const ball = blob(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [0, 0.62, 0], [0.3, 0.3, 0.3], [0.4, 0, 0.4]);
  add(g, new THREE.TorusGeometry(0.34, 0.016, 8, 48), mat('#c8963c', { metalness: 0.6, roughness: 0.3 }), [0, 0.62, 0], [0, Math.PI / 2, 0.4]);
  cyl(g, '#c8963c', 0.025, 0.025, 0.3, [0, 0.2, 0]); cyl(g, '#5a3a1e', 0.2, 0.24, 0.06, [0, 0.03, 0]);
  return g;
}

/** Translucent bubble. */
export const bubble = (parent, pos, r, color = '#ffd3ea') => blob(parent, mat(color, { transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1 }), pos, [r, r, r]);

/** Gold halo ring. */
export const halo = (parent, pos, r) => add(parent, new THREE.TorusGeometry(r, r * 0.12, 16, 48), mat('#ffd23a', { emissive: '#ffb800', emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.25 }), pos, [Math.PI / 2 - 0.15, 0, 0]);

/** Tall vial with label text and liquid. */
export function vial(label, liquid = '#4aa8ff', h = 0.7) {
  const g = new THREE.Group();
  box(g, mat('#dfeeff', { transparent: true, opacity: 0.45, roughness: 0.1 }), 0.4, h, 0.2, [0, h / 2, 0]);
  box(g, mat(liquid, { roughness: 0.2 }), 0.37, h * 0.68, 0.17, [0, h * 0.36, 0]);
  cyl(g, '#d63a3a', 0.12, 0.17, 0.09, [0, h + 0.04, 0]);
  const t = textPlane(label, 0.36, 0.2, { bg: '#ffffff', fg: '#143a8a', font: `bold ${Math.min(130, Math.floor(700 / label.length))}px Arial`, border: '#143a8a' });
  t.position.set(0, h * 0.42, 0.102); g.add(t);
  return g;
}

/** Spiky red "attack" monster, ~0.5 wide. */
export function attacker() {
  const g = new THREE.Group(), red = '#d6281f';
  blob(g, red, [0, 0, 0], [0.22, 0.22, 0.22]);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.7, 0], [-0.7, -0.7, 0], [0, 0.7, -0.7], [0, -0.7, -0.7]];
  for (const d of dirs) { const v = new THREE.Vector3(...d).normalize(); const c = cone(g, '#8f1410', 0.07, 0.2, v.clone().multiplyScalar(0.27));
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); }
  for (const s of [-1, 1]) { blob(g, '#fff', [s * 0.08, 0.04, 0.19], [0.05, 0.05, 0.03]); blob(g, '#111', [s * 0.08, 0.03, 0.22], [0.025, 0.03, 0.015]);
    box(g, '#2a0a08', 0.1, 0.02, 0.02, [s * 0.08, 0.11, 0.21], [0, 0, -s * 0.45]); }
  return g;
}
