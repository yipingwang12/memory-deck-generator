// Shared helpers for Sanofi scenes: materials, mesh adders, stage + anchor setup, props.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSunflower } from './sunflower.js';
export { THREE, guard, canvasTexture, rng, createSunflower };

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);

export function labelTex(text, bg, fg, w = 256, h = 256, size = 120) {
  return canvasTexture(w, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg;
    ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2);
  });
}

export function makeStage({ ground = '#6fae45', sky = {}, el = 35, az = 150 } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}

export function placeSunflower(stage, { pos = [0, 0, 0], ry = 0, scale = 1.6, pose = {}, reach = null } = {}) {
  const s = createSunflower({ scale }); s.position.set(...pos); s.rotation.y = ry; stage.scene.add(s);
  s.userData.pose({ arms: { l: [0, 0.5, 0], r: [0, 0.5, 0] }, ...pose });
  if (reach) { s.updateMatrixWorld(true); for (const [k, w] of Object.entries(reach)) { const t = s.worldToLocal(new THREE.Vector3(...w)); s.userData.reach(k, [t.x / 1, t.y / 1, t.z / 1].map((v) => v)); } }
  return s;
}

export function finish(stage, flower, cam = {}, clouds = true) {
  const pm = new Set(); flower.traverse((o) => pm.add(o));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]);
  stage.camera.position.set(num('cx', cam.pos?.[0] ?? 0), num('cy', cam.pos?.[1] ?? 1), num('cz', cam.pos?.[2] ?? 4));
  stage.camera.lookAt(num('tx', cam.at?.[0] ?? 0), num('ty', cam.at?.[1] ?? 0.8), num('tz', cam.at?.[2] ?? 0));
  stage.finish();
}

export function bee(scale = 1) {
  const g = new THREE.Group(), y = mat('#ffcf1f'), k = mat('#1d1a18');
  blob(g, y, [0, 0, 0], [0.12, 0.09, 0.09]);
  for (const x of [-0.03, 0.03]) cyl(g, k, [x, 0, 0], 0.0905, 0.025, [0, 0, Math.PI / 2]).scale.set(1, 1, 1);
  blob(g, y, [0.13, 0.02, 0], [0.07, 0.065, 0.065]);
  blob(g, k, [0.19, 0.03, 0.03], [0.012, 0.016, 0.01]); blob(g, k, [0.19, 0.03, -0.03], [0.012, 0.016, 0.01]);
  blob(g, mat('#fff'), [0.195, 0.034, 0.032], [0.005, 0.006, 0.004]);
  add(g, new THREE.ConeGeometry(0.015, 0.05, 8), k, [-0.14, 0, 0], [0, 0, Math.PI / 2]);
  const wm = mat('#e8f6ff', { transparent: true, opacity: 0.75 });
  for (const s of [-1, 1]) blob(g, wm, [0, 0.1, s * 0.07], [0.07, 0.012, 0.09], [s * 0.5, 0, 0]);
  for (const s of [-1, 1]) { add(g, new THREE.CylinderGeometry(0.004, 0.004, 0.07, 5), k, [0.19, 0.09, s * 0.015], [s * 0.2, 0, -0.5]); }
  g.scale.setScalar(scale); return g;
}

export function tiles(n, size, a, b) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) box(g, mat((i + j) % 2 ? a : b), [i * size, 0, j * size], [size * 0.96, 0.03, size * 0.96]);
  return g;
}

export function person(color = '#ffffff', hair = '#3a2a20') {
  const g = new THREE.Group(), skin = mat('#f2c9a0');
  cyl(g, mat(color), [0, 0.2, 0], 0.09, 0.32, [0, 0, 0], 0.07);
  blob(g, skin, [0, 0.43, 0], [0.065, 0.07, 0.065]); blob(g, mat(hair), [0, 0.46, -0.01], [0.07, 0.05, 0.07]);
  for (const s of [-1, 1]) cyl(g, mat('#2c3550'), [s * 0.035, 0.02, 0], 0.025, 0.12);
  return g;
}
