// Shared props + stage factory for the Gene Lay HEN scenes (local to this deck).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createHen } from './hen.js';
export { THREE, guard, canvasTexture, rng, createHen };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Anime stage + meadow. opts: ground colour, sky seed. Returns { stage, scene, chars, finish(cam, look) }. */
export function makeScene({ ground = '#6fae45', seed = 5, cover = 2, groundSize = 400 } = {}) {
  const P = new URLSearchParams(location.search);
  const stage = createAnimeStage({
    fov: 40, sunElevation: 35, sunAzimuth: 150, exposure: 1,
    sky: { cover, seed, towerTop: 0.5, puffCover: 2 }, rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.6 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene, chars = new Set();
  add(scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const num = (k, d) => Number(P.get(k) ?? d);
  const finish = (cam, look) => {
    const [cx, cy, cz] = cam, [tx, ty, tz] = look;
    splitMulti(scene);
    stage.toonify(scene, (m) => chars.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cx), num('cy', cy), num('cz', cz));
    stage.camera.lookAt(num('tx', tx), num('ty', ty), tz);
    stage.finish();
  };
  const mark = (obj) => { obj.traverse((o) => chars.add(o)); return obj; };
  return { stage, scene, chars, mark, finish, num };
}

/** Straw nest ring with a bowl of dry grass. */
export function nest(r = 0.55) {
  const g = new THREE.Group(), rn = rng(3);
  add(g, new THREE.CylinderGeometry(r * 0.85, r * 0.7, 0.12, 32), mat('#a9792f'), [0, 0.06, 0]);
  for (let i = 0; i < 70; i++) {
    const a = rn() * Math.PI * 2, rr = r * (0.8 + rn() * 0.2);
    add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.3 + rn() * 0.2, 5), mat(['#d8a845', '#b88a35', '#e8c060'][i % 3]),
      [Math.cos(a) * rr, 0.14 + rn() * 0.08, Math.sin(a) * rr], [Math.PI / 2 + (rn() - 0.5) * 0.3, 0, -a + (rn() - 0.5) * 0.5]);
  }
  add(g, new THREE.TorusGeometry(r, 0.06, 10, 40), mat('#c99a3c'), [0, 0.15, 0], [Math.PI / 2, 0, 0]);
  return g;
}

export function coin(r = 0.07) {
  const m = mat('#ffc928', { metalness: 0.6, roughness: 0.3 });
  const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(r, r, r * 0.22, 24), m, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.72, r * 0.07, 6, 24), mat('#ffe27a', { metalness: 0.5 }), [0, 0, r * 0.12]);
  return g;
}

export function egg(s = 1, color = '#fff3dc') {
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; pts.push(new THREE.Vector2(Math.sin(t) * 0.5 * (1 - 0.15 * Math.cos(t)) * s, -Math.cos(t) * 0.65 * s)); }
  const g = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), mat(color, { roughness: 0.35 })); g.castShadow = true; g.position.y = 0.65 * s; const w = new THREE.Group(); w.add(g); return w;
}

/** d6 with pips. */
export function die(s = 0.3) {
  const faces = [[1], [2], [3], [4], [5], [6]];
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const tex = (n) => canvasTexture(128, (ctx, z) => { ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, z, z); ctx.fillStyle = n === 1 ? '#d9202c' : '#1a1a1f';
    P[n].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(z / 2 + x * z * 0.26, z / 2 + y * z * 0.26, z * (n === 1 ? 0.15 : 0.09), 0, 7); ctx.fill(); }); });
  const order = [3, 4, 1, 6, 2, 5]; // +x -x +y -y +z -z
  const g = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), order.map((n) => new THREE.MeshStandardMaterial({ map: tex(n), roughness: 0.4 })));
  g.castShadow = true; return g;
}

/** Canvas text sign texture. */
export function textTex(text, { bg = '#f4e3b2', fg = '#3a2210', w = 512, h = 192, font = 'bold 110px sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 110; while (x.measureText(text).width > w - 40 && size > 20) { size -= 6; x.font = `bold ${size}px sans-serif`; }
  x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const sign = (text, wd, ht, o = {}) => new THREE.Mesh(new THREE.BoxGeometry(wd, ht, 0.04),
  [mat('#8a5a2b'), mat('#8a5a2b'), mat('#8a5a2b'), mat('#8a5a2b'), new THREE.MeshStandardMaterial({ map: textTex(text, o), roughness: 0.6 }), mat('#8a5a2b')]);

export function tree(h = 2.5, leaf = '#3f9a45') {
  const g = new THREE.Group(); cyl(g, mat('#7a4a25'), [0, h * 0.25, 0], 0.12 * h / 2.5, h * 0.5, [0, 0, 0], 0.08 * h / 2.5);
  [[0, 0.62, 0.55], [0.18, 0.78, 0.4], [-0.15, 0.95, 0.3]].forEach(([x, y, r], i) => blob(g, mat(i % 2 ? '#4aa84f' : leaf), [x * h * 0.5, y * h, 0], [r * h * 0.55, r * h * 0.5, r * h * 0.55]));
  return g;
}

const eye = (head, sx, y, z, r) => {
  const d = (rx, ry, c, dz, x = sx, yy = y) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x, yy, z + dz); head.add(m); };
  d(r, r * 1.2, '#fff', 0); d(r * 0.8, r * 1.1, '#3a2a1a', 0.0015); d(r * 0.42, r * 0.7, '#0c0806', 0.003);
  d(r * 0.28, r * 0.28, '#fff', 0.0045, sx - r * 0.25, y + r * 0.35);
};

/** Chibi human. opts: skin, shirt, pants, hat ('straw'|'gnome'|null), hair, beard. Arms: userData.aim('l'|'r',[x,y,z]) in local space. */
export function person({ skin = '#ffd9b8', shirt = '#4a7fd0', pants = '#35508a', hair = '#4a2d1a', hat = null, hatColor = '#e0b85a', scale = 1, beard = null, robe = null } = {}) {
  const g = new THREE.Group();
  const sk = mat(skin);
  for (const s of [-1, 1]) { if (!robe) { cyl(g, mat(pants), [s * 0.1, 0.2, 0], 0.075, 0.4); blob(g, mat('#5a3a22'), [s * 0.1, 0.04, 0.03], [0.09, 0.05, 0.13]); } }
  if (robe) { add(g, new THREE.CylinderGeometry(0.2, 0.36, 0.78, 32), mat(robe), [0, 0.39, 0]); }
  else blob(g, mat(shirt), [0, 0.6, 0], [0.24, 0.3, 0.19]);
  if (!robe) blob(g, mat(pants), [0, 0.44, 0], [0.235, 0.13, 0.19]);
  const head = new THREE.Group(); head.position.set(0, 1.08, 0); g.add(head);
  blob(head, sk, [0, 0, 0], [0.25, 0.235, 0.23]);
  blob(head, mat(hair), [0, 0.07, -0.05], [0.26, 0.21, 0.23]);
  for (const s of [-1, 1]) eye(head, s * 0.09, -0.01, 0.2, 0.05);
  const bl = mat('#ff8f8f', { transparent: true, opacity: 0.55 });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(1, 20), bl); b.scale.set(0.03, 0.016, 1); b.position.set(s * 0.15, -0.07, 0.19); head.add(b); }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 16, Math.PI), mat('#7a2a2a')); mo.rotation.z = Math.PI; mo.position.set(0, -0.09, 0.225); head.add(mo);
  if (beard) { blob(head, mat(beard), [0, -0.17, 0.1], [0.2, 0.2, 0.14]); }
  if (hat === 'straw') { cyl(head, mat(hatColor), [0, 0.17, 0], 0.46, 0.035); cyl(head, mat(hatColor), [0, 0.27, 0], 0.2, 0.2, [0, 0, 0], 0.17); cyl(head, mat('#c0392b'), [0, 0.2, 0], 0.21, 0.04, [0, 0, 0], 0.21); }
  if (hat === 'gnome') { add(head, new THREE.ConeGeometry(0.24, 0.7, 28), mat('#d8262f'), [0, 0.5, 0]); }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.78, 0); g.add(sh);
    cyl(sh, mat(robe ?? shirt), [0, -0.17, 0], 0.06, 0.34); blob(sh, sk, [0, -0.36, 0], [0.065, 0.065, 0.065]);
    sh.rotation.z = s * 0.2; arms[k] = sh;
  }
  g.userData.aim = (k, t) => { const sh = arms[k], v = new THREE.Vector3(...t).sub(sh.position).normalize(); sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), v); };
  g.userData.head = head; g.userData.arms = arms;
  g.scale.setScalar(scale); return g;
}

/** toonify cannot handle material arrays: split each multi-material mesh into one mesh per group. */
function splitMulti(root) {
  const list = []; root.traverse((o) => { if (o.isMesh && Array.isArray(o.material)) list.push(o); });
  for (const o of list) {
    const geo = o.geometry, idx = geo.index;
    o.material.forEach((m, i) => {
      const gr = geo.groups.find((g) => g.materialIndex === i); if (!gr) return;
      const g2 = geo.clone(); g2.clearGroups(); g2.setIndex(Array.from(idx.array.slice(gr.start, gr.start + gr.count)));
      const c = new THREE.Mesh(g2, m); c.castShadow = c.receiveShadow = true; c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); o.parent.add(c);
    });
    o.material = new THREE.MeshBasicMaterial(); o.visible = false;
  }
}
