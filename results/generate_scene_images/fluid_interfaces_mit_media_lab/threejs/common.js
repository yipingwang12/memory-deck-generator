// Shared scene kit for the Fluid Interfaces scenes: stage, school-by-river backdrop, flute helpers, prop primitives.
import * as THREE from 'three';
import { rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createFlute } from './flute.js';

export { THREE, createFlute };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, w, h, d, c, pos, rot, e) => add(p, new THREE.BoxGeometry(w, h, d), mat(c, e), pos, rot);
export const cyl = (p, rt, rb, h, c, pos, rot, e) => add(p, new THREE.CylinderGeometry(rt, rb, h, 32), mat(c, e), pos, rot);
export const ball = (p, c, pos, scl, e) => add(p, new THREE.SphereGeometry(1, 32, 20), mat(c, e), pos, [0, 0, 0], scl);

/** Stage + meadow + river + school. opts: school:[x,z], clouds. Returns { stage, scene, num, flutes, finish }. */
export function setup({ school = [-3.2, -6], river = true, sky = {} } = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: 35, sunAzimuth: 150,
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene, flutes = [];
  add(scene, new THREE.PlaneGeometry(400, 400), mat('#72b648'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  if (river) add(scene, new THREE.PlaneGeometry(400, 3.2), mat('#4fb2e6', { roughness: 0.25 }), [0, 0.01, -5.2], [-Math.PI / 2, 0, 0]);
  const r = rng(4);
  for (let i = 0; i < 70; i++) add(scene, new THREE.SphereGeometry(0.035, 8, 6), mat(['#ffd84a', '#ffffff', '#ff8fa8'][i % 3]), [(r() - 0.5) * 12, 0.035, -1 - r() * 2.5]);
  buildSchool(scene, school);
  const finish = (toonSkip = []) => {
    const skip = new Set(); toonSkip.forEach((g) => g.traverse((o) => skip.add(o)));
    const fm = new Set(); flutes.forEach((f) => f.traverse((o) => fm.add(o)));
    stage.toonify(scene, (m) => fm.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.finish();
  };
  return { stage, scene, num, flutes, finish };
}

export function buildSchool(scene, [x, z]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  box(g, 5, 2.2, 1.6, '#f0d9a8', [0, 1.1, 0]);
  add(g, new THREE.CylinderGeometry(0.01, 1.35, 1.0, 4), mat('#c4524a'), [0, 2.7, 0], [0, Math.PI / 4, 0], [2.7, 1, 0.95]);
  for (const wx of [-1.8, -0.9, 0.9, 1.8]) box(g, 0.5, 0.65, 0.05, '#8fd0f2', [wx, 1.3, 0.83]);
  box(g, 0.7, 1.1, 0.06, '#7a4a2a', [0, 0.55, 0.83]);
  box(g, 0.5, 1.2, 0.5, '#e8d09a', [2.1, 2.9, -0.2]); // bell tower
  add(g, new THREE.ConeGeometry(0.42, 0.5, 4), mat('#c4524a'), [2.1, 3.75, -0.2], [0, Math.PI / 4, 0]);
  return g;
}

/** Place a flute: opts { s, x, z, ry, pose, color, reach:[hand,[x,y,z]] } */
export function placeFlute(env, { s = 1.1, x = 0, z = 0, ry = 0.3, pose = {}, color, reach, track = true } = {}) {
  const f = createFlute({ scale: s, ...(color ? { bodyColor: color } : {}) });
  f.position.set(x, 0, z); f.rotation.y = ry; env.scene.add(f);
  f.userData.pose(pose);
  if (reach) { f.updateMatrixWorld(true); const t = f.worldToLocal(new THREE.Vector3(...reach[1])); f.userData.reach(reach[0], [t.x, t.y, t.z]); }
  if (track) env.flutes.push(f);
  return f;
}

export function setCam(env, d = {}) {
  const { num, stage } = env;
  stage.camera.position.set(num('cx', d.cx ?? 0), num('cy', d.cy ?? 1.1), num('cz', d.cz ?? 4.8));
  stage.camera.lookAt(num('tx', d.tx ?? 0), num('ty', d.ty ?? 0.8), 0);
}

export const paperSheet = (p, w = 1.1, h = 1.4, pos = [0, 0, 0], rot = [0, 0, 0], lines = true) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); p.add(g);
  box(g, w, h, 0.04, '#fffdf4');
  if (lines) for (let i = 0; i < 6; i++) box(g, w * (i === 0 ? 0.5 : 0.75), 0.035, 0.012, '#6b86b8', [i === 0 ? -w * 0.12 : 0, h * 0.32 - i * h * 0.12, 0.028]);
  return g;
};

export const pencilProp = (p, pos, rot, len = 1.0) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); p.add(g);
  const r = 0.07;
  add(g, new THREE.CylinderGeometry(r, r, len, 6), mat('#f7c820'), [0, len / 2, 0]);
  add(g, new THREE.ConeGeometry(r, 0.2, 6), mat('#efc58a'), [0, -0.1, 0], [Math.PI, 0, 0]);
  add(g, new THREE.ConeGeometry(0.025, 0.06, 12), mat('#2b2b30'), [0, -0.21, 0], [Math.PI, 0, 0]);
  add(g, new THREE.CylinderGeometry(r, r, 0.1, 12), mat('#f4909c'), [0, len + 0.05, 0]);
  return g;
};

export const coin = (p, pos, r = 0.2) => {
  const c = add(p, new THREE.CylinderGeometry(r, r, r * 0.22, 32), mat('#ffcb2e', { metalness: 0.6, roughness: 0.3 }), pos, [Math.PI / 2, 0, 0]);
  add(p, new THREE.TorusGeometry(r * 0.72, r * 0.05, 8, 32), mat('#e09a10', { metalness: 0.6 }), [pos[0], pos[1], pos[2] + r * 0.12]);
  return c;
};
