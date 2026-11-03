// Reusable props for the GeneDx scenes. All y-up, built at roughly real-world scale (meters).
import { THREE, mat, add, blob, textTexture } from './common.js';

export function person({ shirt = '#e8504a', pants = '#2f3a5c', skin = '#f1c9a5', hair = '#3a2a22', scale = 1, up = [0, 0] } = {}) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.1, 0.12, 0.34, 16), mat(shirt), [0, 0.45, 0]);
  for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.045, 0.04, 0.3, 10), mat(pants), [s * 0.05, 0.15, 0]);
  blob(g, mat(skin), [0, 0.7, 0], [0.095, 0.1, 0.095]);
  blob(g, mat(hair), [0, 0.73, -0.015], [0.1, 0.09, 0.1]);
  for (const s of [-1, 1]) blob(g, mat('#1a1210'), [s * 0.035, 0.7, 0.085], [0.014, 0.018, 0.01]);
  add(g, new THREE.TorusGeometry(0.022, 0.006, 6, 12, Math.PI), mat('#8a3a3a'), [0, 0.665, 0.088], [0, 0, Math.PI]);
  g.userData.arms = {};
  [['l', 1, up[0]], ['r', -1, up[1]]].forEach(([k, s, u]) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.13, 0.58, 0);
    const a = add(sh, new THREE.CylinderGeometry(0.03, 0.028, 0.3, 10), mat(shirt), [0, -0.15, 0]);
    blob(sh, mat(skin), [0, -0.31, 0], [0.036, 0.036, 0.036]);
    sh.rotation.z = s * (0.15 + u * 2.7); g.add(sh); g.userData.arms[k] = sh;
  });
  g.scale.setScalar(scale); return g;
}

export function crown() {
  const g = new THREE.Group(), gold = mat('#f2c230', { metalness: 0.6, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.07, 28, 1, true), gold, [0, 0.035, 0]).material.side = THREE.DoubleSide;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    add(g, new THREE.ConeGeometry(0.03, 0.1, 8), gold, [Math.sin(a) * 0.15, 0.115, Math.cos(a) * 0.15]);
    blob(g, mat(['#e23a4a', '#3a8ae2', '#4ac26a'][i % 3]), [Math.sin(a) * 0.15, 0.175, Math.cos(a) * 0.15], [0.015, 0.015, 0.015]);
  }
  blob(g, mat('#e23a4a', { roughness: 0.2 }), [0, 0.035, 0.151], [0.03, 0.03, 0.01]);
  g.scale.set(1, 1, 0.68); return g;
}

export function ribbon(color = '#b57ee8') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.4 });
  add(g, new THREE.TorusGeometry(0.2, 0.065, 12, 28), m, [0, 0.28, 0], [0, 0, 0], [1, 1.2, 0.6]);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.13, 0.55, 0.04), m, [s * 0.1, -0.12, 0], [0, 0, s * 0.42]);
  return g;
}

export function heart(color = '#e0344a') {
  const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.7, 0.05, -0.45, 0.6, 0, 0.25); s.bezierCurveTo(0.45, 0.6, 0.7, 0.05, 0, -0.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }); g.center();
  return new THREE.Mesh(g, mat(color, { roughness: 0.3 }));
}

export function venus(color = '#ff6fa8') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.4 });
  add(g, new THREE.TorusGeometry(0.2, 0.05, 10, 28), m, [0, 0.25, 0]);
  add(g, new THREE.BoxGeometry(0.09, 0.45, 0.07), m, [0, -0.17, 0]);
  add(g, new THREE.BoxGeometry(0.3, 0.09, 0.07), m, [0, -0.22, 0]);
  return g;
}

export function flask(liquid = '#55d46a', s = 1) {
  const g = new THREE.Group(), glass = mat('#dff4ff', { transparent: true, opacity: 0.5, roughness: 0.1 });
  add(g, new THREE.CylinderGeometry(0.04, 0.12, 0.2, 20), glass, [0, 0.1, 0]);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.12, 20), glass, [0, 0.25, 0]);
  add(g, new THREE.CylinderGeometry(0.042, 0.108, 0.1, 20), mat(liquid, { roughness: 0.3 }), [0, 0.06, 0]);
  g.scale.setScalar(s); return g;
}

export function magnifier(r = 0.14) {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(r, 0.018, 10, 32), mat('#2b2f3a', { metalness: 0.5 }), [0, r, 0]);
  add(g, new THREE.CylinderGeometry(0.02, 0.025, 0.2, 10), mat('#7a4a2a'), [0, -0.1, 0]);
  return g;
}

export function dna(h = 1, R = 0.1, turns = 3, n = 36, c1 = '#ff5a7a', c2 = '#4a9aff') {
  const g = new THREE.Group(), rung = mat('#ffe27a');
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = t * turns * Math.PI * 2, y = t * h, p = [Math.cos(a) * R, y, Math.sin(a) * R], q = [-p[0], y, -p[2]];
    blob(g, mat(c1), p, [R * 0.28, R * 0.28, R * 0.28]); blob(g, mat(c2), q, [R * 0.28, R * 0.28, R * 0.28]);
    if (i % 2 === 0) add(g, new THREE.CylinderGeometry(R * 0.08, R * 0.08, 2 * R, 6), rung, [0, y, 0], [0, 0, Math.PI / 2], [1, 1, 1]).rotation.y = -a;
  }
  return g;
}

export function boulder(r = 0.5) {
  const geo = new THREE.IcosahedronGeometry(r, 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), k = 1 + 0.12 * Math.sin(v.x * 9 + v.y * 5) * Math.cos(v.z * 7); v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.8, v.z); }
  geo.computeVertexNormals(); return new THREE.Mesh(geo, mat('#8f8a82', { flatShading: true }));
}

export function miniCar(color = '#d8403a') {
  const g = new THREE.Group(), body = mat(color, { roughness: 0.35 });
  add(g, new THREE.BoxGeometry(0.7, 0.2, 0.36), body, [0, 0.2, 0]);
  add(g, new THREE.BoxGeometry(0.4, 0.17, 0.32), body, [-0.03, 0.38, 0]);
  add(g, new THREE.BoxGeometry(0.34, 0.12, 0.34), mat('#bfe6ff', { roughness: 0.1 }), [-0.03, 0.39, 0]);
  for (const [x, z] of [[0.22, 0.19], [0.22, -0.19], [-0.22, 0.19], [-0.22, -0.19]]) {
    add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.05, 18), mat('#222'), [x, 0.075, z], [Math.PI / 2, 0, 0]);
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.055, 12), mat('#ddd'), [x, 0.075, z], [Math.PI / 2, 0, 0]);
  }
  for (const z of [-0.12, 0.12]) blob(g, mat('#fff6c0', { emissive: '#ffe680' }), [0.355, 0.22, z], [0.02, 0.04, 0.04]);
  return g;
}

export function saint() {
  const g = person({ shirt: '#f0e6d2', pants: '#f0e6d2', up: [0.25, 0] });
  add(g, new THREE.ConeGeometry(0.2, 0.55, 20), mat('#f0e6d2'), [0, 0.28, 0]);
  add(g, new THREE.TorusGeometry(0.1, 0.014, 8, 28), mat('#ffd84a', { emissive: '#ffcc33', emissiveIntensity: 0.6 }), [0, 0.9, 0], [Math.PI / 2.4, 0, 0]);
  blob(g, mat('#cfc8bd'), [0, 0.64, 0.07], [0.07, 0.07, 0.04]);
  return g;
}

export function cone() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.34, 0.04, 0.34), mat('#ff7a1a'), [0, 0.02, 0]);
  add(g, new THREE.ConeGeometry(0.13, 0.6, 20), mat('#ff7a1a'), [0, 0.34, 0]);
  add(g, new THREE.CylinderGeometry(0.075, 0.1, 0.1, 20), mat('#fff'), [0, 0.36, 0]);
  return g;
}

export function tree(h = 1.6, leaf = '#4aa84a') {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.07 * h / 1.6, 0.1 * h / 1.6, h * 0.5, 10), mat('#7a4e2a'), [0, h * 0.25, 0]);
  for (const [x, y, z, r] of [[0, 0.7, 0, 0.42], [0.22, 0.58, 0.1, 0.3], [-0.22, 0.62, -0.08, 0.32], [0.05, 0.9, 0.05, 0.28]]) blob(g, mat(leaf), [x * h, y * h, z * h], [r * h, r * h, r * h]);
  return g;
}

export function sign(text, w, h, bg, fg) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ map: textTexture(text, 512, Math.round(512 * h / w), bg, fg), roughness: 0.6 });
  add(g, new THREE.BoxGeometry(w, h, 0.05), m); return g;
}
