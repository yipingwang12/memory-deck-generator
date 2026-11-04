// Shared scene helpers + props for the Dewpoint scenes: boot() stage/anchor setup, small mesh builders, cue props.
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createDewdrop } from './dewdrop.js';

export { THREE };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, r, h, pos, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const box = (p, m, w, h, d, pos, rot) => add(p, new THREE.BoxGeometry(w, h, d), m, pos, rot);
const basic = (c) => new THREE.MeshBasicMaterial({ color: c });

/** Flat text plane (canvas texture), unlit so it always reads. */
export function textPlane(text, w, h, { fg = '#111', bg = null, font = 'bold', px = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = px * 2; c.height = Math.round(px * 2 * h / w);
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = c.height * 0.8; x.font = `${font} ${size}px Arial, Helvetica, sans-serif`;
  while (x.measureText(text).width > c.width * 0.92) { size *= 0.93; x.font = `${font} ${size}px Arial, Helvetica, sans-serif`; }
  x.fillText(text, c.width / 2, c.height / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg }));
  return m;
}

/** Stage + anchor + camera. build(ctx) adds props; ctx = { scene, stage, dd, num }. */
export function boot(build, o = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', o.fov ?? 40), sunElevation: o.el ?? 35, sunAzimuth: o.az ?? 150, exposure: o.exp ?? 1,
      sky: { cover: 1.5, seed: 5, towerTop: 0.5, puffCover: 1.5, ...(o.sky ?? {}) },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.5, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    add(scene, new THREE.PlaneGeometry(400, 400), mat(o.ground ?? '#6fae45'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const d = o.dd ?? {};
    const dd = createDewdrop({ scale: d.scale ?? 1.3 });
    dd.position.set(...(d.pos ?? [-0.9, 0, 0.6])); dd.rotation.y = d.ry ?? 0.35; scene.add(dd);
    if (d.pose) dd.userData.pose(d.pose);
    dd.updateMatrixWorld(true);
    build({ scene, stage, dd, num, THREE });
    const set = new Set(); dd.traverse((m) => set.add(m));
    stage.toonify(scene, (m) => set.has(m));
    if (o.clouds !== false) stage.addClouds([[150, 900, 90, 1.2], [190, 1300, 200, 2.2], [230, 1000, 120, 1.6], [260, 950, 70, 0.9]]);
    const c = o.cam ?? [0.3, 1.5, 4.8], l = o.look ?? [0.1, 1.2, 0];
    stage.camera.position.set(num('cx', c[0]), num('cy', c[1]), num('cz', c[2]));
    stage.camera.lookAt(num('tx', l[0]), num('ty', l[1]), num('tz', l[2]));
    stage.finish();
  });
}

/** Make the anchor's hand reach a WORLD point. */
export function reachWorld(dd, key, p) {
  dd.updateMatrixWorld(true);
  const t = dd.worldToLocal(new THREE.Vector3(...p)); dd.userData.reach(key, [t.x, t.y, t.z]);
}

/** Solid protein droplet: glossy sphere with a highlight and optional dots. */
export function droplet(r, color = '#ffe9a8', dots = 0, dotColors = ['#e8483c', '#3a7be0', '#3fae4f']) {
  const g = new THREE.Group();
  blob(g, mat(color, { roughness: 0.4 }), [0, 0, 0], [r, r, r]);
  blob(g, basic('#fffdf0'), [-r * 0.35, r * 0.4, r * 0.8], [r * 0.2, r * 0.1, r * 0.05], [0, -0.4, 0.5]);
  for (let i = 0; i < dots; i++) {
    const a = i * 2.4, b = (i % 5) / 5 * 1.6 - 0.5, rr = r * 0.97;
    blob(g, mat(dotColors[i % dotColors.length]), [rr * Math.cos(a) * Math.cos(b), rr * Math.sin(b), rr * Math.sin(a) * Math.cos(b)], [r * 0.09, r * 0.09, r * 0.09]);
  }
  return g;
}

/** SCRIBE: round little robed figure with a quill and a scroll; smooth and handle-less. */
export function scribe(robe = '#7a46c8', s = 1) {
  const g = new THREE.Group(), skin = mat('#ffd9b8'), pap = mat('#fff1c8');
  cyl(g, mat(robe), 0.2, 0.42, [0, 0.21, 0], [0, 0, 0], 0.1);
  blob(g, skin, [0, 0.52, 0], [0.13, 0.13, 0.13]);
  cyl(g, mat('#2b2250'), 0.19, 0.06, [0, 0.62, 0], [0, 0, 0], 0.15); cyl(g, mat('#2b2250'), 0.09, 0.14, [0, 0.69, 0], [0, 0, 0], 0.09);
  for (const x of [-0.05, 0.05]) { blob(g, basic('#fff'), [x, 0.53, 0.115], [0.034, 0.042, 0.01]); blob(g, basic('#1a1230'), [x, 0.53, 0.123], [0.02, 0.028, 0.01]); }
  const sc = cyl(g, pap, 0.04, 0.2, [0.13, 0.3, 0.14], [0, 0, Math.PI / 2]); sc.rotation.z = Math.PI / 2;
  cyl(g, mat('#e8d090'), 0.045, 0.01, [0.03, 0.3, 0.14], [0, 0, Math.PI / 2]);
  const q = new THREE.Group(); q.position.set(-0.16, 0.34, 0.1); q.rotation.z = 0.5; g.add(q);
  cyl(q, mat('#ffffff'), 0.012, 0.3, [0, 0.15, 0]); blob(q, mat('#ffffff'), [0, 0.3, 0], [0.04, 0.12, 0.012]);
  g.scale.setScalar(s); return g;
}

/** Fish with a beta flank mark; length ~1 * s, faces +x. */
export function fish(color = '#2f9bd8', s = 1, label = 'β') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.45 });
  blob(g, m, [0, 0, 0], [0.5, 0.28, 0.18]);
  add(g, new THREE.ConeGeometry(0.22, 0.4, 4), m, [-0.62, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.35]);
  add(g, new THREE.ConeGeometry(0.14, 0.24, 4), m, [0, 0.3, 0], [0, 0, 0.1], [1, 1, 0.3]);
  for (const z of [-1, 1]) { blob(g, basic('#fff'), [0.32, 0.08, z * 0.15], [0.07, 0.08, 0.03]); blob(g, basic('#10131f'), [0.34, 0.08, z * 0.172], [0.04, 0.05, 0.02]); }
  for (const z of [-1, 1]) { const t = textPlane(label, 0.3, 0.3, { fg: '#fffbe8', px: 128 }); t.position.set(-0.02, -0.02, z * 0.185); if (z < 0) t.rotation.y = Math.PI; g.add(t); }
  g.scale.setScalar(s); return g;
}

/** CRAB: red, claws up, eye stalks. ~0.5 wide * s. */
export function crab(s = 1) {
  const g = new THREE.Group(), m = mat('#e0392f', { roughness: 0.45 }), dk = mat('#a81f1b');
  blob(g, m, [0, 0.12, 0], [0.25, 0.12, 0.18]);
  for (const x of [-1, 1]) {
    cyl(g, m, 0.025, 0.2, [x * 0.2, 0.28, 0.06], [0, 0, x * -0.5]);
    blob(g, m, [x * 0.33, 0.4, 0.06], [0.1, 0.09, 0.06]); blob(g, dk, [x * 0.38, 0.47, 0.06], [0.04, 0.06, 0.04], [0, 0, x * 0.5]);
    cyl(g, dk, 0.012, 0.1, [x * 0.07, 0.27, 0.12]); blob(g, basic('#fff'), [x * 0.07, 0.34, 0.12], [0.035, 0.035, 0.035]); blob(g, basic('#111'), [x * 0.07, 0.34, 0.148], [0.018, 0.018, 0.01]);
    for (let i = 0; i < 3; i++) cyl(g, dk, 0.012, 0.2, [x * 0.26, 0.07, -0.06 + i * 0.06], [0, 0, x * 1.1]);
  }
  g.scale.setScalar(s); return g;
}

/** Weapon: long blade with its code on it; hilt at the origin, blade along +y. */
export function sword(label = 'DPTX3186', len = 1.5) {
  const g = new THREE.Group(), steel = mat('#dfeaf5', { roughness: 0.25, metalness: 0.4 });
  cyl(g, mat('#7a3b1c'), 0.035, 0.28, [0, -0.05, 0]); blob(g, mat('#e2b13c'), [0, -0.2, 0], [0.06, 0.06, 0.06]);
  box(g, mat('#e2b13c'), 0.34, 0.06, 0.07, [0, 0.1, 0]);
  box(g, steel, 0.24, len, 0.04, [0, 0.13 + len / 2, 0]);
  add(g, new THREE.ConeGeometry(0.12, 0.2, 4), steel, [0, 0.13 + len + 0.1, 0], [0, Math.PI / 4, 0], [1, 1, 0.33]);
  const t = textPlane(label, len * 0.92, 0.2, { fg: '#0d2b6b', px: 256 }); t.rotation.z = -Math.PI / 2; t.position.set(0, 0.13 + len / 2, 0.025); g.add(t);
  return g;
}

/** Simple pine for snowy scenes. */
export function pine(h = 2.2, snow = true) {
  const g = new THREE.Group();
  cyl(g, mat('#6a4326'), 0.1, h * 0.25, [0, h * 0.125, 0]);
  for (let i = 0; i < 3; i++) { const r = 0.6 * (1 - i * 0.25) * h / 2.2; add(g, new THREE.ConeGeometry(r, h * 0.45, 8), mat('#2f7d4a'), [0, h * (0.35 + i * 0.22), 0]); if (snow) add(g, new THREE.ConeGeometry(r * 0.72, h * 0.2, 8), mat('#ffffff'), [0, h * (0.43 + i * 0.22), 0]); }
  return g;
}

/** Cylinder between two points (limbs, rods). */
export function bone(parent, m, a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 14), m, A.clone().add(B).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}

/** Simple face on +z of a head sphere of radius r at the group origin. */
export function eyes(parent, r, y = 0.1, gap = 0.4, big = 0.2) {
  for (const s of [-1, 1]) {
    const x = s * r * gap, z = Math.sqrt(r * r - x * x - y * y) - 0.002;
    blob(parent, basic('#fff'), [x, y, z], [r * big, r * big * 1.2, r * 0.05]);
    blob(parent, basic('#1a1230'), [x, y - r * 0.02, z + 0.004], [r * big * 0.6, r * big * 0.85, r * 0.05]);
    blob(parent, basic('#fff'), [x - r * 0.03, y + r * 0.05, z + 0.01], [r * 0.04, r * 0.04, r * 0.03]);
  }
}

/** Generic wooden/plain wall at z. */
export function wall(scene, color, z = -2, w = 40, h = 16) { return add(scene, new THREE.PlaneGeometry(w, h), mat(color), [0, h / 2 - 0.5, z]); }

/** Snow-flake dots. */
export function snow(scene, n = 80, box = [10, 5, 5], center = [0, 2.5, 0]) {
  for (let i = 0; i < n; i++) { const r = (k) => Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1; blob(scene, new THREE.MeshBasicMaterial({ color: '#ffffff' }), [center[0] + (r(1) - 0.5) * box[0], center[1] + (r(2) - 0.5) * box[1], center[2] + (r(3) - 0.5) * box[2]], [0.035, 0.035, 0.035]); }
}
