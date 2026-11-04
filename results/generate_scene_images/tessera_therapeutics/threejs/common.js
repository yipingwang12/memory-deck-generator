// Shared scene helpers for the Tessera deck: stage, primitives, canvas text, person, crown, eggshell, scroll.
// run({ build(ctx), cam:{p:[x,y,z], t:[x,y,z]}, ground, sky }) — ctx = { scene, chars:Set, P, num, tess(opts) }.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTesseract } from './tesseract.js';

export { THREE, rng };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);

/** Bright (unlit) plane carrying canvas text. */
export function label(text, w, h, { fg = '#1a1a1a', bg = null, font = 'bold', px = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = px * (w / h > 1 ? w / h : 1) | 0; c.height = px * (h / w > 1 ? h / w : 1) | 0;
  const x = c.getContext('2d'); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = c.height * 0.8; do { x.font = `${font} ${size}px sans-serif`; size *= 0.93; } while (x.measureText(text).width > c.width * 0.92);
  x.fillText(text, c.width / 2, c.height / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, side: THREE.DoubleSide }));
}

/** Simple anime-ish human. userData: arms/legs pivots {l,r} (rotation.x swings; +z fwd), head. Feet on y=0, ~1.8 tall at scale 1. */
export function makePerson({ skin = '#ffd9b8', shirt = '#d9453a', pants = '#2f3a63', hair = '#2a1a12', shoe = '#3a2a22', scale = 1, shirtMap = null } = {}) {
  const g = new THREE.Group(), sk = mat(skin), sh = shirtMap ? new THREE.MeshStandardMaterial({ map: shirtMap, roughness: 0.7 }) : mat(shirt);
  add(g, new THREE.CapsuleGeometry(0.22, 0.45, 8, 16), sh, [0, 1.15, 0], [0, 0, 0], [1.05, 1, 0.75]);
  const head = new THREE.Group(); head.position.set(0, 1.78, 0); g.add(head);
  blob(head, sk, [0, 0, 0], [0.2, 0.22, 0.2]);
  blob(head, mat(hair), [0, 0.07, -0.025], [0.215, 0.2, 0.2]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [s * 0.075, -0.01, 0.175], [0.048, 0.062, 0.02]);
    blob(head, mat('#1a1018'), [s * 0.075, -0.015, 0.19], [0.03, 0.045, 0.014]);
    blob(head, mat('#fff'), [s * 0.068, 0.005, 0.2], [0.011, 0.011, 0.008]);
  }
  const arms = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const a = new THREE.Group(); a.position.set(s * 0.29, 1.4, 0); g.add(a);
    add(a, new THREE.CapsuleGeometry(0.065, 0.5, 6, 12), sh, [0, -0.3, 0]); blob(a, sk, [0, -0.64, 0], [0.075, 0.075, 0.075]); arms[k] = a;
    const l = new THREE.Group(); l.position.set(s * 0.12, 0.85, 0); g.add(l);
    add(l, new THREE.CapsuleGeometry(0.09, 0.55, 6, 12), mat(pants), [0, -0.38, 0]); blob(l, mat(shoe), [0, -0.84, 0.05], [0.1, 0.07, 0.16]); legs[k] = l;
  }
  g.scale.setScalar(scale); g.userData = { arms, legs, head, hand: (k) => new THREE.Vector3(0, -0.64, 0).applyMatrix4(arms[k].matrixWorld) };
  return g;
}

export function crown(r = 0.2) {
  const g = new THREE.Group(), gold = mat('#ffcf2e', { metalness: 0.5, roughness: 0.3 });
  cyl(g, gold, [0, 0.07, 0], r, 0.14, [0, 0, 0], r * 0.92);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(g, new THREE.ConeGeometry(0.045, 0.16, 8), gold, [Math.cos(a) * r * 0.9, 0.22, Math.sin(a) * r * 0.9]); blob(g, mat('#e0304a'), [Math.cos(a) * r * 0.9, 0.31, Math.sin(a) * r * 0.9], [0.03, 0.03, 0.03]); }
  blob(g, mat('#2e8bff'), [0, 0.07, r * 0.93], [0.04, 0.04, 0.02]);
  return g;
}

/** Egg bottom half (open bowl, zig-zag lip) glowing blue-white; radius r. */
export function eggBowl(r = 0.8, { color = '#bfe4ff' } = {}) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, side: THREE.DoubleSide });
  add(g, new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI * 0.38, Math.PI * 0.62), m, [0, r, 0], [0, 0, 0], [r * 0.85, r, r * 0.85]);
  const y0 = r + Math.cos(Math.PI * 0.38) * r, rr = Math.sin(Math.PI * 0.38) * r * 0.85;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(g, new THREE.ConeGeometry(rr * 0.2, r * 0.28, 4), m, [Math.cos(a) * rr * 0.97, y0 + r * 0.1, Math.sin(a) * rr * 0.97], [0, -a, 0]); }
  return g;
}
export function eggTop(r = 0.8, { color = '#bfe4ff' } = {}) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, side: THREE.DoubleSide });
  add(g, new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.4), m, [0, 0, 0], [0, 0, 0], [r * 0.85, r, r * 0.85]);
  return g;
}

/** Parchment page with ruled lines (and optional big text). Faces +z, w x h, bottom at y=0. */
export function page(w = 0.9, h = 1.2, text = null) {
  const g = new THREE.Group();
  box(g, '#f3e2b4', [0, h / 2, 0], [w, h, 0.03]);
  for (let i = 0; i < 6; i++) box(g, '#b79b64', [0, h * (0.85 - i * 0.1), 0.017], [w * 0.7, 0.018, 0.004]);
  box(g, '#7a5a2a', [0, 0.0, 0], [w * 1.08, 0.05, 0.06]); box(g, '#7a5a2a', [0, h, 0], [w * 1.08, 0.05, 0.06]);
  if (text) { const l = label(text, w * 0.9, h * 0.22, { fg: '#1b3a8a' }); l.position.set(0, h * 0.3, 0.025); g.add(l); }
  return g;
}

export function run({ build, cam = {}, ground = '#6fae45', sky = {}, sun = {}, fov = 40 }) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', fov), sunElevation: num('el', sun.el ?? 35), sunAzimuth: num('az', sun.az ?? 150), exposure: num('exp', 1),
      sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene, chars = new Set();
    add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const tess = (o = {}) => { const t = createTesseract({ scale: 1.5, ...o }); scene.add(t); return t; };
    const mark = (o) => o.traverse((c) => chars.add(c));
    build({ scene, chars, mark, P, num, tess });
    stage.toonify(scene, (m) => chars.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    const p = cam.p ?? [0, 1.2, 5], t = cam.t ?? [0, 0.9, 0];
    stage.camera.position.set(num('cx', p[0]), num('cy', p[1]), num('cz', p[2]));
    stage.camera.lookAt(num('tx', t[0]), num('ty', t[1]), num('tz', t[2]));
    stage.finish();
  });
}

/** Quill pen from `from` toward `to` (world points) with glowing tip; returns Group in scene. */
export function quill(scene, from, to) {
  const q = new THREE.Group(), d = to.clone().sub(from), len = d.length();
  q.position.copy(from).addScaledVector(d, 0.5); q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  add(q, new THREE.CylinderGeometry(0.02, 0.03, len, 8), mat('#ffffff'));
  blob(q, mat('#ffffff'), [0.06, -len * 0.25, 0], [0.07, 0.3, 0.015], [0, 0, 0.3]); blob(q, mat('#cfd8ff'), [0.1, -len * 0.1, 0], [0.06, 0.24, 0.015], [0, 0, 0.4]);
  add(q, new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: '#7fe6ff' }), [0, len / 2, 0]);
  scene.add(q); return q;
}
export const worldHand = (t, k) => { t.updateMatrixWorld(true); return t.userData.parts.hands[k].getWorldPosition(new THREE.Vector3()); };
/** Point the tesseract arm k at a world point. */
export const reachWorld = (t, k, w) => { t.updateMatrixWorld(true); const l = t.worldToLocal(w.clone()); t.userData.reach(k, [l.x, l.y, l.z]); };
