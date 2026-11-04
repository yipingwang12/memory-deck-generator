// Shared scene helpers for the Beam deck: stage + anchor placement + small prop builders.
// run({ ground, gAt, gRot, gScale, pose, cam, look, fov, build(ctx) }); ctx = { scene, girder, reach(key,[x,y,z] world) }.
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createGirder } from './girder.js';
export { THREE };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const glow = (c, i = 1.6) => mat(c, { emissive: c, emissiveIntensity: i });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, r, h, pos, rot, seg = 28) => add(p, new THREE.CylinderGeometry(r, r, h, seg), m, pos, rot);
export const box = (p, m, w, h, d, pos, rot) => add(p, new THREE.BoxGeometry(w, h, d), m, pos, rot);
export const cone = (p, m, r, h, pos, rot) => add(p, new THREE.ConeGeometry(r, h, 24), m, pos, rot);
export const group = (p, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) => { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); g.scale.setScalar(s); p.add(g); return g; };

/** Flat text plane (canvas texture); fg on bg, optional border. Text shrinks to fit. */
export function label(text, w, h, { bg = '#ffffff', fg = '#1a1a1a', border = null } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  if (border) { x.strokeStyle = border; x.lineWidth = 16; x.strokeRect(8, 8, c.width - 16, c.height - 16); }
  const lines = text.split('\n'); let px = c.height / lines.length * 0.72;
  x.font = `800 ${px}px Arial Black, Arial, sans-serif`;
  const wide = Math.max(...lines.map((l) => x.measureText(l).width)); if (wide > c.width * 0.86) { px *= c.width * 0.86 / wide; x.font = `800 ${px}px Arial Black, Arial, sans-serif`; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => x.fillText(l, c.width / 2, c.height * (i + 0.5) / lines.length));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 1 }));
  return m;
}

export function eyes(p, { x = 0, y = 0, z = 0, gap = 0.08, r = 0.04, closed = false } = {}) {
  for (const s of [-1, 1]) {
    if (closed) { const a = add(p, new THREE.TorusGeometry(r, r * 0.22, 8, 20, Math.PI), mat('#1a1010'), [x + s * gap, y, z], [0, 0, Math.PI]); continue; }
    blob(p, mat('#fff'), [x + s * gap, y, z], [r * 1.2, r * 1.5, r * 0.4]);
    blob(p, mat('#1a1a2a', { roughness: 0.3 }), [x + s * gap, y - r * 0.1, z + r * 0.2], [r * 0.85, r * 1.2, r * 0.3]);
    blob(p, mat('#fff'), [x + s * gap - r * 0.3, y + r * 0.4, z + r * 0.45], [r * 0.3, r * 0.3, r * 0.15]);
  }
}

export const coin = (p, pos, r = 0.13, rot = [Math.PI / 2, 0, 0]) => { const c = group(p, pos, rot); cyl(c, mat('#ffc81e', { metalness: 0.5, roughness: 0.3 }), r, r * 0.22, [0, 0, 0]); cyl(c, mat('#e09a00', { metalness: 0.5 }), r * 0.72, r * 0.26, [0, 0, 0]); return c; };
export const bubble = (p, pos, r, color = '#9fd8ff') => { const g = group(p, pos); blob(g, mat(color, { transparent: true, opacity: 0.55, roughness: 0.1, emissive: color, emissiveIntensity: 0.25 }), [0, 0, 0], [r, r, r]); blob(g, mat('#fff', { emissive: '#fff', emissiveIntensity: 1 }), [-r * 0.4, r * 0.45, r * 0.7], [r * 0.2, r * 0.12, r * 0.08]); return g; };
export function sack(p, pos, s = 1, tag = null) {
  const g = group(p, pos, [0, 0, 0], s), m = mat('#b98a52');
  blob(g, m, [0, 0.4, 0], [0.5, 0.4, 0.45]); blob(g, m, [0, 0.82, 0], [0.22, 0.2, 0.2]);
  cyl(g, mat('#7a4a22'), 0.2, 0.06, [0, 0.74, 0]); for (const a of [-0.12, 0.12]) blob(g, m, [a, 1.02, 0], [0.12, 0.14, 0.1], [0, 0, a * 3]);
  if (tag) { const l = label(tag, 0.5, 0.26, { bg: '#fff6d8', fg: '#2a6a2a', border: '#2a6a2a' }); l.position.set(0, 0.35, 0.5); g.add(l); }
  return g;
}
export function flag(p, pos, color, h = 0.6, tilt = 0) {
  const g = group(p, pos, [0, 0, tilt]); cyl(g, mat('#e8e2d6'), 0.012, h, [0, h / 2, 0], [0, 0, 0], 8);
  box(g, mat(color), 0.3, 0.2, 0.02, [0.15, h - 0.12, 0]); return g;
}
export function liver(p, pos, s = 1) {
  const g = group(p, pos, [0, 0, 0], s), m = mat('#a8402f', { roughness: 0.4 }), d = mat('#c0553f', { roughness: 0.4 });
  blob(g, m, [-0.25, 0.3, 0], [0.7, 0.35, 0.38], [0, 0, 0.12]); blob(g, d, [0.4, 0.22, 0.05], [0.4, 0.26, 0.33], [0, 0, -0.25]);
  blob(g, m, [0.0, 0.1, 0.1], [0.4, 0.14, 0.3]); blob(g, mat('#5fae3a'), [0.15, 0.02, 0.28], [0.1, 0.08, 0.09]);
  eyes(g, { x: -0.18, y: 0.34, z: 0.36, gap: 0.14, r: 0.06 });
  const sm = mat('#7a2a22'); const mo = add(g, new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), sm, [-0.18, 0.2, 0.37], [0, 0, Math.PI]); return g;
}
/** Quadruped facing +x, ~0.9 tall. kind 'dog' | 'fox'. Snout tip ~ (0.76, 0.65, 0). */
export function animal(kind) {
  const fox = kind === 'fox', g = new THREE.Group();
  const coat = mat(fox ? '#ee7b1e' : '#c98a4a'), pale = mat(fox ? '#fff1de' : '#f1dcb8'), dark = mat(fox ? '#3a2418' : '#6a4426');
  blob(g, coat, [0, 0.45, 0], [0.45, 0.22, 0.2]); blob(g, coat, [0.27, 0.5, 0], [0.2, 0.23, 0.18]); blob(g, pale, [0.1, 0.35, 0], [0.4, 0.1, 0.16]);
  const head = group(g, [0.5, 0.68, 0]);
  blob(head, coat, [0, 0, 0], [0.18, 0.16, 0.15]); blob(head, pale, [0.16, -0.035, 0], [0.12, 0.075, 0.075]); blob(head, mat('#1a1214'), [0.265, -0.005, 0], [0.032, 0.03, 0.04]);
  if (fox) blob(head, pale, [0.02, -0.07, 0], [0.12, 0.07, 0.15]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [0.09, 0.04, s * 0.115], [0.05, 0.062, 0.025]); blob(head, mat('#1a1a2a'), [0.1, 0.035, s * 0.13], [0.033, 0.047, 0.02]); blob(head, mat('#fff'), [0.108, 0.058, s * 0.145], [0.012, 0.014, 0.01]);
    if (fox) { const e = cone(head, coat, 0.075, 0.22, [-0.05, 0.2, s * 0.08], [s * 0.1, 0, 0.12]); cone(head, dark, 0.04, 0.14, [-0.045, 0.19, s * 0.085], [s * 0.1, 0, 0.12]); }
    else blob(head, dark, [-0.02, 0.0, s * 0.16], [0.07, 0.13, 0.04], [s * 0.2, 0, 0.25]);
  }
  for (const [x, z] of [[0.34, 0.11], [0.34, -0.11], [-0.32, 0.11], [-0.32, -0.11]]) { cyl(g, coat, 0.05, 0.34, [x, 0.2, z]); blob(g, pale, [x + 0.02, 0.04, z], [0.085, 0.05, 0.065]); }
  if (fox) { blob(g, coat, [-0.7, 0.42, 0], [0.38, 0.13, 0.13], [0, 0, 0.35]); blob(g, pale, [-0.98, 0.52, 0], [0.13, 0.1, 0.1], [0, 0, 0.35]); }
  else { cyl(g, coat, 0.035, 0.4, [-0.52, 0.62, 0], [0, 0, 0.7]); }
  return g;
}

export function run({ ground = '#d9c29a', gAt = [-1.1, 0, 0.2], gRot = 0.35, gScale = 1.15, pose = {}, cam = [0.2, 0.9, 3.9], look = [0.2, 0.65, 0], fov = 40, build }) {
  guard(() => {
    const stage = createAnimeStage({ fov, sunElevation: 35, sunAzimuth: 150, exposure: 1, sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2 },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 } });
    const scene = stage.scene;
    add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const girder = createGirder({ scale: gScale }); girder.position.set(...gAt); girder.rotation.y = gRot; scene.add(girder);
    girder.userData.pose(pose);
    const reach = (k, w) => { scene.updateMatrixWorld(true); const t = girder.worldToLocal(new THREE.Vector3(...w)); girder.userData.reach(k, [t.x, t.y, t.z]); };
    build?.({ scene, girder, reach });
    const gm = new Set(); girder.traverse((o) => gm.add(o));
    stage.toonify(scene, (m) => gm.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look);
    stage.finish();
  });
}
