// Shared helpers for the Asimov scenes (stage, materials, small prop builders).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createAsimo } from './asimo.js';
export { THREE, guard, canvasTexture, rng, createAsimo };

const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, c, pos, scl, rot, e) => add(parent, new THREE.SphereGeometry(1, 32, 20), mat(c, e), pos, rot, scl);
export const box = (parent, c, size, pos, rot, e) => add(parent, new THREE.BoxGeometry(...size), mat(c, e), pos, rot);
export const cyl = (parent, c, r0, r1, h, pos, rot, e) => add(parent, new THREE.CylinderGeometry(r0, r1, h, 32), mat(c, e), pos, rot);

export function makeStage({ ground = '#7fb857', fov = 36, sky = {}, groundSize = 400 } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  if (ground) add(scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene };
}

export function wrap(stage, scene, chars, { cam = [0, 0.9, 3.2], look = [0, 0.6, 0], clouds = true } = {}) {
  const set = new Set(); (Array.isArray(chars) ? chars : [chars]).forEach((t) => t.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}


export const V3 = (...a) => new THREE.Vector3(...a);
export function limbTo(parent, c, r, a, b, e) {
  const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L = d.length();
  const m = cyl(parent, c, r, r, L, [0, 0, 0], [0, 0, 0], e);
  m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m;
}
export function limbArm(parent, c, r, sh, target, hand, bend = [0.06, -0.08, -0.05]) {
  const g = new THREE.Group(); parent.add(g);
  const mid = V3(...sh).lerp(V3(...target), 0.5).add(V3(...bend)), M = mid.toArray();
  limbTo(g, c, r, sh, M); limbTo(g, c, r * 0.92, M, target);
  blob(g, c, sh, [r * 1.4, r * 1.4, r * 1.4]); blob(g, c, M, [r * 1.1, r * 1.1, r * 1.1]); blob(g, hand, target, [r * 1.2, r * 1.2, r * 1.2]);
  return g;
}
export function textPlane(parent, text, w, h, pos = [0, 0, 0], rot = [0, 0, 0], { bg = '#fff', fg = '#222', border = null, draw = null } = {}) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * h / w);
  const ctx = cv.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height); }
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 16; ctx.strokeRect(8, 8, cv.width - 16, cv.height - 16); }
  if (draw) draw(ctx, cv.width, cv.height);
  if (text) {
    let fs = cv.height * 0.72; ctx.font = `900 ${fs}px sans-serif`;
    const tw = ctx.measureText(text).width; if (tw > cv.width * 0.88) { fs *= cv.width * 0.88 / tw; ctx.font = `900 ${fs}px sans-serif`; }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cv.width / 2, cv.height / 2 + fs * 0.04);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide, transparent: !bg }));
  m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
}
export function tube(parent, c, pts, r, e, seg = 100) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(...p))), seg, r, 10);
  const o = new THREE.Mesh(g, mat(c, e)); o.castShadow = true; parent.add(o); return o;
}
export function ribbon(parent, c, pts, w, e) {
  const P = pts.map((p) => V3(...p)), pos = [], idx = [];
  P.forEach((p, i) => {
    const t = P[Math.min(i + 1, P.length - 1)].clone().sub(P[Math.max(i - 1, 0)]).normalize();
    const s = t.clone().cross(V3(0, 0, 1)).normalize().multiplyScalar(w / 2);
    pos.push(p.x - s.x, p.y - s.y, p.z - s.z, p.x + s.x, p.y + s.y, p.z + s.z);
    if (i) { const a = 2 * i; idx.push(a - 2, a - 1, a, a - 1, a + 1, a); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, side: THREE.DoubleSide, ...e })); m.castShadow = true; parent.add(m); return m;
}
export function dnaHelix(parent, { h = 1.6, r = 0.2, turns = 2.5, n = 26, colors = ['#e8453c', '#f5b82e', '#37a86b', '#3b7bd8'] } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const pt = (i, ph) => { const a = i / (n - 1) * turns * Math.PI * 2 + ph; return [Math.cos(a) * r, i / (n - 1) * h, Math.sin(a) * r]; };
  const strand = (ph) => Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2 - 1) * turns * Math.PI * 2 + ph; return [Math.cos(a) * r, i / (n * 2 - 1) * h, Math.sin(a) * r]; });
  for (const ph of [0, Math.PI]) tube(g, ph ? '#ff7aa8' : '#6ab0ff', strand(ph), r * 0.2, {}, n * 6);
  for (let i = 0; i < n; i++) {
    const a = pt(i, 0), b = pt(i, Math.PI), m = V3(...a).lerp(V3(...b), 0.5).toArray();
    limbTo(g, colors[i % 4], r * 0.09, a, m); limbTo(g, colors[(i + 2) % 4], r * 0.09, m, b);
  }
  return g;
}
export function blade({ steel = '#e6eef5', handle = '#ff8a1f', glow = '#6ff0ff' } = {}) {
  const g = new THREE.Group(), sh = new THREE.Shape();
  sh.moveTo(0.14, 0.08); sh.lineTo(0.75, 0.08); sh.quadraticCurveTo(0.95, 0.07, 1.0, -0.09); sh.quadraticCurveTo(0.55, -0.1, 0.14, -0.1); sh.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), mat(steel, { metalness: 0.5, roughness: 0.25 }));
  m.position.z = -0.007; m.castShadow = true; g.add(m);
  limbTo(g, glow, 0.008, [0.2, -0.098, 0.012], [0.98, -0.088, 0.012], { emissive: glow, emissiveIntensity: 1.3 });
  box(g, handle, [0.3, 0.075, 0.06], [0, -0.01, 0]); box(g, '#444a55', [0.025, 0.18, 0.07], [0.15, -0.01, 0]);
  return g;
}
export function person({ coat = '#c0392b', pants = '#333b55', skin = '#f2c9a5', hair = '#eeeeee', glasses = false, mustache = false } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { cyl(g, pants, 0.085, 0.07, 0.75, [s * 0.1, 0.375, 0]); blob(g, '#2b2b33', [s * 0.1, 0.045, 0.05], [0.09, 0.05, 0.15]); }
  blob(g, coat, [0, 1.02, 0], [0.27, 0.4, 0.19]); blob(g, pants, [0, 0.78, 0], [0.25, 0.13, 0.18]); blob(g, skin, [0, 1.4, 0], [0.06, 0.06, 0.06]);
  const head = new THREE.Group(); head.position.set(0, 1.55, 0); g.add(head);
  blob(head, skin, [0, 0, 0], [0.17, 0.195, 0.17]);
  for (const s of [-1, 1]) {
    blob(head, '#fff', [s * 0.065, 0.015, 0.14], [0.045, 0.055, 0.025]); blob(head, '#2a2a3a', [s * 0.065, 0.01, 0.158], [0.025, 0.036, 0.014]);
    blob(head, '#fff', [s * 0.058, 0.025, 0.168], [0.009, 0.009, 0.006]); blob(head, skin, [s * 0.17, 0, 0], [0.03, 0.05, 0.03]);
    if (glasses) add(head, new THREE.TorusGeometry(0.056, 0.008, 8, 24), mat('#222'), [s * 0.065, 0.015, 0.165]);
  }
  blob(head, '#d9937a', [0, -0.035, 0.165], [0.025, 0.02, 0.02]); blob(head, '#a5473f', [0, -0.095, 0.15], [0.045, 0.014, 0.02]);
  blob(head, hair, [0, 0.075, -0.03], [0.18, 0.14, 0.17]); blob(head, hair, [0, 0.12, 0.05], [0.17, 0.07, 0.1]);
  if (mustache) blob(head, hair, [0, -0.062, 0.168], [0.075, 0.02, 0.025]);
  const armG = {};
  g.userData.arm = (k, t) => { const s = k === 'l' ? 1 : -1; armG[k]?.removeFromParent(); armG[k] = limbArm(g, coat, 0.055, [s * 0.3, 1.28, 0], t, skin, [s * 0.06, -0.1, -0.06]); };
  g.userData.arm('l', [0.33, 0.85, 0.03]); g.userData.arm('r', [-0.33, 0.85, 0.03]); g.userData.head = head;
  return g;
}
export function armW(p, k, w) { p.updateMatrixWorld(true); const t = p.worldToLocal(V3(...w)); p.userData.arm(k, [t.x, t.y, t.z]); }
export function reachW(a, k, w) { a.updateMatrixWorld(true); const t = a.worldToLocal(V3(...w)); a.userData.reach(k, [t.x, t.y, t.z]); a.updateMatrixWorld(true); }
export function handPos(a, k) { a.updateMatrixWorld(true); return a.userData.parts.hands[k].getWorldPosition(V3()); }
export function lens(parent, c, pos, s = 0.03) { return blob(parent, c, pos, [s, s * 0.45, s], [Math.random() * 3, Math.random() * 3, 0]); }
export function crate(parent, pos, s = 0.4, rotY = 0, label = true) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; parent.add(g);
  box(g, '#c99a5b', [s, s * 0.75, s], [0, s * 0.375, 0]); box(g, '#e6c27d', [s * 1.02, s * 0.06, s * 0.25], [0, s * 0.775, 0]);
  if (label) textPlane(g, '', s * 0.7, s * 0.5, [0, s * 0.38, s * 0.505], [0, 0, 0], { bg: '#fff1d0', draw: (c, w, h) => { c.fillStyle = '#c4551c'; c.beginPath(); c.ellipse(w * 0.5, h * 0.5, w * 0.3, h * 0.3, 0.3, 0, 7); c.fill(); c.fillStyle = '#e8873a'; c.beginPath(); c.ellipse(w * 0.45, h * 0.42, w * 0.12, h * 0.1, 0.3, 0, 7); c.fill(); } });
  const r = rng(5); for (let i = 0; i < 9; i++) lens(g, ['#c4551c', '#d9742a', '#a8431a'][i % 3], [(r() - 0.5) * s * 0.6, s * 0.78 + 0.01 * (i % 3), (r() - 0.5) * s * 0.6], s * 0.09);
  return g;
}
