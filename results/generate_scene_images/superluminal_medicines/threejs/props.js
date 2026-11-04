// Superluminal scene props + side characters (not a kit file). All characters face +z, feet on y = 0.
import * as THREE from 'three';
const V = (a) => new THREE.Vector3(...a);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
const SKIN = '#ffd9b8';

/** Flat texture plane with fitted text. bg=null -> transparent. */
export function textPlane(str, w, h, { fg = '#111', bg = '#fff', weight = 'bold', border = null } = {}) {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w);
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  if (border) { x.strokeStyle = border; x.lineWidth = 18; x.strokeRect(9, 9, c.width - 18, c.height - 18); }
  let f = c.height * 0.8; x.font = `${weight} ${f}px sans-serif`;
  const tw = x.measureText(str).width; if (tw > c.width * 0.86) { f *= c.width * 0.86 / tw; x.font = `${weight} ${f}px sans-serif`; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(str, c.width / 2, c.height / 2 + f * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, side: THREE.DoubleSide }));
}

const disc = (p, rx, ry, color, z, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); p.add(m); return m;
};
/** Anime eyes on a sphere of radius R (sphere centred at p's origin) or on a flat face at z=z0. */
export function eyes(p, R, { y = 0, sep = 0.42, size = 0.24, iris = '#2d4fa8', flat = false, z0 = 0, brow = true } = {}) {
  const st = Math.max(0.0025, 0.01 * R);
  for (const sx of [-1, 1]) {
    const x = sx * sep * R, yy = y * R, z = flat ? z0 : Math.sqrt(Math.max(R * R - x * x - yy * yy, 0));
    const g = new THREE.Group(); g.position.set(x, yy, z + st); g.rotation.order = 'YXZ';
    if (!flat) { g.rotation.y = Math.atan2(x, z); g.rotation.x = -Math.atan2(yy, Math.hypot(x, z)); }
    const s = size * R; p.add(g);
    disc(g, 0.8 * s, s, '#ffffff', 0); disc(g, 0.66 * s, 0.92 * s, iris, st); disc(g, 0.55 * s, 0.5 * s, '#ffffff22' === 0 ? iris : '#86b6f5', 1.5 * st, 0, -0.35 * s);
    disc(g, 0.34 * s, 0.56 * s, '#0c1030', 2 * st, 0, -0.04 * s);
    disc(g, 0.24 * s, 0.24 * s, '#ffffff', 3 * st, -0.25 * s, 0.4 * s); disc(g, 0.1 * s, 0.1 * s, '#ffffff', 3 * st, 0.25 * s, -0.5 * s);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 28, 1, 0.15, Math.PI - 0.3), mat('#1a1020'));
    lid.scale.set(0.84 * s, 1.04 * s, 1); lid.position.z = 4 * st; g.add(lid);
  }
}
export function smile(p, R, y, w = 0.1, z = null, open = false) {
  const zz = z ?? Math.sqrt(R * R - (y * R) * (y * R)) + 0.004;
  if (open) { const m = disc(p, w, w * 0.8, '#5a1420', zz, 0, y * R); disc(p, w * 0.6, w * 0.3, '#ff7f8f', zz + 0.004, 0, y * R - w * 0.4); return; }
  const t = new THREE.Mesh(new THREE.TorusGeometry(w, w * 0.12, 8, 20, Math.PI), mat('#7a2a2a'));
  t.rotation.z = Math.PI; t.position.set(0, y * R, zz); p.add(t);
}
/** Cylinder from a to b (+ optional end ball). */
export function limbBetween(p, a, b, r, m, ball = null) {
  const A = V(a), B = V(b), d = B.clone().sub(A), L = d.length();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), m);
  c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  c.castShadow = true; p.add(c);
  if (ball) blob(p, ball.m, b, [ball.r, ball.r, ball.r]);
  return c;
}
const arms = (g, sh, hands, r, m, hm) => { for (const k of ['l', 'r']) limbBetween(g, sh[k], hands[k], r, m, { r: r * 1.4, m: hm }); };

export function coin(r = 0.16) {
  const g = new THREE.Group(), gold = mat('#f5b81c', { metalness: 0.5, roughness: 0.3 });
  cyl(g, gold, [0, 0, 0], r, r * 0.22, [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.72, r * 0.07, 8, 28), mat('#ffd75a', { metalness: 0.5, roughness: 0.3 }), [0, 0, r * 0.12]);
  add(g, new THREE.TorusGeometry(r, r * 0.08, 8, 28), mat('#e0a010', { metalness: 0.5, roughness: 0.3 }));
  return g;
}

export function nun({ hands = { l: [0.5, 0.45, 0.2], r: [-0.5, 0.45, 0.2] } } = {}) {
  const g = new THREE.Group(), black = mat('#1b1b22'), white = mat('#f7f4ee'), skin = mat(SKIN);
  const pts = [[0, 0], [0.5, 0], [0.45, 0.1], [0.32, 0.5], [0.22, 0.78], [0, 0.8]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 32), black);
  add(g, new THREE.TorusGeometry(0.21, 0.045, 8, 24), white, [0, 0.8, 0], [Math.PI / 2, 0, 0]);
  box(g, white, [0, 0.45, 0.28], [0.22, 0.5, 0.04], [-0.25, 0, 0]);
  box(g, mat('#f5b81c', { metalness: 0.4 }), [0, 0.6, 0.31], [0.03, 0.14, 0.02], [-0.25, 0, 0]); box(g, mat('#f5b81c', { metalness: 0.4 }), [0, 0.62, 0.31], [0.09, 0.03, 0.02], [-0.25, 0, 0]);
  const h = new THREE.Group(); h.position.y = 1.0; g.add(h);
  blob(h, skin, [0, 0, 0], [0.22, 0.22, 0.22]);
  add(h, new THREE.SphereGeometry(0.245, 32, 20, 0, Math.PI * 2, 0, 0.4 * Math.PI), black);
  add(h, new THREE.SphereGeometry(0.245, 32, 20, Math.PI, Math.PI, 0, 0.9 * Math.PI), black);
  add(h, new THREE.TorusGeometry(0.19, 0.035, 8, 28), white, [0, 0.125, 0], [Math.PI / 2, 0, 0]);
  eyes(h, 0.22, { y: -0.12, sep: 0.4, size: 0.24, iris: '#4a7a3a' }); smile(h, 0.22, -0.5, 0.05);
  arms(g, { l: [0.22, 0.72, 0], r: [-0.22, 0.72, 0] }, hands, 0.06, black, skin);
  return g;
}

export function mummy({ hands = { l: [0.45, 0.6, 0.25], r: [-0.45, 0.6, 0.25] } } = {}) {
  const g = new THREE.Group(), A = mat('#e8dcb5'), B = mat('#cdbd8c');
  for (let i = 0; i < 8; i++) cyl(g, i % 2 ? B : A, [0, 0.06 + i * 0.1, 0], 0.3 - i * 0.008 + (i < 2 ? 0.02 : 0), 0.105);
  for (const x of [-0.12, 0.12]) { cyl(g, A, [x, 0.05, 0.02], 0.1, 0.2); blob(g, B, [x, 0.0, 0.1], [0.12, 0.06, 0.18]); }
  const h = new THREE.Group(); h.position.y = 1.02; g.add(h);
  blob(h, A, [0, 0, 0], [0.25, 0.25, 0.25]);
  for (const [y, rr] of [[0.15, 0.2], [-0.16, 0.19], [0.05, 0.25]]) add(h, new THREE.TorusGeometry(rr, 0.022, 8, 28), B, [0, y, 0], [Math.PI / 2, 0, 0]);
  eyes(h, 0.25, { y: -0.02, sep: 0.4, size: 0.2, iris: '#7a3a1a' }); smile(h, 0.25, -0.5, 0.05);
  box(h, B, [0.2, 0.1, 0.1], [0.04, 0.2, 0.01], [0, 0.4, 0.6]);
  arms(g, { l: [0.27, 0.78, 0], r: [-0.27, 0.78, 0] }, hands, 0.07, A, B);
  return g;
}

export function ram({ mouth = true } = {}) {
  const g = new THREE.Group(), wool = mat('#fbf6ec'), dark = mat('#3a3330'), cream = mat('#e9d6b8');
  blob(g, wool, [0, 0.6, -0.05], [0.5, 0.46, 0.55]);
  for (let i = 0; i < 14; i++) { const a = i * 2.4; blob(g, wool, [Math.cos(a) * 0.38, 0.6 + Math.sin(a * 1.7) * 0.28, -0.05 + Math.sin(a) * 0.4], [0.2, 0.2, 0.2]); }
  for (const [x, z] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.3], [-0.25, -0.3]]) { cyl(g, dark, [x, 0.17, z], 0.065, 0.36); blob(g, mat('#241f1d'), [x, 0.03, z + 0.03], [0.08, 0.05, 0.1]); }
  const h = new THREE.Group(); h.position.set(0, 1.0, 0.4); g.add(h);
  blob(h, cream, [0, 0, 0], [0.26, 0.29, 0.28]);
  blob(h, dark, [0, -0.12, 0.2], [0.14, 0.1, 0.1]);
  eyes(h, 0.28, { y: 0.15, sep: 0.42, size: 0.2, iris: '#8a5a1a' });
  if (mouth) { smile(h, 0.28, -0.45, 0.1, 0.285, true); }
  for (const sx of [-1, 1]) {
    add(h, new THREE.TorusGeometry(0.19, 0.06, 10, 24, 1.55 * Math.PI), mat('#d9b46a'), [sx * 0.3, 0.1, -0.03], [0, 0, 0.3]).scale.x = sx;
    blob(h, cream, [sx * 0.3, 0.26, -0.1], [0.1, 0.05, 0.05], [0, 0, sx * -0.4]);
  }
  return g;
}

export function shredder() {
  const g = new THREE.Group(), body = mat('#5b6b85'), dark = mat('#222833');
  box(g, body, [0, 0.8, 0], [1.1, 1.2, 0.7]);
  box(g, dark, [0, 1.43, 0], [1.2, 0.12, 0.8]);
  box(g, mat('#10141c'), [0, 1.5, 0.05], [0.9, 0.03, 0.12]);
  box(g, mat('#cfd6e3'), [0, 0.28, 0.05], [1.0, 0.45, 0.62]);
  for (let i = 0; i < 26; i++) {
    const t = i / 25 - 0.5;
    const s = box(g, mat(i % 3 ? '#fffdf5' : '#e9ecf2'), [t * 0.9, 0.08 + (i % 4) * 0.08, 0.36 + (i % 5) * 0.05], [0.03, 0.4 + (i % 3) * 0.12, 0.008], [0.15 * Math.sin(i), 0, 0.2 * Math.cos(i * 1.7)]);
  }
  const sheet = box(g, mat('#fffdf5'), [0, 1.7, 0.05], [0.7, 0.45, 0.01]); for (let i = 0; i < 4; i++) box(g, mat('#9aa4b8'), [0, 1.6 + i * 0.07, 0.06], [0.55, 0.02, 0.005]);
  const f = new THREE.Group(); f.position.set(0, 0.98, 0.351); g.add(f);
  eyes(f, 1, { flat: true, y: 0.0, sep: 0.2, size: 0.13, iris: '#c0392b' });
  box(f, mat('#fff'), [0, -0.2, 0.002], [0.5, 0.1, 0.004]); for (let i = -4; i <= 4; i++) box(f, mat('#8a8f99'), [i * 0.055, -0.2, 0.005], [0.006, 0.1, 0.002]);
  for (const x of [-0.45, 0.45]) cyl(g, dark, [x, 0.04, 0.2], 0.07, 0.08);
  return g;
}

export function yak({ hands = { l: [0.5, 0.75, 0.4], r: [-0.5, 0.75, 0.4] } } = {}) {
  const g = new THREE.Group(), fur = mat('#8a5a3a'), fur2 = mat('#6e4630'), light = mat('#b08060');
  blob(g, fur, [0, 0.68, 0], [0.5, 0.55, 0.46]);
  add(g, new THREE.CylinderGeometry(0.46, 0.58, 0.45, 32), fur2, [0, 0.3, 0]);
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; add(g, new THREE.ConeGeometry(0.07, 0.3, 8), fur2, [Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55], [Math.PI, 0, 0]); }
  const h = new THREE.Group(); h.position.set(0, 1.28, 0.1); g.add(h);
  blob(h, fur, [0, 0, 0], [0.28, 0.27, 0.27]);
  blob(h, light, [0, -0.09, 0.22], [0.16, 0.12, 0.12]); blob(h, mat('#241410'), [0, -0.08, 0.33], [0.06, 0.04, 0.03]);
  eyes(h, 0.27, { y: 0.1, sep: 0.45, size: 0.2, iris: '#6a4a1a' }); smile(h, 0.27, -0.55, 0.05, 0.31);
  for (const sx of [-1, 1]) {
    const hn = add(h, new THREE.TorusGeometry(0.2, 0.05, 10, 24, Math.PI), mat('#efe6cf'), [sx * 0.34, 0.08, 0], [0, 0, -Math.PI / 2]); hn.scale.x = sx;
    for (let k = 0; k < 6; k++) { const a = -0.3 + k * 0.1; blob(g, fur2, [sx * 0.1 * (k - 2), 1.17 + 0.0, 0.0], [0.07, 0.08, 0.1]); }
  }
  arms(g, { l: [0.42, 0.9, 0.1], r: [-0.42, 0.9, 0.1] }, hands, 0.11, fur, fur2);
  return g;
}

export function beaver({ hands = { l: [0.4, 0.55, 0.15], r: [-0.4, 0.8, 0.15] } } = {}) {
  const g = new THREE.Group(), fur = mat('#8a5a33'), belly = mat('#d9b48a'), dark = mat('#4a2d1c');
  blob(g, fur, [0, 0.5, 0], [0.38, 0.47, 0.33]); blob(g, belly, [0, 0.46, 0.17], [0.27, 0.36, 0.2]);
  add(g, new THREE.BoxGeometry(0.5, 0.5, 0.06), dark, [0, 0.28, -0.5], [-0.5, 0, 0]);
  for (const x of [-0.18, 0.18]) blob(g, dark, [x, 0.04, 0.12], [0.14, 0.07, 0.2]);
  const h = new THREE.Group(); h.position.set(0, 1.1, 0.04); g.add(h);
  blob(h, fur, [0, 0, 0], [0.3, 0.27, 0.27]); blob(h, mat('#a56c3e'), [0, -0.1, 0.2], [0.19, 0.13, 0.14]);
  blob(h, dark, [0, -0.02, 0.33], [0.06, 0.04, 0.03]);
  for (const x of [-0.035, 0.035]) box(h, mat('#fffdf5'), [x, -0.2, 0.3], [0.06, 0.1, 0.03]);
  eyes(h, 0.27, { y: 0.14, sep: 0.42, size: 0.2, iris: '#3a2416' });
  for (const sx of [-1, 1]) blob(h, dark, [sx * 0.2, 0.24, -0.05], [0.07, 0.07, 0.04]);
  arms(g, { l: [0.3, 0.7, 0.05], r: [-0.3, 0.7, 0.05] }, hands, 0.07, fur, fur);
  return g;
}

export function lollipop({ tongue = false, hands = { l: [0.65, 0.9, 0.2], r: [-0.65, 0.9, 0.2] } } = {}) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#ff5fa2'; x.fillRect(0, 0, 512, 512); x.lineCap = 'round';
  const cols = ['#ffffff', '#ffd23f']; for (let k = 0; k < 3; k++) { x.strokeStyle = cols[k % 2]; x.lineWidth = 34; x.beginPath(); for (let t = 0; t < 7; t += 0.05) { const r = 12 + t * 33, a = t * 1.6 * Math.PI * 1.3 + k * 2.1; x.lineTo(256 + r * Math.cos(a), 256 + r * Math.sin(a)); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const cap = mat('#ff5fa2'), side = mat('#ff5fa2', { roughness: 0.3 });
  const candy = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 48), side);
  candy.rotation.x = Math.PI / 2; candy.position.y = 1.15; candy.castShadow = true; g.add(candy);
  for (const s of [1, -1]) for (const [r, c] of [[0.5, '#ffffff'], [0.4, '#ffd23f'], [0.3, '#ffffff'], [0.2, '#ffd23f']]) { const q = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 8, 48), mat(c, { roughness: 0.3 })); q.position.set(0, 1.15, s * 0.1); g.add(q); }
  cyl(g, mat('#f2efe8'), [0, 0.5, -0.0], 0.04, 1.0);
  add(g, new THREE.TorusGeometry(0.06, 0.02, 8, 16), mat('#e0262d'), [0, 0.62, 0], [Math.PI / 2, 0, 0]);
  const f = new THREE.Group(); f.position.set(0, 1.15, 0.101); g.add(f);
  // face sits on the swirl: white plate so eyes read
  disc(f, 0.34, 0.24, '#ffe9f2', 0.002, 0, -0.04);
  eyes(f, 1, { flat: true, y: 0.03, sep: 0.15, size: 0.11, iris: '#2d4fa8', z0: 0.004 });
  if (tongue) { smile(f, 1, -0.2, 0.1, 0.01, true); } else smile(f, 1, -0.16, 0.06, 0.01);
  arms(g, { l: [0.52, 1.1, 0.05], r: [-0.52, 1.1, 0.05] }, hands, 0.035, mat('#f2efe8'), mat('#ffffff'));
  if (tongue) {
    const pts = [[0, 0, 0], [0, -0.02, 0.2], [0.05, 0.02, 0.5], [0.22, 0.14, 0.8], [0.5, 0.3, 0.95]].map(V);
    const tg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 10), mat('#ff6f8a', { roughness: 0.4 }));
    tg.position.set(0, -0.28, 0.1); tg.castShadow = true; f.add(tg); blob(f, mat('#ff6f8a', { roughness: 0.4 }), [0.5, 0.02, 1.05], [0.11, 0.1, 0.11]);
  }
  return g;
}

export function robot({ hands = { l: [0.5, 0.5, 0.35], r: [-0.5, 0.5, 0.35] } } = {}) {
  const g = new THREE.Group(), body = mat('#dfe5ee', { metalness: 0.2 }), dark = mat('#4a5568'), cy = mat('#42e8ff', { emissive: '#42e8ff', emissiveIntensity: 0.6 });
  box(g, body, [0, 0.62, 0], [0.5, 0.55, 0.34]); box(g, cy, [0, 0.66, 0.175], [0.2, 0.14, 0.01]);
  for (const x of [-0.13, 0.13]) { cyl(g, dark, [x, 0.22, 0], 0.06, 0.4); box(g, dark, [x, 0.03, 0.06], [0.16, 0.06, 0.24]); }
  const h = new THREE.Group(); h.position.y = 1.18; g.add(h);
  box(h, body, [0, 0, 0], [0.5, 0.4, 0.4]); box(h, mat('#0c1020'), [0, 0.01, 0.201], [0.4, 0.22, 0.01]);
  for (const sx of [-1, 1]) { disc(h, 0.07, 0.085, '#42e8ff', 0.208, sx * 0.1, 0.01); disc(h, 0.025, 0.025, '#ffffff', 0.212, sx * 0.1 - 0.02, 0.04); }
  cyl(h, dark, [0, 0.3, 0], 0.02, 0.2); blob(h, cy, [0, 0.42, 0], [0.05, 0.05, 0.05]);
  arms(g, { l: [0.3, 0.8, 0], r: [-0.3, 0.8, 0] }, hands, 0.05, dark, body);
  return g;
}

export function microscope() {
  const g = new THREE.Group(), body = mat('#27526b', { roughness: 0.4 }), steel = mat('#d5dbe0', { metalness: 0.7, roughness: 0.25 });
  box(g, body, [0, 0.05, 0], [0.8, 0.1, 0.6]);
  cyl(g, body, [-0.18, 0.55, 0], 0.07, 1.0);
  cyl(g, body, [0, 1.0, 0], 0.09, 0.8, [0, 0, -0.5]);
  cyl(g, steel, [0.2, 1.3, 0], 0.07, 0.4, [0, 0, -0.5]);
  cyl(g, mat('#111'), [0.4, 1.68, 0], 0.07, 0.12, [0, 0, -0.5]);
  cyl(g, steel, [0.17, 0.6, 0], 0.07, 0.4, [0, 0, 0]); cyl(g, steel, [0.17, 0.42, 0], 0.04, 0.12);
  box(g, steel, [0.15, 0.3, 0], [0.55, 0.05, 0.4]); box(g, mat('#9fd8ff'), [0.17, 0.33, 0], [0.12, 0.015, 0.1]);
  cyl(g, mat('#e0262d'), [-0.24, 0.42, 0.2], 0.09, 0.06, [Math.PI / 2, 0, 0]);
  return g;
}

export function cryoEM() {
  const g = new THREE.Group(), steel = mat('#cfd6de', { metalness: 0.5, roughness: 0.3 }), blue = mat('#2a6fd6', { roughness: 0.4 });
  box(g, mat('#e8edf2'), [0, 0.4, 0], [1.3, 0.8, 1.1]);
  cyl(g, steel, [0, 1.6, 0], 0.36, 1.6);
  for (const y of [1.1, 1.6, 2.1]) cyl(g, blue, [0, y, 0], 0.385, 0.1);
  cyl(g, mat('#f4f9ff'), [0, 2.65, 0], 0.5, 0.55); cyl(g, mat('#cfe8ff'), [0, 3.0, 0], 0.36, 0.2);
  box(g, mat('#2a3140'), [0.9, 1.05, 0.25], [0.12, 0.7, 0.9], [0, 0, 0]);
  const scr = box(g, mat('#42e8ff', { emissive: '#42e8ff', emissiveIntensity: 0.6 }), [0.97, 1.15, 0.25], [0.02, 0.4, 0.65]);
  return g;
}

export function helix(h = 1.6, color = '#e0562d') {
  const g = new THREE.Group(), a = mat(color, { roughness: 0.4 });
  cyl(g, a, [0, 0, 0], 0.1, h);
  for (let y = -h / 2 + 0.08; y < h / 2; y += 0.14) add(g, new THREE.TorusGeometry(0.11, 0.035, 8, 20), mat('#ffffff', { roughness: 0.4 }), [0, y, 0], [Math.PI / 2 + 0.35, 0, 0]);
  return g;
}

export function door(w = 0.9, h = 1.9) {
  const g = new THREE.Group(), wood = mat('#a5683a');
  box(g, wood, [w / 2, h / 2, 0], [w, h, 0.09]);
  for (const y of [h * 0.3, h * 0.72]) box(g, mat('#c0834f'), [w / 2, y, 0.05], [w * 0.7, h * 0.28, 0.02]);
  blob(g, mat('#f5b81c', { metalness: 0.6, roughness: 0.3 }), [w * 0.85, h * 0.5, 0.1], [0.06, 0.06, 0.06]);
  return g;
}

export function chest() {
  const g = new THREE.Group(), wood = mat('#8a4f24'), gold = mat('#f5b81c', { metalness: 0.5, roughness: 0.3 });
  box(g, wood, [0, 0.4, 0], [1.9, 0.8, 1.1]);
  const lid = add(g, new THREE.CylinderGeometry(0.55, 0.55, 1.9, 24, 1, false, 0, Math.PI), wood, [0, 0.8, 0], [0, 0, Math.PI / 2]); lid.rotation.set(0, 0, Math.PI / 2); lid.rotation.order = 'XYZ';
  lid.rotation.set(Math.PI / 2 * 0, 0, Math.PI / 2); lid.rotation.y = 0;
  for (const x of [-0.8, 0.8]) { box(g, gold, [x, 0.4, 0], [0.12, 0.84, 1.14]); add(g, new THREE.CylinderGeometry(0.58, 0.58, 0.12, 24, 1, false, 0, Math.PI), gold, [x, 0.8, 0], [0, 0, Math.PI / 2]); }
  box(g, gold, [0, 0.72, 0.57], [0.24, 0.3, 0.05]);
  const t = textPlane('TEA', 1.2, 0.5, { fg: '#fff3dc', bg: '#2e6b3a', border: '#f5b81c' }); t.position.set(0, 0.38, 0.56); g.add(t);
  return g;
}

export function check(txt = '$1.3B') {
  const g = new THREE.Group();
  const t = textPlane(txt, 1.9, 0.95, { fg: '#1b7a3a', bg: '#fff8e0', border: '#1b7a3a' }); g.add(t);
  box(g, mat('#fff8e0'), [0, 0, -0.012], [1.94, 0.99, 0.02]);
  return g;
}

export function balloon(color, y = 0) {
  const g = new THREE.Group();
  blob(g, mat(color, { roughness: 0.25 }), [0, 0, 0], [0.2, 0.25, 0.2]); cyl(g, mat('#fff'), [0, -0.9, 0], 0.004, 1.3);
  return g;
}
