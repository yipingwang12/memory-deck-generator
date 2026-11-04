// Shared winter-scene helpers for the Whitehead scenes.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, guard, rng };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, rt, rb, h, rot, seg = 24) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), m, pos, rot);

export function winterStage(P, o = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 30), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.4, ambient: { color: '#dfe8ff', intensity: 2.4 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(o.ground ?? '#e3ecf8'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num };
}
export const clouds = (stage) => stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);

export function pine(parent, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  cyl(g, mat('#5a3a22'), [0, 0.15, 0], 0.05, 0.07, 0.3, undefined, 10);
  for (let i = 0; i < 4; i++) {
    add(g, new THREE.ConeGeometry(0.4 - i * 0.08, 0.5, 18), mat('#2f6b4a'), [0, 0.45 + i * 0.28, 0]);
    add(g, new THREE.ConeGeometry(0.3 - i * 0.07, 0.15, 18), mat('#fbfdff'), [0, 0.62 + i * 0.28, 0]);
  }
  return g;
}
export function snowfall(scene, n = 120, seed = 3, box = [6, 3, 5], center = [0, 1.5, 0]) {
  const r = rng(seed), m = mat('#ffffff', { roughness: 0.3 });
  for (let i = 0; i < n; i++) blob(scene, m, [center[0] + (r() - .5) * box[0], center[1] + (r() - .5) * box[1], center[2] + (r() - .5) * box[2]], [0.012, 0.012, 0.012]);
}

// ---- characters (face +z, feet y=0, ~1 tall) ----
function eyes(head, r, y = 0.02) {
  for (const s of [-1, 1]) {
    const e = new THREE.Group(), n = new THREE.Vector3(s * 0.36, y / r, 1).normalize();
    e.position.copy(n).multiplyScalar(r + 0.001); e.lookAt(n.clone().multiplyScalar(2)); head.add(e);
    const d = (rx, ry, c, z, x = 0, yy = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x, yy, z); e.add(m); };
    d(r * 0.23, r * 0.3, '#fff', 0); d(r * 0.19, r * 0.26, '#3b2a1c', 0.001); d(r * 0.09, r * 0.15, '#0b0806', 0.002);
    d(r * 0.06, r * 0.06, '#fff', 0.003, -r * 0.06, r * 0.1);
  }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(r * 0.1, r * 0.02, 6, 14, Math.PI), mat('#7a2a2a')); mo.rotation.z = Math.PI; mo.position.set(0, -r * 0.42, r * 0.92); head.add(mo);
}
export function person({ coat = '#2a2a33', skin = '#ffd9b8', hair = '#3a2a1c', h = 1, kind = 'plain', trim = '#ffffff' } = {}) {
  const g = new THREE.Group(), cm = mat(coat), HR = 0.15;
  cyl(g, cm, [0, 0.4, 0], 0.15, 0.24, 0.8, undefined, 28);              // robe / coat cone
  blob(g, mat(skin), [0, 0.88, 0], [HR, HR * 1.05, HR]);
  const head = g.children[g.children.length - 1]; head.castShadow = true;
  const fh = new THREE.Group(); fh.position.set(0, 0.88, 0); g.add(fh); eyes(fh, HR);
  blob(g, mat(hair), [0, 0.96, -0.05], [HR * 1.03, HR * 0.92, HR * 0.9]);
  if (kind === 'preacher') {
    cyl(g, mat('#ffffff'), [0, 0.76, 0.03], 0.1, 0.12, 0.05, [0.2, 0, 0], 20);   // white collar
    box(g, mat('#ffffff'), [0, 0.7, 0.14], [0.05, 0.12, 0.01]);
  }
  if (kind === 'page') {
    cyl(g, mat('#d8323a'), [0, 1.04, 0], 0.115, 0.14, 0.1, undefined, 24);       // pillbox cap
    for (const y of [0.55, 0.45, 0.35]) blob(g, mat('#e9c24a', { metalness: 0.5 }), [0, y, 0.2], [0.022, 0.022, 0.022]);
  }
  if (kind === 'bartender') {
    box(g, mat('#f6f1e6'), [0, 0.6, 0.115], [0.2, 0.36, 0.04]);                  // shirt front under vest
    box(g, mat('#14141a'), [0, 0.7, 0.14], [0.12, 0.05, 0.02], [0, 0, 0.0]);
    blob(g, mat('#14141a'), [-0.05, 0.75, 0.15], [0.035, 0.025, 0.02]); blob(g, mat('#14141a'), [0.05, 0.75, 0.15], [0.035, 0.025, 0.02]);
    cyl(g, mat('#14141a'), [0, 1.0, 0], 0.07, 0.1, 0.04, undefined, 20); 
  }
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.17, 0.72, 0); g.add(a);
    cyl(a, cm, [0, -0.13, 0], 0.036, 0.04, 0.28, undefined, 12); blob(a, mat(skin), [0, -0.29, 0], [0.04, 0.04, 0.04]); a.name = s > 0 ? 'armL' : 'armR'; }
  g.scale.setScalar(h); return g;
}
export function lamb() {
  const g = new THREE.Group(), wool = mat('#fffaf0', { roughness: 1 }), dark = mat('#2b2420');
  blob(g, wool, [0, 0.22, 0], [0.22, 0.17, 0.15]);
  for (const [x, y, z] of [[-0.12, 0.3, 0.06], [0.1, 0.32, -0.05], [0, 0.34, 0.07], [-0.1, 0.28, -0.08], [0.15, 0.24, 0.08], [-0.18, 0.2, 0]]) blob(g, wool, [x, y, z], [0.1, 0.09, 0.09]);
  const head = new THREE.Group(); head.position.set(0.24, 0.3, 0); g.add(head);
  blob(head, dark, [0, 0, 0], [0.095, 0.1, 0.08]); blob(head, mat('#fffaf0', { roughness: 1 }), [-0.01, 0.1, 0], [0.07, 0.04, 0.06]);
  for (const s of [-1, 1]) { blob(head, dark, [-0.03, 0.03, s * 0.09], [0.07, 0.025, 0.035], [s * 0.4, 0, -0.2]);
    blob(head, mat('#fff'), [0.07, 0.03, s * 0.05], [0.03, 0.04, 0.025]); blob(head, mat('#0b0806'), [0.087, 0.03, s * 0.055], [0.017, 0.025, 0.015]);
    blob(head, mat('#fff'), [0.095, 0.04, s * 0.06], [0.006, 0.006, 0.006]); }
  blob(head, mat('#e8a0a0'), [0.095, -0.02, 0], [0.02, 0.015, 0.025]);
  for (const [x, z] of [[0.13, 0.07], [0.13, -0.07], [-0.13, 0.07], [-0.13, -0.07]]) cyl(g, dark, [x, 0.07, z], 0.025, 0.02, 0.16, undefined, 8);
  return g;
}
export function hen() {
  const g = new THREE.Group(), w = mat('#f7efe0');
  blob(g, w, [0, 0.16, 0], [0.17, 0.14, 0.13]); blob(g, w, [0.13, 0.27, 0], [0.07, 0.09, 0.06]);
  blob(g, mat('#d8323a'), [0.13, 0.37, 0], [0.025, 0.04, 0.012]);
  add(g, new THREE.ConeGeometry(0.02, 0.07, 10), mat('#f2a21a'), [0.21, 0.27, 0], [0, 0, -Math.PI / 2]);
  for (const s of [-1, 1]) { blob(g, mat('#0b0806'), [0.17, 0.3, s * 0.05], [0.014, 0.018, 0.01]); blob(g, mat('#fff'), [0.175, 0.31, s * 0.055], [0.005, 0.005, 0.005]); }
  blob(g, w, [-0.17, 0.22, 0], [0.07, 0.1, 0.04], [0, 0, 0.6]);
  blob(g, mat('#efe3c8'), [0, 0.15, 0.1], [0.13, 0.1, 0.03], [0, 0, 0.1]);
  return g;
}
export function egg(color = '#fff6e4') { return new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat(color, { roughness: 0.4 })); }
export function pose(g, side, x, y, z) { const a = g.getObjectByName(side === 'l' ? 'armL' : 'armR'); a.rotation.set(x, y, z); }
// Cut a wedge out of the snowman's belly (front, +z) and floor it, for "inside the SNOWMAN" scenes.
export function openBelly(sm, wedge = 1.5) {
  const base = sm.userData.parts.base, r = 0.25;
  base.geometry = new THREE.SphereGeometry(r, 48, 32, Math.PI / 2 + wedge / 2, Math.PI * 2 - wedge);
  base.material = new THREE.MeshStandardMaterial({ color: '#fbfdff', roughness: 0.85, side: THREE.DoubleSide });
  const inner = new THREE.Mesh(new THREE.SphereGeometry(r - 0.004, 48, 32, Math.PI / 2 + wedge / 2, Math.PI * 2 - wedge), new THREE.MeshStandardMaterial({ color: '#cfe0f4', roughness: 1, side: THREE.BackSide }));
  inner.position.y = base.position.y; sm.add(inner);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 40), mat('#9a6a3e')); floor.position.set(0, 0.07, 0); sm.add(floor);
  return sm;
}
export const lbox = (p, c, pos, size) => box(p, mat(c), pos, size);
