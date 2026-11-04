// Shared helpers for the BMS scene pages: stage, materials, labels, and the prop library.
// Every prop is a function returning a THREE.Group standing on y = 0 (units ~ metres; squid ~1.1 tall).
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSquid } from './squid.js';
export { THREE, guard, createSquid };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const glass = (c = '#bfe9ff', o = 0.3) => mat(c, { transparent: true, opacity: o, roughness: 0.1, depthWrite: false });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, size, pos, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, r0, r1, h, pos, rot, seg = 24) => add(p, new THREE.CylinderGeometry(r1, r0, h, seg), m, pos, rot);
export const grp = (parent, pos = [0, 0, 0], rot = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent?.add(g); return g; };

/** Flat text/colour sign plane (canvas text, lit-independent). */
export function label(text, { w = 1, h = 0.5, bg = '#ffffff', fg = '#1d2a44', size = 0.62, border = null } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  if (border) { x.strokeStyle = border; x.lineWidth = 14; x.strokeRect(7, 7, c.width - 14, c.height - 14); }
  x.fillStyle = fg; x.font = `900 ${Math.round(c.height * size)}px Arial Black, Helvetica, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + c.height * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
}

/** Stage + ground. o: { ground, sky:{}, cover, el, az, fov, wall }. Returns ctx { stage, scene, chars }. */
export function makeScene(o = {}) {
  const stage = createAnimeStage({
    fov: o.fov ?? 32, sunElevation: o.el ?? 38, sunAzimuth: o.az ?? 150, exposure: 1,
    sky: { cover: o.cover ?? 1.5, seed: o.seed ?? 5, towerTop: 0.5, puffCover: 1.5, ...(o.sky || {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#fff0e0', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const ctx = { stage, scene: stage.scene, chars: new Set(), clouds: o.clouds !== false };
  add(ctx.scene, new THREE.PlaneGeometry(400, 400), mat(o.ground ?? '#7cbc58', { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  if (o.wall) { // indoor back wall
    add(ctx.scene, new THREE.PlaneGeometry(40, 12), mat(o.wall, { roughness: 1 }), [0, 6, -2.2]);
  }
  return ctx;
}

/** Register an object's meshes as toon-shaded characters. */
export const toon = (ctx, obj) => { obj.traverse((m) => ctx.chars.add(m)); return obj; };

export function addSquid(ctx, { x = 0, y = 0, z = 0, ry = 0, s = 1, lean = 0, tilt = 0, body } = {}) {
  const q = createSquid({ scale: s, ...(body ? { body } : {}) }); q.position.set(x, y, z); q.rotation.y = ry;
  q.userData.pose({ lean, tilt }); ctx.scene.add(q); toon(ctx, q); return q;
}
/** Stretch a squid tentacle club to a WORLD point. */
export function reachW(q, side, p) {
  q.updateMatrixWorld(true); const l = q.worldToLocal(new THREE.Vector3(...p)); q.userData.reach(side, [l.x, l.y, l.z]);
}

/** Camera + toon + clouds + finish. cam: { pos, look }. */
export function finish(ctx, cam) {
  const { stage } = ctx;
  stage.toonify(ctx.scene, (m) => ctx.chars.has(m));
  if (ctx.clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam.pos); stage.camera.lookAt(...cam.look); stage.finish();
}

// ---------------------------------------------------------------- characters
function animeEye(head, x, y, z, iris = '#3a2a6a', r = 0.045) {
  blob(head, mat('#fff', { roughness: 0.3 }), [x, y, z], [r, r * 1.3, r * 0.5]);
  blob(head, mat(iris, { roughness: 0.3 }), [x, y - 0.004, z + r * 0.3], [r * 0.72, r * 1.0, r * 0.5]);
  blob(head, mat('#0e0a14'), [x, y - 0.004, z + r * 0.5], [r * 0.4, r * 0.62, r * 0.4]);
  blob(head, mat('#fff'), [x - r * 0.25, y + r * 0.35, z + r * 0.7], [r * 0.22, r * 0.22, r * 0.15]);
}

/** Chibi person ~1.0 tall facing +z. opts: skin, shirt, pants, hair, hairLong, iris. Arms: userData.armL/armR (pivot groups, rotate to pose). */
export function human({ skin = '#ffd9bd', shirt = '#4a7bd8', pants = '#35405e', hair = '#4a2d1e', hairLong = false, iris = '#3a6ab0', dress = false } = {}) {
  const g = new THREE.Group();
  const legs = [];
  for (const s of [-1, 1]) { legs.push(cyl(g, mat(dress ? skin : pants), 0.055, 0.05, 0.4, [s * 0.075, 0.2, 0])); blob(g, mat('#2b2220'), [s * 0.075, 0.03, 0.03], [0.065, 0.04, 0.09]); }
  if (dress) cyl(g, mat(shirt), 0.27, 0.13, 0.42, [0, 0.5, 0]);
  else cyl(g, mat(shirt), 0.15, 0.12, 0.38, [0, 0.58, 0]);
  const head = grp(g, [0, 0.86, 0]);
  blob(head, mat(skin, { roughness: 0.5 }), [0, 0, 0], [0.2, 0.19, 0.19]);
  animeEye(head, -0.075, -0.01, 0.165, iris); animeEye(head, 0.075, -0.01, 0.165, iris);
  blob(head, mat('#ff8f9d', { transparent: true, opacity: 0.55 }), [-0.12, -0.07, 0.15], [0.03, 0.02, 0.01]);
  blob(head, mat('#ff8f9d', { transparent: true, opacity: 0.55 }), [0.12, -0.07, 0.15], [0.03, 0.02, 0.01]);
  add(head, new THREE.TorusGeometry(0.025, 0.004, 6, 12, Math.PI), mat('#8a3a3a'), [0, -0.085, 0.178], [0, 0, Math.PI]);
  const hm = mat(hair);
  blob(head, hm, [0, 0.05, -0.02], [0.215, 0.175, 0.21]);
  blob(head, hm, [0, 0.12, 0.1], [0.2, 0.07, 0.1]);
  if (hairLong) blob(head, hm, [0, -0.15, -0.09], [0.19, 0.28, 0.1]);
  const arms = {};
  for (const [k, s] of [['armL', 1], ['armR', -1]]) {
    const a = grp(g, [s * 0.19, 0.7, 0]);
    cyl(a, mat(shirt), 0.045, 0.04, 0.3, [0, -0.14, 0]); blob(a, mat(skin), [0, -0.31, 0], [0.05, 0.05, 0.05]);
    a.rotation.z = s * 0.18; arms[k] = a; g.userData[k] = a;
  }
  g.userData.head = head;
  return g;
}

export function crown(r = 0.2, col = '#ffc928') {
  const g = new THREE.Group(), m = mat(col, { metalness: 0.7, roughness: 0.25 });
  cyl(g, m, r, r * 0.95, r * 0.55, [0, 0, 0], [0, 0, 0], 28);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    add(g, new THREE.ConeGeometry(r * 0.2, r * 0.6, 12), m, [Math.cos(a) * r * 0.85, r * 0.55, Math.sin(a) * r * 0.85]);
    blob(g, mat(['#e23b4e', '#2f7bdc', '#2fc07a'][i % 3], { roughness: 0.2 }), [Math.cos(a) * r * 0.95, r * 0.05, Math.sin(a) * r * 0.95], [r * 0.08, r * 0.08, r * 0.08]);
  }
  return g;
}

// ---------------------------------------------------------------- props
export function crab({ col = '#d6452f' } = {}) {
  const g = new THREE.Group(), m = mat(col), d = mat('#8a2a1c');
  blob(g, m, [0, 0.18, 0], [0.28, 0.15, 0.2]);
  for (const s of [-1, 1]) {
    cyl(g, m, 0.03, 0.03, 0.22, [s * 0.32, 0.3, 0.1], [0.8, 0, -s * 0.5]);
    const c = grp(g, [s * 0.42, 0.45, 0.2]);
    blob(c, m, [0, 0, 0], [0.11, 0.1, 0.07]);
    add(c, new THREE.ConeGeometry(0.05, 0.16, 10), d, [s * 0.04, 0.12, 0], [0, 0, -s * 0.3]);
    add(c, new THREE.ConeGeometry(0.05, 0.16, 10), d, [-s * 0.02, 0.12, 0], [0, 0, s * 0.3]);
    for (let i = 0; i < 3; i++) cyl(g, d, 0.015, 0.015, 0.22, [s * (0.25 + i * 0.05), 0.08, -0.05 + i * 0.07], [0, 0, s * 1.1]);
    cyl(g, m, 0.012, 0.012, 0.12, [s * 0.1, 0.38, 0.14]); blob(g, mat('#fff'), [s * 0.1, 0.46, 0.14], [0.04, 0.04, 0.04]); blob(g, mat('#111'), [s * 0.1, 0.46, 0.17], [0.02, 0.02, 0.02]);
  }
  return g;
}

export function brain({ col = '#f09aa8', r = 0.3 } = {}) {
  const g = new THREE.Group(), m = mat(col, { roughness: 0.5 }), d = mat('#c9667a');
  const rg = rng(3);
  for (const s of [-1, 1]) blob(g, m, [s * r * 0.45, r * 0.9, 0], [r * 0.6, r * 0.7, r * 0.8]);
  for (let i = 0; i < 18; i++) { const a = rg() * Math.PI, b = rg() * Math.PI * 2;
    blob(g, d, [Math.cos(b) * r * 0.9 * Math.sin(a), r * 0.9 + Math.cos(a) * r * 0.6, Math.sin(b) * r * 0.75 * Math.sin(a)], [r * 0.18, r * 0.07, r * 0.07], [a, b, 0]); }
  cyl(g, mat('#e8b4b8'), r * 0.1, r * 0.13, r * 0.4, [0, r * 0.25, -r * 0.1]);
  return g;
}

export function shield({ col = '#2f7bdc', s = 0.4 } = {}) {
  const g = new THREE.Group(), sh = new THREE.Shape();
  sh.moveTo(-s, s); sh.lineTo(s, s); sh.lineTo(s, 0); sh.quadraticCurveTo(s, -s * 0.8, 0, -s * 1.1); sh.quadraticCurveTo(-s, -s * 0.8, -s, 0); sh.closePath();
  add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), mat(col, { metalness: 0.3 }), [0, s * 1.2, 0]);
  box(g, mat('#fff'), [s * 0.25, s * 1.0, 0.04], [0, s * 1.2, 0.09]); box(g, mat('#fff'), [s * 1.0, s * 0.25, 0.04], [0, s * 1.3, 0.09]);
  return g;
}

export function tuba() {
  const g = new THREE.Group(), br = mat('#e3b229', { metalness: 0.75, roughness: 0.22 });
  add(g, new THREE.TorusGeometry(0.34, 0.045, 12, 40), br, [0, 0.55, 0]);
  add(g, new THREE.TorusGeometry(0.24, 0.04, 12, 40), br, [0.02, 0.5, 0.0]);
  cyl(g, br, 0.05, 0.42, 0.6, [0.22, 1.0, 0], [0, 0, -0.1], 36);
  blob(g, br, [0.2, 1.3, 0], [0.43, 0.04, 0.43]);
  cyl(g, br, 0.04, 0.04, 0.45, [-0.16, 0.95, 0], [0, 0, 0.1]);
  for (const x of [-0.04, 0.06, 0.16]) { cyl(g, mat('#c9c9c9', { metalness: 0.8 }), 0.035, 0.035, 0.22, [x, 0.8, 0.38]); blob(g, mat('#f5f0e0'), [x, 0.93, 0.38], [0.04, 0.025, 0.04]); }
  add(g, new THREE.TorusGeometry(0.07, 0.015, 8, 20), br, [-0.36, 1.15, 0], [0, Math.PI / 2, 0]);
  return g;
}

export function celery({ h = 0.9 } = {}) {
  const g = new THREE.Group();
  [[-0.05, 0.25], [0.04, -0.15], [0.0, 0.0], [0.08, 0.3], [-0.09, -0.25]].forEach(([x, t], i) => {
    const s = grp(g, [x, 0, (i - 2) * 0.03], [0, 0, -t * 0.6]);
    cyl(s, mat(i % 2 ? '#a9d56a' : '#8ccb53'), 0.045, 0.03, h, [0, h / 2, 0]);
    for (let k = 0; k < 3; k++) add(s, new THREE.BoxGeometry(0.008, h * 0.9, 0.012), mat('#6fae3c'), [0.03, h / 2, 0.03 - k * 0.03]);
    for (let k = 0; k < 3; k++) blob(s, mat(['#4ea038', '#62b142', '#74c04c'][k]), [(k - 1) * 0.07, h + 0.06, (k - 1) * 0.02], [0.09, 0.07, 0.03], [0, 0, (k - 1) * 0.4]);
  });
  return g;
}

export function oats() {
  const g = new THREE.Group(), st = mat('#d9b85c'), gr = mat('#f0d78a');
  for (let i = 0; i < 7; i++) {
    const t = (i - 3) * 0.11, s = grp(g, [t * 0.35, 0, 0], [0, 0, -t]);
    cyl(s, st, 0.012, 0.012, 0.65, [0, 0.33, 0]);
    for (let k = 0; k < 6; k++) { const y = 0.68 - k * 0.055; blob(s, gr, [0.025, y, 0], [0.018, 0.04, 0.018], [0, 0, -0.4]); blob(s, gr, [-0.025, y - 0.02, 0], [0.018, 0.04, 0.018], [0, 0, 0.4]); }
  }
  cyl(g, mat('#a64b2a'), 0.05, 0.05, 0.08, [0, 0.2, 0]);
  return g;
}

export function lamp() {
  const g = new THREE.Group(), au = mat('#f0b92a', { metalness: 0.8, roughness: 0.25 });
  const pts = [[0.0, 0], [0.16, 0.01], [0.2, 0.06], [0.28, 0.14], [0.3, 0.2], [0.2, 0.27], [0.1, 0.3], [0.1, 0.34], [0.14, 0.37], [0, 0.37]].map(([r, y]) => new THREE.Vector2(r, y));
  add(g, new THREE.LatheGeometry(pts, 32), au);
  add(g, new THREE.TorusGeometry(0.1, 0.02, 8, 20, Math.PI * 1.5), au, [-0.32, 0.2, 0], [0, 0, 1.2]);
  const spout = [new THREE.Vector3(0.25, 0.18, 0), new THREE.Vector3(0.4, 0.2, 0), new THREE.Vector3(0.52, 0.3, 0), new THREE.Vector3(0.6, 0.4, 0)];
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spout), 16, 0.035, 10), au);
  blob(g, mat('#e23b4e', { roughness: 0.2 }), [0, 0.28, 0.27], [0.04, 0.04, 0.03]);
  return g;
}

export function genie() {
  const g = new THREE.Group(), bl = '#3aa0e8';
  const smoke = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.75, 24), mat('#7cc4f2', { transparent: true, opacity: 0.8 }));
  smoke.rotation.z = Math.PI; smoke.position.y = 0.375; smoke.castShadow = true; g.add(smoke);
  cyl(g, mat(bl), 0.28, 0.2, 0.5, [0, 0.95, 0]);
  const head = grp(g, [0, 1.38, 0]); const src = human({ skin: bl, shirt: bl, hair: '#222a55', iris: '#ffd23c' });
  head.add(src.userData.head); src.userData.head.position.set(0, 0, 0);
  const tb = mat('#f2f2f2'); blob(head, tb, [0, 0.14, 0], [0.24, 0.17, 0.24]); blob(head, mat('#e23b4e'), [0, 0.28, 0.12], [0.05, 0.05, 0.05]);
  for (const s of [-1, 1]) { const a = grp(g, [s * 0.3, 1.05, 0], [0, 0, s * 0.9]); cyl(a, mat(bl), 0.07, 0.06, 0.4, [0, -0.18, 0]); blob(a, mat('#e0b020', { metalness: 0.7 }), [0, -0.4, 0], [0.08, 0.04, 0.08]); }
  blob(g, mat('#e0b020', { metalness: 0.7 }), [0, 1.12, 0.22], [0.1, 0.05, 0.04]);
  return g;
}

export function car({ col = '#e8473a' } = {}) {
  const g = new THREE.Group(), m = mat(col, { metalness: 0.3, roughness: 0.35 });
  box(g, m, [1.5, 0.3, 0.7], [0, 0.32, 0]); box(g, m, [0.85, 0.28, 0.64], [-0.05, 0.6, 0]);
  box(g, glass('#bfe9ff', 0.7), [0.8, 0.2, 0.66], [-0.05, 0.62, 0]);
  for (const [x, z] of [[-0.5, 0.36], [0.5, 0.36], [-0.5, -0.36], [0.5, -0.36]]) { cyl(g, mat('#222'), 0.17, 0.17, 0.12, [x, 0.17, z], [Math.PI / 2, 0, 0]); cyl(g, mat('#ccc', { metalness: 0.8 }), 0.09, 0.09, 0.13, [x, 0.17, z], [Math.PI / 2, 0, 0]); }
  blob(g, mat('#fff8c8', { emissive: '#ffee88', emissiveIntensity: 0.4 }), [0.75, 0.36, 0.22], [0.04, 0.06, 0.08]); blob(g, mat('#fff8c8', { emissive: '#ffee88', emissiveIntensity: 0.4 }), [0.75, 0.36, -0.22], [0.04, 0.06, 0.08]);
  return g;
}

export function tuna({ len = 1 } = {}) {
  const g = new THREE.Group(), blue = mat('#3a6fb5'), silver = mat('#dfe8f0'), dk = mat('#1f3f73');
  blob(g, blue, [0, 0, 0], [0.5 * len, 0.2 * len, 0.17 * len]); blob(g, silver, [0, -0.06 * len, 0], [0.42 * len, 0.12 * len, 0.16 * len]);
  add(g, new THREE.ConeGeometry(0.16 * len, 0.3 * len, 4), dk, [-0.62 * len, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.3]);
  add(g, new THREE.ConeGeometry(0.1 * len, 0.2 * len, 4), dk, [-0.1 * len, 0.22 * len, 0], [0, 0, 0], [1, 1, 0.3]);
  blob(g, mat('#fff'), [0.34 * len, 0.04 * len, 0.14 * len], [0.05 * len, 0.05 * len, 0.03 * len]); blob(g, mat('#111'), [0.35 * len, 0.04 * len, 0.16 * len], [0.03 * len, 0.03 * len, 0.02 * len]);
  for (let i = 0; i < 4; i++) blob(g, dk, [0.1 * len - i * 0.14 * len, 0.1 * len, 0.16 * len], [0.012, 0.012, 0.01]);
  return g;
}

/** Spider web from thin strands in the xy plane (r = radius). */
export function web(r = 0.5) {
  const g = new THREE.Group(), m = mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 1 }), Y = new THREE.Vector3(0, 1, 0);
  const seg = (a, b) => { const A = new THREE.Vector3(a[0], a[1], 0), B = new THREE.Vector3(b[0], b[1], 0);
    const o = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, A.distanceTo(B), 5), m); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(Y, B.sub(A).normalize()); g.add(o); };
  const N = 10, pt = (i, k) => [Math.cos((i / N) * Math.PI * 2) * r * k, Math.sin((i / N) * Math.PI * 2) * r * k];
  for (let i = 0; i < N; i++) seg([0, 0], pt(i, 1));
  for (const k of [0.3, 0.55, 0.8, 1]) for (let i = 0; i < N; i++) seg(pt(i, k * (i % 2 ? 0.93 : 1)), pt(i + 1, k * ((i + 1) % 2 ? 0.93 : 1)));
  return g;
}

/** COBWEB pill: capsule wrapped in web strands, with a little spider. */
export function cobPill({ s = 1 } = {}) {
  const g = new THREE.Group(), p = grp(g, [0, 0, 0], [0, 0, 0.5]);
  add(p, new THREE.CapsuleGeometry(0.17, 0.26, 10, 20), mat('#2f7bdc', { roughness: 0.25 }), [0, 0.13, 0]);
  add(p, new THREE.CapsuleGeometry(0.172, 0.26, 10, 20), mat('#f3f3f3', { roughness: 0.25 }), [0, -0.13, 0]);
  cyl(p, mat('#f3f3f3', { roughness: 0.25 }), 0.17, 0.17, 0.0001, [0, 0, 0]);
  const w = web(0.34); w.position.set(0.0, 0.0, 0.19); w.rotation.z = 0.4; g.add(w);
  const sp = grp(g, [0.36, -0.35, 0.2]); blob(sp, mat('#222'), [0, 0, 0], [0.06, 0.06, 0.06]); blob(sp, mat('#222'), [0, 0.07, 0], [0.04, 0.04, 0.04]);
  for (let i = 0; i < 4; i++) for (const k of [-1, 1]) cyl(sp, mat('#222'), 0.006, 0.006, 0.14, [k * 0.09, 0.0 + (i - 1.5) * 0.02, 0], [0, 0, k * (0.9 - i * 0.15)]);
  g.scale.setScalar(s); return g;
}

export function cheese() { // BRIE wedge
  const g = new THREE.Group(), sh = new THREE.Shape(), R = 0.5, a = 0.9;
  sh.moveTo(0, 0); sh.lineTo(R, 0); sh.absarc(0, 0, R, 0, a, false); sh.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 }); geo.rotateX(-Math.PI / 2);
  add(g, geo, mat('#fbe27a', { roughness: 0.5 }), [-0.15, 0, 0.1]);
  const rind = new THREE.Shape(); rind.moveTo(R, 0); rind.absarc(0, 0, R, 0, a, false); rind.absarc(0, 0, R - 0.035, a, 0, true);
  const rg = new THREE.ExtrudeGeometry(rind, { depth: 0.32, bevelEnabled: false }); rg.rotateX(-Math.PI / 2);
  add(g, rg, mat('#fffbe8', { roughness: 0.8 }), [-0.15, -0.005, 0.1]);
  return g;
}

export function dna({ h = 1.2, r = 0.16, turns = 2.5 } = {}) {
  const g = new THREE.Group(), A = [], B = [], n = 60;
  for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2; A.push(new THREE.Vector3(Math.cos(a) * r, t * h, Math.sin(a) * r)); B.push(new THREE.Vector3(-Math.cos(a) * r, t * h, -Math.sin(a) * r)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(A), 120, 0.032, 8), mat('#e5427a'));
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(B), 120, 0.032, 8), mat('#2f9be0'));
  for (let i = 2; i < n; i += 4) { const a = A[i], b = B[i]; const m = a.clone().add(b).multiplyScalar(0.5); const l = a.distanceTo(b);
    const rung = cyl(g, mat(['#ffd23c', '#7be0a0'][Math.floor(i / 4) % 2]), 0.014, 0.014, l, [m.x, m.y, m.z]); rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()); }
  return g;
}

/** Protein ribbon: coloured helix + beta arrows on a short coil. */
export function protein({ s = 1 } = {}) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 80; i++) { const t = i / 80, a = t * Math.PI * 2 * 4; pts.push(new THREE.Vector3(Math.cos(a) * 0.14 * (1 + 0.3 * Math.sin(t * 9)), t * 0.7, Math.sin(a) * 0.14)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.04, 8), mat('#ff7b3a'));
  const loop = [new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(0.3, 0.85, 0.1), new THREE.Vector3(0.5, 0.6, -0.1), new THREE.Vector3(0.45, 0.2, 0.0)];
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loop), 40, 0.035, 8), mat('#5fd08a'));
  add(g, new THREE.ConeGeometry(0.09, 0.2, 14), mat('#5fd08a'), [0.45, 0.1, 0], [Math.PI, 0, 0]);
  g.scale.setScalar(s); return g;
}

export function triangle({ s = 1, col = '#22b8a6', solid = false } = {}) { // musical-style TRIANGLE: equilateral frame with a striker
  const g = new THREE.Group(), m = mat(col, { metalness: 0.5, roughness: 0.3 }), sh = new THREE.Shape();
  sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 0.866); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.34, 0.07); hole.lineTo(0, 0.66); hole.lineTo(0.34, 0.07); hole.closePath(); if (!solid) sh.holes.push(hole);
  add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), m, [0, 0, -0.06]);
  if (solid) for (const x of [-0.12, 0.12]) { blob(g, mat('#fff'), [x, 0.33, 0.1], [0.07, 0.09, 0.03]); blob(g, mat('#1a2a4a'), [x, 0.32, 0.125], [0.04, 0.06, 0.02]); blob(g, mat('#fff'), [x - 0.015, 0.35, 0.145], [0.015, 0.015, 0.01]); }
  g.scale.setScalar(s); return g;
}

export function bone({ len = 0.8 } = {}) {
  const g = new THREE.Group(), m = mat('#f4ead4');
  cyl(g, m, 0.07, 0.07, len, [0, len / 2, 0]);
  for (const y of [0, len]) for (const s of [-1, 1]) blob(g, m, [s * 0.06, y, 0], [0.09, 0.09, 0.09]);
  cyl(g, mat('#d83a4a'), 0.075, 0.075, 0.25, [0, len / 2, 0.0], [0, 0, 0], 20).scale.set(1.0, 1, 1.0);
  blob(g, mat('#d83a4a'), [0, len / 2, 0.07], [0.06, 0.13, 0.015]);
  return g;
}

export function bCell({ r = 0.22, col = '#8e6ad8' } = {}) {
  const g = new THREE.Group();
  blob(g, mat(col), [0, r, 0], [r, r, r]); blob(g, mat('#5a3aa8'), [0.02, r, r * 0.3], [r * 0.5, r * 0.5, r * 0.5]);
  blob(g, mat('#fff'), [-r * 0.35, r * 1.15, r * 0.88], [r * 0.18, r * 0.22, r * 0.1]); blob(g, mat('#fff'), [r * 0.35, r * 1.15, r * 0.88], [r * 0.18, r * 0.22, r * 0.1]);
  blob(g, mat('#111'), [-r * 0.35, r * 1.15, r * 0.97], [r * 0.09, r * 0.12, r * 0.05]); blob(g, mat('#111'), [r * 0.35, r * 1.15, r * 0.97], [r * 0.09, r * 0.12, r * 0.05]);
  return g;
}

/** CD19 receptor stalk: Y-shape on a stem, with a coloured tip. */
export function receptor({ col = '#ffb020', h = 0.35 } = {}) {
  const g = new THREE.Group(), m = mat(col);
  cyl(g, m, 0.025, 0.025, h, [0, h / 2, 0]);
  for (const s of [-1, 1]) cyl(g, m, 0.025, 0.025, h * 0.6, [s * h * 0.17, h + h * 0.22, 0], [0, 0, -s * 0.5]);
  return g;
}

export function bore() { // electric drill with auger bit
  const g = new THREE.Group(), body = mat('#e8b01a'), dk = mat('#2c2f36'), st = mat('#b7bcc6', { metalness: 0.85, roughness: 0.25 });
  box(g, body, [0.8, 0.36, 0.34], [0, 0.95, 0]); cyl(g, dk, 0.14, 0.14, 0.2, [0.5, 0.95, 0], [0, 0, Math.PI / 2]);
  cyl(g, st, 0.1, 0.1, 0.18, [0.66, 0.95, 0], [0, 0, Math.PI / 2]);
  box(g, dk, [0.2, 0.55, 0.26], [-0.12, 0.5, 0], [0, 0, 0.12]); box(g, mat('#c93d33'), [0.16, 0.12, 0.22], [-0.02, 0.8, 0]);
  const sp = []; for (let i = 0; i <= 90; i++) { const t = i / 90; sp.push(new THREE.Vector3(0.78 + t * 0.9, 0.95 + Math.cos(t * 28) * 0.05, Math.sin(t * 28) * 0.05)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 220, 0.032, 8), st);
  cyl(g, st, 0.014, 0.014, 0.9, [1.23, 0.95, 0], [0, 0, Math.PI / 2]); add(g, new THREE.ConeGeometry(0.05, 0.14, 12), st, [1.74, 0.95, 0], [0, 0, -Math.PI / 2]);
  return g;
}

export function water({ w = 3, d = 2, h = 0.9, col = '#3fa7e6' } = {}) { // pool/tank of water with glass walls
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(w, h, d), mat(col, { transparent: true, opacity: 0.5, roughness: 0.05, depthWrite: false }), [0, h / 2, 0]);
  add(g, new THREE.BoxGeometry(w + 0.1, 0.08, d + 0.1), mat('#c9ced6'), [0, 0.0, 0]);
  return g;
}

export function house({ w = 1, h = 0.8, d = 0.8, wall = '#e9c9a0', roof = '#b8463a' } = {}) {
  const g = new THREE.Group();
  box(g, mat(wall), [w, h, d], [0, h / 2, 0]);
  add(g, new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.6, 4), mat(roof), [0, h + h * 0.3, 0], [0, Math.PI / 4, 0], [w / Math.max(w, d), 1, d / Math.max(w, d)]);
  box(g, mat('#7a4a2a'), [w * 0.2, h * 0.5, 0.03], [0, h * 0.25, d / 2 + 0.01]);
  for (const s of [-1, 1]) box(g, mat('#bfe3ff'), [w * 0.18, h * 0.25, 0.03], [s * w * 0.3, h * 0.6, d / 2 + 0.01]);
  return g;
}

export function dome() { // MIT-style Great Dome building
  const g = new THREE.Group(), st = mat('#e8e2d4');
  box(g, st, [3.0, 0.8, 1.2], [0, 0.4, 0]);
  for (let i = 0; i < 8; i++) cyl(g, mat('#f6f1e4'), 0.07, 0.07, 0.8, [-0.98 + i * 0.28, 1.2, 0.68]);
  box(g, st, [2.3, 0.15, 1.0], [0, 1.65, 0.12]); box(g, st, [1.6, 0.5, 1.0], [0, 1.9, 0]);
  add(g, new THREE.SphereGeometry(0.75, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d7dbe0', { metalness: 0.5, roughness: 0.35 }), [0, 2.15, 0]);
  cyl(g, st, 0.2, 0.2, 0.2, [0, 2.95, 0]); add(g, new THREE.ConeGeometry(0.1, 0.25, 12), st, [0, 3.15, 0]);
  return g;
}

export function castle() {
  const g = new THREE.Group(), st = mat('#d9d3e8'), rf = mat('#d84b6a');
  box(g, st, [1.4, 0.9, 0.7], [0, 0.45, 0]);
  for (const x of [-0.85, 0.85]) { cyl(g, st, 0.28, 0.28, 1.5, [x, 0.75, 0]); add(g, new THREE.ConeGeometry(0.36, 0.55, 20), rf, [x, 1.78, 0]); }
  cyl(g, st, 0.3, 0.3, 1.9, [0, 0.95, -0.1]); add(g, new THREE.ConeGeometry(0.4, 0.65, 20), rf, [0, 2.2, -0.1]);
  for (let i = 0; i < 5; i++) box(g, st, [0.16, 0.14, 0.16], [-0.56 + i * 0.28, 0.97, 0.3]);
  add(g, new THREE.CircleGeometry(0.2, 20), mat('#5a3a2a'), [0, 0.2, 0.36]); box(g, mat('#5a3a2a'), [0.4, 0.2, 0.02], [0, 0.1, 0.36]);
  for (const [x, y] of [[-0.85, 1.1], [0.85, 1.1], [0, 1.5]]) add(g, new THREE.CircleGeometry(0.07, 12), mat('#ffd86a', { emissive: '#ffcc44', emissiveIntensity: 0.5 }), [x, y, 0.29 + (x === 0 ? 0.0 : 0)]);
  return g;
}

export function bubble({ w = 0.7, h = 0.45, col = '#ffffff' } = {}) { // speech bubble with squiggles
  const g = new THREE.Group();
  blob(g, mat(col, { roughness: 0.4 }), [0, 0, 0], [w / 2, h / 2, 0.03]);
  add(g, new THREE.ConeGeometry(0.08, 0.2, 3), mat(col), [-w * 0.25, -h * 0.55, 0], [0, 0, Math.PI + 0.3]);
  return g;
}

export function pot() {
  const g = new THREE.Group(), m = mat('#4a4f5c', { metalness: 0.6, roughness: 0.35 });
  cyl(g, m, 0.34, 0.3, 0.42, [0, 0.21, 0], [0, 0, 0], 32);
  add(g, new THREE.TorusGeometry(0.34, 0.03, 8, 32), m, [0, 0.42, 0], [Math.PI / 2, 0, 0]);
  cyl(g, mat('#7cd88a', { emissive: '#3a8a4a', emissiveIntensity: 0.3 }), 0.31, 0.31, 0.02, [0, 0.4, 0]);
  for (const s of [-1, 1]) cyl(g, m, 0.03, 0.03, 0.14, [s * 0.4, 0.34, 0], [0, 0, Math.PI / 2]);
  return g;
}

export function tree({ h = 1.6, col = '#4ea038' } = {}) {
  const g = new THREE.Group(); cyl(g, mat('#7a4a2a'), 0.09, 0.12, h * 0.4, [0, h * 0.2, 0]);
  blob(g, mat(col), [0, h * 0.62, 0], [h * 0.3, h * 0.28, h * 0.3]); blob(g, mat(col), [h * 0.12, h * 0.8, 0.05], [h * 0.2, h * 0.2, h * 0.2]); return g;
}

export function mama() { // A BIG MAMA: warm mother figure, pink dress + apron (scale it up)
  const g = human({ shirt: '#e8688a', dress: true, hair: '#5a3a22', hairLong: true, iris: '#7a4a2a' });
  box(g, mat('#fff6e6'), [0.2, 0.3, 0.03], [0, 0.5, 0.2]); box(g, mat('#fff6e6'), [0.1, 0.12, 0.03], [0, 0.72, 0.15]);
  return g;
}

export function bird({ col = '#2f7bdc', s = 1 } = {}) { // BLUEBIRD facing +z
  const g = new THREE.Group(), m = mat(col);
  blob(g, m, [0, 0.4, 0], [0.34, 0.32, 0.4]); blob(g, mat('#f4a46a'), [0, 0.32, 0.12], [0.26, 0.24, 0.3]);
  blob(g, mat('#f2f6ff'), [0, 0.18, 0.1], [0.2, 0.1, 0.25]);
  const h = grp(g, [0, 0.78, 0.15]); blob(h, m, [0, 0, 0], [0.24, 0.22, 0.22]);
  add(h, new THREE.ConeGeometry(0.06, 0.18, 12), mat('#ffb12a'), [0, -0.02, 0.28], [Math.PI / 2, 0, 0]);
  for (const x of [-0.1, 0.1]) { blob(h, mat('#fff'), [x, 0.03, 0.17], [0.06, 0.075, 0.03]); blob(h, mat('#111'), [x, 0.03, 0.2], [0.035, 0.05, 0.02]); blob(h, mat('#fff'), [x - 0.01, 0.055, 0.22], [0.012, 0.012, 0.01]); }
  add(h, new THREE.ConeGeometry(0.05, 0.14, 8), m, [0, 0.24, -0.04], [-0.4, 0, 0]);
  for (const x of [-1, 1]) blob(g, mat('#1f5cb8'), [x * 0.34, 0.42, -0.02], [0.08, 0.26, 0.32], [0, 0, x * 0.3]);
  add(g, new THREE.ConeGeometry(0.12, 0.45, 8), mat('#1f5cb8'), [0, 0.3, -0.5], [-1.9, 0, 0], [1, 1, 0.4]);
  g.scale.setScalar(s); return g;
}

export function devil() { // DEVIL: red chibi with horns, ears, tail
  const g = human({ skin: '#d6342f', shirt: '#6b1a28', pants: '#3a1620', hair: '#1a0a0a', iris: '#ffd23c' });
  const h = g.userData.head, hm = mat('#2a0f12');
  for (const x of [-1, 1]) { add(h, new THREE.ConeGeometry(0.045, 0.2, 10), hm, [x * 0.11, 0.24, 0.02], [0, 0, -x * 0.3]); add(h, new THREE.ConeGeometry(0.04, 0.12, 8), mat('#d6342f'), [x * 0.21, 0.02, 0], [0, 0, -x * 1.2]); }
  const tail = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.4, -0.12), new THREE.Vector3(0, 0.3, -0.35), new THREE.Vector3(0.1, 0.5, -0.45), new THREE.Vector3(0.12, 0.62, -0.38)]);
  add(g, new THREE.TubeGeometry(tail, 20, 0.025, 8), mat('#d6342f')); add(g, new THREE.ConeGeometry(0.06, 0.12, 3), mat('#d6342f'), [0.12, 0.7, -0.36]);
  return g;
}
