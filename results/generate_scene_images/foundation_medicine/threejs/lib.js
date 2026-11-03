// Shared scene helpers + props for the Foundation Medicine scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCornerstone } from './cornerstone.js';
export { THREE, guard, canvasTexture, rng, createCornerstone };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, size, pos, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, r, h, pos, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const tubeAlong = (p, m, pts, r) => add(p, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((v) => new THREE.Vector3(...v))), 60, r, 12), m);

export function textSprite(text, { w = 1, h = 0.5, bg = '#ffffff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + 8);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
}

/** Standard scene: sunny anime stage + ground. cfg: ground colour, camera, sun. Returns helpers. */
export function setup(cfg = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: cfg.fov ?? 40, sunElevation: cfg.el ?? 35, sunAzimuth: cfg.az ?? 150, exposure: cfg.exp ?? 1,
    sky: { cover: 2, seed: cfg.seed ?? 5, towerTop: 0.5, puffCover: 2, ...(cfg.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 },
    triBumpScale: 0.3, ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  if (cfg.ground !== null) add(scene, new THREE.PlaneGeometry(400, 400), mat(cfg.ground ?? '#6fae45', { roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const chars = new Set();
  const finish = (cam, look) => {
    stage.toonify(scene, (m) => chars.has(m));
    stage.addClouds(cfg.clouds ?? [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
  };
  const toon = (o) => { o.traverse((m) => chars.add(m)); return o; };
  const stone = (opts = {}) => { const c = createCornerstone(opts); scene.add(c); toon(c); return c; };
  return { stage, scene, P, num, finish, toon, stone };
}

// ---------- props ----------
export const gold = () => mat('#f2b928', { metalness: 0.6, roughness: 0.3 });

export function golfClub() {
  const g = new THREE.Group(), steel = mat('#cfd5dc', { metalness: 0.7, roughness: 0.3 });
  cyl(g, steel, 0.016, 1.2, [0, 0.6, 0]); cyl(g, mat('#222'), 0.022, 0.3, [0, 1.05, 0]);
  const head = add(g, new THREE.BoxGeometry(0.16, 0.07, 0.06), mat('#9aa3ad', { metalness: 0.7, roughness: 0.3 }), [0.07, 0.04, 0], [0, 0, 0.15]);
  blob(g, mat('#fff', { roughness: 0.4 }), [0.32, 0.045, 0.06], [0.045, 0.045, 0.045]);
  return g;
}
export function garage() {
  const g = new THREE.Group();
  box(g, '#d9604a', [1.4, 0.9, 1], [0, 0.45, 0]); box(g, '#8f3a2e', [1.5, 0.08, 1.1], [0, 0.94, 0], [0, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4), '#8f3a2e', [0, 1.0, 0], [0, 0, Math.PI / 2]);
  box(g, '#f3f3ee', [1.0, 0.7, 0.04], [0, 0.35, 0.51]);
  for (let i = 0; i < 5; i++) box(g, '#c9ccd0', [1.0, 0.02, 0.05], [0, 0.1 + i * 0.14, 0.53]);
  box(g, '#444a52', [1.2, 0.012, 1.8], [0, 0.006, 1.4]); // the way (drive)
  return g;
}
export function lander() {
  const g = new THREE.Group(), foil = mat('#e0b440', { metalness: 0.5, roughness: 0.35 }), steel = mat('#cfd5dc', { metalness: 0.6 });
  add(g, new THREE.CylinderGeometry(0.5, 0.6, 0.35, 8), foil, [0, 0.75, 0]);
  add(g, new THREE.CylinderGeometry(0.34, 0.5, 0.3, 8), mat('#e9e9e6'), [0, 1.07, 0]);
  blob(g, mat('#9fd0f5', { metalness: 0.6, roughness: 0.15 }), [0, 1.08, 0.3], [0.13, 0.1, 0.05]);
  add(g, new THREE.ConeGeometry(0.2, 0.25, 16), steel, [0, 0.45, 0], [Math.PI, 0, 0]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), steel, [c * 0.55, 0.38, s * 0.55], [s * 0.45, 0, -c * 0.45]);
    cyl(g, steel, 0.12, 0.025, [c * 0.72, 0.02, s * 0.72]);
  }
  return g;
}
export function broadsword(len = 1.6) {
  const g = new THREE.Group(), steel = mat('#dfe5ea', { metalness: 0.8, roughness: 0.25 });
  add(g, new THREE.BoxGeometry(0.16, len, 0.03), steel, [0, len / 2 + 0.2, 0]);
  add(g, new THREE.ConeGeometry(0.113, 0.3, 4), steel, [0, len + 0.2 + 0.15, 0], [0, Math.PI / 4, 0], [1, 1, 0.26]);
  box(g, gold(), [0.55, 0.07, 0.09], [0, 0.2, 0]); cyl(g, mat('#5a2a1a'), 0.032, 0.25, [0, 0.07, 0]); blob(g, gold(), [0, -0.07, 0], [0.06, 0.06, 0.06]);
  return g;
}
export function person({ shirt = '#c54a3a', pants = '#3a4a7a', hat = null, hair = '#4a2e1a', scale = 1 } = {}) {
  const g = new THREE.Group(), skin = mat('#f6cfa8');
  cyl(g, pants, 0.07, 0.4, [-0.07, 0.2, 0]); cyl(g, pants, 0.07, 0.4, [0.07, 0.2, 0]);
  cyl(g, shirt, 0.17, 0.42, [0, 0.6, 0], [0, 0, 0], 0.13); blob(g, skin, [0, 0.95, 0], [0.14, 0.15, 0.14]);
  blob(g, mat(hair), [0, 1.0, -0.03], [0.15, 0.13, 0.14]);
  for (const s of [-1, 1]) { blob(g, mat('#111'), [s * 0.055, 0.96, 0.125], [0.02, 0.028, 0.012]); cyl(g, shirt, 0.04, 0.38, [s * 0.2, 0.62, 0.02], [0, 0, s * 0.18]); }
  blob(g, mat('#c9505a'), [0, 0.92, 0.13], [0.025, 0.012, 0.01]);
  if (hat === 'straw') { cyl(g, mat('#e6c566'), 0.32, 0.03, [0, 1.1, 0]); cyl(g, mat('#e6c566'), 0.15, 0.14, [0, 1.17, 0]); }
  g.scale.setScalar(scale); return g;
}
export function dove() {
  const g = new THREE.Group(), w = mat('#ffffff', { roughness: 0.5 });
  blob(g, w, [0, 0, 0], [0.32, 0.16, 0.16]); blob(g, w, [0.3, 0.1, 0], [0.11, 0.1, 0.1]);
  add(g, new THREE.ConeGeometry(0.035, 0.1, 10), mat('#f0a030'), [0.43, 0.09, 0], [0, 0, -Math.PI / 2]);
  for (const s of [-1, 1]) { blob(g, mat('#111'), [0.34, 0.14, s * 0.075], [0.018, 0.018, 0.012]);
    const wing = new THREE.Group(); wing.position.set(0, 0.05, s * 0.1); wing.rotation.x = s * 0.9; g.add(wing);
    blob(wing, w, [0, 0, s * 0.3], [0.24, 0.03, 0.34], [0, s * -0.3, 0]); }
  blob(g, w, [-0.38, 0, 0], [0.22, 0.04, 0.1], [0, 0, 0.15]);
  return g;
}
export function brooch(r = 0.4) {
  const g = new THREE.Group();
  cyl(g, gold(), r, 0.07, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; blob(g, mat('#f7f2e8', { roughness: 0.2 }), [Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, 0.05], [0.07, 0.07, 0.05]); }
  add(g, new THREE.OctahedronGeometry(r * 0.5), mat('#d8244a', { roughness: 0.15, metalness: 0.2 }), [0, 0, 0.08], [0, 0, 0], [1, 1, 0.6]);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, r * 2.3, 8), gold(), [0, 0, -0.04], [0, 0, Math.PI / 2]);
  return g;
}
export function peach(r = 0.14) {
  const g = new THREE.Group();
  blob(g, mat('#ffa66b', { roughness: 0.55 }), [0, 0, 0], [r, r * 0.95, r]); blob(g, mat('#ff7a6b', { roughness: 0.6 }), [r * 0.3, 0, r * 0.35], [r * 0.7, r * 0.8, r * 0.6]);
  box(g, mat('#c78a50'), [r * 0.04, r * 2, r * 0.04], [0, 0, 0]).visible = false;
  for (const s of [-1, 1]) blob(g, mat('#4c9a3a'), [s * r * 0.4, r * 1.05, 0], [r * 0.4, r * 0.1, r * 0.2], [0, 0, s * 0.5]);
  return g;
}
export function peachTree(h = 2.2) {
  const g = new THREE.Group(), bark = mat('#7a4e2c'), leaf = mat('#5aa63e');
  cyl(g, bark, 0.14, h * 0.55, [0, h * 0.275, 0], [0, 0, 0], 0.1);
  const r = rng(3);
  for (let i = 0; i < 9; i++) blob(g, leaf, [(r() - 0.5) * 1.1, h * 0.7 + r() * 0.5, (r() - 0.5) * 0.7], [0.45, 0.35, 0.4]);
  for (let i = 0; i < 9; i++) { const p = peach(0.13); p.position.set((r() - 0.5) * 1.3, h * 0.55 + r() * 0.55, 0.25 + r() * 0.3); g.add(p); }
  return g;
}
export function coin(r = 0.16) {
  const g = new THREE.Group();
  cyl(g, gold(), r, r * 0.22, [0, 0, 0], [Math.PI / 2, 0, 0]); cyl(g, mat('#ffd75e', { metalness: 0.5, roughness: 0.3 }), r * 0.72, r * 0.25, [0, 0, 0], [Math.PI / 2, 0, 0]);
  return g;
}
export function mallard() {
  const g = new THREE.Group(), body = mat('#8a6b4a'), green = mat('#1f8a5a'), white = mat('#f4f1ea');
  blob(g, body, [0, 0.2, 0], [0.3, 0.2, 0.2]); blob(g, white, [-0.02, 0.1, 0], [0.22, 0.1, 0.17]); blob(g, mat('#3a3f6a'), [-0.12, 0.28, 0], [0.12, 0.05, 0.19]);
  blob(g, green, [0.26, 0.5, 0], [0.12, 0.13, 0.12]); cyl(g, white, 0.05, 0.05, [0.26, 0.38, 0], [0, 0, 0.05]); blob(g, white, [0.26, 0.4, 0], [0.105, 0.025, 0.105]);
  cyl(g, green, 0.06, 0.2, [0.22, 0.36, 0], [0, 0, -0.2], 0.05);
  blob(g, mat('#f2c230'), [0.4, 0.46, 0], [0.09, 0.03, 0.07]);
  for (const s of [-1, 1]) { blob(g, mat('#fff'), [0.34, 0.54, s * 0.1], [0.032, 0.036, 0.02]); blob(g, mat('#111'), [0.352, 0.54, s * 0.115], [0.016, 0.022, 0.012]);
    blob(g, mat('#6a4a30'), [-0.02, 0.22, s * 0.19], [0.2, 0.1, 0.03], [0, 0, 0.1]); cyl(g, mat('#f08a2a'), 0.02, 0.1, [0, 0.0, s * 0.09]); blob(g, mat('#f08a2a'), [0.04, -0.02, s * 0.09], [0.1, 0.02, 0.07]); }
  return g;
}
export function crown(r = 0.17) {
  const g = new THREE.Group(), m = gold();
  cyl(g, m, r, r * 0.6, [0, 0, 0]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(g, new THREE.ConeGeometry(r * 0.22, r * 0.7, 8), m, [Math.cos(a) * r * 0.85, r * 0.55, Math.sin(a) * r * 0.85]); blob(g, mat('#d8244a', { roughness: 0.2 }), [Math.cos(a) * r * 0.85, r * 0.95, Math.sin(a) * r * 0.85], [r * 0.12, r * 0.12, r * 0.12]); }
  return g;
}
export function dna(h = 1.4, r = 0.18) {
  const g = new THREE.Group(), N = 22, A = [], B = [];
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * Math.PI * 4, y = (t - 0.5) * h; A.push([Math.cos(a) * r, y, Math.sin(a) * r]); B.push([-Math.cos(a) * r, y, -Math.sin(a) * r]); }
  tubeAlong(g, mat('#3aa0e8', { roughness: 0.3 }), A, 0.028); tubeAlong(g, mat('#f0508a', { roughness: 0.3 }), B, 0.028);
  const cols = ['#ffd23a', '#58d68d', '#ffd23a', '#58d68d'];
  for (let i = 1; i < N; i++) {
    const a = new THREE.Vector3(...A[i]), b = new THREE.Vector3(...B[i]), d = b.clone().sub(a);
    const rung = cyl(g, mat(cols[i % 4]), 0.016, d.length(), a.clone().add(b).multiplyScalar(0.5).toArray());
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  }
  return g;
}
export function tumour(r = 0.3) {
  const g = new THREE.Group(), m = mat('#8a3f9e', { roughness: 0.55 }), rr = rng(9);
  blob(g, m, [0, 0, 0], [r, r * 0.9, r]);
  for (let i = 0; i < 9; i++) { const a = rr() * 6.28, b = (rr() - 0.5) * 2; blob(g, mat('#a64fb8', { roughness: 0.5 }), [Math.cos(a) * r * 0.85 * Math.sqrt(1 - b * b), b * r * 0.8, Math.sin(a) * r * 0.85 * Math.sqrt(1 - b * b)], [r * 0.3, r * 0.3, r * 0.3]); }
  for (const s of [-1, 1]) blob(g, mat('#2b0f33'), [s * r * 0.3, r * 0.15, r * 0.9], [r * 0.09, r * 0.12, r * 0.05]);
  return g;
}
export function pill() {
  const g = new THREE.Group();
  cyl(g, mat('#e8355a', { roughness: 0.3 }), 0.07, 0.14, [0, 0.07, 0]); cyl(g, mat('#f6f6f0', { roughness: 0.3 }), 0.07, 0.14, [0, -0.07, 0]);
  blob(g, mat('#e8355a', { roughness: 0.3 }), [0, 0.14, 0], [0.07, 0.07, 0.07]); blob(g, mat('#f6f6f0', { roughness: 0.3 }), [0, -0.14, 0], [0.07, 0.07, 0.07]);
  return g;
}
export function magnifier() {
  const g = new THREE.Group(), steel = mat('#8a6a3a');
  add(g, new THREE.TorusGeometry(0.17, 0.025, 12, 40), gold(), [0, 0.2, 0]); cyl(g, steel, 0.025, 0.3, [0, -0.06, 0]);
  add(g, new THREE.CircleGeometry(0.165, 32), mat('#cfeeff', { transparent: true, opacity: 0.35, roughness: 0.1 }), [0, 0.2, 0]);
  return g;
}
export function vial(fill = '#d8243a') {
  const g = new THREE.Group();
  cyl(g, mat('#e8f4ff', { transparent: true, opacity: 0.45, roughness: 0.1 }), 0.05, 0.3, [0, 0.15, 0]); cyl(g, mat(fill, { roughness: 0.25 }), 0.042, 0.2, [0, 0.11, 0]);
  blob(g, mat('#e8f4ff', { transparent: true, opacity: 0.45 }), [0, 0.0, 0], [0.05, 0.05, 0.05]); cyl(g, mat('#3a7be0'), 0.055, 0.07, [0, 0.33, 0]);
  return g;
}
export function bloodCell(r = 0.1, color = '#d8243a') {
  const g = new THREE.Group(); add(g, new THREE.TorusGeometry(r * 0.7, r * 0.4, 16, 32), mat(color, { roughness: 0.35 }), [0, 0, 0]); cyl(g, mat(color, { roughness: 0.35 }), r * 0.75, r * 0.35, [0, 0, 0], [Math.PI / 2, 0, 0]); return g;
}
export function book({ cover = '#7a3b8f', text = null, w = 0.5, h = 0.66, t = 0.1 } = {}) {
  const g = new THREE.Group(); box(g, cover, [w, h, t], [0, 0, 0]); box(g, '#f4ecd8', [w * 0.96, h * 0.96, t * 0.8], [0.02, 0, 0]);
  box(g, cover, [w, h, t * 0.2], [0, 0, t * 0.4]); box(g, gold(), [0.02, h, t], [-w / 2, 0, 0]);
  if (text) { const s = textSprite(text, { w: w * 0.85, h: w * 0.85, bg: cover, fg: '#ffe08a', font: 'bold 130px serif' }); s.position.set(0, h * 0.05, t * 0.51); g.add(s); }
  return g;
}
export function nacho(s = 1) {
  const g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-0.4, -0.35); shape.lineTo(0.4, -0.35); shape.lineTo(0, 0.4); shape.closePath();
  const tri = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.02, bevelSegments: 3 });
  add(g, tri, mat('#e8b04a', { roughness: 0.8 }), [0, 0, 0]);
  blob(g, mat('#ffb21e', { roughness: 0.3 }), [0, -0.05, 0.07], [0.3, 0.22, 0.04]); blob(g, mat('#ffb21e', { roughness: 0.3 }), [0.1, -0.2, 0.08], [0.18, 0.1, 0.04]);
  for (const [x, y] of [[-0.12, -0.12], [0.12, 0.02], [0, -0.28]]) add(g, new THREE.TorusGeometry(0.05, 0.018, 8, 20), mat('#4aa83a'), [x, y, 0.1]);
  g.scale.setScalar(s); return g;
}
export function bridge() {
  const g = new THREE.Group(), st = mat('#c9b48e');
  const sh = new THREE.Shape(); sh.moveTo(-3, 0); sh.lineTo(-1.9, 0); sh.absarc(0, 0, 1.9, Math.PI, 0, true); sh.lineTo(3, 0); sh.lineTo(3, 2.8); sh.lineTo(-3, 2.8); sh.closePath();
  add(g, new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false, curveSegments: 40 }), st, [0, 0, -0.9]);
  box(g, '#b39d76', [6.2, 0.2, 2.0], [0, 2.9, 0]);
  for (const z of [-0.9, 0.9]) box(g, '#b39d76', [6.2, 0.5, 0.2], [0, 3.2, z]);
  return g;
}

export function sign(text, { w = 1.8, h = 0.8, bg = '#fff6dc', fg = '#c0392b', post = true, font = 'bold 190px sans-serif' } = {}) {
  const g = new THREE.Group(), s = textSprite(text, { w, h, bg, fg, font });
  s.geometry = new THREE.PlaneGeometry(w, h); s.position.set(0, post ? 1.6 : 0, 0.05); s.scale.set(1, 1, 1); g.add(s);
  box(g, '#7a4e2c', [w + 0.12, h + 0.12, 0.08], [0, post ? 1.6 : 0, 0]);
  if (post) cyl(g, mat('#7a4e2c'), 0.05, 1.3, [0, 0.65, -0.02]);
  return g;
}
export function laptop(screenTex) {
  const g = new THREE.Group();
  box(g, '#b8bec6', [0.5, 0.025, 0.34], [0, 0.0125, 0]);
  const scr = new THREE.Group(); scr.position.set(0, 0.025, -0.17); scr.rotation.x = -0.25; g.add(scr);
  box(scr, '#b8bec6', [0.5, 0.33, 0.02], [0, 0.165, 0]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.29), new THREE.MeshBasicMaterial({ map: screenTex })); m.position.set(0, 0.165, 0.012); scr.add(m);
  return g;
}
export const codeTex = () => canvasTexture(256, (ctx, s) => { ctx.fillStyle = '#16202e'; ctx.fillRect(0, 0, s, s); const r = rng(2);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = ['#58d68d', '#5dade2', '#f5b041', '#ec7063'][i % 4]; ctx.fillRect(20 + (i % 3) * 20, 20 + i * 18, 30 + r() * 140, 8); } });
export const tissueTex = () => canvasTexture(256, (ctx, s) => { ctx.fillStyle = '#f7c6d8'; ctx.fillRect(0, 0, s, s); const r = rng(4);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = i % 3 ? '#8e44ad' : '#d98fb8'; ctx.beginPath(); ctx.arc(r() * s, r() * s, 6 + r() * 10, 0, 7); ctx.fill(); } });
export function monitor(tex, w = 1.6, h = 1.0) {
  const g = new THREE.Group(); box(g, '#2a2f38', [w + 0.1, h + 0.1, 0.07], [0, h / 2 + 0.3, 0]); cyl(g, mat('#2a2f38'), 0.05, 0.3, [0, 0.15, 0]); cyl(g, mat('#2a2f38'), 0.3, 0.03, [0, 0.015, 0]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(0, h / 2 + 0.3, 0.04); g.add(m); return g;
}
export function frameChar() {
  const g = new THREE.Group(), gl = gold();
  const W = 0.9, H = 1.1, y = 0.85;
  box(g, gl, [W, 0.12, 0.12], [0, y + H / 2, 0]); box(g, gl, [W, 0.12, 0.12], [0, y - H / 2, 0]);
  box(g, gl, [0.12, H, 0.12], [-W / 2 + 0.06, y, 0]); box(g, gl, [0.12, H, 0.12], [W / 2 - 0.06, y, 0]);
  for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) blob(g, gl, [sx * W / 2, y + sy * H / 2, 0.02], [0.11, 0.11, 0.1]);
  box(g, '#f6eedd', [W - 0.1, H - 0.1, 0.03], [0, y, -0.02]);
  for (const sx of [-1, 1]) { blob(g, mat('#fff', { roughness: 0.3 }), [sx * 0.18, y + 0.1, 0.0], [0.085, 0.1, 0.01]).position.z = 0.0;
    blob(g, mat('#3a2416'), [sx * 0.18, y + 0.09, 0.012], [0.055, 0.075, 0.01]); blob(g, mat('#fff'), [sx * 0.18 - 0.02, y + 0.13, 0.02], [0.02, 0.02, 0.008]);
    cyl(g, mat('#ffe0c0'), 0.03, 0.3, [sx * 0.55, 0.9, 0.02], [0, 0, sx * 0.3]); cyl(g, mat('#7a4e2c'), 0.04, 0.25, [sx * 0.15, 0.13, 0]); blob(g, mat('#3a2a2a'), [sx * 0.15, 0.02, 0.05], [0.07, 0.04, 0.1]); }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20, Math.PI), mat('#7a2a2a')); m.rotation.z = Math.PI; m.position.set(0, y - 0.12, 0.012); g.add(m);
  const vp = textSprite('VP', { w: 0.34, h: 0.2, bg: '#c0392b', fg: '#fff', font: 'bold 200px sans-serif' }); vp.position.set(0, y - 0.38, 0.02); g.add(vp);
  return g;
}
export function organ(kind) {
  const g = new THREE.Group(), pink = mat('#f08a9a', { roughness: 0.5 });
  if (kind === 'ovary') { for (const s of [-1, 1]) { blob(g, mat('#e8a8c8', { roughness: 0.45 }), [s * 0.28, 0.1, 0], [0.16, 0.12, 0.1]); } tubeAlong(g, pink, [[-0.12, -0.12, 0], [-0.05, -0.2, 0], [0.05, -0.2, 0], [0.12, -0.12, 0]], 0.03); blob(g, mat('#e8c8d8'), [0, -0.05, 0], [0.12, 0.17, 0.09]); }
  if (kind === 'lung') { for (const s of [-1, 1]) blob(g, mat('#f2a0a8', { roughness: 0.5 }), [s * 0.2, 0, 0], [0.17, 0.27, 0.12], [0, 0, s * -0.1]); cyl(g, mat('#e8d0c8'), 0.03, 0.3, [0, 0.25, 0]); }
  if (kind === 'ribbon') { for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.13, 0.04, 12, 30), mat('#ff5fa2', { roughness: 0.4 }), [s * 0.1, 0.12, 0], [0, 0, s * 0.9]).scale.set(1, 1.4, 1);
    for (const s of [-1, 1]) box(g, '#ff5fa2', [0.09, 0.32, 0.04], [s * 0.1, -0.12, 0], [0, 0, s * 0.35]); }
  if (kind === 'colon') { tubeAlong(g, mat('#d98c6a', { roughness: 0.5 }), [[-0.28, -0.25, 0], [-0.28, 0.2, 0], [-0.1, 0.3, 0], [0.12, 0.3, 0], [0.28, 0.2, 0], [0.28, -0.15, 0], [0.1, -0.2, 0], [0.0, -0.05, 0], [-0.08, -0.15, 0]], 0.065); }
  if (kind === 'skin') { cyl(g, mat('#f2c8a0'), 0.3, 0.06, [0, 0, 0], [Math.PI / 2, 0, 0]); blob(g, mat('#3a2418'), [0.04, 0, 0.05], [0.1, 0.09, 0.04]); blob(g, mat('#5a3a28'), [-0.1, 0.1, 0.04], [0.04, 0.04, 0.02]); }
  if (kind !== 'skin') blob(g, mat('#8a3f9e'), [0.12, 0.12, 0.13], [0.07, 0.07, 0.07]);
  return g;
}
export function bone(len = 1.2) {
  const g = new THREE.Group(), m = mat('#f2ead6', { roughness: 0.6 });
  cyl(g, m, 0.08, len, [0, 0, 0], [0, 0, Math.PI / 2]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) blob(g, m, [sx * len / 2, 0, sz * 0.07], [0.12, 0.12, 0.12]);
  blob(g, mat('#8a3f9e'), [0.1, 0.12, 0.05], [0.2, 0.17, 0.15]); return g;
}
export function whiteCell(r = 0.12) { const g = new THREE.Group(); blob(g, mat('#e8e8f2', { roughness: 0.4 }), [0, 0, 0], [r, r, r]); blob(g, mat('#7a5cc0'), [r * 0.3, r * 0.2, r * 0.7], [r * 0.5, r * 0.45, r * 0.3]); return g; }
