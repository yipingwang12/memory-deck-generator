// Shared helpers + props for the Nabla Bio scenes (own file; kit symlinks stay untouched).
import * as THREE from 'three';
import { rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTriangle } from './triangle.js';
export { THREE, createTriangle, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r, seg = 28) => add(p, new THREE.CylinderGeometry(r2, r, h, seg), m, pos, rot);
const UP = new THREE.Vector3(0, 1, 0);
export function bar(p, a, b, r, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 10), m);
  c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  c.castShadow = true; p.add(c); return c;
}
export function labelTex(draw, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export const textTex = (text, bg, fg, w = 512, h = 256, font = 'bold 150px Arial Black, Arial, sans-serif') => labelTex((ctx) => {
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 8);
}, w, h);
export function sign(p, tex, w, h, pos, rot = [0, 0, 0], transparent = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent, side: THREE.DoubleSide }));
  m.position.set(...pos); m.rotation.set(...rot); p.add(m); return m;
}

export function base(P, o = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', o.fov ?? 40), sunElevation: o.el ?? 35, sunAzimuth: o.az ?? 150, exposure: o.exp ?? 1,
    sky: { cover: 2, seed: o.seed ?? 5, towerTop: 0.5, puffCover: 2, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (o.ground !== null) {
    const g = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(o.ground ?? '#6fae45'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    g.castShadow = false;
  }
  return { stage, scene: stage.scene, num };
}

export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];
export function done(S, anchors, cam, look, clouds = CLOUDS) {
  const { stage, scene, num } = S, set = new Set();
  for (const a of anchors) a.traverse((m) => set.add(m));
  stage.toonify(scene, (m) => set.has(m));
  if (clouds) stage.addClouds(clouds);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0));
  stage.finish();
}
export function triangle(S, { scale = 1.5, pos = [0, 0, 0], ry = 0, pose = {}, color } = {}) {
  const t = createTriangle({ scale: S.num('ts', scale), color }); t.position.set(...pos); t.rotation.y = ry;
  t.userData.pose({ arms: { l: [0, 0.5, 0], r: [0, -0.5, 0] }, legs: { l: [0.1, 0], r: [-0.1, 0] }, ...pose });
  S.scene.add(t); return t;
}
// world point -> triangle-local reach target
export function reachWorld(t, hand, v) { t.updateMatrixWorld(true); const l = t.worldToLocal(new THREE.Vector3(...v)); t.userData.reach(hand, [l.x, l.y, l.z]); }

// ---------- props ----------
export function ant() {
  const g = new THREE.Group(), blk = mat('#6b2a1c'), red = mat('#d2452f');
  blob(g, blk, [-0.55, 0.55, 0], [0.5, 0.38, 0.36]); blob(g, red, [0, 0.58, 0], [0.26, 0.22, 0.24]);
  blob(g, blk, [0.45, 0.66, 0], [0.26, 0.24, 0.24]);
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [0.6, 0.72, s * 0.15], [0.09, 0.11, 0.07]); blob(g, mat('#10142a'), [0.64, 0.72, s * 0.19], [0.05, 0.075, 0.04]);
    blob(g, mat('#fff'), [0.66, 0.75, s * 0.22], [0.016, 0.02, 0.012]);
    bar(g, [0.6, 0.85, s * 0.1], [0.82, 1.18, s * 0.2], 0.018, blk); blob(g, blk, [0.82, 1.18, s * 0.2], [0.04, 0.04, 0.04]);
    [-0.1, 0.1, 0.3].forEach((x, i) => {
      const z = s * 0.2, out = s * (0.5 + (i === 1 ? 0.08 : 0)), kneeY = 0.9 - i * 0.05;
      bar(g, [x, 0.55, z], [x + (i - 1) * 0.15, kneeY, out * 0.8], 0.045, blk); bar(g, [x + (i - 1) * 0.15, kneeY, out * 0.8], [x + (i - 1) * 0.32, 0.03, out], 0.04, blk);
    });
  }
  g.scale.setScalar(1.0); return g;
}
export function launchBox() {
  const g = new THREE.Group(), card = mat('#c99a5b'), dk = mat('#a77a40');
  box(g, card, [0, 0.55, -0.55], [1.9, 1.1, 0.12]); box(g, card, [-0.95, 0.55, 0], [0.12, 1.1, 1.2]); box(g, card, [0.95, 0.55, 0], [0.12, 1.1, 1.2]);
  box(g, dk, [0, 0.04, 0], [1.9, 0.08, 1.2]); box(g, card, [0, 0.4, 0.58], [1.9, 0.8, 0.12]);
  box(g, card, [-0.55, 1.15, 0.65], [0.9, 0.05, 0.5], [-0.9, 0, 0.2]); box(g, card, [0.55, 1.15, 0.65], [0.9, 0.05, 0.5], [-0.9, 0, -0.2]);
  box(g, dk, [0, 1.15, -0.8], [1.9, 0.05, 0.5], [0.9, 0, 0]);
  const rk = textTex('', '#ffffff00', '#000'); rk.dispose();
  sign(g, labelTex((c, w, h) => {
    c.fillStyle = '#e63b2e'; c.beginPath(); c.moveTo(w / 2, 20); c.quadraticCurveTo(w / 2 + 70, 110, w / 2 + 50, 200); c.lineTo(w / 2 - 50, 200); c.quadraticCurveTo(w / 2 - 70, 110, w / 2, 20); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, 100, 22, 0, 7); c.fill(); c.fillStyle = '#ff9d1a'; c.beginPath(); c.moveTo(w / 2 - 40, 200); c.lineTo(w / 2, 245); c.lineTo(w / 2 + 40, 200); c.fill();
    c.fillStyle = '#e63b2e'; c.fillRect(w / 2 - 100, 170, 50, 60); c.fillRect(w / 2 + 50, 170, 50, 60);
  }, 512, 256), 1.0, 0.5, [0, 0.45, 0.65], [0, 0, 0], true);
  return g;
}
export function church() {
  const g = new THREE.Group(), brick = mat('#b3503a'), trim = mat('#f4efe6'), roof = mat('#4b4a58'), glass = mat('#7fb7e8', { roughness: 0.3 });
  box(g, brick, [0, 0.9, -1.2], [2.4, 1.8, 3.2]);
  const rs = new THREE.Shape(); rs.moveTo(-1.35, 0); rs.lineTo(1.35, 0); rs.lineTo(0, 0.85); rs.closePath();
  const rg = new THREE.ExtrudeGeometry(rs, { depth: 3.4, bevelEnabled: false }); add(g, rg, roof, [0, 1.8, -2.9]);
  box(g, brick, [0, 1.25, 0.6], [1.4, 2.5, 1.2]); box(g, trim, [0, 2.52, 0.6], [1.55, 0.1, 1.35]);
  box(g, brick, [0, 3.1, 0.6], [1.0, 1.1, 1.0]); box(g, trim, [0, 3.68, 0.6], [1.12, 0.08, 1.12]);
  cyl(g, roof, [0, 4.75, 0.6], 0.55, 2.1, [0, 0, 0], 0.0, 4).rotation.y = Math.PI / 4;
  box(g, mat('#e6b73a', { metalness: 0.6 }), [0, 5.95, 0.6], [0.06, 0.4, 0.06]); box(g, mat('#e6b73a', { metalness: 0.6 }), [0, 5.98, 0.6], [0.26, 0.06, 0.06]);
  const arch = new THREE.Shape(); arch.moveTo(-0.38, 0); arch.lineTo(0.38, 0); arch.lineTo(0.38, 0.9); arch.absarc(0, 0.9, 0.38, 0, Math.PI, false); arch.lineTo(-0.38, 0);
  add(g, new THREE.ShapeGeometry(arch), mat('#2b1a22'), [0, 0, 1.215]);
  const glow = add(g, new THREE.ShapeGeometry(arch), new THREE.MeshBasicMaterial({ color: '#ffe08a' }), [0, 0, 1.22], [0, 0, 0], [0.8, 0.8, 1]);
  for (const s of [-1, 1]) { add(g, new THREE.BoxGeometry(0.3, 1.5, 0.05), mat('#5b3320'), [s * 0.5, 0.75, 1.35], [0, s * -1.0, 0]).geometry.translate(s * 0.0, 0, 0); }
  for (const [x, y, z, ry] of [[1.21, 1.0, -0.2, 1], [1.21, 1.0, -1.6, 1], [-1.21, 1.0, -0.2, -1], [-1.21, 1.0, -1.6, -1]]) {
    const a = new THREE.Shape(); a.moveTo(-0.22, 0); a.lineTo(0.22, 0); a.lineTo(0.22, 0.5); a.absarc(0, 0.5, 0.22, 0, Math.PI, false); a.lineTo(-0.22, 0);
    add(g, new THREE.ShapeGeometry(a), glass, [x, y - 0.35, z], [0, ry * Math.PI / 2, 0]);
  }
  return g;
}
export function crown(scale = 1) {
  const g = new THREE.Group(), gold = mat('#f2b91c', { metalness: 0.7, roughness: 0.3 });
  cyl(g, gold, [0, 0.1, 0], 0.32, 0.2, [0, 0, 0], 0.3, 32);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(g, new THREE.ConeGeometry(0.075, 0.3, 4), gold, [Math.sin(a) * 0.29, 0.34, Math.cos(a) * 0.29]); blob(g, mat('#e8344a', { roughness: 0.2 }), [Math.sin(a) * 0.29, 0.52, Math.cos(a) * 0.29], [0.05, 0.05, 0.05]); }
  sign(g, textTex('CEO', '#b98a0f', '#fff', 256, 128, 'bold 90px Arial Black, Arial'), 0.34, 0.14, [0, 0.1, 0.327]);
  g.scale.setScalar(scale); return g;
}
export function surge() {
  const g = new THREE.Group(), water = mat('#3aa6ea', { roughness: 0.15, transparent: true, opacity: 0.88 }), foam = mat('#e8f7ff');
  blob(g, water, [0, 0.75, 0], [0.7, 0.85, 0.62]); blob(g, water, [0, 0.25, 0], [1.0, 0.3, 0.9]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(g, new THREE.ConeGeometry(0.1, 0.45, 8), water, [Math.sin(a) * 1.0, 0.45, Math.cos(a) * 0.9], [Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6]); }
  for (const [x, y, z, r] of [[-0.9, 1.2, 0.2, 0.08], [1.0, 1.4, 0, 0.07], [0.8, 1.7, 0.3, 0.06], [-0.7, 1.7, 0, 0.05]]) blob(g, water, [x, y, z], [r, r * 1.3, r]);
  blob(g, foam, [-0.3, 1.45, 0.1], [0.25, 0.1, 0.2]); blob(g, foam, [0.3, 1.5, 0.1], [0.2, 0.09, 0.18]);
  for (const s of [-1, 1]) { blob(g, mat('#fff'), [s * 0.24, 0.85, 0.55], [0.14, 0.17, 0.05]); blob(g, mat('#0e2a5e'), [s * 0.24, 0.84, 0.59], [0.09, 0.13, 0.04]); blob(g, mat('#fff'), [s * 0.22, 0.9, 0.62], [0.035, 0.04, 0.02]); }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 16, Math.PI), mat('#0e2a5e')); m.rotation.z = Math.PI; m.position.set(0, 0.62, 0.6); g.add(m);
  return g;
}
const FONT = { P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'] };
export function beadLetter(ch, size = 0.05, cols = ['#5a5a5a', '#2f6fe0', '#e23b3b', '#f2f2f2']) {
  const g = new THREE.Group(), ms = cols.map((cc) => mat(cc, { roughness: 0.3 })); let k = 0;
  FONT[ch].forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') blob(g, ms[(k++) % ms.length], [(i - 2) * size * 2.1, (3 - j) * size * 2.1, 0], [size, size, size]); }));
  return g;
}
export function book() {
  const g = new THREE.Group(), cover = mat('#2f5fb8'), pg = mat('#fbf6e8');
  for (const s of [-1, 1]) {
    const half = new THREE.Group(); half.rotation.z = s * -0.12; g.add(half);
    box(half, cover, [s * 0.5, 0, 0], [1.0, 0.06, 0.8]); box(half, pg, [s * 0.5, 0.07, 0], [0.92, 0.1, 0.74]);
    for (let i = 0; i < 4; i++) box(half, mat('#3b3b4a'), [s * 0.5, 0.125, -0.25 + i * 0.16], [0.7, 0.004, 0.025]);
  }
  return g;
}
export function coin(r = 0.5, text = 'F') {
  const g = new THREE.Group(), gold = mat('#f2b91c', { metalness: 0.7, roughness: 0.3 }), face = (z) => sign(g, textTex(text, null, '#8a5a00', 256, 256, 'bold 170px Arial Black, Arial'), r * 1.3, r * 1.3, [0, 0, z], [0, z < 0 ? Math.PI : 0, 0], true);
  cyl(g, gold, [0, 0, 0], r, r * 0.22, [Math.PI / 2, 0, 0]); add(g, new THREE.TorusGeometry(r * 0.88, r * 0.04, 8, 40), gold, [0, 0, r * 0.115]); add(g, new THREE.TorusGeometry(r * 0.88, r * 0.04, 8, 40), gold, [0, 0, -r * 0.115]);
  face(r * 0.13); face(-r * 0.13); return g;
}
export function moneyBag(text = 'VC') {
  const g = new THREE.Group(), sack = mat('#a47a45');
  blob(g, sack, [0, 0.42, 0], [0.5, 0.45, 0.45]); cyl(g, sack, [0, 0.85, 0], 0.16, 0.3, [0, 0, 0], 0.22, 20); add(g, new THREE.TorusGeometry(0.2, 0.04, 8, 20), mat('#b8342a'), [0, 0.78, 0], [Math.PI / 2, 0, 0]);
  blob(g, sack, [0.12, 1.05, 0], [0.22, 0.1, 0.12], [0, 0, 0.5]); blob(g, sack, [-0.12, 1.05, 0], [0.22, 0.1, 0.12], [0, 0, -0.5]);
  sign(g, textTex(text, null, '#fff3d0', 256, 256, 'bold 130px Arial Black, Arial'), 0.5, 0.5, [0, 0.42, 0.455], [0, 0, 0], true);
  return g;
}
export function flag(h = 1.2, w = 0.8) {
  const g = new THREE.Group();
  cyl(g, mat('#ddd', { metalness: 0.5 }), [0, h / 2, 0], 0.02, h, [0, 0, 0]); blob(g, mat('#f2b91c', { metalness: 0.7 }), [0, h + 0.02, 0], [0.04, 0.04, 0.04]);
  const tex = labelTex((c, W, H) => { c.fillStyle = '#2a4fc0'; c.fillRect(0, 0, W / 3, H); c.fillStyle = '#fff'; c.fillRect(W / 3, 0, W / 3, H); c.fillStyle = '#e03a3a'; c.fillRect(2 * W / 3, 0, W / 3, H); }, 300, 200);
  sign(g, tex, w, w * 0.66, [w / 2 + 0.02, h - w * 0.33 - 0.02, 0]);
  return g;
}
export function jar(label = 'JAM', { r = 0.42, h = 0.75, fill = 0.8, opacity = 1, lid = true } = {}) {
  const g = new THREE.Group(), jam = mat('#a8142a', { roughness: 0.25, transparent: opacity < 1, opacity });
  cyl(g, jam, [0, h * fill / 2, 0], r, h * fill, [0, 0, 0], r, 36);
  cyl(g, mat('#dcecf5'), [0, h * (fill + 1) / 2 - 0.01, 0], r * 0.97, h * (1 - fill) + 0.02, [0, 0, 0], r * 0.97, 36);
  box(g, mat('#ffffff'), [-r * 0.83, h * 0.5, r * 0.55], [0.03, h * 0.7, 0.03], [0, 0.55, 0]);
  if (lid) cyl(g, mat('#e8b41c', { metalness: 0.6, roughness: 0.3 }), [0, h + 0.07, 0], r * 0.82, 0.14, [0, 0, 0], r * 0.84, 36);
  const lt = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.34, 36, 1, true, -0.95, 1.9), new THREE.MeshBasicMaterial({ map: textTex(label, '#fff7e0', '#b0142a', 512, 256, `bold ${label.length > 3 ? 120 : 160}px Arial Black, Arial`) }));
  lt.position.y = h * 0.27; lt.renderOrder = 4; g.add(lt);
  return g;
}
export function molecule(spec, s = 0.12) {
  const g = new THREE.Group(), cs = { C: '#8a8a95', N: '#3b6fe0', O: '#e23b3b', H: '#f2f2f2', S: '#f2c230' };
  for (const [e, x, y, z] of spec.atoms) blob(g, mat(cs[e], { roughness: 0.25 }), [x * s, y * s, z * s], [s * 0.5, s * 0.5, s * 0.5]);
  for (const [a, b] of spec.bonds) bar(g, spec.atoms[a].slice(1).map((v) => v * s), spec.atoms[b].slice(1).map((v) => v * s), s * 0.1, mat('#f0f0f0'));
  return g;
}
export const CHAIN = { atoms: [['N', 0, 0, 0], ['C', 1.5, 0.8, 0], ['C', 3, 0, 0], ['O', 3, -1.4, 0], ['N', 4.4, 0.8, 0], ['C', 5.9, 0, 0], ['C', 7.4, 0.8, 0], ['S', 7.4, 2.4, 0], ['O', 8.8, 0, 0]], bonds: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [6, 8]] };
export function phone(draw) {
  const g = new THREE.Group();
  box(g, mat('#1c1c26', { roughness: 0.3 }), [0, 0, 0], [0.95, 1.7, 0.08]);
  sign(g, labelTex(draw, 380, 700), 0.85, 1.56, [0, 0, 0.045]);
  return g;
}
export function person({ shirt = '#c92f2f', pants = '#2b3b6a', skin = '#f1c9a0', hat = null, fist = false } = {}) {
  const g = new THREE.Group(), s = mat(skin);
  for (const k of [-1, 1]) { bar(g, [k * 0.1, 0.5, 0], [k * 0.1, 0.06, 0], 0.07, mat(pants)); blob(g, mat('#2a1a14'), [k * 0.1, 0.04, 0.05], [0.09, 0.05, 0.14]); }
  blob(g, mat(shirt), [0, 0.85, 0], [0.27, 0.4, 0.2]); blob(g, s, [0, 1.42, 0], [0.19, 0.21, 0.19]);
  for (const k of [-1, 1]) { blob(g, mat('#fff'), [k * 0.075, 1.45, 0.17], [0.05, 0.06, 0.02]); blob(g, mat('#1a120e'), [k * 0.075, 1.45, 0.185], [0.03, 0.04, 0.015]); }
  blob(g, mat('#3a2418'), [0, 1.52, -0.03], [0.2, 0.15, 0.2]);
  if (hat === 'beret') { blob(g, mat('#d62b2b'), [0.04, 1.62, 0], [0.24, 0.07, 0.22], [0, 0, 0.15]); blob(g, mat('#f2c230'), [0.04, 1.69, 0], [0.04, 0.04, 0.04]); }
  if (hat === 'hard') { blob(g, mat('#f2c230'), [0, 1.6, 0], [0.22, 0.12, 0.22]); }
  bar(g, [-0.25, 1.05, 0], [-0.36, 0.7, 0.05], 0.05, mat(shirt)); blob(g, s, [-0.37, 0.66, 0.06], [0.06, 0.06, 0.06]);
  bar(g, [0.25, 1.05, 0], fist ? [0.42, 1.55, 0.05] : [0.38, 0.72, 0.1], 0.05, mat(shirt)); blob(g, s, fist ? [0.43, 1.6, 0.05] : [0.39, 0.68, 0.1], [0.07, 0.07, 0.07]);
  return g;
}
export function koala() {
  const g = new THREE.Group(), gr = mat('#8d939c'), lt = mat('#e8e8ea'), dk = mat('#1a1a22');
  blob(g, gr, [0, 0.6, 0], [0.4, 0.5, 0.34]); blob(g, lt, [0, 0.55, 0.22], [0.26, 0.35, 0.16]);
  blob(g, gr, [0, 1.3, 0], [0.38, 0.33, 0.3]);
  for (const s of [-1, 1]) {
    blob(g, gr, [s * 0.36, 1.45, 0], [0.2, 0.2, 0.08]); blob(g, mat('#f2b8c4'), [s * 0.36, 1.45, 0.06], [0.12, 0.12, 0.03]);
    blob(g, mat('#fff'), [s * 0.14, 1.34, 0.26], [0.07, 0.09, 0.03]); blob(g, dk, [s * 0.14, 1.33, 0.285], [0.045, 0.065, 0.02]); blob(g, mat('#fff'), [s * 0.13, 1.37, 0.3], [0.015, 0.02, 0.01]);
    blob(g, gr, [s * 0.14, 0.12, 0.05], [0.14, 0.12, 0.2]); bar(g, [s * 0.34, 0.9, 0], [s * 0.4, 1.4, 0.1], 0.07, gr); blob(g, gr, [s * 0.41, 1.45, 0.1], [0.09, 0.09, 0.09]);
  }
  blob(g, dk, [0, 1.24, 0.3], [0.1, 0.14, 0.07]); return g;
}
export function zebra() {
  const tex = labelTex((c, w, h) => { c.fillStyle = '#fafafa'; c.fillRect(0, 0, w, h); c.fillStyle = '#15151a'; for (let i = 0; i < 12; i++) c.fillRect(i * w / 12, 0, w / 24, h); }, 256, 64), st = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  const g = new THREE.Group(), dk = mat('#15151a');
  blob(g, st, [0, 0.8, 0], [0.72, 0.36, 0.3]); blob(g, st, [0.55, 1.05, 0], [0.22, 0.34, 0.2], [0, 0, -0.5]);
  const head = new THREE.Group(); head.position.set(0.82, 1.38, 0); head.rotation.z = -0.3; g.add(head);
  blob(head, st, [0, 0, 0], [0.3, 0.17, 0.15]); blob(head, mat('#e8d6c8'), [0.26, -0.04, 0], [0.14, 0.12, 0.12]); blob(head, dk, [0.36, -0.02, 0], [0.04, 0.05, 0.06]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [0.1, 0.06, s * 0.13], [0.05, 0.06, 0.025]); blob(head, dk, [0.12, 0.06, s * 0.15], [0.035, 0.045, 0.02]); blob(head, mat('#fff'), [0.125, 0.08, s * 0.165], [0.012, 0.014, 0.01]);
    add(head, new THREE.ConeGeometry(0.06, 0.22, 12), st, [-0.12, 0.2, s * 0.07]); 
  }
  for (let i = 0; i < 6; i++) blob(g, dk, [0.6 - i * 0.08, 1.42 + i * 0.04 - 0.02, 0], [0.04, 0.12, 0.03], [0, 0, -0.5]);
  for (const [x, z] of [[0.5, 0.15], [0.5, -0.15], [-0.5, 0.15], [-0.5, -0.15]]) { cyl(g, st, [x, 0.34, z], 0.06, 0.68, [0, 0, 0], 0.045); cyl(g, dk, [x, 0.04, z], 0.065, 0.08, [0, 0, 0]); }
  bar(g, [-0.72, 0.9, 0], [-0.9, 0.4, 0], 0.025, dk); return g;
}
export function star(r = 0.8) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  s.closePath();
  const g = new THREE.Group(), geo = new THREE.ExtrudeGeometry(s, { depth: r * 0.25, bevelEnabled: true, bevelSize: r * 0.06, bevelThickness: r * 0.06, bevelSegments: 3 });
  geo.translate(0, 0, -r * 0.125); add(g, geo, mat('#ffd21f', { metalness: 0.5, roughness: 0.3, emissive: '#7a5a00', emissiveIntensity: 0.4 }));
  for (const k of [-1, 1]) { blob(g, mat('#fff'), [k * r * 0.2, r * 0.0, r * 0.2], [r * 0.09, r * 0.11, 0.02]); blob(g, mat('#1a1a40'), [k * r * 0.2, -r * 0.01, r * 0.22], [r * 0.055, r * 0.08, 0.02]); }
  return g;
}
export function bus() {
  const g = new THREE.Group(), red = mat('#d9342b'), glass = mat('#9fd2f2', { roughness: 0.2 });
  box(g, red, [0, 0.85, 0], [2.6, 1.2, 1.1]); box(g, mat('#fff'), [0, 0.6, 0.555], [2.6, 0.12, 0.02]);
  for (let i = 0; i < 4; i++) box(g, glass, [-0.9 + i * 0.6, 1.1, 0.56], [0.45, 0.4, 0.02]); box(g, glass, [1.2, 1.0, 0.56], [0.3, 0.55, 0.02]);
  box(g, glass, [1.31, 1.05, 0], [0.02, 0.45, 0.9]);
  sign(g, textTex('BMS', '#ffffff', '#c8201a', 512, 160, 'bold 120px Arial Black, Arial'), 1.3, 0.38, [-0.45, 0.5, 0.57]);
  for (const x of [-0.85, 0.85]) for (const z of [-0.5, 0.5]) { cyl(g, mat('#222'), [x, 0.28, z], 0.28, 0.2, [Math.PI / 2, 0, 0]); cyl(g, mat('#ccc', { metalness: 0.6 }), [x, 0.28, z * 1.08], 0.13, 0.04, [Math.PI / 2, 0, 0]); }
  for (const z of [-0.4, 0.4]) blob(g, mat('#ffeb9a', { emissive: '#ffdd55', emissiveIntensity: 0.6 }), [1.3, 0.55, z], [0.04, 0.09, 0.09]);
  return g;
}
export function taco() {
  const g = new THREE.Group(), shell = new THREE.MeshStandardMaterial({ color: '#f0bf4a', roughness: 0.6, side: THREE.DoubleSide });
  const R = 0.5, L = 1.2;
  add(g, new THREE.CylinderGeometry(R, R, L, 40, 1, true, Math.PI, Math.PI), shell, [0, 0.55, 0], [0, 0, Math.PI / 2]);
  for (const x of [-L / 2, L / 2]) add(g, new THREE.CircleGeometry(R, 32, Math.PI, Math.PI), shell, [x, 0.55, 0], [0, Math.PI / 2, 0]);
  blob(g, mat('#7a4a2a'), [0, 0.6, 0], [0.5, 0.2, 0.32]);
  const r = rng(5); for (let i = 0; i < 12; i++) blob(g, mat(i % 3 ? '#4fb53c' : '#e23b2e'), [(r() - 0.5) * 1.1, 0.72 + r() * 0.1, (r() - 0.5) * 0.4], [0.12, 0.07, 0.1]);
  blob(g, mat('#f6d36a'), [0, 0.8, 0], [0.4, 0.05, 0.25]);
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [s * 0.22, 0.3, 0.45], [0.11, 0.14, 0.03]); blob(g, mat('#2a1408'), [s * 0.22, 0.29, 0.48], [0.075, 0.1, 0.025]); blob(g, mat('#fff'), [s * 0.2, 0.33, 0.5], [0.025, 0.03, 0.01]);
    bar(g, [s * 0.15, 0.1, 0], [s * 0.15, -0.3, 0], 0.035, mat('#5a3a20')); blob(g, mat('#2a2a2a'), [s * 0.15, -0.33, 0.04], [0.08, 0.04, 0.1]);
  }
  blob(g, mat('#c04a3a'), [0, 0.14, 0.34], [0.08, 0.03, 0.02]);
  g.position.y = 0.35; const w = new THREE.Group(); w.add(g); return w;
}
