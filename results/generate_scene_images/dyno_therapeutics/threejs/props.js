// Shared prop builders for the Dyno scenes. Each returns a Group standing on y = 0 (origin at base) facing +z.
import { THREE, mat, add, blob, box, cyl, sign } from './common.js';

export function egg(h = 1) {
  const g = new THREE.Group(), shell = mat('#fbf4e2'), spot = mat('#7ccf8a');
  const e = blob(g, shell, [0, 0.4 * h, 0], [0.3 * h, 0.4 * h, 0.3 * h]);
  [[0.12, 0.6, 0.24], [-0.15, 0.3, 0.24], [0.2, 0.25, 0.2], [-0.08, 0.7, 0.26]].forEach(([x, y, z]) => blob(g, spot, [x * h, y * h, z * h], [0.05 * h, 0.05 * h, 0.012 * h]));
  return g;
}
export function dove(s = 1) {
  const g = new THREE.Group(), w = mat('#ffffff'), sh = mat('#dfe8f5');
  blob(g, w, [0, 0.2 * s, 0], [0.16 * s, 0.14 * s, 0.24 * s]);
  blob(g, w, [0, 0.36 * s, 0.17 * s], [0.1 * s, 0.1 * s, 0.1 * s]);
  add(g, new THREE.ConeGeometry(0.03 * s, 0.09 * s, 8), mat('#ffa43c'), [0, 0.35 * s, 0.3 * s], [Math.PI / 2, 0, 0]);
  for (const x of [-1, 1]) {
    blob(g, mat('#2a2a35', { roughness: 0.3 }), [x * 0.055 * s, 0.385 * s, 0.25 * s], [0.02 * s, 0.026 * s, 0.014 * s]);
    blob(g, w, [x * 0.045 * s, 0.4 * s, 0.265 * s], [0.007 * s, 0.007 * s, 0.006 * s]);
    const wing = blob(g, sh, [x * 0.17 * s, 0.27 * s, -0.02 * s], [0.05 * s, 0.17 * s, 0.22 * s], [0, 0, x * -0.6]);
    blob(g, w, [x * 0.22 * s, 0.4 * s, -0.04 * s], [0.04 * s, 0.14 * s, 0.17 * s], [0, 0, x * -0.9]);
  }
  add(g, new THREE.ConeGeometry(0.1 * s, 0.26 * s, 4), w, [0, 0.18 * s, -0.3 * s], [-Math.PI / 2 - 0.3, 0, 0], [1, 1, 0.3]);
  return g;
}
export function church(s = 1) {
  const g = new THREE.Group(), wall = mat('#f1e3c8'), roof = mat('#b6452f'), stone = mat('#a99a86');
  box(g, wall, [0, 0.35 * s, 0], [0.8 * s, 0.7 * s, 0.9 * s]);
  const r = add(g, new THREE.ConeGeometry(0.62 * s, 0.4 * s, 4), roof, [0, 0.9 * s, 0], [0, Math.PI / 4, 0], [1.0, 1, 1.1]);
  const tw = box(g, wall, [0, 0.85 * s, 0.5 * s], [0.34 * s, 1.3 * s, 0.34 * s]); tw.position.y = 0.65 * s;
  add(g, new THREE.ConeGeometry(0.28 * s, 0.5 * s, 4), roof, [0, 1.55 * s, 0.5 * s], [0, Math.PI / 4, 0]);
  box(g, mat('#ffd23c', { metalness: 0.5, roughness: 0.3 }), [0, 1.95 * s, 0.5 * s], [0.05 * s, 0.22 * s, 0.05 * s]);
  box(g, mat('#ffd23c', { metalness: 0.5, roughness: 0.3 }), [0, 1.99 * s, 0.5 * s], [0.16 * s, 0.05 * s, 0.05 * s]);
  box(g, mat('#6b3f22'), [0, 0.2 * s, 0.68 * s], [0.18 * s, 0.4 * s, 0.03 * s]);
  add(g, new THREE.CylinderGeometry(0.09 * s, 0.09 * s, 0.03 * s, 20, 1, false, 0, Math.PI), mat('#6b3f22'), [0, 0.4 * s, 0.68 * s], [Math.PI / 2, 0, Math.PI / 2]);
  for (const x of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.03 * s, 16), mat('#58a8e0', { emissive: '#2a5a9a', emissiveIntensity: 0.4 }), [x * 0.28 * s, 0.4 * s, 0.46 * s + 0.01], [Math.PI / 2, 0, 0]);
    add(g, new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.03 * s, 16), mat('#e05858', { emissive: '#8a2a2a', emissiveIntensity: 0.4 }), [x * 0.28 * s, 0.4 * s, 0.46 * s + 0.01], [Math.PI / 2, 0, 0]).visible = false;
  }
  const s3 = new THREE.Group(); box(s3, stone, [0, 0.03 * s, 0.9 * s], [0.5 * s, 0.06 * s, 0.2 * s]); g.add(s3);
  return g;
}
export function capsid(r = 0.4, color = '#ff6fa8', tip = '#ffd23c') {
  const g = new THREE.Group();
  const ico = add(g, new THREE.IcosahedronGeometry(r, 1), mat(color, { roughness: 0.4, flatShading: true }), [0, r, 0]);
  const v = new THREE.IcosahedronGeometry(r, 0).attributes.position, seen = new Set();
  for (let i = 0; i < v.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(v, i), k = p.toArray().map((x) => x.toFixed(3)).join(',');
    if (seen.has(k)) continue; seen.add(k);
    const n = p.clone().normalize(), c = add(g, new THREE.ConeGeometry(r * 0.17, r * 0.3, 8), mat(tip, { roughness: 0.4 }), [p.x * 1.07, r + p.y * 1.07, p.z * 1.07]);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  }
  return g;
}
export function helix(h = 1.2, r = 0.18, turns = 3, c1 = '#ff5a7a', c2 = '#4aa8ff') {
  const g = new THREE.Group(), N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = t * turns * Math.PI * 2, y = t * h;
    for (const [off, c] of [[0, c1], [Math.PI, c2]]) blob(g, mat(c), [Math.cos(a + off) * r, y, Math.sin(a + off) * r], [0.045, 0.045, 0.045]);
    if (i % 3 === 0) add(g, new THREE.CylinderGeometry(0.014, 0.014, 2 * r, 6), mat('#ffe9a0'), [0, y, 0], [0, 0, Math.PI / 2], [1, 1, 1]).rotation.set(0, -a, Math.PI / 2);
  }
  return g;
}
export function kelp(h = 1.2) {
  const g = new THREE.Group(), c = ['#2f7d3a', '#3d9648', '#27683a'];
  for (let k = 0; k < 4; k++) {
    let x = (k - 1.5) * 0.12;
    for (let i = 0; i < 8; i++) {
      const y = i * h / 8; x += Math.sin(i * 0.9 + k) * 0.025;
      blob(g, mat(c[k % 3]), [x, y + 0.06, 0.02 * k], [0.035, 0.08, 0.02]);
      if (i % 2) { blob(g, mat(c[(k + 1) % 3]), [x + 0.09, y + 0.07, 0], [0.12, 0.035, 0.015], [0, 0, 0.4]); blob(g, mat(c[(k + 2) % 3]), [x - 0.09, y + 0.1, 0], [0.12, 0.035, 0.015], [0, 0, -0.4]); }
    }
  }
  return g;
}
export function brain(s = 1) {
  const g = new THREE.Group(), cols = ['#f5a3b8', '#ee90a8', '#f9b8c8'];
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  blob(g, mat('#e88aa5'), [0, 0.5 * s, 0], [0.55 * s, 0.38 * s, 0.45 * s]);
  for (let i = 0; i < 70; i++) {
    const th = r() * Math.PI * 2, ph = r() * Math.PI * 0.62, x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
    blob(g, mat(cols[i % 3]), [0.58 * s * x, 0.5 * s + 0.4 * s * y, 0.47 * s * z], [0.13 * s, 0.1 * s, 0.13 * s]);
  }
  add(g, new THREE.BoxGeometry(0.02 * s, 0.4 * s, 0.9 * s), mat('#c8607f'), [0, 0.86 * s, 0]);
  blob(g, mat('#e88aa5'), [-0.3 * s, 0.16 * s, -0.25 * s], [0.2 * s, 0.14 * s, 0.14 * s]);
  cyl(g, mat('#e88aa5'), [0.1 * s, 0.1 * s, 0], 0.09 * s, 0.12 * s, 0.25 * s);
  return g;
}
export function bean(s = 1) {
  const g = new THREE.Group(), m = mat('#b0301f', { roughness: 0.3 }), N = 9;
  for (let i = 0; i < N; i++) {
    const a = (i / (N - 1) - 0.5) * 2.0, rr = 0.15 * s * (1 - 0.25 * Math.abs(i / (N - 1) - 0.5) * 2 * 0.6);
    blob(g, m, [Math.sin(a) * 0.34 * s, 0.2 * s + Math.cos(a) * 0.16 * s - 0.1 * s, 0], [rr * 1.1, rr * 1.2, rr * 1.05]);
  }
  blob(g, mat('#c84a30'), [0, 0.2 * s, 0.02 * s], [0.2 * s, 0.1 * s, 0.12 * s]);
  for (const x of [-1, 1]) {
    blob(g, mat('#fff'), [x * 0.07 * s, 0.25 * s, 0.15 * s], [0.05 * s, 0.065 * s, 0.02 * s]);
    blob(g, mat('#111'), [x * 0.07 * s, 0.25 * s, 0.17 * s], [0.028 * s, 0.045 * s, 0.015 * s]);
  }
  return g;
}
export function muscleArm(s = 1) {
  const g = new THREE.Group(), skin = mat('#f2b78f');
  cyl(g, skin, [0, 0.15 * s, 0], 0.17 * s, 0.14 * s, 0.4 * s, [0, 0, 0]);
  const up = blob(g, skin, [0, 0.55 * s, 0], [0.16 * s, 0.3 * s, 0.16 * s]);
  blob(g, skin, [0.28 * s, 0.82 * s, 0], [0.34 * s, 0.22 * s, 0.2 * s], [0, 0, 0.25]);   // bicep
  cyl(g, skin, [0.55 * s, 1.0 * s, 0], 0.15 * s, 0.11 * s, 0.4 * s, [0, 0, -0.5]);
  blob(g, skin, [0.7 * s, 1.25 * s, 0], [0.17 * s, 0.17 * s, 0.16 * s]);
  return g;
}
export function rocket(s = 1) {
  const g = new THREE.Group();
  cyl(g, mat('#f4f4f8', { roughness: 0.3 }), [0, 0.6 * s, 0], 0.22 * s, 0.22 * s, 1.1 * s);
  add(g, new THREE.ConeGeometry(0.22 * s, 0.5 * s, 28), mat('#e8422f'), [0, 1.4 * s, 0]);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; add(g, new THREE.ConeGeometry(0.15 * s, 0.4 * s, 3), mat('#e8422f'), [Math.sin(a) * 0.25 * s, 0.2 * s, Math.cos(a) * 0.25 * s], [0, a, 0], [0.4, 1, 1]); }
  add(g, new THREE.TorusGeometry(0.1 * s, 0.03 * s, 8, 20), mat('#9ad8f0'), [0, 0.95 * s, 0.215 * s], [0, 0, 0]);
  blob(g, mat('#9ad8f0', { roughness: 0.2 }), [0, 0.95 * s, 0.2 * s], [0.095 * s, 0.095 * s, 0.03 * s]);
  sign(g, 'a16z', [0, 0.5 * s, 0.226 * s], 0.36 * s, 0.14 * s, '#f4f4f8', '#1a1a2a');
  add(g, new THREE.ConeGeometry(0.15 * s, 0.6 * s, 20), mat('#ffb12b', { emissive: '#ff8a00', emissiveIntensity: 1.2 }), [0, -0.3 * s, 0], [Math.PI, 0, 0]);
  add(g, new THREE.ConeGeometry(0.09 * s, 0.4 * s, 20), mat('#fff3a0', { emissive: '#ffe070', emissiveIntensity: 1.5 }), [0, -0.2 * s, 0], [Math.PI, 0, 0]);
  return g;
}
export function waterTower(s = 1) {
  const g = new THREE.Group(), st = mat('#7f8a93', { metalness: 0.4 }), tank = mat('#e8eef2', { metalness: 0.3, roughness: 0.4 });
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add(g, new THREE.CylinderGeometry(0.035 * s, 0.045 * s, 1.5 * s, 10), st, [x * 0.38 * s, 0.75 * s, z * 0.38 * s], [-z * 0.06, 0, x * 0.06]);
  for (const y of [0.4, 0.9]) box(g, st, [0, y * s, 0.37 * s], [0.78 * s, 0.03 * s, 0.03 * s]);
  cyl(g, tank, [0, 1.8 * s, 0], 0.6 * s, 0.6 * s, 0.6 * s);
  add(g, new THREE.ConeGeometry(0.62 * s, 0.35 * s, 28), mat('#c8483c'), [0, 2.27 * s, 0]);
  sign(g, 'WATERTOWN', [0, 1.8 * s, 0.605 * s], 0.9 * s, 0.26 * s, '#2a78c8', '#ffffff');
  cyl(g, st, [0.0, 1.35 * s, 0.35 * s], 0.05 * s, 0.05 * s, 0.4 * s);
  return g;
}
export function monkey(s = 1, fur = '#8a5a34') {
  const g = new THREE.Group(), f = mat(fur), face = mat('#f1cfa0');
  blob(g, f, [0, 0.3 * s, 0], [0.18 * s, 0.22 * s, 0.16 * s]);
  blob(g, f, [0, 0.62 * s, 0.02 * s], [0.17 * s, 0.16 * s, 0.15 * s]);
  blob(g, face, [0, 0.6 * s, 0.1 * s], [0.12 * s, 0.1 * s, 0.07 * s]);
  for (const x of [-1, 1]) {
    blob(g, f, [x * 0.19 * s, 0.64 * s, 0], [0.06 * s, 0.06 * s, 0.03 * s]);
    blob(g, mat('#fff'), [x * 0.05 * s, 0.65 * s, 0.16 * s], [0.032 * s, 0.04 * s, 0.015 * s]);
    blob(g, mat('#111'), [x * 0.05 * s, 0.65 * s, 0.175 * s], [0.018 * s, 0.026 * s, 0.012 * s]);
    blob(g, f, [x * 0.2 * s, 0.3 * s, 0.05 * s], [0.05 * s, 0.17 * s, 0.05 * s], [0, 0, x * 0.2]);
    blob(g, f, [x * 0.09 * s, 0.07 * s, 0.05 * s], [0.07 * s, 0.07 * s, 0.1 * s]);
  }
  add(g, new THREE.TorusGeometry(0.16 * s, 0.025 * s, 8, 20, 4), f, [0, 0.2 * s, -0.16 * s], [0, 0, 0]);
  return g;
}
export function puppy(s = 1) {
  const g = new THREE.Group(), f = mat('#d9a36a'), w = mat('#fff4e0');
  blob(g, f, [0, 0.2 * s, 0], [0.16 * s, 0.15 * s, 0.22 * s]);
  blob(g, f, [0, 0.4 * s, 0.17 * s], [0.14 * s, 0.13 * s, 0.13 * s]);
  blob(g, w, [0, 0.36 * s, 0.29 * s], [0.07 * s, 0.05 * s, 0.07 * s]);
  blob(g, mat('#222'), [0, 0.39 * s, 0.35 * s], [0.025 * s, 0.02 * s, 0.02 * s]);
  blob(g, mat('#a02a3a'), [0, 0.32 * s, 0.31 * s], [0.045 * s, 0.025 * s, 0.05 * s]);
  for (const x of [-1, 1]) {
    blob(g, mat('#fff'), [x * 0.06 * s, 0.45 * s, 0.28 * s], [0.035 * s, 0.045 * s, 0.015 * s]);
    blob(g, mat('#111'), [x * 0.06 * s, 0.45 * s, 0.295 * s], [0.02 * s, 0.03 * s, 0.012 * s]);
    blob(g, mat('#a06c3a'), [x * 0.15 * s, 0.4 * s, 0.14 * s], [0.05 * s, 0.1 * s, 0.04 * s], [0, 0, x * 0.4]);
    blob(g, f, [x * 0.08 * s, 0.05 * s, 0.14 * s], [0.045 * s, 0.05 * s, 0.05 * s]);
  }
  add(g, new THREE.ConeGeometry(0.04 * s, 0.2 * s, 8), f, [0, 0.3 * s, -0.25 * s], [-0.9, 0, 0]);
  return g;
}
export function person(color = '#4a7ac8', hat = '#222', s = 1) {
  const g = new THREE.Group();
  blob(g, mat(color), [0, 0.2 * s, 0], [0.12 * s, 0.17 * s, 0.1 * s]);
  blob(g, mat('#ffd9b8'), [0, 0.42 * s, 0], [0.09 * s, 0.09 * s, 0.09 * s]);
  blob(g, mat(hat), [0, 0.48 * s, -0.01 * s], [0.095 * s, 0.05 * s, 0.095 * s]);
  return g;
}
