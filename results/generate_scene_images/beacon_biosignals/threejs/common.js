// Shared helpers for beacon_biosignals scene pages.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createBeacon } from './beacon.js';
export { THREE, guard, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);

/** Flat plane showing canvas text. */
export function textPlane(text, w, h, { bg = '#fff8e6', fg = '#2a2a2a', font = 'bold', px = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = px * w / h > px ? px * 2 : px * 2; c.height = Math.round(c.width * h / w);
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = c.height * 0.8; x.font = `${font} ${fs}px Helvetica, Arial, sans-serif`;
  while (x.measureText(text).width > c.width * 0.9) { fs *= 0.92; x.font = `${font} ${fs}px Helvetica, Arial, sans-serif`; }
  x.fillText(text, c.width / 2, c.height / 2 + fs * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg }));
}

/** Fluffy cloud; face = true adds sleepy anime eyes on +z. */
export function makeCloud(s = 1, { color = '#f4f0ff', face = false, open = false } = {}) {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.9 });
  [[0, 0, 0, 0.5], [0.45, -0.05, 0, 0.4], [-0.45, -0.05, 0, 0.4], [0.2, 0.3, 0, 0.38], [-0.2, 0.28, 0, 0.36], [0.8, -0.12, 0, 0.27], [-0.8, -0.12, 0, 0.27], [0, -0.12, 0.25, 0.4]]
    .forEach(([x, y, z, r]) => blob(g, m, [x, y, z], [r, r, r]));
  if (face) for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 20, Math.PI), mat('#3b2f63')); e.rotation.z = Math.PI; e.position.set(sx * 0.2, 0.02, 0.63); g.add(e);
    blob(g, mat('#ff9fb4'), [sx * 0.34, -0.1, 0.55], [0.07, 0.04, 0.02]);
  }
  if (open) blob(g, mat('#5a1f4a'), [0, -0.15, 0.62], [0.07, 0.09, 0.03]);
  g.scale.setScalar(s); return g;
}

/** Gold coin stack with $. */
export function coinStack(n = 6, r = 0.3) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) add(g, new THREE.CylinderGeometry(r, r, 0.07, 28), mat('#f2b82a', { metalness: 0.6, roughness: 0.3 }), [(i % 2) * 0.03, 0.04 + i * 0.075, 0]);
  const t = textPlane('$', r * 1.4, r * 1.4, { bg: null, fg: '#a86a00' }); t.rotation.x = -Math.PI / 2; t.position.y = 0.04 + n * 0.075; g.add(t);
  return g;
}

/** Bed with sleeper (head + blanket), headband optional. Faces +z, ~1.4 wide. */
export function makeBed({ blanket = '#4a7bd0', headband = false } = {}) {
  const g = new THREE.Group();
  box(g, mat('#8a5a34'), [0, 0.18, 0], [1.4, 0.2, 0.8]);
  box(g, mat('#f5f1e8'), [0, 0.35, 0], [1.3, 0.16, 0.72]);
  box(g, mat('#ffffff'), [-0.45, 0.5, 0], [0.4, 0.14, 0.45]);
  blob(g, mat('#ffd9b8'), [-0.45, 0.62, 0], [0.19, 0.19, 0.19]);
  for (const sz of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12, Math.PI), mat('#2a1a10')); e.rotation.z = Math.PI; e.position.set(-0.45 + sz * 0.07, 0.64, 0.17); g.add(e); }
  if (headband) add(g, new THREE.TorusGeometry(0.17, 0.025, 8, 24), mat('#ffffff'), [-0.45, 0.67, 0], [Math.PI / 2, 0, 0]);
  box(g, mat(blanket), [0.1, 0.52, 0], [0.9, 0.17, 0.78]);
  box(g, mat('#8a5a34'), [-0.72, 0.4, 0], [0.06, 0.6, 0.8]);
  return g;
}

/** Setup stage + ground; returns helpers. opts: ground colour, sun. */
export function setup({ ground = '#6fae45', el = 22, sky = {}, exposure = 1 } = {}) {
  const stage = createAnimeStage({
    fov: 40, sunElevation: el, sunAzimuth: 150, exposure,
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene };
}

export function beacon(scene, { x = -0.9, z = 0, s = 1, yaw = 0.2, pose = {} } = {}) {
  const b = createBeacon({ scale: s }); b.position.set(x, 0, z); b.rotation.y = yaw; scene.add(b);
  b.userData.pose({ mouth: 'smile', ...pose }); return b;
}

/** Toonify listed characters, add clouds, aim camera, finish. */
export function wrap(stage, scene, chars, cam = {}) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]);
  const { pos = [0.1, 0.8, 4], look = [0.1, 0.65, 0] } = cam;
  stage.camera.position.set(...pos); stage.camera.lookAt(...look); stage.finish();
}
