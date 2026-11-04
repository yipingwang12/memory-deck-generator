// Shared scene scaffold + props for the Vertex deck. setup(opts) -> { scene, vortex, done }.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createVortex } from './vortex.js';
export { THREE, guard, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const rbox = (p, m, pos, size, rot) => add(p, new THREE.Mesh(new RoundedBoxGeometry(...size, 4, Math.min(...size) * 0.2)).geometry, m, pos, rot);

/** Canvas text texture, w x h pixels. */
export function textTex(text, w, h, { bg = '#111', fg = '#fff', font = 'bold 110px Arial' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const textPlane = (text, w, h, opt, px = 512) =>
  new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTex(text, px, Math.round(px * h / w), opt) }));

export function setup({ ground = '#7ab648', vx = -0.9, vz = 0, vs = 1.3, vry = 0.35, el = 35, az = 150, seed = 5, cover = 2 } = {}) {
  const stage = createAnimeStage({
    fov: 40, sunElevation: el, sunAzimuth: az, sky: { cover, seed, towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 },
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const vortex = createVortex({ scale: vs }); vortex.position.set(vx, 0, vz); vortex.rotation.y = vry; scene.add(vortex);
  vortex.userData.pose({ arms: { l: [0, 0.9, 0.2], r: [0, -0.9, 0.2] }, legs: { l: [0.2, 0], r: [-0.2, 0] } });
  const done = ({ cam = [0, 0.95, 4.2], look = [0, 0.8, 0] } = {}) => {
    const vm = new Set(); vortex.traverse((o) => vm.add(o));
    stage.toonify(scene, (m) => vm.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
  };
  return { scene, vortex, done, stage };
}

/** Reach the vortex hand to a world point. */
export function reachWorld(vortex, key, p) {
  vortex.updateMatrixWorld(true);
  const l = vortex.worldToLocal(new THREE.Vector3(...p)); vortex.userData.reach(key, [l.x / 1, l.y, l.z]);
}

// ---------- props (each ~1 unit tall, base at y = 0 unless noted) ----------
export function fob() {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(0.2, 0.03, 10, 32), mat('#c8ccd2', { metalness: 0.7, roughness: 0.3 }), [0, 0.38, 0]);
  rbox(g, mat('#2b3a55'), [0, 0, 0], [0.34, 0.62, 0.12]);
  add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.03, 24), mat('#ff5a3c'), [0, 0.08, 0.075], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24), mat('#ffd24a'), [0, -0.12, 0.075], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.05, 0.012, 8, 20), mat('#ffd24a'), [0, 0.25, 0.065]);
  g.position.y = 0.5; const w = new THREE.Group(); w.add(g); return w;
}
export function golfBall(r = 0.3) {
  const g = new THREE.Group(); add(g, new THREE.SphereGeometry(r, 40, 28), mat('#ffffff', { roughness: 0.3 }), [0, r, 0]);
  const R = rng(3);
  for (let i = 0; i < 110; i++) {
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u), n = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
    const d = add(g, new THREE.CircleGeometry(r * 0.09, 10), mat('#c9d3de', { roughness: 0.5 }), [n.x * r * 1.003, r + n.y * r * 1.003, n.z * r * 1.003]);
    d.lookAt(new THREE.Vector3(n.x * 5 * r, r + n.y * 5 * r, n.z * 5 * r));
  }
  return g;
}
export function tee(r = 0.3) { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(r * 0.12, r * 0.04, r * 0.9, 12), mat('#e8c27a'), [0, r * 0.45, 0]); add(g, new THREE.CylinderGeometry(r * 0.28, r * 0.12, r * 0.1, 16), mat('#e8c27a'), [0, r * 0.92, 0]); return g; }
export function flag(color = '#ff4a4a', h = 0.9) {
  const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.012, 0.012, h, 8), mat('#e8e8e8'), [0, h / 2, 0]);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.38, -0.12); s.lineTo(0, -0.26); s.closePath();
  const f = add(g, new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), mat(color, { side: THREE.DoubleSide }), [0.012, h - 0.01, 0]); return g;
}
export function person({ shirt = '#e8504a', h = 1, hair = '#3a2416', skirt = false } = {}) {
  const g = new THREE.Group(), skin = mat('#ffe0c0');
  add(g, new THREE.CylinderGeometry(0.1 * h, 0.07 * h, 0.35 * h, 14), mat('#3d4a8a'), [0, 0.22 * h, 0]);
  add(g, new THREE.CylinderGeometry(0.13 * h, skirt ? 0.2 * h : 0.1 * h, 0.4 * h, 16), mat(shirt), [0, 0.5 * h, 0]);
  blob(g, skin, [0, 0.83 * h, 0], [0.17 * h, 0.17 * h, 0.16 * h]);
  blob(g, mat(hair), [0, 0.9 * h, -0.02 * h], [0.18 * h, 0.14 * h, 0.17 * h]);
  for (const s of [-1, 1]) {
    blob(g, mat('#1a1210'), [s * 0.06 * h, 0.83 * h, 0.14 * h], [0.025 * h, 0.035 * h, 0.012 * h]);
    add(g, new THREE.CylinderGeometry(0.025 * h, 0.025 * h, 0.3 * h, 8), skin, [s * 0.15 * h, 0.58 * h, 0], [0, 0, s * 0.25]);
  }
  return g;
}
export function textBoard(text, w, h, opt, px = 768) {
  const g = new THREE.Group(); rbox(g, mat('#1b1f2a'), [0, 0, 0], [w + 0.1, h + 0.1, 0.1]);
  const p = textPlane(text, w, h, opt, px); p.position.z = 0.056; g.add(p); return g;
}
export function molecule(R = 1) {
  const g = new THREE.Group(), cols = ['#ff4a5a', '#3a8cff', '#ffd23a', '#40c46a', '#b45cff'];
  const pts = [[0, 0.2, 0], [0.4, 0.5, 0.1], [-0.4, 0.5, -0.1], [0.2, 0.9, 0.2], [-0.25, 0.95, 0], [0.5, 0.05, -0.2], [-0.5, 0.05, 0.2]];
  pts.forEach((p, i) => blob(g, mat(cols[i % 5], { roughness: 0.35 }), p, Array(3).fill(0.16 + (i % 3) * 0.03)));
  [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 5], [2, 6], [0, 5], [0, 6]].forEach(([a, b]) => {
    const A = new THREE.Vector3(...pts[a]), B = new THREE.Vector3(...pts[b]), m = A.clone().add(B).multiplyScalar(0.5), L = A.distanceTo(B);
    const c = add(g, new THREE.CylinderGeometry(0.03, 0.03, L, 8), mat('#dde3ea'), [m.x, m.y, m.z]);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  });
  g.scale.setScalar(R); return g;
}
export function brick(color, s = 0.2) { const g = new THREE.Group(); rbox(g, mat(color, { roughness: 0.4 }), [0, s / 2, 0], [s * 1.6, s, s]); for (const x of [-0.5, 0.5]) add(g, new THREE.CylinderGeometry(s * 0.2, s * 0.2, s * 0.15, 12), mat(color, { roughness: 0.4 }), [x * s, s * 1.06, 0]); return g; }
export function crispBag() {
  const g = new THREE.Group();
  rbox(g, mat('#e8322e', { roughness: 0.3 }), [0, 0.5, 0], [0.62, 1.0, 0.3]);
  for (let i = 0; i < 2; i++) add(g, new THREE.BoxGeometry(0.62 - i * 0.02, 0.07, 0.06), mat('#c4231f'), [0, 1.0 - i * 0.05, 0]);
  const star = add(g, new THREE.CircleGeometry(0.26, 14), mat('#ffd23a'), [0, 0.5, 0.152]);
  const t = textPlane('CRISP', 0.5, 0.2, { bg: 'rgba(0,0,0,0)', fg: '#ffffff', font: 'bold 120px Arial' }); t.material.transparent = true; t.material.map.premultiplyAlpha = false; t.position.set(0, 0.5, 0.157); g.add(t);
  return g;
}
export function chip() { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), mat('#ffe27a', { roughness: 0.5 }), [0, 0, 0], [0.4, 0, 0.3], [1, 1, 0.8]); return g; }
export function vial(label = '#2fa8e8') {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.4, 24), mat('#ffffff', { transparent: true, opacity: 0.35, roughness: 0.1 }), [0, 0.2, 0]);
  add(g, new THREE.CylinderGeometry(0.095, 0.095, 0.25, 24), mat('#7fe0ff', { roughness: 0.2 }), [0, 0.14, 0]);
  add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.09, 24), mat('#d8dde4', { metalness: 0.6 }), [0, 0.46, 0]);
  add(g, new THREE.CylinderGeometry(0.113, 0.113, 0.14, 24), mat(label), [0, 0.2, 0]);
  return g;
}
export function dna(h = 1, turns = 2.5) {
  const g = new THREE.Group(), N = 28;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), a = t * turns * Math.PI * 2, y = t * h;
    blob(g, mat('#ff5a8a'), [Math.cos(a) * 0.16, y, Math.sin(a) * 0.16], Array(3).fill(0.05));
    blob(g, mat('#4a8cff'), [-Math.cos(a) * 0.16, y, -Math.sin(a) * 0.16], Array(3).fill(0.05));
    if (i % 2 === 0) add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6), mat('#ffe066'), [0, y, 0], [0, 0, Math.PI / 2]).rotation.y = -a;
  }
  return g;
}
export function scissors() {
  const g = new THREE.Group(), st = mat('#d0d6dc', { metalness: 0.7, roughness: 0.25 }), red = mat('#e8322e');
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.rotation.z = s * 0.18; g.add(arm);
    add(arm, new THREE.BoxGeometry(0.06, 0.55, 0.03), st, [0, 0.3, 0], [0, 0, 0], [1, 1, 1]);
    add(arm, new THREE.TorusGeometry(0.09, 0.025, 8, 20), red, [s * -0.0, -0.22, 0], [0, 0, 0]);
  }
  return g;
}
export function podium() {
  const g = new THREE.Group(); rbox(g, mat('#ffc83a'), [0, 0.3, 0], [0.9, 0.6, 0.8]);
  const t = textPlane('1', 0.4, 0.4, { bg: '#ffc83a', fg: '#7a4a00', font: 'bold 300px Arial' }, 256); t.position.set(0, 0.3, 0.41); g.add(t); return g;
}
export function redCell(r = 0.1) { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(r * 0.72, r * 0.38, 14, 28), mat('#e02a3a', { roughness: 0.35 }), [0, 0, 0], [0, 0, 0], [1, 1, 0.8]); add(g, new THREE.CircleGeometry(r * 0.5, 20), mat('#b81c2c'), [0, 0, 0.0]); return g; }
export function sickleCell(r = 0.1) { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(r * 1.3, r * 0.3, 10, 24, Math.PI * 1.15), mat('#8e1b3a', { roughness: 0.35 }), [0, 0, 0], [0, 0, 0.5]); return g; }
export function sack() {
  const g = new THREE.Group(), pts = [[0, 0], [0.3, 0.02], [0.42, 0.25], [0.36, 0.55], [0.18, 0.78], [0.1, 0.9], [0.14, 1.0], [0.0, 1.02]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 32), mat('#b08a55', { roughness: 0.95, side: THREE.DoubleSide }));
  add(g, new THREE.TorusGeometry(0.115, 0.03, 8, 20), mat('#6a4a2a'), [0, 0.88, 0], [Math.PI / 2, 0, 0]);
  for (const [x, y, c] of [[0.1, 0.4, '#5a7ec8'], [-0.14, 0.25, '#c85a5a']]) { const p = add(g, new THREE.PlaneGeometry(0.17, 0.17), mat(c, { roughness: 1 }), [x, y, 0.4 - Math.abs(x) * 0.2], [0, x * -1, 0.2]); }
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), mat('#3a2a1a'), [0.1, 0.4, 0.405], [Math.PI / 2, 0, 0]);
  return g;
}
export function eyesOn(g, y = 0.5, z = 0.4, sx = 0.12) {
  for (const s of [-1, 1]) { blob(g, mat('#fff'), [s * sx, y, z], [0.07, 0.085, 0.02]); blob(g, mat('#1a1210'), [s * sx, y - 0.005, z + 0.015], [0.04, 0.055, 0.015]); blob(g, mat('#fff'), [s * sx - 0.012, y + 0.02, z + 0.03], [0.014, 0.014, 0.01]); }
}
export function kidney(S = 1) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 24; i++) { const a = (-0.65 + (i / 24) * 1.3) * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * 0.38 + 0.08, Math.sin(a) * 0.5, 0)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.2, 16, false), mat('#c4455a', { roughness: 0.4 }));
  for (const p of [pts[0], pts[24]]) blob(g, mat('#c4455a', { roughness: 0.4 }), [p.x, p.y, 0], Array(3).fill(0.2));
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.4, 10), mat('#e8a0a8'), [0.05, 0, 0], [0, 0, Math.PI / 2]);
  g.scale.setScalar(S); g.position.y = 0.55 * S; const w = new THREE.Group(); w.add(g); return w;
}
export function lungs(S = 1) {
  const g = new THREE.Group(), pink = mat('#f08aa0', { roughness: 0.4 });
  for (const s of [-1, 1]) {
    blob(g, pink, [s * 0.3, 0.5, 0], [0.3, 0.5, 0.2], [0, 0, s * -0.12]);
    add(g, new THREE.CylinderGeometry(0.02, 0.03, 0.4, 8), mat('#ffd0d8'), [s * 0.14, 0.7, 0], [0, 0, s * 0.8]);
  }
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), mat('#ffd0d8'), [0, 0.95, 0]);
  g.scale.setScalar(S); return g;
}
export function coin(r = 0.12) { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(r, r, r * 0.22, 24), mat('#ffc928', { metalness: 0.7, roughness: 0.3 }), [0, 0, 0], [Math.PI / 2, 0, 0]); add(g, new THREE.TorusGeometry(r * 0.72, r * 0.06, 6, 24), mat('#e09a10', { metalness: 0.7 }), [0, 0, r * 0.12]); return g; }
export function lighthouse() {
  const g = new THREE.Group(); let y = 0;
  for (let i = 0; i < 6; i++) { const r0 = 0.5 - i * 0.045, r1 = r0 - 0.045; add(g, new THREE.CylinderGeometry(r1, r0, 0.3, 28), mat(i % 2 ? '#e8322e' : '#fafafa'), [0, y + 0.15, 0]); y += 0.3; }
  add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.05, 28), mat('#2b2f3a'), [0, y + 0.02, 0]); y += 0.05;
  add(g, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 24), mat('#fff3b0', { emissive: '#ffd24a', emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }), [0, y + 0.15, 0]);
  add(g, new THREE.ConeGeometry(0.28, 0.3, 24), mat('#e8322e'), [0, y + 0.45, 0]);
  add(g, new THREE.CylinderGeometry(0.5, 0.55, 0.12, 28), mat('#5c6270'), [0, 0.06, 0]);
  add(g, new THREE.BoxGeometry(0.16, 0.26, 0.04), mat('#5a3a1a'), [0, 0.2, 0.5 - 0.0]);
  return g;
}
