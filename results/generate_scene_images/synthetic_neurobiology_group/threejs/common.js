// Shared scene helpers + props for the Synthetic Neurobiology scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSynthesizer, animeEyes } from './synthesizer.js';
export { THREE, rng, createSynthesizer, animeEyes, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const glow = (c, i = 1) => mat(c, { emissive: c, emissiveIntensity: i, roughness: 0.4 });
const V = (a) => new THREE.Vector3(...a);

// Scene scaffold: stage + ground, build(ctx) returns the roots to toon-shade.
export function makeScene(build, { cam = [0, 1.1, 4.6], look = [0, 0.75, 0], fov = 40, ground = '#6fae45', el = 35, az = 150, cover = 2, seed = 5 } = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', fov), sunElevation: el, sunAzimuth: az, exposure: 1,
      sky: { cover, seed, towerTop: 0.5, puffCover: 2 }, rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.5, fog: { near: 120, far: 1500 },
    });
    const g = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const roots = build({ scene: stage.scene, stage, num }) || [];
    const set = new Set(); roots.forEach((r) => r.traverse((o) => set.add(o)));
    stage.toonify(stage.scene, (m) => set.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
    stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
    stage.finish();
  });
}

// Synth placed in scene; hands play keys (or custom targets in world space).
export function synth(scene, { pos = [0, 0, 0], scale = 1.5, ry = 0, lean = 0.06, headTilt = 0.06, l, r, legs } = {}) {
  const s = createSynthesizer({ scale }); s.position.set(...pos); s.rotation.y = ry; scene.add(s);
  s.userData.pose({ lean, headTilt, legs: legs ?? { l: [0.25, 0], r: [-0.25, 0] } }); s.updateMatrixWorld(true);
  const w = (a) => { const v = s.worldToLocal(V(a)); return [v.x, v.y, v.z]; };
  s.userData.reach('l', l ? w(l) : [0.24, 0.42, 0.19]); s.userData.reach('r', r ? w(r) : [-0.18, 0.4, 0.19]);
  return s;
}

// A limb between two points: arm cylinder + mitten.
export function paw(parent, from, to, color = '#ffe0c0', r = 0.04) {
  const a = V(from), b = V(to), d = b.clone().sub(a), g = new THREE.Group();
  const arm = add(g, new THREE.CylinderGeometry(r, r, d.length(), 12), mat(color)); arm.position.copy(a.clone().add(b).multiplyScalar(0.5));
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  blob(g, mat('#fff3e0'), to, [r * 1.7, r * 1.7, r * 1.5]); parent.add(g); return g;
}

export function note(parent, pos, color = '#ffd23c', s = 1) {
  const g = new THREE.Group(), m = glow(color, 0.6);
  blob(g, m, [0, 0, 0], [0.09 * s, 0.065 * s, 0.04 * s], [0, 0, 0.4]);
  add(g, new THREE.CylinderGeometry(0.013 * s, 0.013 * s, 0.34 * s, 8), m, [0.075 * s, 0.17 * s, 0]);
  add(g, new THREE.BoxGeometry(0.13 * s, 0.05 * s, 0.02 * s), m, [0.135 * s, 0.32 * s, 0], [0, 0, -0.5]);
  g.position.set(...pos); parent.add(g); return g;
}

export function bow() { // archery bow, upright
  const g = new THREE.Group(), wood = mat('#8b4a1e', { roughness: 0.5 });
  add(g, new THREE.TorusGeometry(0.62, 0.035, 12, 40, Math.PI), wood, [0, 0, 0], [0, 0, -Math.PI / 2]);
  add(g, new THREE.CylinderGeometry(0.008, 0.008, 1.24, 6), mat('#f4efe0'), [0, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.22, 14), mat('#c0392b'), [-0.62, 0, 0]);
  for (const y of [-0.62, 0.62]) blob(g, mat('#e9c46a'), [0, y, 0], [0.04, 0.04, 0.04]);
  g.position.y = 0.65; const o = new THREE.Group(); o.add(g); return o;
}

export function den() { // dirt mound with a dark hole; glowing eyes inside
  const g = new THREE.Group(), dirt = mat('#8a5a34');
  blob(g, dirt, [0, 0.3, 0], [1.0, 0.7, 0.85]);
  for (const [x, z, s] of [[-0.6, 0.5, 0.2], [0.55, 0.55, 0.16], [0.8, 0.3, 0.12]]) blob(g, mat('#a06a3c'), [x, s * 0.5, z], [s, s * 0.7, s]);
  const hole = add(g, new THREE.CircleGeometry(1, 36), mat('#120a08', { roughness: 1 }), [0, 0.3, 0.9], [0, 0, 0], [0.34, 0.3, 1]);
  const ring = add(g, new THREE.TorusGeometry(0.34, 0.05, 10, 32), mat('#5e3a1c'), [0, 0.3, 0.89], [0, 0, 0], [1, 0.88, 1]);
  animeEyes(g, 0.905, 0, 0.32, 0.12, 0.45, false);
  return g;
}

export function dancer(color, seedv = 1) {
  const g = new THREE.Group(), skin = mat(['#ffe0c0', '#e8b98a', '#b9814f', '#8a5a34'][seedv % 4]);
  const cloth = mat(color);
  blob(g, cloth, [0, 0.38, 0], [0.12, 0.2, 0.09]); blob(g, skin, [0, 0.68, 0], [0.09, 0.09, 0.09]);
  blob(g, mat(['#2b1b12', '#5a3a1e', '#d4a24c', '#1c1c24'][seedv % 4]), [0, 0.72, -0.01], [0.095, 0.075, 0.095]);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), cloth, [s * 0.1 + s * 0.05, 0.66, 0], [0, 0, s * (0.6 + 0.2 * Math.sin(seedv * 3 + s))]);
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.26, 8), mat('#2c3e66'), [s * 0.05, 0.13, 0], [0.3 * s * Math.sin(seedv), 0, 0]);
  }
  return g;
}

export function cheese(r = 0.5) { // wheel with a wedge missing and holes
  const g = new THREE.Group(), y = mat('#f7c331', { roughness: 0.5 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.6, 40, 1, false, 0.9, Math.PI * 2 - 0.9), y, [0, r * 0.3, 0]);
  const cut = mat('#fbd964'); for (const s of [0.9, 0]) add(g, new THREE.PlaneGeometry(r, r * 0.6), cut, [Math.sin(s) * r / 2 * 0 + Math.sin(s + (s ? 0 : 0)) * 0, r * 0.3, 0]).visible = false;
  for (const [x, yy, z, s] of [[0.2, 0.62, 0.1, 0.07], [-0.15, 0.62, 0.25, 0.09], [-0.28, 0.62, -0.2, 0.06], [0.05, 0.62, -0.3, 0.07]]) blob(g, mat('#c9921c'), [x * r * 2, r * 0.6, z * r * 2], [s * r, s * r * 0.25, s * r]);
  add(g, new THREE.CylinderGeometry(r + 0.01, r + 0.01, 0.04, 40), mat('#e3a21a'), [0, r * 0.05, 0]);
  return g;
}

export function sauceBottle(s = 1) {
  const g = new THREE.Group(), red = mat('#d62828', { roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(0.2 * s, 0.22 * s, 0.62 * s, 24), red, [0, 0.31 * s, 0]);
  add(g, new THREE.CylinderGeometry(0.1 * s, 0.2 * s, 0.14 * s, 24), red, [0, 0.69 * s, 0]);
  add(g, new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.1 * s, 20), red, [0, 0.81 * s, 0]);
  add(g, new THREE.CylinderGeometry(0.095 * s, 0.095 * s, 0.1 * s, 20), mat('#f4f0e6'), [0, 0.9 * s, 0]);
  add(g, new THREE.ConeGeometry(0.05 * s, 0.08 * s, 16), mat('#f4f0e6'), [0, 0.99 * s, 0]);
  add(g, new THREE.CylinderGeometry(0.205 * s, 0.205 * s, 0.26 * s, 24), mat('#fff4d6'), [0, 0.32 * s, 0]);
  blob(g, mat('#d62828'), [0, 0.32 * s, 0.2 * s], [0.08 * s, 0.1 * s, 0.02 * s]);
  return g;
}

export function spanner(color = '#c8d0d8') {
  const g = new THREE.Group(), m = mat(color, { metalness: 0.6, roughness: 0.3 }), R = 0.2, d = Math.asin(0.07 / R);
  const sh = new THREE.Shape(); sh.absarc(0, 0, R, Math.PI / 2 + d, Math.PI / 2 - d + Math.PI * 2, false);
  sh.lineTo(0.07, 0.05); sh.lineTo(-0.07, 0.05); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }); geo.translate(0, 0, -0.03);
  add(g, geo, m, [0, 0.95, 0]);
  const hs = new THREE.Shape(); hs.moveTo(-0.055, 0); hs.lineTo(0.055, 0); hs.lineTo(0.07, 0.8); hs.lineTo(-0.07, 0.8); hs.closePath();
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }); hg.translate(0, 0, -0.025);
  add(g, hg, m, [0, 0.0, 0]); add(g, new THREE.TorusGeometry(0.06, 0.02, 10, 20), m, [0, 0.0, 0]);
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16), mat('#e63946'), [0, 0.3, 0]).scale.z = 0.8;
  return g;
}

export function eyeMask() {
  const g = new THREE.Group(), s = new THREE.Shape();
  s.moveTo(-0.5, 0.05); s.bezierCurveTo(-0.4, 0.2, -0.15, 0.2, 0, 0.1); s.bezierCurveTo(0.15, 0.2, 0.4, 0.2, 0.5, 0.05);
  s.bezierCurveTo(0.5, -0.12, 0.3, -0.2, 0.2, -0.16); s.bezierCurveTo(0.1, -0.1, 0.06, -0.06, 0, -0.08);
  s.bezierCurveTo(-0.06, -0.06, -0.1, -0.1, -0.2, -0.16); s.bezierCurveTo(-0.3, -0.2, -0.5, -0.12, -0.5, 0.05);
  for (const x of [-0.25, 0.25]) { const h = new THREE.Path(); h.absellipse(x, 0.0, 0.1, 0.065, 0, Math.PI * 2, false, x > 0 ? -0.3 : 0.3); s.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }); geo.translate(0, 0, -0.02);
  add(g, geo, mat('#2a1a4a', { roughness: 0.35 }));
  for (const x of [-0.5, 0.5]) add(g, new THREE.TorusGeometry(0.06, 0.012, 8, 16), mat('#f4d03f'), [x, 0.05, 0]);
  for (const x of [-0.25, 0.25]) blob(g, glow('#f4d03f', 0.5), [x * 1.6, 0.14, 0.03], [0.025, 0.025, 0.012]);
  g.scale.setScalar(1.3); return g;
}

// Translucent gel cube with a lattice of coloured cells inside (spacing grows with size).
export function gel(size, n = 3, colors = ['#ff5d8f', '#ffd23c', '#4dd2ff']) {
  const g = new THREE.Group();
  const em = mat('#5fd6ee', { roughness: 0.2 }), t = Math.max(0.012, size * 0.018), h = size / 2;
  for (const y of [0, size]) for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(t, t, size, 8), em, [0, y, s * h], [0, 0, Math.PI / 2]);
    add(g, new THREE.CylinderGeometry(t, t, size, 8), em, [s * h, y, 0], [Math.PI / 2, 0, 0]);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, new THREE.CylinderGeometry(t, t, size, 8), em, [sx * h, h, sz * h]);
  add(g, new THREE.BoxGeometry(size, t * 1.5, size), mat('#9fe8f5', { roughness: 0.2 }), [0, 0, 0]);
  const gap = size / (n + 1), r = Math.max(0.018, size * 0.06);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++)
    blob(g, mat(colors[(i + j + k) % colors.length], { roughness: 0.4 }), [(i + 1) * gap - size / 2, (j + 1) * gap, (k + 1) * gap - size / 2], [r, r, r]);
  return g;
}

export function neuron(color = '#ff7ab8') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.4 }), r = rng(3);
  blob(g, m, [0, 0, 0], [0.16, 0.16, 0.16]); blob(g, mat('#7a1f4f'), [0.02, 0.0, 0.14], [0.06, 0.06, 0.04]);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, d = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    const pts = [d.clone().multiplyScalar(0.12), d.clone().multiplyScalar(0.3).add(V([0, 0, (r() - 0.5) * 0.1])), d.clone().multiplyScalar(0.5).add(V([(r() - 0.5) * 0.14, (r() - 0.5) * 0.14, 0])), d.clone().multiplyScalar(0.68)];
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, i ? 0.025 : 0.03, 8), m);
    blob(g, m, pts[3].toArray(), [0.04, 0.04, 0.04]);
  }
  return g;
}

export function lightSwitch(on = true) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.34, 0.5, 0.05), mat('#f4efe0'), [0, 0.25, 0]);
  add(g, new THREE.BoxGeometry(0.12, 0.22, 0.04), mat('#c9c2ae'), [0, 0.25, 0.04]);
  add(g, new THREE.BoxGeometry(0.1, 0.12, 0.06), mat('#ffffff'), [0, on ? 0.3 : 0.2, 0.08], [on ? -0.3 : 0.3, 0, 0]);
  return g;
}

export function lightCone(len = 1.2, r = 0.5, color = '#fff3a0') {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false });
  const c = new THREE.Mesh(new THREE.ConeGeometry(r, len, 32, 1, true), m); return c;
}

export function brain(size = 0.6) {
  const geo = new THREE.IcosahedronGeometry(1, 6), p = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = Math.sin(x * 14 + Math.sin(y * 9)) * Math.sin(y * 13 + z * 7) * Math.sin(z * 14 + x * 6);
    const s = 1 + 0.13 * f - (Math.abs(x) < 0.07 ? 0.14 * (1 - Math.abs(x) / 0.07) : 0);
    p.setXYZ(i, x * s * 1.15, y * s * 0.85 * (y < 0 ? 0.8 : 1), z * s * 1.3);
    const v = 0.5 + 0.5 * Math.sin(x * 11 + y * 7 + z * 13 + f * 3);
    c.setHSL(0.8 - v * 0.75, 1.0, 0.42 + 0.1 * f); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#ffffff', emissiveIntensity: 0.02, emissiveMap: null, roughness: 0.5 }));
  m.castShadow = true; m.scale.setScalar(size); return m;
}

export function church() {
  const g = new THREE.Group(), wall = mat('#f2e6d0'), roof = mat('#9b3d2e');
  add(g, new THREE.BoxGeometry(1.6, 1.0, 1.4), wall, [0, 0.5, 0]);
  const rs = new THREE.Shape(); rs.moveTo(-0.9, 0); rs.lineTo(0.9, 0); rs.lineTo(0, 0.55); rs.closePath();
  add(g, new THREE.ExtrudeGeometry(rs, { depth: 1.5, bevelEnabled: false }), roof, [0, 1.0, -0.75]);
  add(g, new THREE.BoxGeometry(0.55, 1.5, 0.55), wall, [-0.7, 0.75, 0.55]);
  add(g, new THREE.ConeGeometry(0.42, 0.7, 4), roof, [-0.7, 1.85, 0.55], [0, Math.PI / 4, 0]);
  const cr = mat('#ffd23c', { metalness: 0.5, roughness: 0.3 });
  add(g, new THREE.BoxGeometry(0.05, 0.3, 0.05), cr, [-0.7, 2.35, 0.55]); add(g, new THREE.BoxGeometry(0.18, 0.05, 0.05), cr, [-0.7, 2.3, 0.55]);
  const ds = new THREE.Shape(); ds.moveTo(-0.22, 0); ds.lineTo(0.22, 0); ds.lineTo(0.22, 0.4); ds.absarc(0, 0.4, 0.22, 0, Math.PI, false); ds.closePath();
  add(g, new THREE.ShapeGeometry(ds), mat('#5a2e12'), [0.25, 0, 0.705]);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const cols = ['#e63946', '#4dd2ff', '#ffd23c', '#8fdc5a', '#b05cff', '#ff9f43'];
  for (let i = 0; i < 12; i++) { x.fillStyle = cols[i % 6]; x.beginPath(); x.moveTo(128, 128); x.arc(128, 128, 120, i * Math.PI / 6, (i + 1) * Math.PI / 6); x.fill(); }
  x.strokeStyle = '#222'; x.lineWidth = 8; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 124 * Math.cos(i * Math.PI / 6), 128 + 124 * Math.sin(i * Math.PI / 6)); x.stroke(); }
  x.beginPath(); x.arc(128, 128, 122, 0, 7); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  add(g, new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ map: t }), [0.25, 0.8, 0.705]);
  for (let s = 0; s < 3; s++) add(g, new THREE.BoxGeometry(0.5, 0.06, 0.3), mat('#cfc3a8'), [0.25, 0.03 + 0.0, 0.85 + s * 0.0]).scale.set(1 + s * 0.3, 1, 1 + s * 0.8);
  return g;
}

// RNA strand: ribbon tube + coloured base beads along a wavy path.
export function rna(len = 1, seedv = 1) {
  const g = new THREE.Group(), r = rng(seedv), pts = [];
  for (let i = 0; i <= 8; i++) pts.push(V([Math.sin(i * 1.3 + seedv) * 0.07, i / 8 * len, Math.cos(i * 1.1) * 0.05]));
  const cu = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cu, 40, 0.012, 8), mat('#e8e2f0'));
  const cols = ['#ff4d6d', '#4dd2ff', '#ffd23c', '#8fdc5a'];
  for (let i = 0; i < 14; i++) { const p = cu.getPoint(i / 13); blob(g, mat(cols[Math.floor(r() * 4)], { roughness: 0.35 }), [p.x + 0.045, p.y, p.z], [0.032, 0.032, 0.032]); }
  return g;
}

export function journal() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 704; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 704); gr.addColorStop(0, '#0e6b4d'); gr.addColorStop(1, '#2fb67c'); x.fillStyle = gr; x.fillRect(0, 0, 512, 704);
  x.fillStyle = '#f7f3e3'; x.fillRect(0, 0, 512, 150); x.fillStyle = '#0e6b4d'; x.font = 'bold 74px serif'; x.textAlign = 'center';
  x.fillText('nature', 256, 78); x.font = 'bold 66px serif'; x.fillText('methods', 256, 138);
  x.fillStyle = '#f7f3e3'; x.beginPath(); x.moveTo(256, 230); x.bezierCurveTo(400, 300, 420, 480, 256, 620); x.bezierCurveTo(92, 480, 112, 300, 256, 230); x.fill();
  x.strokeStyle = '#2fb67c'; x.lineWidth = 8; x.beginPath(); x.moveTo(256, 250); x.lineTo(256, 640); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const g = new THREE.Group(); add(g, new THREE.BoxGeometry(0.9, 1.24, 0.06), mat('#ffffff'), [0, 0.62, 0]);
  add(g, new THREE.PlaneGeometry(0.9, 1.24), new THREE.MeshBasicMaterial({ map: t }), [0, 0.62, 0.032]); return g;
}

export function tree(h = 1) {
  const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.07 * h, 0.1 * h, 0.7 * h, 10), mat('#7a4a22'), [0, 0.35 * h, 0]);
  blob(g, mat('#3e9a3c'), [0, 0.95 * h, 0], [0.4 * h, 0.4 * h, 0.4 * h]); blob(g, mat('#4fb348'), [0.15 * h, 1.15 * h, 0.05], [0.28 * h, 0.28 * h, 0.28 * h]); return g;
}
