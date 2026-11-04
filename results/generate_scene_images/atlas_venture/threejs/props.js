// Shared Atlas Venture scene props + stage setup. All props face +x unless noted; feet/base on y = 0.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTitan } from './titan.js';
export { THREE, createTitan, rng, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);
const GOLD = () => mat('#f2b91c', { metalness: 0.5, roughness: 0.35 });

/** Standard stage: sky + grass ground. */
export function makeStage(opts = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 38), sunAzimuth: num('az', 150), shadowSize: opts.shadowSize ?? 4,
    sky: { cover: 1.5, seed: opts.seed ?? 5, towerTop: 0.5, puffCover: 1.5 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 },
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (opts.ground !== false) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(opts.ground ?? '#74b84a'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num, P };
}

/** Finish: toonify characters (set of root groups), clouds, camera. */
export function finishScene({ stage, num }, chars, cam) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam.pos[0]), num('cy', cam.pos[1]), num('cz', cam.pos[2]));
  stage.camera.lookAt(num('tx', cam.look[0]), num('ty', cam.look[1]), num('tz', cam.look[2] ?? 0));
  stage.finish();
}

/** Titan placed at world pos, facing yaw; hands IK'd to world points {l:[x,y,z], r:[..]}. */
export function placeTitan(scene, { pos, yaw = 0, scale = 1.3, armLen = 1, pose = {}, hands = {}, poles = {} }) {
  const t = createTitan({ scale, armLen }); t.position.set(...pos); t.rotation.y = yaw; scene.add(t);
  t.userData.pose(pose); t.updateMatrixWorld(true);
  for (const [k, w] of Object.entries(hands)) { const l = t.worldToLocal(new THREE.Vector3(...w)); t.userData.reach(k, [l.x, l.y, l.z], poles[k]); }
  return t;
}

export function coin(parent, pos, r = 0.05, rot = [Math.PI / 2, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
  cyl(g, GOLD(), [0, 0, 0], r, r * 0.22);
  cyl(g, mat('#c98a10', { metalness: 0.5, roughness: 0.4 }), [0, 0, 0], r * 0.7, r * 0.26);
  return g;
}

/** Heap of coins (mound + coins on top), radius R. */
export function coinHeap(parent, [x, y, z], R, seed = 3) {
  const r = rng(seed), g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  blob(g, GOLD(), [0, 0, 0], [R, R * 0.5, R]);
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * R * 0.85, h = R * 0.5 * Math.sqrt(Math.max(0, 1 - (d / R) ** 2));
    coin(g, [Math.cos(a) * d, h + R * 0.04, Math.sin(a) * d], R * 0.22, [r() * 1.2 + 0.2, r() * 6, r() * 0.8]);
  }
  return g;
}

/** Sack with tied neck; label = short canvas text on front (+z). */
export function bag({ color = '#c9a063', label = null, size = 1 } = {}) {
  const g = new THREE.Group();
  blob(g, mat(color), [0, 0.3, 0], [0.3, 0.3, 0.27]);
  blob(g, mat(color), [0, 0.52, 0], [0.19, 0.16, 0.17]);
  cyl(g, mat('#c0392b'), [0, 0.64, 0], 0.115, 0.05);
  blob(g, mat(color), [0.07, 0.76, 0], [0.12, 0.09, 0.1], [0, 0, -0.5]); blob(g, mat(color), [-0.07, 0.76, 0], [0.12, 0.09, 0.1], [0, 0, 0.5]);
  if (label) {
    const tex = canvasTexture(256, (ctx, s) => { ctx.fillStyle = '#fff6dc'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#b02a1e'; ctx.lineWidth = 10; ctx.strokeStyle = '#b02a1e'; ctx.strokeRect(8, 8, s - 16, s - 16);
      ctx.font = 'bold 120px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, s / 2, s / 2 + 8); });
    add(g, new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ map: tex }), [0, 0.3, 0.272]).scale.set(1, 1, 1);
    g.children[g.children.length - 1].material.map.colorSpace = THREE.SRGBColorSpace;
  }
  g.scale.setScalar(size); return g;
}

export function horse() {
  const g = new THREE.Group(), coat = mat('#a8643a'), dark = mat('#34211a'), white = mat('#f6efe4');
  blob(g, coat, [0, 0.82, 0], [0.62, 0.3, 0.26]); blob(g, coat, [0.45, 0.9, 0], [0.27, 0.32, 0.24]); blob(g, coat, [-0.46, 0.86, 0], [0.26, 0.3, 0.24]);
  cyl(g, coat, [0.66, 1.15, 0], 0.13, 0.55, [0, 0, -0.65], 0.19);
  const head = new THREE.Group(); head.position.set(0.9, 1.34, 0); head.rotation.z = -0.7; g.add(head);
  blob(head, coat, [0, 0, 0], [0.24, 0.13, 0.11]); blob(head, coat, [0.2, -0.02, 0], [0.14, 0.1, 0.09]); blob(head, white, [0.2, -0.0, 0], [0.04, 0.025, 0.1]);
  blob(head, dark, [0.32, -0.02, 0], [0.04, 0.05, 0.06]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [0.09, 0.055, s * 0.095], [0.04, 0.045, 0.02]); blob(head, mat('#1a1210'), [0.095, 0.055, s * 0.105], [0.026, 0.036, 0.02]);
    blob(head, mat('#fff'), [0.103, 0.065, s * 0.116], [0.01, 0.01, 0.008]);
    add(head, new THREE.ConeGeometry(0.04, 0.16, 12), coat, [-0.07, 0.15, s * 0.06], [s * 0.15, 0, 0.2]);
  }
  for (let i = 0; i < 8; i++) { const t = i / 7; blob(g, dark, [0.58 + 0.2 * t - 0.1, 1.38 - 0.35 * (1 - t) * 0 + 0.06 - 0.45 * (1 - t) * 0 - 0.0 + (t * 0.0), 0], [0.05, 0.08, 0.05], [0, 0, -0.65]).position.set(0.5 + 0.34 * t - 0.09, 1.0 + 0.4 * t + 0.1, 0); }
  for (const [x, z] of [[0.45, 0.14], [0.45, -0.14], [-0.46, 0.14], [-0.46, -0.14]]) {
    cyl(g, coat, [x, 0.4, z], 0.055, 0.8, [0, 0, 0], 0.075); cyl(g, white, [x, 0.07, z], 0.062, 0.14); cyl(g, dark, [x, 0.02, z], 0.07, 0.05);
  }
  add(g, new THREE.CylinderGeometry(0.03, 0.05, 0.6, 10), dark, [-0.76, 0.68, 0], [0, 0, 0.4]); blob(g, dark, [-0.86, 0.42, 0], [0.07, 0.2, 0.06], [0, 0, 0.4]);
  box(g, mat('#b8343a'), [0, 1.1, 0], [0.5, 0.05, 0.4]);
  return g;
}

/** Owl chick facing +z, ~0.6 tall. */
export function owl(scale = 1) {
  const g = new THREE.Group(), br = mat('#a9753f'), cream = mat('#f1dcae'), orange = mat('#f08a24');
  blob(g, br, [0, 0.3, 0], [0.26, 0.3, 0.22]); blob(g, cream, [0, 0.27, 0.12], [0.18, 0.22, 0.14]);
  blob(g, br, [0, 0.58, 0], [0.3, 0.22, 0.22]);
  for (const s of [-1, 1]) {
    blob(g, br, [s * 0.27, 0.3, 0], [0.07, 0.2, 0.15], [0, 0, s * 0.25]);
    add(g, new THREE.ConeGeometry(0.07, 0.17, 10), br, [s * 0.2, 0.8, 0], [0, 0, -s * 0.35]);
    blob(g, cream, [s * 0.12, 0.59, 0.19], [0.13, 0.14, 0.05]);
    blob(g, mat('#fff7d6'), [s * 0.12, 0.6, 0.225], [0.105, 0.11, 0.03]);
    blob(g, mat('#f2a81a'), [s * 0.12, 0.6, 0.245], [0.075, 0.08, 0.02]);
    blob(g, mat('#120a08'), [s * 0.12, 0.6, 0.262], [0.045, 0.05, 0.02]);
    blob(g, mat('#fff'), [s * 0.105, 0.625, 0.278], [0.018, 0.018, 0.01]);
    blob(g, orange, [s * 0.09, 0.04, 0.12], [0.07, 0.035, 0.09]);
  }
  add(g, new THREE.ConeGeometry(0.045, 0.11, 12), orange, [0, 0.52, 0.27], [Math.PI / 2, 0, 0]);
  g.scale.setScalar(scale); return g;
}

export function house({ wall = '#f1e3c4', roof = '#c0452e', w = 1.2, d = 0.9, h = 0.7 } = {}) {
  const g = new THREE.Group();
  box(g, mat(wall), [0, h / 2, 0], [w, h, d]);
  const rf = add(g, new THREE.CylinderGeometry(0, 1, 1, 4, 1), mat(roof), [0, h + 0.25, 0], [0, Math.PI / 4, 0], [w * 0.78, 0.5, d * 0.78 * 1.0]); rf.scale.set(w * 0.8, 0.5, d * 0.8);
  box(g, mat('#7a4a2a'), [0, 0.19, d / 2 + 0.01], [0.22, 0.38, 0.03]);
  for (const x of [-w * 0.3, w * 0.3]) { box(g, mat('#fff3b0', { emissive: '#ffcf50', emissiveIntensity: 0.6 }), [x, h * 0.58, d / 2 + 0.01], [0.2, 0.2, 0.03]); box(g, mat('#7a4a2a'), [x, h * 0.58, d / 2 + 0.02], [0.23, 0.025, 0.03]); }
  box(g, mat('#a35a3a'), [w * 0.25, h + 0.4, -d * 0.1], [0.1, 0.3, 0.1]);
  return g;
}

/** Potted sapling (a new company). */
export function sapling(scale = 1) {
  const g = new THREE.Group();
  cyl(g, mat('#c8643a'), [0, 0.1, 0], 0.11, 0.2, [0, 0, 0], 0.14); blob(g, mat('#5a3a22'), [0, 0.2, 0], [0.125, 0.03, 0.125]);
  cyl(g, mat('#5b8f2c'), [0, 0.32, 0], 0.014, 0.25);
  for (const [x, y, s] of [[-0.09, 0.4, -1], [0.09, 0.45, 1], [0, 0.5, 0]]) blob(g, mat('#4fc23c'), [x, y, 0], [0.1, 0.055, 0.04], [0, 0, s * 0.5]);
  g.scale.setScalar(scale); return g;
}

/** Ground rails along x, centred z; returns group. */
export function rails(len = 14, z = 0, gauge = 0.55) {
  const g = new THREE.Group(); g.position.z = z;
  for (let x = -len / 2; x < len / 2; x += 0.34) box(g, mat('#6b4426'), [x, 0.04, 0], [0.14, 0.06, gauge + 0.4]);
  for (const s of [-1, 1]) box(g, mat('#555b66', { metalness: 0.5 }), [0, 0.1, s * gauge / 2], [len, 0.06, 0.06]);
  box(g, mat('#a89b86'), [0, 0.01, 0], [len, 0.02, gauge + 1.0]);
  return g;
}

/** Steam locomotive + open coin wagon, facing +x. */
export function railwayCar({ coins = true } = {}) {
  const g = new THREE.Group(), red = mat('#c0392b'), black = mat('#2a2d34'), gold = mat('#e8b53c', { metalness: 0.5 });
  const wheel = (p, x, z, r) => { cyl(p, black, [x, r + 0.04, z], r, 0.06, [Math.PI / 2, 0, 0]); cyl(p, red, [x, r + 0.04, z * 1.02], r * 0.35, 0.07, [Math.PI / 2, 0, 0]); };
  // locomotive
  const L = new THREE.Group(); g.add(L);
  box(L, black, [0, 0.3, 0], [1.5, 0.12, 0.62]);
  cyl(L, mat('#2f6fa8'), [0.2, 0.62, 0], 0.27, 1.1, [0, 0, Math.PI / 2]);
  cyl(L, gold, [0.78, 0.62, 0], 0.285, 0.05, [0, 0, Math.PI / 2]);
  cyl(L, black, [0.55, 1.0, 0], 0.07, 0.35, [0, 0, 0], 0.1);
  blob(L, gold, [0.0, 0.92, 0], [0.12, 0.1, 0.12]);
  box(L, red, [-0.5, 0.78, 0], [0.5, 0.7, 0.62]); box(L, black, [-0.5, 1.16, 0], [0.62, 0.06, 0.74]);
  for (const s of [-1, 1]) box(L, mat('#fff3b0', { emissive: '#ffcf50', emissiveIntensity: 0.5 }), [-0.5, 0.85, s * 0.32], [0.22, 0.22, 0.02]);
  for (const x of [-0.55, 0.0, 0.5]) for (const s of [-1, 1]) wheel(L, x, s * 0.33, x === 0 ? 0.12 : 0.17);
  // wagon
  const W = new THREE.Group(); W.position.x = -1.75; g.add(W);
  box(W, mat('#7a4a2a'), [0, 0.32, 0], [1.5, 0.1, 0.7]);
  for (const s of [-1, 1]) box(W, mat('#9a5e34'), [0, 0.52, s * 0.35], [1.5, 0.36, 0.06]);
  for (const s of [-1, 1]) box(W, mat('#9a5e34'), [s * 0.75, 0.52, 0], [0.06, 0.36, 0.7]);
  for (const x of [-0.5, 0.5]) for (const s of [-1, 1]) wheel(W, x, s * 0.37, 0.14);
  if (coins) { coinHeap(W, [0, 0.62, 0], 0.62, 8); blob(W, gold, [0, 0.62, 0], [0.62, 0.3, 0.3]); }
  box(g, black, [-0.95, 0.3, 0], [0.3, 0.05, 0.06]);
  return g;
}
