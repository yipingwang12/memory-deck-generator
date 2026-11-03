// Shared Arrakis scene kit: desert stage + props. base(P, opts) -> ctx { THREE, stage, scene, worm, char(obj), done(cam, look) }.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSandworm } from './sandworm.js';
export { THREE, guard, canvasTexture, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
const Y = new THREE.Vector3(0, 1, 0);
export function limb(parent, a, b, r, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 12), m);
  o.position.copy(A.clone().add(B).multiplyScalar(0.5)); o.quaternion.setFromUnitVectors(Y, d.normalize()); return o;
}
export function animeEye(parent, x, y, z, s = 1, iris = '#3a2a1a') {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); const st = 0.0015;
  const d = (rx, ry, c, zz, px = 0, py = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(px, py, zz); g.add(m); };
  d(0.05, 0.062, '#fff', 0); d(0.038, 0.054, iris, st); d(0.021, 0.03, '#0a0808', 2 * st); d(0.013, 0.013, '#fff', 3 * st, -0.013, 0.02); d(0.006, 0.006, '#fff', 3 * st, 0.012, -0.024);
  parent.add(g); return g;
}

export function base(P, { tilt = 1.25, wx = 0, wz = 0, wry = 0, ws = 1.7, height = 1.3, open = 1, ground = '#e8b86b', worm = true } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#ffe8d0', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene, chars = new Set();
  add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const r = rng(11);
  for (let i = 0; i < 9; i++) {  // background dunes
    const x = (i - 4) * 9 + (r() - 0.5) * 4;
    blob(scene, mat(i % 2 ? '#d9a057' : '#efc57c', { roughness: 0.95 }), [x, -1.5, -22 - r() * 12], [10 + r() * 5, 3 + r() * 2.2, 6]);
  }
  const ctx = { THREE, stage, scene, chars, num };
  ctx.char = (o) => { o.traverse((m) => chars.add(m)); return o; };
  if (worm) {
    ctx.worm = createSandworm({ scale: ws, tilt, height, open }); ctx.worm.position.set(wx, 0, wz); ctx.worm.rotation.y = wry; scene.add(ctx.worm);
    ctx.char(ctx.worm);
    add(scene, new THREE.TorusGeometry(0.34 * ws, 0.09, 10, 36), mat('#d9a057', { roughness: 1 }), [wx, 0.02, wz], [Math.PI / 2, 0, 0], [1, 1, 0.5]); // sand ring at base
  }
  ctx.done = (cam, look, clouds = [[150, 900, 90, 1.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]) => {
    stage.toonify(scene, (m) => chars.has(m)); stage.addClouds(clouds);
    stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
    stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0)); stage.finish();
  };
  return ctx;
}

// ---- props -------------------------------------------------------------------------------------------------
export function coin(r = 0.12) {
  const g = new THREE.Group(), gold = mat('#ffc830', { metalness: 0.55, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, 0.035, 32), gold, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.96, 0.012, 8, 32), mat('#ffe27a', { metalness: 0.5, roughness: 0.3 }), [0, 0, 0.012]);
  add(g, new THREE.TorusGeometry(r * 0.62, 0.008, 8, 28), mat('#d79a10', { metalness: 0.5 }), [0, 0, 0.019]);
  add(g, new THREE.CylinderGeometry(r * 0.28, r * 0.28, 0.01, 6), mat('#d79a10', { metalness: 0.5 }), [0, 0, 0.02], [Math.PI / 2, 0, 0]);
  return g;
}
export function coinPile(n = 14, r = 0.12, spread = 0.35, seed = 3) {
  const g = new THREE.Group(), rn = rng(seed); let left = n;
  for (let L = 0; left > 0; L++) for (const [f, k] of [[1, 9], [0.62, 6], [0.3, 3], [0, 1]]) for (let i = 0; i < k && left > 0; i++, left--) {
    const c = coin(r), a = i / k * 6.283 + L, s = spread * (1 - L * 0.2) * f;
    c.position.set(Math.cos(a) * s, r * 0.2 + L * 0.06 + (1 - f) * 0.04, Math.sin(a) * s);
    c.rotation.set(-Math.PI / 2 + (rn() - 0.5) * 0.4, rn() * 6.28, (rn() - 0.5) * 0.3); g.add(c);
  }
  return g;
}
export function crown(s = 1) {
  const g = new THREE.Group(), gold = mat('#ffc830', { metalness: 0.6, roughness: 0.28 });
  add(g, new THREE.CylinderGeometry(0.2, 0.17, 0.12, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#ffc830', metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide }), [0, 0.06, 0]);
  add(g, new THREE.TorusGeometry(0.185, 0.015, 8, 28), gold, [0, 0.005, 0], [Math.PI / 2, 0, 0]);
  const gems = ['#e0304a', '#2a8ae0', '#3ac070', '#e0304a', '#2a8ae0'];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.28, x = Math.cos(a) * 0.19, z = Math.sin(a) * 0.19;
    add(g, new THREE.ConeGeometry(0.05, 0.17, 4), gold, [x, 0.2, z], [0, a, 0]);
    blob(g, mat('#fff0a0', { metalness: 0.4 }), [x * 1.04, 0.3, z * 1.04], [0.03, 0.03, 0.03]);
    blob(g, mat(gems[i], { roughness: 0.2 }), [x * 1.05, 0.07, z * 1.05], [0.032, 0.032, 0.032]);
  }
  g.scale.setScalar(s); return g;
}
export function pill(len = 0.3, r = 0.075, c1 = '#ff5a78', c2 = '#fff') {
  const g = new THREE.Group();
  for (const [s, c] of [[1, c1], [-1, c2]]) {
    const m = mat(c, { roughness: 0.25 });
    add(g, new THREE.CylinderGeometry(r, r, len / 2, 18), m, [s * len / 4, 0, 0], [0, 0, Math.PI / 2]);
    blob(g, m, [s * len / 2, 0, 0], [r, r, r]);
  }
  return g;
}
export function heart(s = 1, color = '#ff4a6a') {
  const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.7, 0, -0.5, 0.55, 0, 0.2); sh.bezierCurveTo(0.5, 0.55, 0.7, 0, 0, -0.5);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }); geo.center();
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.3 })); m.scale.setScalar(s); m.castShadow = true; return m;
}
export function canoe() {
  const g = new THREE.Group(), wood = mat('#a8622e'), dark = mat('#5a3014');
  const hull = new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  add(g, hull, new THREE.MeshStandardMaterial({ color: '#a8622e', roughness: 0.7, side: THREE.DoubleSide }), [0, 0.38, 0], [0, 0, 0], [1.2, 0.4, 0.42]);
  add(g, new THREE.TorusGeometry(1, 0.03, 8, 48), dark, [0, 0.38, 0], [Math.PI / 2, 0, 0], [1.2, 0.42, 1]);
  for (const s of [-1, 1]) add(g, new THREE.ConeGeometry(0.17, 0.5, 14), wood, [s * 1.3, 0.5, 0], [0, 0, -s * 1.1], [1, 1, 0.8]);
  for (const x of [-0.5, 0.5]) add(g, new THREE.BoxGeometry(0.07, 0.05, 0.8), dark, [x, 0.36, 0]);
  return g;
}
export function ladder(h = 2.2) {
  const g = new THREE.Group(), wood = mat('#b97a3c'), dk = mat('#7a4a20');
  for (const x of [-0.2, 0.2]) add(g, new THREE.BoxGeometry(0.06, h, 0.06), wood, [x, h / 2, 0]);
  for (let y = 0.2; y < h; y += 0.3) add(g, new THREE.CylinderGeometry(0.028, 0.028, 0.4, 10), dk, [0, y, 0], [0, 0, Math.PI / 2]);
  return g;
}
export function flag(color = '#e8344a') {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.018, 0.018, 1.0, 10), mat('#ddd', { metalness: 0.4 }), [0, 0.5, 0]);
  blob(g, mat('#ffc830', { metalness: 0.5 }), [0, 1.02, 0], [0.04, 0.04, 0.04]);
  const cloth = add(g, new THREE.PlaneGeometry(0.55, 0.36, 12, 4), new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }), [0.29, 0.82, 0]);
  const p = cloth.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 7) * 0.04); cloth.geometry.computeVertexNormals();
  heartOn(g, 0.2, 0.82); return g;
}
function heartOn() {}
export function pocketWatch() {
  const g = new THREE.Group(), gold = mat('#ffc830', { metalness: 0.6, roughness: 0.28 });
  const face = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#fff8e8'; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = '#2a1a0a'; ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, big = i % 5 === 0; ctx.lineWidth = big ? 12 : 4; const r0 = big ? 190 : 214;
      ctx.beginPath(); ctx.moveTo(s / 2 + Math.sin(a) * r0, s / 2 - Math.cos(a) * r0); ctx.lineTo(s / 2 + Math.sin(a) * 230, s / 2 - Math.cos(a) * 230); ctx.stroke(); }
    ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(s / 2 + Math.sin(0.6) * 110, s / 2 - Math.cos(0.6) * 110); ctx.stroke();
    ctx.lineWidth = 12; ctx.strokeStyle = '#c0283a'; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(s / 2 + Math.sin(3.4) * 160, s / 2 - Math.cos(3.4) * 160); ctx.stroke();
    ctx.lineWidth = 16; ctx.strokeStyle = '#2a1a0a'; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(s / 2 + Math.sin(2.2) * 175, s / 2 - Math.cos(2.2) * 175); ctx.stroke();
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.arc(s / 2, s / 2, 16, 0, 7); ctx.fill();
  });
  add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.14, 48), gold, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.5, 0.05, 12, 48), gold, [0, 0, 0.07]);
  add(g, new THREE.CircleGeometry(0.46, 48), new THREE.MeshStandardMaterial({ map: face, roughness: 0.4 }), [0, 0, 0.075]);
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16), gold, [0, 0.57, 0]);
  add(g, new THREE.TorusGeometry(0.13, 0.03, 10, 24), gold, [0, 0.72, 0]);
  for (let i = 0; i < 8; i++) add(g, new THREE.TorusGeometry(0.06, 0.016, 8, 16), gold, [-0.14 - i * 0.1, 0.8 - i * 0.02 - (i % 2) * 0.01, 0], [0, i % 2 ? Math.PI / 2 : 0, 0]);
  return g;
}
export function rna(points, { n = 26, back = '#3aa0e0' } = {}) {
  const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  add(g, new THREE.TubeGeometry(curve, 80, 0.025, 8), mat(back, { roughness: 0.35 }));
  const cols = ['#ff5a5a', '#ffc830', '#4acf7a', '#b06af0'];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 0, 1)).normalize();
    if (side.lengthSq() < 0.1) side.set(0, 1, 0);
    const b = add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.11, 8), mat(cols[i % 4]), [0, 0, 0]);
    b.position.copy(p).addScaledVector(side, 0.075); b.quaternion.setFromUnitVectors(Y, side);
    blob(g, mat(cols[i % 4], { roughness: 0.3 }), [b.position.x + side.x * 0.06, b.position.y + side.y * 0.06, b.position.z + side.z * 0.06], [0.034, 0.034, 0.034]);
  }
  g.userData.curve = curve; return g;
}
export function eagle() {
  const g = new THREE.Group(), brown = mat('#6a3f1e'), dk = mat('#4a2a12'), white = mat('#fafaf5'), yel = mat('#ffc020');
  blob(g, brown, [0, 0, 0], [0.26, 0.36, 0.24], [0.3, 0, 0]);
  blob(g, white, [0, 0.38, 0.1], [0.17, 0.17, 0.17]);
  add(g, new THREE.ConeGeometry(0.07, 0.2, 14), yel, [0, 0.34, 0.31], [Math.PI / 2 + 0.5, 0, 0]);
  for (const s of [-1, 1]) {
    animeEye(g, s * 0.075, 0.42, 0.255, 0.9, '#c8861a').rotation.y = s * 0.3;
    const w = new THREE.Group(); w.position.set(s * 0.2, 0.1, -0.02); w.rotation.set(0, 0, s * 0.35); g.add(w);
    for (let i = 0; i < 6; i++) blob(w, i % 2 ? brown : dk, [s * (0.18 + i * 0.17), 0.04 - i * 0.02, -0.02 - i * 0.02], [0.3 - i * 0.015, 0.075, 0.2 - i * 0.015], [0, 0, s * 0.25]);
    add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), yel, [s * 0.1, -0.42, 0.06]);
    for (const k of [-1, 0, 1]) add(g, new THREE.ConeGeometry(0.012, 0.07, 6), mat('#2a1a0a'), [s * 0.1 + k * 0.03, -0.54, 0.08], [Math.PI, 0, 0]);
  }
  for (let i = -2; i <= 2; i++) blob(g, white, [i * 0.07, -0.42, -0.16], [0.045, 0.2, 0.03], [0.5, 0, -i * 0.2]);
  return g;
}
export function termite() {
  const g = new THREE.Group(), cream = mat('#f4dcaa'), tan = mat('#d99a50'), dk = mat('#4a2a12');
  blob(g, cream, [0, 0.3, -0.03], [0.21, 0.28, 0.2]);
  for (const y of [0.18, 0.3, 0.42]) add(g, new THREE.TorusGeometry(0.19 - Math.abs(y - 0.3) * 0.2, 0.012, 8, 24), tan, [0, y, -0.03], [Math.PI / 2, 0, 0]);
  blob(g, tan, [0, 0.58, 0], [0.14, 0.1, 0.13]);
  blob(g, mat('#e8a860'), [0, 0.8, 0.03], [0.2, 0.19, 0.19]);
  for (const s of [-1, 1]) {
    animeEye(g, s * 0.085, 0.82, 0.215, 1.3, '#5a3a1a');
    add(g, new THREE.ConeGeometry(0.03, 0.12, 8), dk, [s * 0.05, 0.66, 0.19], [Math.PI * 0.9, 0, s * 0.3]);
    limb(g, [s * 0.06, 0.95, 0.04], [s * 0.2, 1.17, 0.1], 0.012, dk); blob(g, dk, [s * 0.2, 1.18, 0.1], [0.025, 0.025, 0.025]);
    limb(g, [s * 0.12, 0.12, 0.02], [s * 0.15, 0.01, 0.06], 0.03, tan); blob(g, dk, [s * 0.15, 0.01, 0.1], [0.06, 0.03, 0.08]);
  }
  add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.2, 20), mat('#222'), [0, 1.0, 0.03]); add(g, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), mat('#222'), [0, 0.91, 0.03]);
  add(g, new THREE.CylinderGeometry(0.145, 0.145, 0.04, 20), mat('#c0283a'), [0, 0.95, 0.03]);
  return g;
}
export function gillMan() {
  const g = new THREE.Group(), skin = mat('#4fb0a8'), belly = mat('#c8ecd0'), fin = mat('#2a7a90', { side: THREE.DoubleSide }), dk = mat('#1a4048');
  blob(g, skin, [0, 0.62, 0], [0.22, 0.3, 0.16]); blob(g, belly, [0, 0.6, 0.06], [0.16, 0.24, 0.12]);
  for (const s of [-1, 1]) {
    limb(g, [s * 0.09, 0.4, 0], [s * 0.1, 0.07, 0.02], 0.045, skin); add(g, new THREE.ConeGeometry(0.1, 0.22, 3), fin, [s * 0.1, 0.03, 0.14], [Math.PI / 2, 0, 0], [1, 1, 0.3]);
    limb(g, [s * 0.22, 0.82, 0], [s * 0.34, 0.6, 0.08], 0.038, skin); limb(g, [s * 0.34, 0.6, 0.08], [s * 0.38, 0.4, 0.16], 0.034, skin);
    add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.012, 4, 1), fin, [s * 0.39, 0.37, 0.17], [Math.PI / 2, 0, 0], [1, 1, 1.3]);
    for (let k = 0; k < 3; k++) add(g, new THREE.BoxGeometry(0.012, 0.05, 0.01), dk, [s * 0.172, 0.9 + k * 0.03 - 0.02, 0.09 - k * 0.012], [0, -s * 0.5, 0]);
    animeEye(g, s * 0.1, 1.06, 0.18, 1.5, '#e8b020');
    blob(g, fin, [s * 0.22, 1.04, 0], [0.05, 0.12, 0.08]);
  }
  blob(g, skin, [0, 1.02, 0], [0.22, 0.22, 0.2]);
  for (let i = 0; i < 4; i++) add(g, new THREE.ConeGeometry(0.04, 0.16 - i * 0.02, 4), fin, [0, 1.22 - i * 0.02, -0.08 - i * 0.05], [-0.7, 0, 0], [1, 0.4, 1]);
  add(g, new THREE.TorusGeometry(0.035, 0.012, 8, 14, Math.PI), mat('#8a2a3a'), [0, 0.93, 0.2], [0, 0, Math.PI]);
  const c = crown(0.55); c.position.set(0, 1.2, 0); g.add(c);
  return g;
}
export function bicep() {
  const g = new THREE.Group(), skin = mat('#f2b48a');
  limb(g, [-0.45, 0.3, 0], [0.45, 0.4, 0], 0.13, skin); limb(g, [0.45, 0.4, 0], [0.6, 1.15, 0], 0.115, skin);
  blob(g, skin, [0.45, 0.4, 0], [0.15, 0.15, 0.15]); blob(g, skin, [-0.45, 0.3, 0], [0.14, 0.14, 0.14]);
  blob(g, skin, [0.05, 0.6, 0], [0.34, 0.24, 0.22], [0, 0, 0.1]);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 1.7, 14), mat('#b0b8c8', { metalness: 0.5 }), [0.62, 1.2, 0.0]);
  blob(g, skin, [0.62, 1.2, 0], [0.19, 0.17, 0.17]);
  for (let i = 0; i < 4; i++) add(g, new THREE.TorusGeometry(0.075, 0.035, 8, 14), skin, [0.62, 1.31 - i * 0.075, 0.0], [Math.PI / 2, 0, 0]);
  const bolt = mat('#ffe030', { emissive: '#ffb000', emissiveIntensity: 0.6 });
  for (const [x, y, r] of [[0.95, 1.4, -0.6], [0.28, 1.45, 0.6], [1.0, 1.05, -1.1], [0.2, 1.1, 1.1]]) add(g, new THREE.BoxGeometry(0.2, 0.03, 0.03), bolt, [x, y, 0.1], [0, 0, r]);
  return g;
}
