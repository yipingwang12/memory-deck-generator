// Shared scene helpers for Takeda: stage setup, primitives, bean-people, text signs.
import * as THREE from 'three';
import { guard, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTaco } from './taco.js';
export { THREE, guard, canvasTexture, createTaco };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, w, h, d, c, pos, rot) => add(p, new THREE.BoxGeometry(w, h, d), c, pos, rot);
export const cyl = (p, rt, rb, h, c, pos, rot, seg = 24) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), c, pos, rot);
export const ball = (p, r, c, pos, scl = [1, 1, 1], rot) => add(p, new THREE.SphereGeometry(r, 32, 20), c, pos, rot, scl);

/** Canvas text texture material on a plane. */
export function textPlane(text, w, h, { bg = '#ffffff', fg = '#1a1a1a', px = 160, font = 'bold' } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let f = px; ctx.font = `${font} ${f}px Helvetica, Arial, sans-serif`;
    while (ctx.measureText(text).width > s * 0.9 && f > 10) { f -= 4; ctx.font = `${font} ${f}px Helvetica, Arial, sans-serif`; }
    ctx.fillText(text, s / 2, s / 2 + 6);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

/** Anime eyes on a front-facing sphere of radius r at height y (z = front surface). */
export function eyes(parent, y, z, spread, size) {
  for (const s of [-1, 1]) {
    const e = (rx, ry, c, dz, dx = 0, dy = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: c })); m.scale.set(rx, ry, 1); m.position.set(s * spread + dx, y + dy, z + dz); parent.add(m); };
    e(size, size * 1.25, '#ffffff', 0); e(size * 0.75, size, '#3a2416', 0.001); e(size * 0.4, size * 0.6, '#120a08', 0.002);
    e(size * 0.22, size * 0.22, '#ffffff', 0.003, -size * 0.2, size * 0.3);
  }
}

/** Bean person facing +z, ~1.0 tall. opts: body, skin, hat, tie. Returns Group; userData.arms {l,r} pivot groups. */
export function person({ body = '#3b5fa8', skin = '#ffd9b8', hair = '#3a2a20', scale = 1, robe = false } = {}) {
  const g = new THREE.Group();
  if (robe) cyl(g, 0.12, 0.3, 0.7, body, [0, 0.38, 0]); else { cyl(g, 0.15, 0.17, 0.4, body, [0, 0.55, 0]); for (const s of [-1, 1]) cyl(g, 0.05, 0.05, 0.35, '#2c2f45', [s * 0.07, 0.17, 0]); }
  const head = ball(g, 0.17, skin, [0, 0.9, 0]); eyes(g, 0.9, 0.165, 0.065, 0.028);
  if (hair) ball(g, 0.175, hair, [0, 0.93, -0.03], [1, 0.9, 1]);
  const arms = {};
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.18, 0.7, 0); cyl(a, 0.04, 0.04, 0.3, body, [0, -0.15, 0]); ball(a, 0.045, skin, [0, -0.32, 0]); g.add(a); arms[s > 0 ? 'l' : 'r'] = a; }
  g.userData.arms = arms; g.userData.head = head; g.scale.setScalar(scale); return g;
}

/** Standard stage. Returns { stage, scene, num, P }. */
export function setup({ sky = {}, ground = '#7fbf5a', groundSize = 400, sunAz = 150, cover = 1.5, seed = 5, fov = 40 } = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', 38), sunAzimuth: num('az', sunAz), exposure: num('exp', 1),
    sky: { cover, seed, towerTop: 0.5, puffCover: 1.5, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num, P };
}

/** Toonify characters (anchor + people), add clouds, aim camera, finish. */
export function wrap(stage, chars, cam, look, clouds = true) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}
