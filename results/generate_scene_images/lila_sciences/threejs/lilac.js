// The Lila anchor: one bold LILAC bloom character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createLilac({ scale = 1, petal = '#b583e0' }) -> Group.
// userData.parts = { head, torso, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a lilac-local point.
import * as THREE from 'three';

const ARM = 0.15, SHOULDER = [0.2, 0.3, 0.02], HIP_Y = 0.15, HEAD_C = [0, 0.64, 0], HR = [0.4, 0.37, 0.34];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** One 4-petal floret lying on the head surface at unit direction n. */
function floret(n, color, center, size) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat(color));
    p.scale.set(size * 0.55, size * 0.55, size * 0.2);
    p.position.set(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5, 0); p.rotation.z = a; g.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(size * 0.2, 12, 8), mat(center)); c.position.z = size * 0.12; g.add(c);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  return g;
}

function bloom() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#8e5cc4'));
  core.scale.set(...HR).multiplyScalar(0.93); g.add(core);
  const shades = ['#b583e0', '#c49af0', '#a46fd6', '#d3b0f5'], N = 150, golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), th = i * golden;
    const n = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    if (n.z > 0.35 && Math.abs(n.x) < 0.78 && n.y < 0.6 && n.y > -0.75) continue; // face window
    const f = floret(n.clone(), shades[i % 4], '#ffe27a', 0.2);
    f.position.set(n.x * HR[0], n.y * HR[1], n.z * HR[2]); g.add(f);
  }
  // face patch
  const face = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#ffe6e8', { roughness: 0.5 }));
  face.scale.set(0.3, 0.255, 0.2); face.position.set(0, -0.03, 0.2); g.add(face);
  return g;
}

function face(parent, blush) {
  const z = 0.4, step = 0.002;
  for (const sx of [-1, 1]) {
    const x = sx * 0.115, y = 0.0;
    disc(0.082, 0.1, '#ffffff', z, parent, x, y);
    disc(0.066, 0.094, '#3a1d5c', z + step, parent, x, y - 0.004);
    disc(0.058, 0.05, '#7a4fc0', z + 2 * step, parent, x, y - 0.04);
    disc(0.036, 0.055, '#150a22', z + 3 * step, parent, x, y);
    disc(0.024, 0.024, '#ffffff', z + 4 * step, parent, x - 0.024, y + 0.038);
    disc(0.01, 0.01, '#ffffff', z + 4 * step, parent, x + 0.02, y - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f2a'));
    lid.scale.set(0.088, 0.108, 1); lid.position.set(x, y, z + 5 * step); parent.add(lid);
    if (blush) { const b = disc(0.045, 0.027, '#ff7f9f', z, parent, sx * 0.19, -0.12); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 8, 20, Math.PI), mat('#8a2a4a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.15, z + step); parent.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function leafHand(color) {
  const g = new THREE.Group(), l = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat(color));
  l.scale.set(0.05, 0.06, 0.02); const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(color));
  th.position.set(0.04, 0.0, 0.01); g.add(l, th); g.position.y = -ARM; return g;
}

export function createLilac({ scale = 1, petal = '#b583e0', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const green = '#5fae4a', head = new THREE.Group();
  head.position.set(...HEAD_C); const inner = new THREE.Group(); head.add(inner);
  inner.add(bloom());
  const fc = new THREE.Group(); fc.position.set(0, -0.03, 0); inner.add(fc); face(fc, blush);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 20), mat(green)); stem.position.y = 0.2;
  upper.add(stem, head);
  for (const s of [-1, 1]) { // collar leaves
    const lf = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat('#4d9a3c'));
    lf.scale.set(0.15, 0.04, 0.08); lf.position.set(s * 0.13, 0.3, 0.02); lf.rotation.z = s * 0.4; upper.add(lf);
  }
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.02, green)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, green));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(green)));
    hands[k] = leafHand('#7cc860'); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.07, HIP_Y, 0); hip.add(limb(0.13, 0.026, green));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e0527a')); shoe.scale.set(0.052, 0.04, 0.085);
    shoe.position.set(0, -0.145, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, torso, arms, legs, hands };
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
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
