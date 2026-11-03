// Shared props + stage for the Pfizer scenes (copy of the Editas scene pattern).
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createVisor } from './visor.js';
export { THREE, guard, rng, createVisor };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, w, h, d, c, pos, rot, e) => add(p, new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? mat(c, e) : c, pos, rot);
export const cyl = (p, r1, r2, h, c, pos, rot, seg = 28) => add(p, new THREE.CylinderGeometry(r1, r2, h, seg), typeof c === 'string' ? mat(c) : c, pos, rot);
export const blob = (p, c, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), typeof c === 'string' ? mat(c) : c, pos, rot, scl);

/** Canvas texture of any aspect: draw(ctx, w, h). */
export function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Flat sign: big centred text. */
export function sign(text, w, h, { bg = '#ffffff', fg = '#111', font = 'bold', border = null, px = 256 } = {}) {
  const t = tex(Math.round(px * w / h), px, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = H * 0.06; ctx.strokeRect(H * 0.03, H * 0.03, W - H * 0.06, H * 0.94); }
    let fs = H * 0.7; ctx.font = `${font} ${fs}px Helvetica, Arial, sans-serif`;
    while (ctx.measureText(text).width > W * 0.86) { fs *= 0.93; ctx.font = `${font} ${fs}px Helvetica, Arial, sans-serif`; }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H * 0.54);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
}

export function setup(P, { sky = {}, ...o } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 38), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 1.5), seed: num('seed', 5), towerTop: 0.5, puffCover: 1.5, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.5, fog: { near: 120, far: 1500 }, ...o,
  });
  return { stage, scene: stage.scene, num };
}
export function ground(scene, color = '#7fbb55', size = 400) {
  return add(scene, new THREE.PlaneGeometry(size, size), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}
export function road(scene, z, w = 3, color = '#5c5f68', len = 400) {
  add(scene, new THREE.PlaneGeometry(len, w), mat(color), [0, 0.004, z], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(len, 0.06), mat('#f3d94a'), [0, 0.008, z], [-Math.PI / 2, 0, 0]);
}
/** Toonify the characters, add clouds, aim camera, finish. */
export function finish(stage, scene, chars, cam, look) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [190, 1100, 160, 1.6], [230, 950, 80, 1.0], [120, 1200, 140, 1.8]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}

/** Triangular prism (ridge along x): length, height, base depth; base sits at pos. */
export function prism(p, len, hgt, depth, c, pos) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 3); geo.rotateZ(Math.PI / 2); geo.rotateX(-Math.PI / 2);
  return add(p, geo, mat(c), [pos[0], pos[1] + hgt / 3, pos[2]], [0, 0, 0], [len, hgt / 1.5, depth / 1.732]);
}

/** Small house; old = weathered, crooked. */
export function house({ w = 1, h = 0.8, d = 0.8, wall = '#d9a87a', roof = '#b8493a', old = false } = {}) {
  const g = new THREE.Group();
  box(g, w, h, d, wall, [0, h / 2, 0]);
  prism(g, w * 1.12, 0.32 * w, d * 1.1, roof, [0, h, 0]);
  box(g, 0.2 * w, 0.4 * h, 0.04, old ? '#4a3524' : '#7a4a2a', [0, 0.2 * h, d / 2 + 0.01]);
  for (const x of [-0.3, 0.3]) box(g, 0.2 * w, 0.2 * h, 0.04, old ? '#9bbad0' : '#bfe4ff', [x * w, 0.62 * h, d / 2 + 0.01]);
  box(g, 0.14 * w, 0.4 * h, 0.14 * w, old ? '#8a5a4a' : '#9a6a5a', [0.3 * w, h + 0.3 * h, -0.1 * d]);
  if (old) { box(g, 0.1, 0.04, 0.04, '#6b5a3f', [-0.3 * w, 0.3 * h, d / 2 + 0.02], [0, 0, 0.6]); }
  return g;
}

/** MIT-style Great Dome: colonnade + drum + silver dome. face = living child version. */
export function dome({ face = false } = {}) {
  const g = new THREE.Group(), stone = '#ece3cc';
  box(g, 2.6, 0.7, 1.4, stone, [0, 0.35, 0]);
  box(g, 2.8, 0.08, 1.6, '#d6ccb2', [0, 0.04, 0.05]);
  for (let i = 0; i < 8; i++) cyl(g, 0.065, 0.075, 0.7, '#f6efdc', [-1.05 + i * 0.3, 0.4, 0.78]);
  prism(g, 2.8, 0.3, 1.6, '#ddd3ba', [0, 0.7, 0.75]);
  cyl(g, 0.78, 0.82, 0.55, stone, [0, 1.0, -0.1], [0, 0, 0], 40);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cyl(g, 0.03, 0.03, 0.5, '#f6efdc', [Math.sin(a) * 0.82, 1.0, -0.1 + Math.cos(a) * 0.82]); }
  const d = add(g, new THREE.SphereGeometry(0.78, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat('#aeb9c6', { metalness: 0.4, roughness: 0.35 }), [0, 1.27, -0.1]);
  cyl(g, 0.12, 0.14, 0.12, stone, [0, 2.07, -0.1]); blob(g, '#aeb9c6', [0, 2.2, -0.1], [0.07, 0.07, 0.07]);
  if (face) {
    const f = new THREE.Group(); f.position.set(0, 1.27, -0.1); f.rotation.x = -0.35; g.add(f);
    for (const s of [-1, 1]) {
      const x = s * 0.25, z = 0.72;
      blob(f, '#ffffff', [x, 0.02, z], [0.16, 0.2, 0.02]); blob(f, '#2d3a8c', [x, 0.0, z + 0.015], [0.115, 0.17, 0.02]);
      blob(f, '#0b0f2a', [x, 0.0, z + 0.03], [0.07, 0.11, 0.02]); blob(f, '#fff', [x - 0.04, 0.06, z + 0.045], [0.04, 0.04, 0.01]);
      blob(f, '#ff8aa0', [s * 0.42, -0.2, 0.6], [0.08, 0.05, 0.01]);
    }
    blob(f, '#8a2a3a', [0, -0.17, 0.74], [0.07, 0.03, 0.01]);
  }
  return g;
}

/** Cartoon person ~0.55 tall: coat colour, hat kind, skin. */
export function person({ coat = '#ffffff', hat = null, skin = '#f2c9a0', hair = '#3a2a1e', beard = false, glasses = false, arms = 'down' } = {}) {
  const g = new THREE.Group();
  cyl(g, 0.1, 0.14, 0.3, coat, [0, 0.28, 0], [0, 0, 0], 16);
  for (const s of [-1, 1]) cyl(g, 0.035, 0.035, 0.16, '#33384a', [s * 0.05, 0.08, 0]);
  blob(g, skin, [0, 0.5, 0], [0.12, 0.12, 0.12]);
  blob(g, hair, [0, 0.56, -0.03], [0.125, 0.1, 0.11]);
  for (const s of [-1, 1]) { blob(g, '#ffffff', [s * 0.045, 0.5, 0.108], [0.033, 0.04, 0.01]); blob(g, '#1b1b30', [s * 0.045, 0.495, 0.116], [0.02, 0.028, 0.01]); }
  if (glasses) for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.04, 0.007, 6, 16), mat('#222'), [s * 0.045, 0.5, 0.118]);
  if (beard) blob(g, '#f1f1f1', [0, 0.43, 0.07], [0.09, 0.09, 0.05]);
  const armTilt = arms === 'up' ? 2.6 : arms === 'out' ? 1.5 : 0.25;
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.13, 0.4, 0); a.rotation.z = s * armTilt; g.add(a); cyl(a, 0.026, 0.026, 0.2, coat, [0, -0.1, 0], [0, 0, 0], 10); blob(a, skin, [0, -0.21, 0], [0.032, 0.032, 0.032]); }
  if (hat === 'cap') { // mortarboard
    cyl(g, 0.1, 0.1, 0.05, '#1a1a2a', [0, 0.62, 0]); box(g, 0.34, 0.025, 0.34, '#1a1a2a', [0, 0.655, 0]); cyl(g, 0.006, 0.006, 0.1, '#e8b830', [0.12, 0.64, 0], [0, 0, 1.4]);
  }
  if (hat === 'hard') { add(g, new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffd23a'), [0, 0.54, 0]); cyl(g, 0.15, 0.15, 0.015, '#ffd23a', [0, 0.545, 0.01]); }
  return g;
}

/** Sumo wrestler ~1.6 tall: arms up (holding things). */
export function sumo() {
  const g = new THREE.Group(), skin = '#f0b98e';
  for (const s of [-1, 1]) cyl(g, 0.17, 0.15, 0.55, skin, [s * 0.22, 0.28, 0]);
  blob(g, skin, [0, 0.95, 0], [0.55, 0.5, 0.45]);
  blob(g, skin, [0, 1.12, 0.12], [0.5, 0.35, 0.4]);
  add(g, new THREE.TorusGeometry(0.5, 0.075, 12, 40), mat('#1e8a8a'), [0, 0.66, 0.0], [Math.PI / 2, 0, 0], [1, 0.88, 1]);
  box(g, 0.34, 0.5, 0.05, '#1e8a8a', [0, 0.5, 0.42]);
  blob(g, skin, [0, 1.68, 0.02], [0.3, 0.28, 0.28]);
  blob(g, '#17141a', [0, 1.85, -0.04], [0.28, 0.12, 0.27]); blob(g, '#17141a', [0, 1.98, -0.04], [0.09, 0.09, 0.09]);
  for (const s of [-1, 1]) { blob(g, '#fff', [s * 0.1, 1.7, 0.255], [0.06, 0.07, 0.015]); blob(g, '#1b1b30', [s * 0.1, 1.69, 0.27], [0.038, 0.05, 0.015]); blob(g, '#ff8aa0', [s * 0.18, 1.6, 0.25], [0.05, 0.03, 0.01]); }
  box(g, 0.09, 0.015, 0.02, '#8a3a2a', [0, 1.57, 0.28]);
  for (const s of [-1, 1]) { // raised arms
    const a = new THREE.Group(); a.position.set(s * 0.55, 1.35, 0); a.rotation.z = s * -0.35; g.add(a);
    cyl(a, 0.11, 0.1, 0.6, skin, [0, 0.3, 0]); blob(a, skin, [0, 0.64, 0], [0.13, 0.13, 0.13]);
  }
  for (const s of [-1, 1]) blob(g, '#2b2b2b', [s * 0.24, 0.03, 0.08], [0.2, 0.06, 0.28]);
  return g;
}
