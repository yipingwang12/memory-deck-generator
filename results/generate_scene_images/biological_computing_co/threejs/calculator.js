// The Biological Computing Co anchor: a living pocket CALCULATOR with an LCD face, arms and legs.
// Faces +z, feet on y = 0, ~1 unit tall. createCalculator({ scale = 1, bodyColor = '#3f8fe0', eyeColor = '#2fd0e8', blush = true }) -> Group.
// userData.parts = { body, torso, arms:{l,r}, legs:{l,r}, hands:{l,r}, screen }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
//   lean = pitch about the hips (+ = forward), headTilt = roll of the whole body (z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a calculator-local point.
import * as THREE from 'three';

const HIP_Y = 0.27, TOP = 1.0, W = 0.54, D = 0.12, SHOULDER = [0.29, 0.84, 0], ARM = 0.15;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
function roundedBox(w, h, d, r, color, extra = {}) {
  const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r, b = Math.min(r * 0.5, 0.012);
  s.moveTo(x, -h / 2); s.lineTo(x + ww, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y); s.lineTo(w / 2, y + hh);
  s.quadraticCurveTo(w / 2, h / 2, x + ww, h / 2); s.lineTo(x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y + hh);
  s.lineTo(-w / 2, y); s.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return new THREE.Mesh(g, mat(color, extra));
}

function face(group, eyeColor, blush) {
  const z = D / 2 + 0.002, st = 0.0015, ey = 0.875;
  const lcd = roundedBox(0.46, 0.25, 0.02, 0.03, '#12302e'); lcd.position.set(0, 0.86, D / 2 - 0.004); group.add(lcd);
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, zz = z + 0.014;
    disc(0.065, 0.082, '#ffffff', zz, group, x, ey);
    disc(0.05, 0.075, eyeColor, zz + st, group, x, ey - 0.004);
    disc(0.05, 0.03, '#1a8ca8', zz + 2 * st, group, x, ey - 0.04);
    disc(0.029, 0.047, '#08141c', zz + 3 * st, group, x, ey);
    disc(0.017, 0.017, '#ffffff', zz + 4 * st, group, x - 0.02, ey + 0.028);
    disc(0.008, 0.008, '#ffffff', zz + 4 * st, group, x + 0.018, ey - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#050a0a'));
    lid.scale.set(0.07, 0.088, 1); lid.position.set(x, ey, zz + 5 * st); group.add(lid);
    if (blush) { const b = disc(0.032, 0.016, '#ff7f8f', zz + st, group, sx * 0.175, 0.795, { transparent: true, opacity: 0.7 }); }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#ff9aa8'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.805, z + 0.016); group.add(mouth);
}

function buttons(group) {
  const cols = [-0.165, -0.055, 0.055, 0.165], rows = [0.685, 0.575, 0.465, 0.355];
  const cap = (x, y, w, h, c) => { const b = roundedBox(w, h, 0.05, 0.02, c, { roughness: 0.35 }); b.position.set(x, y, D / 2 + 0.002); group.add(b); };
  rows.forEach((y, ri) => cols.forEach((x, ci) => {
    if (ci === 3 && ri >= 2) return;
    cap(x, y, 0.09, 0.085, ci === 3 ? '#ff9f2e' : (ri === 0 ? '#e8465a' : (ci + ri) % 2 ? '#f5f1e6' : '#dfe9f2'));
  }));
  cap(0.165, 0.41, 0.09, 0.195, '#3ecf6a');
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function glove(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), mat(color));
  th.position.set(0.036, 0.008, 0.014); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createCalculator({ scale = 1, bodyColor = '#3f8fe0', eyeColor = '#2fd0e8', blush = true } = {}) {
  const root = new THREE.Group(), upper = new THREE.Group();
  upper.position.y = HIP_Y; root.add(upper);
  const inner = new THREE.Group(); inner.position.y = -HIP_Y; upper.add(inner);
  const body = roundedBox(W, TOP - 0.25, D, 0.06, bodyColor); body.position.y = (TOP + 0.25) / 2; inner.add(body);
  const solar = roundedBox(0.2, 0.025, 0.02, 0.008, '#2b2f45'); solar.position.set(0.12, 0.965, D / 2 + 0.002); inner.add(solar);
  face(inner, eyeColor, blush); buttons(inner);

  const arms = {}, hands = {}, elbows = {}, legs = {}, dark = '#2b3548', white = '#ffffff';
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.018, dark)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.018, dark));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mat(dark)));
    hands[k] = glove(white); el.add(hands[k]); sh.add(el); inner.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.14, HIP_Y, 0); hip.add(limb(0.2, 0.026, dark));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#ff8a2e')); shoe.scale.set(0.056, 0.042, 0.088);
    shoe.position.set(0, -0.225, 0.028); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso: upper, arms, legs, hands, screen: face };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    upper.rotation.x = lean; upper.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    upper.updateMatrix(); inner.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(upper.matrix.clone().multiply(inner.matrix).invert());
    const d = t.clone().sub(sh.position), Dd = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(Dd / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(Dd).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
