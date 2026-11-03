// The Exact Sciences anchor: a living RULER, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.05 units tall. createRuler({ scale = 1, bodyColor = '#f2c14e', blush = true }) -> Group.
// userData.parts = { body, torso, upper, head (face only), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a ruler-local point.
import * as THREE from 'three';

const W = 0.26, D = 0.04, B = 0.007, Y0 = 0.26, Y1 = 1.04, HIP_Y = 0.27, ARM = 0.13, SHOULDER = [W / 2 + 0.012, 0.86, 0];
const FZ = D / 2 + B;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function slab(color) {
  const s = new THREE.Shape(), r = 0.03, w = W / 2 - B, h = (Y1 - Y0) / 2 - B;
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const g = new THREE.ExtrudeGeometry(s, { depth: D - 2 * B, bevelEnabled: true, bevelSize: B, bevelThickness: B, bevelSegments: 2 });
  g.translate(0, 0, -(D - 2 * B) / 2);
  const m = new THREE.Mesh(g, mat(color)); m.position.y = (Y0 + Y1) / 2; return m;
}

function ticks(group) {
  const ink = mat('#3a2412', { roughness: 0.8 }), n = 62;
  for (let i = 0; i <= n; i++) {
    const y = Y0 + 0.02 + i * (Y1 - Y0 - 0.04) / n, major = i % 10 === 0, mid = i % 5 === 0;
    const len = major ? 0.085 : mid ? 0.058 : 0.034;
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(len, major ? 0.005 : 0.003, 0.002), ink);
      t.position.set(s * (W / 2 - len / 2 - 0.004), y, FZ + 0.001); group.add(t);
    }
  }
}

function face(group, blush) {
  const z = FZ + 0.002, step = 0.0015, ey = 0.80;
  for (const sx of [-1, 1]) {
    const x = sx * 0.04;
    disc(0.03, 0.038, '#ffffff', z, group, x, ey);
    disc(0.0235, 0.033, '#2a4a7a', z + step, group, x, ey - 0.002);
    disc(0.02, 0.015, '#4f86c6', z + 2 * step, group, x, ey - 0.014);
    disc(0.0115, 0.019, '#0a0e18', z + 3 * step, group, x, ey);
    disc(0.0078, 0.0078, '#ffffff', z + 4 * step, group, x - 0.008, ey + 0.012);
    disc(0.0036, 0.0036, '#ffffff', z + 4 * step, group, x - 0.008, ey - 0.014);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.032, 0.04, 1); lid.position.set(x, ey, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.017, 0.009, '#ff7f8f', z, group, sx * 0.07, ey - 0.04); b.material.transparent = true; b.material.opacity = 0.55; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, ey - 0.042, z + step); group.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mat(color));
  th.position.set(0.025, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createRuler({ scale = 1, bodyColor = '#f2c14e', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = slab(bodyColor), head = new THREE.Group();
  head.position.y = 0.8; const inner = new THREE.Group(); inner.position.y = -0.8; head.add(inner);
  ticks(upper); face(inner, blush);
  upper.add(body, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.011, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.011, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.06, HIP_Y, 0); hip.add(limb(0.21, 0.017, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.034, 0.03, 0.055);
    shoe.position.set(0, -0.24, 0.018); hip.add(shoe); root.add(hip); legs[k] = hip;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, upper, head, arms, legs, hands };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D2 = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D2 / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D2).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
