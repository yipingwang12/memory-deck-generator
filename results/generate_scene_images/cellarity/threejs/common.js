// Shared scaffold + props for the Cellarity scenes. makeScene(opts) -> { THREE, scene, stage, cellar(opts), done(opts) }.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCellar } from './cellar.js';
export { THREE, rng, canvasTexture, guard };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, r, h, pos, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const box = (p, m, w, h, d, pos, rot) => add(p, new THREE.BoxGeometry(w, h, d), m, pos, rot);
export const textTex = (text, bg, fg, { w = 512, h = 256, font = 'bold 150px sans-serif' } = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 8); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** Stage + ground/back wall. room: 'cellar' (stone wall+floor) | 'meadow' | 'sky'. */
export function makeScene({ room = 'cellar', floor, wall, sun = 35, fovv = 40 } = {}) {
  const stage = createAnimeStage({
    fov: fovv, sunElevation: sun, sunAzimuth: 150, exposure: 1, sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.5, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  add(scene, new THREE.PlaneGeometry(400, 400), mat(floor ?? (room === 'cellar' ? '#8a7a68' : '#6fae45')), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  if (room === 'cellar') {
    const t = canvasTexture(512, (ctx, s) => {
      ctx.fillStyle = wall ?? '#b79a78'; ctx.fillRect(0, 0, s, s);
      const r = rng(3);
      for (let row = 0; row < 8; row++) for (let i = 0; i < 4; i++) {
        const o = row % 2 ? s / 8 : 0, l = r() * 20 - 10;
        ctx.fillStyle = `rgb(${183 + l},${154 + l},${120 + l})`; ctx.fillRect(i * s / 4 + o + 3, row * s / 8 + 3, s / 4 - 6, s / 8 - 6);
      }
    }, { repeat: 6 });
    t.repeat.set(5, 2.5);
    const w = add(scene, new THREE.PlaneGeometry(30, 15), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), [0, 6, -3]);
    w.castShadow = false;
  }
  const api = {
    THREE, scene, stage,
    cellar({ pos = [-1.3, 0, 0], scale = 1.35, ry = 0.3, pose = { arms: { l: [0, 0.4], r: [0, 0.4] } } } = {}) {
      const c = createCellar({ scale }); c.position.set(...pos); c.rotation.y = ry; c.userData.pose(pose); scene.add(c); api.anchorObj = c; return c;
    },
    done({ cam = [0, 1.1, 4.6], look = [0, 0.75, 0], clouds = room !== 'cellar' } = {}) {
      const s = new Set(); api.anchorObj?.traverse((o) => s.add(o)); stage.toonify(scene, (m) => s.has(m));
      if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]);
      stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
    },
  };
  return api;
}

// ---------- props ----------
export function crown(s = 1) {
  const g = new THREE.Group(), gold = mat('#f2c230', { metalness: 0.6, roughness: 0.3 });
  cyl(g, gold, 0.2, 0.14, [0, 0.07, 0]);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2; const c = add(g, new THREE.ConeGeometry(0.06, 0.18, 12), gold, [Math.sin(a) * 0.17, 0.22, Math.cos(a) * 0.17]);
    blob(g, mat('#ff3a5a'), [Math.sin(a) * 0.17, 0.33, Math.cos(a) * 0.17], [0.03, 0.03, 0.03]);
  }
  for (const a of [0.6, 2.2, 3.8, 5.4]) blob(g, mat('#3ab6ff'), [Math.sin(a) * 0.2, 0.07, Math.cos(a) * 0.2], [0.035, 0.035, 0.035]);
  g.scale.setScalar(s); return g;
}
const furMat = (c) => mat(c, { roughness: 0.9 });
export function dog({ coat = '#c98a4b', pale = '#f1dcb8', snout = 0.12, ear = 'floppy', ruff = false } = {}) {
  const g = new THREE.Group(), C = furMat(coat), P = furMat(pale), D = mat('#2a1c14');
  blob(g, C, [0, 0.5, 0], [0.5, 0.26, 0.22]); blob(g, C, [0.36, 0.62, 0], [0.22, 0.26, 0.21]); blob(g, C, [-0.38, 0.52, 0], [0.22, 0.24, 0.2]);
  if (ruff) blob(g, P, [0.42, 0.55, 0], [0.2, 0.28, 0.23]);
  const head = new THREE.Group(); head.position.set(0.62, 0.86, 0); g.add(head);
  blob(head, C, [0, 0, 0], [0.19, 0.16, 0.15]); blob(head, P, [0.17 + snout, -0.04, 0], [0.1 + snout, 0.07, 0.07]); blob(head, D, [0.3 + snout * 1.6, -0.02, 0], [0.035, 0.03, 0.04]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [0.1, 0.05, s * 0.115], [0.04, 0.05, 0.02]); blob(head, D, [0.115, 0.05, s * 0.128], [0.028, 0.036, 0.015]);
    blob(head, mat('#fff'), [0.124, 0.062, s * 0.14], [0.01, 0.01, 0.008]);
    if (ear === 'floppy') blob(head, D.clone(), [-0.05, 0, s * 0.15], [0.07, 0.14, 0.035], [s * 0.2, 0, 0.3]).material.color.set(coat).multiplyScalar(0.6);
    else { const e = add(head, new THREE.ConeGeometry(0.07, 0.2, 12), C, [-0.04, 0.22, s * 0.09], [s * 0.25, 0, 0.1]); }
  }
  for (const [x, z] of [[0.34, 0.12], [0.34, -0.12], [-0.36, 0.12], [-0.36, -0.12]]) { cyl(g, C, 0.055, 0.34, [x, 0.2, z]); blob(g, P, [x, 0.03, z + 0.02], [0.08, 0.04, 0.07]); }
  const tail = new THREE.Group(); tail.position.set(-0.55, 0.62, 0); tail.rotation.z = 0.9; g.add(tail);
  add(tail, new THREE.ConeGeometry(0.06, 0.4, 12), ruff ? P : C, [0, 0.2, 0]);
  g.userData.head = head; g.userData.tail = tail; return g;
}
export function tin() {
  const g = new THREE.Group(), steel = mat('#cfd6de', { metalness: 0.7, roughness: 0.3 });
  cyl(g, mat('#1d3f8c'), 0.5, 0.22, [0, 0.11, 0]); cyl(g, steel, 0.52, 0.04, [0, 0.22, 0]);
  cyl(g, mat('#e2b13c', { metalness: 0.6 }), 0.505, 0.04, [0, 0.12, 0]);
  const r = rng(2); const bead = mat('#15151c', { roughness: 0.25, metalness: 0.3 });
  for (let i = 0; i < 90; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.44; blob(g, bead, [Math.cos(a) * d, 0.26 + (1 - d) * 0.07, Math.sin(a) * d], [0.05, 0.05, 0.05]); }
  const lid = cyl(g, steel, 0.5, 0.025, [-0.3, 0.45, -0.3], [-0.9, 0.3, 0.7]); return g;
}
export function flag() {
  const g = new THREE.Group(); cyl(g, mat('#e8e2d0'), 0.025, 2, [0, 1, 0]); blob(g, mat('#f2c230'), [0, 2.03, 0], [0.05, 0.05, 0.05]);
  const cloth = add(g, new THREE.PlaneGeometry(0.9, 0.55, 12, 4), new THREE.MeshStandardMaterial({ color: '#d92f3a', side: THREE.DoubleSide, roughness: 0.8 }), [0.47, 1.7, 0]);
  const p = cloth.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 6) * 0.05); cloth.geometry.computeVertexNormals();
  blob(g, mat('#f2c230'), [0.45, 1.7, 0.03], [0.12, 0.12, 0.02]); return g;
}
export function mortarboard() {
  const g = new THREE.Group(), k = mat('#1d1d28'); cyl(g, k, 0.13, 0.1, [0, 0.05, 0]); box(g, k, 0.4, 0.03, 0.4, [0, 0.12, 0], [0, 0.4, 0]);
  cyl(g, mat('#f2c230'), 0.012, 0.15, [0.17, 0.08, 0.17], [0.3, 0, 0.2]); blob(g, mat('#f2c230'), [0.2, 0.0, 0.2], [0.03, 0.04, 0.03]); return g;
}
export function cell({ r = 0.6, color = '#ff8aa0', nucleus = '#7a3ccf', opacity = 0.72 } = {}) {
  const g = new THREE.Group();
  blob(g, new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.3 }), [0, r, 0], [r, r, r]);
  blob(g, mat(nucleus, { roughness: 0.4 }), [0.05 * r, r, 0.05 * r], [r * 0.38, r * 0.38, r * 0.38]);
  blob(g, mat('#fff'), [-0.08 * r, r * 1.08, 0.2 * r], [r * 0.08, r * 0.08, r * 0.08]);
  const o = rng(9); for (let i = 0; i < 6; i++) blob(g, mat(['#ffd23a', '#3ad0a0', '#4aa8ff'][i % 3]), [(o() - 0.5) * r * 1.0, r + (o() - 0.5) * r * 1.0, r * 0.35 + o() * r * 0.2], [r * 0.1, r * 0.07, r * 0.07]);
  return g;
}
export function zigzag(g, r, color = '#2a1020') {
  const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3((i % 2 ? 0.07 : -0.07) * r * 2, r * 1.9 - i * r * 0.22, r * 0.97 - Math.abs(i - 4) * 0.01 * r));
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 40, r * 0.035, 6), mat(color)); return g;
}
export function bandage(len = 0.8) {
  const g = new THREE.Group(), tan = mat('#f2cf9f');
  box(g, tan, len, len * 0.32, 0.05, [0, 0, 0]); box(g, mat('#fff4e0'), len * 0.35, len * 0.3, 0.06, [0, 0, 0.005]);
  for (let i = -3; i <= 3; i++) if (Math.abs(i) > 1) cyl(g, mat('#e0b57d'), 0.018, 0.06, [i * len * 0.12, len * 0.07, 0.01], [Math.PI / 2, 0, 0]); return g;
}
export function pill(len = 1) {
  const g = new THREE.Group(), geo = (r, l) => new THREE.CapsuleGeometry(r, l, 12, 24);
  const a = add(g, geo(0.28, 0.35), mat('#ff4a5a', { roughness: 0.25 }), [-0.31, 0, 0], [0, 0, Math.PI / 2]);
  const b = add(g, geo(0.28, 0.35), mat('#fff6ee', { roughness: 0.25 }), [0.31, 0, 0], [0, 0, Math.PI / 2]);
  g.children[0].scale.set(1, 1, 1); g.scale.setScalar(len); return g;
}
export function magnifier(s = 1) {
  const g = new THREE.Group(); add(g, new THREE.TorusGeometry(0.4, 0.05, 12, 40), mat('#e2b13c', { metalness: 0.6, roughness: 0.3 }));
  add(g, new THREE.CircleGeometry(0.39, 40), new THREE.MeshStandardMaterial({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1 }), [0, 0, 0.01]);
  cyl(g, mat('#5a3a20'), 0.045, 0.55, [-0.37, -0.52, 0], [0, 0, 0.75]); g.scale.setScalar(s); return g;
}
export function rnaStrand(len = 2, seed = 1, color = '#ffd23a') {
  const r = rng(seed), pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(i / 8 * len - len / 2, Math.sin(i * 1.4 + seed) * 0.15, (r() - 0.5) * 0.2));
  const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(curve, 60, 0.03, 8), mat(color, { emissive: color, emissiveIntensity: 0.15 }));
  for (let i = 0; i < 16; i++) { const p = curve.getPoint(i / 15); blob(g, mat(['#4aa8ff', '#ff5a8a', '#3ad0a0', '#ffffff'][i % 4]), [p.x, p.y + 0.06, p.z], [0.045, 0.045, 0.045]); }
  return g;
}
export function jar({ label = '124', clay = '#c97a4a' } = {}) {
  const g = new THREE.Group(), pts = [[0, 0], [0.34, 0], [0.5, 0.15], [0.58, 0.45], [0.5, 0.8], [0.3, 0.98], [0.28, 1.08], [0.36, 1.12], [0.36, 1.18], [0, 1.18]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 40), mat(clay, { roughness: 0.85 }));
  cyl(g, mat('#8a4a28'), 0.3, 0.12, [0, 1.22, 0], [0, 0, 0], 0.26);
  const cap = add(g, new THREE.SphereGeometry(0.12, 16, 12), mat('#8a4a28'), [0, 1.34, 0]);
  const lab = add(g, new THREE.CylinderGeometry(0.585, 0.585, 0.36, 40, 1, true, -0.95, 1.9), new THREE.MeshStandardMaterial({ map: textTex(label, '#fff4dc', '#2a1a10', { w: 256, h: 192, font: 'bold 150px sans-serif' }), roughness: 0.8, side: THREE.DoubleSide }), [0, 0.5, 0]);
  g.userData.label = lab; return g;
}
export function sickle() {
  const g = new THREE.Group(); add(g, new THREE.TorusGeometry(0.42, 0.13, 16, 40, Math.PI * 1.1), mat('#c6202e', { roughness: 0.4 }), [0, 0, 0], [0, 0, 0.3], [1, 1, 1.2]);
  return g;
}
export function redCell(r = 0.4) {
  const g = new THREE.Group(), pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = t * r; pts.push(new THREE.Vector2(x, 0.09 * Math.sin(Math.PI * (1 - t)) * (0.4 + 1.2 * t) + 0.02)); }
  const m = add(g, new THREE.LatheGeometry(pts, 36), mat('#e0303d', { roughness: 0.4 })); m.material.side = THREE.DoubleSide;
  const b = add(g, new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x, -p.y)), 36), mat('#e0303d', { roughness: 0.4 })); b.material.side = THREE.DoubleSide;
  g.scale.setScalar(1.1); return g;
}
export function globe() {
  const g = new THREE.Group(), tex = canvasTexture(512, (c, s) => {
    c.fillStyle = '#2f7de0'; c.fillRect(0, 0, s, s); c.fillStyle = '#5cbf4a'; const r = rng(5);
    for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(r() * s, 60 + r() * (s - 120), 30 + r() * 60, 20 + r() * 40, r() * 3, 0, 7); c.fill(); }
  });
  const gl = add(g, new THREE.SphereGeometry(0.5, 40, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [0, 0.8, 0], [0, 0, 0.4]);
  cyl(g, mat('#6a4020'), 0.35, 0.08, [0, 0.04, 0]); cyl(g, mat('#6a4020'), 0.03, 0.3, [0, 0.2, 0]);
  add(g, new THREE.TorusGeometry(0.58, 0.025, 8, 40, Math.PI * 1.3), mat('#e2b13c', { metalness: 0.6 }), [0, 0.8, 0], [0, 0, 0.9]); return g;
}
export function wallSwitch() {
  const g = new THREE.Group(); box(g, mat('#f3efe6'), 0.5, 0.8, 0.1, [0, 0, 0]); box(g, mat('#2a2a30'), 0.2, 0.42, 0.04, [0, 0, 0.07]);
  const lever = box(g, mat('#e53a4a'), 0.14, 0.34, 0.1, [0, 0.14, 0.12], [-0.5, 0, 0]); blob(g, mat('#e53a4a'), [0, 0.3, 0.2], [0.09, 0.09, 0.07]); return g;
}
export function egg(label = 'NOVO') {
  const g = new THREE.Group(), pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; pts.push(new THREE.Vector2(Math.sin(t) * 0.55 * (1 - 0.18 * Math.cos(t)), -Math.cos(t) * 0.72)); }
  add(g, new THREE.LatheGeometry(pts, 40), mat('#fbf1dc', { roughness: 0.35 }), [0, 0.72, 0]);
  const band = add(g, new THREE.CylinderGeometry(0.55, 0.55, 0.3, 40, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: textTex(label, '#2a5fc4', '#ffffff', { w: 512, h: 128, font: 'bold 90px sans-serif' }), side: THREE.DoubleSide, roughness: 0.4 }), [0, 0.72, 0]);
  band.scale.set(1.01, 1, 1.01); return g;
}
export function liver() {
  const g = new THREE.Group(), L = mat('#a8452e', { roughness: 0.4 });
  blob(g, L, [0, 0.35, 0], [0.8, 0.32, 0.5]); blob(g, L, [0.55, 0.3, 0.1], [0.42, 0.25, 0.4]); blob(g, mat('#8f3626'), [-0.4, 0.55, 0.1], [0.4, 0.2, 0.3]);
  const r = rng(6); for (let i = 0; i < 12; i++) blob(g, mat('#ffd84a', { roughness: 0.2 }), [(r() - 0.5) * 1.3, 0.4 + r() * 0.2, 0.3 + r() * 0.2], [0.085, 0.085, 0.085]);
  return g;
}
export function bowel() {
  const g = new THREE.Group(), pts = []; for (let i = 0; i < 28; i++) { const a = i / 27 * Math.PI * 5; pts.push(new THREE.Vector3(Math.cos(a) * (0.7 - i * 0.012) + Math.sin(i) * 0.04, 0.2 + i * 0.045, Math.sin(a) * 0.3)); }
  const curve = new THREE.CatmullRomCurve3(pts); add(g, new THREE.TubeGeometry(curve, 160, 0.15, 14), mat('#f29a9a', { roughness: 0.4 }));
  for (const t of [0.25, 0.5, 0.75]) { const p = curve.getPoint(t); blob(g, mat('#d4202e', { roughness: 0.35 }), [p.x, p.y, p.z], [0.19, 0.19, 0.19]); }
  return g;
}
export function coin(r = 0.12) { const g = new THREE.Group(); cyl(g, mat('#f2c230', { metalness: 0.7, roughness: 0.25 }), r, r * 0.22, [0, 0, 0]); cyl(g, mat('#ffe27a', { metalness: 0.7 }), r * 0.7, r * 0.26, [0, 0, 0]); return g; }
export function crate(label = 'C') {
  const g = new THREE.Group(), w = mat('#b9824a');
  box(g, w, 1.2, 0.8, 0.9, [0, 0.4, 0]);
  const L = add(g, new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshStandardMaterial({ map: textTex(label, '#fff4dc', '#c4202e', { w: 256, h: 256, font: 'bold 220px sans-serif' }) }), [0, 0.4, 0.46]);
  for (const x of [-0.55, 0.55]) box(g, mat('#6a3f1d'), 0.1, 0.84, 0.94, [x, 0.4, 0]); box(g, mat('#6a3f1d'), 1.24, 0.08, 0.94, [0, 0.04, 0]);
  return g;
}
export function tongue() {
  const g = new THREE.Group(), lip = mat('#c8283c', { roughness: 0.35 });
  add(g, new THREE.TorusGeometry(0.55, 0.16, 16, 40), lip, [0, 0.55, 0], [0, 0, 0], [1, 0.8, 0.7]);
  blob(g, mat('#4a0a14'), [0, 0.5, -0.05], [0.5, 0.36, 0.1]);
  const curve = new THREE.CatmullRomCurve3([[0, 0.38, 0.05], [0.4, 0.25, 0.2], [0.9, 0.2, 0.3], [1.5, 0.35, 0.3], [1.9, 0.55, 0.3]].map((p) => new THREE.Vector3(...p)));
  add(g, new THREE.TubeGeometry(curve, 40, 0.16, 14), mat('#ff6f86', { roughness: 0.3 })); blob(g, mat('#ff6f86', { roughness: 0.3 }), [1.9, 0.55, 0.3], [0.17, 0.17, 0.17]);
  return g;
}
export function trident() {
  const g = new THREE.Group(), gold = mat('#f2c230', { metalness: 0.7, roughness: 0.25 });
  cyl(g, gold, 0.07, 2.2, [0, 1.1, 0]);
  box(g, gold, 0.8, 0.1, 0.1, [0, 2.12, 0]);
  for (const x of [-0.35, 0, 0.35]) { add(g, new THREE.ConeGeometry(0.11, x ? 0.42 : 0.55, 12), gold, [x, 2.32 + (x ? 0 : 0.07), 0]); }
  for (const x of [-0.35, 0.35]) cyl(g, gold, 0.03, 0.2, [x, 2.2, 0]);
  blob(g, mat('#3ab6ff'), [0, 1.0, 0], [0.07, 0.07, 0.07]); return g;
}
export function laptop() {
  const g = new THREE.Group(), tex = canvasTexture(512, (c, s) => {
    c.fillStyle = '#0d1b33'; c.fillRect(0, 0, s, s); const cols = ['#4aa8ff', '#ff5a8a'];
    for (let y = 0; y < s; y += 6) { const x = s / 2 + Math.sin(y / 28) * 130; c.fillStyle = cols[0]; c.fillRect(x - 6, y, 12, 5); c.fillStyle = cols[1]; c.fillRect(s - x - 6, y, 12, 5); if (y % 24 < 6) { c.fillStyle = '#fff'; c.fillRect(Math.min(x, s - x), y + 1, Math.abs(s - 2 * x), 3); } }
  });
  box(g, mat('#c8ccd4', { metalness: 0.5 }), 1.3, 0.07, 0.9, [0, 0.035, 0]);
  const scr = new THREE.Group(); scr.position.set(0, 0.07, -0.42); scr.rotation.x = -0.25; g.add(scr);
  box(scr, mat('#c8ccd4', { metalness: 0.5 }), 1.3, 0.85, 0.05, [0, 0.43, 0]);
  add(scr, new THREE.PlaneGeometry(1.18, 0.74), new THREE.MeshBasicMaterial({ map: tex }), [0, 0.43, 0.03]); return g;
}
export function hammer() {
  const g = new THREE.Group(), steel = mat('#8e97a6', { metalness: 0.7, roughness: 0.35 });
  cyl(g, mat('#6a3f1d'), 0.11, 1.8, [0, 0.9, 0]); box(g, steel, 1.1, 0.6, 0.6, [0, 1.95, 0]);
  for (const s of [-1, 1]) box(g, mat('#b8c0cc', { metalness: 0.7, roughness: 0.3 }), 0.1, 0.66, 0.66, [s * 0.52, 1.95, 0]);
  box(g, mat('#c8283c'), 0.2, 0.07, 0.07, [0, 0.1, 0]); blob(g, mat('#c8283c'), [0, 0.02, 0], [0.09, 0.09, 0.09]); return g;
}
export function microscope() {
  const g = new THREE.Group(), body = mat('#e8e8ee', { metalness: 0.4, roughness: 0.4 }), dk = mat('#2a2f3a');
  box(g, dk, 0.55, 0.07, 0.4, [0, 0.035, 0]); cyl(g, body, 0.05, 0.7, [-0.15, 0.4, 0]);
  const tube = cyl(g, body, 0.075, 0.62, [0.05, 0.68, 0], [0, 0, -0.4]); cyl(g, dk, 0.05, 0.12, [0.19, 0.95, 0], [0, 0, -0.4]);
  cyl(g, dk, 0.045, 0.14, [-0.11, 0.38, 0], [0, 0, -0.4]); box(g, dk, 0.35, 0.04, 0.3, [0.08, 0.2, 0]); cyl(g, mat('#e2b13c'), 0.04, 0.08, [-0.2, 0.65, 0.07], [Math.PI / 2, 0, 0]);
  return g;
}
export function sun(r = 0.9) {
  const g = new THREE.Group(); add(g, new THREE.SphereGeometry(r, 32, 24), new THREE.MeshBasicMaterial({ color: '#fff2a0' }));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(g, new THREE.ConeGeometry(r * 0.13, r * 0.55, 8), new THREE.MeshBasicMaterial({ color: '#ffd23a' }), [Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35, 0], [0, 0, a - Math.PI / 2]); }
  return g;
}
export function sunflower(h = 1) {
  const g = new THREE.Group(); cyl(g, mat('#3f9a3a'), 0.03, h, [0, h / 2, 0]);
  const head = new THREE.Group(); head.position.set(0, h, 0.04); head.rotation.x = 0.2; g.add(head);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; blob(head, mat('#ffcf1f'), [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0], [0.1, 0.05, 0.02], [0, 0, a]); }
  blob(head, mat('#6a3a18'), [0, 0, 0.01], [0.14, 0.14, 0.04]); return g;
}
export function house(c = '#e6c46a') { const g = new THREE.Group(); box(g, mat(c), 1.4, 1.5, 1, [0, 0.75, 0]); add(g, new THREE.ConeGeometry(1.1, 0.7, 4), mat('#8a3a2a'), [0, 1.85, 0], [0, Math.PI / 4, 0], [1, 1, 0.75]); for (const x of [-0.35, 0.35]) box(g, mat('#bfe4ff'), 0.25, 0.3, 0.02, [x, 0.9, 0.51]); box(g, mat('#6a3f1d'), 0.3, 0.5, 0.02, [0, 0.25, 0.51]); return g; }
export function flask() {
  const g = new THREE.Group(), pts = [[0, 0], [0.38, 0], [0.4, 0.05], [0.12, 0.7], [0.12, 0.95], [0.16, 1.0], [0.12, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ color: '#d8f2ff', transparent: true, opacity: 0.4, roughness: 0.1, side: THREE.DoubleSide }));
  cyl(g, mat('#44d68a', { transparent: true, opacity: 0.85 }), 0.3, 0.3, [0, 0.17, 0], [0, 0, 0], 0.37); return g;
}
export function dirt(n = 14, seed = 4, spread = 0.5) {
  const g = new THREE.Group(), r = rng(seed); for (let i = 0; i < n; i++) blob(g, mat(i % 3 ? '#6a4326' : '#85583a'), [(r() - 0.5) * spread * 2, 0.05 + r() * spread * 0.5, (r() - 0.5) * spread * 2], [0.14, 0.1, 0.14]); return g;
}

export const put = (parent, o, x, y, z, s = 1, ry = 0) => { o.position.set(x, y, z); o.scale.multiplyScalar(s); o.rotation.y = ry; parent.add(o); return o; };
export function arrow(parent, x, y, color = '#ffd23a', len = 0.8) {
  const m = mat(color, { emissive: color, emissiveIntensity: 0.25 });
  cyl(parent, m, 0.07, len, [x, y, 0.2], [0, 0, Math.PI / 2]); add(parent, new THREE.ConeGeometry(0.18, 0.3, 16), m, [x + len / 2 + 0.1, y, 0.2], [0, 0, -Math.PI / 2]);
}
