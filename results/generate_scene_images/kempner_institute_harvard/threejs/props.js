// Reusable props for the Kempner scenes.
import { THREE, mat, add, blob, box, cyl, rng } from './world.js';

export function brain(s = 1) {
  const g = new THREE.Group(), r = rng(11), pink = mat('#f08fa8'), dark = mat('#c9607e');
  for (const sx of [-1, 1]) {
    blob(g, pink, [sx * 0.27, 0, 0], [0.5, 0.4, 0.55]);
    for (let i = 0; i < 46; i++) {
      const u = r() * 2 - 1, t = r() * Math.PI * 2, q = Math.sqrt(1 - u * u);
      blob(g, i % 3 ? pink : mat('#f6a3b8'), [sx * 0.27 + 0.5 * q * Math.cos(t) * 0.93, 0.4 * u * 0.93, 0.55 * q * Math.sin(t) * 0.93], [0.1, 0.1, 0.1]);
    }
  }
  box(g, 0.03, 0.62, 0.9, '#c9607e', [0, 0.02, 0], [0, 0, 0], 0.01);
  blob(g, dark, [0, -0.32, -0.42], [0.3, 0.16, 0.2]);
  cyl(g, 0.07, 0.09, 0.3, '#e8a5a0', [0, -0.45, -0.1], [0.3, 0, 0]);
  g.scale.setScalar(s); return g;
}

export function robotHead(s = 1) {
  const g = new THREE.Group(), glow = { emissive: '#3de0ff', emissiveIntensity: 1.2 };
  box(g, 1.0, 0.85, 0.8, '#c7d0da', [0, 0, 0], [0, 0, 0], 0.12, { metalness: 0.4, roughness: 0.4 });
  box(g, 0.84, 0.4, 0.04, '#1c2a3a', [0, 0.1, 0.4], [0, 0, 0], 0.03);
  for (const x of [-1, 1]) {
    box(g, 0.24, 0.24, 0.04, '#3de0ff', [x * 0.2, 0.1, 0.43], [0, 0, 0], 0.05, glow);
    box(g, 0.06, 0.06, 0.05, '#ffffff', [x * 0.2 - 0.05, 0.16, 0.46], [0, 0, 0], 0.02, { emissive: '#ffffff' });
    cyl(g, 0.11, 0.11, 0.14, '#8a96a4', [x * 0.56, 0, 0], [0, 0, Math.PI / 2]);
  }
  for (let i = 0; i < 4; i++) box(g, 0.34, 0.03, 0.03, '#38485a', [0, -0.22 - i * 0.055, 0.405], [0, 0, 0], 0.01);
  cyl(g, 0.03, 0.03, 0.3, '#8a96a4', [0, 0.57, 0]); blob(g, mat('#ff5a6a', { emissive: '#ff2a40', emissiveIntensity: 0.8 }), [0, 0.76, 0], [0.09, 0.09, 0.09]);
  g.scale.setScalar(s); return g;
}

/** Heap of gold coins within radius R and height H. */
export function coinPile(R = 1, H = 1, n = 160) {
  const g = new THREE.Group(), r = rng(3), gold = mat('#f5c230', { metalness: 0.7, roughness: 0.3, emissive: '#7a5200', emissiveIntensity: 0.3 });
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R, y = H * (1 - d / R) ** 1.2;
    add(g, new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), gold, [Math.cos(a) * d, y + 0.08, Math.sin(a) * d], [r() * 1.2 - 0.6, r() * 3, r() * 1.2 - 0.6]);
  }
  return g;
}

/** Heap of sugar cubes with a few glints. */
export function sugarCubes(R = 1, H = 1, n = 120, seed = 5) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R, y = H * (1 - d / R) ** 1.2, k = 0.16 + r() * 0.08;
    box(g, k, k, k, i % 4 ? '#ffffff' : '#e6f0ff', [Math.cos(a) * d, y + k / 2, Math.sin(a) * d], [r() * 0.8, r() * 3, r() * 0.8], 0.02);
  }
  return g;
}

export function gear(R = 0.5, color = '#ff9a3c', teeth = 10) {
  const g = new THREE.Group(), m = mat(color, { metalness: 0.3 });
  add(g, new THREE.CylinderGeometry(R, R, 0.14, 32), m, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2; add(g, new THREE.BoxGeometry(R * 0.34, R * 0.3, 0.14), m, [Math.cos(a) * R * 1.08, Math.sin(a) * R * 1.08, 0], [0, 0, a]); }
  add(g, new THREE.CylinderGeometry(R * 0.38, R * 0.38, 0.16, 24), mat('#ffe9c8'), [0, 0, 0.01], [Math.PI / 2, 0, 0]);
  return g;
}

export function tree(s = 1, color = '#3f9a4a') {
  const g = new THREE.Group();
  cyl(g, 0.08, 0.12, 0.8, '#7a5030', [0, 0.4, 0]); blob(g, mat(color), [0, 1.1, 0], [0.5, 0.55, 0.5]); blob(g, mat(color), [0.2, 0.85, 0.1], [0.35, 0.3, 0.35]);
  g.scale.setScalar(s); return g;
}
