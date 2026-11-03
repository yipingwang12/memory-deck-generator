// The Scholar Rock anchor: a MORTARBOARD (graduation cap) character, reused in every scene.
// Faces +z, feet on y = 0, ~0.85 unit tall. createMortarboard({ scale = 1, color = '#2b3070', blush = true }) -> Group.
// userData.parts = { crown, board, tassel, head (whole cap), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a local point (unscaled units).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const HIP_Y = 0.27, SHOULDER = [0.21, 0.62, 0], ARM = 0.14, FACE_Z = 0.152;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function face(group, blush) {
  const z = FACE_Z + 0.002, step = 0.0015, ey = 0.56;
  for (const sx of [-1, 1]) {
    const x = sx * 0.07;
    disc(0.04, 0.05, '#ffffff', z, group, x, ey);
    disc(0.031, 0.043, '#3a2416', z + step, group, x, ey - 0.002);
    disc(0.027, 0.02, '#c9843a', z + 2 * step, group, x, ey - 0.02);
    disc(0.015, 0.024, '#120a08', z + 3 * step, group, x, ey);
    disc(0.01, 0.01, '#ffffff', z + 4 * step, group, x - 0.011, ey + 0.016);
    disc(0.0045, 0.0045, '#ffffff', z + 4 * step, group, x - 0.011, ey - 0.019);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#0d0d14'));
    lid.scale.set(0.043, 0.053, 1); lid.position.set(x, ey, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.022, 0.012, '#ff7f8f', z, group, sx * 0.115, 0.505); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#ffb0b0'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.505, z + step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8);
  const th = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), mat(color)); th.position.set(0.03, 0.005, 0.012);
  g.add(palm, th); g.position.y = -ARM; return g;
}

function tassel(boardYaw) {
  const g = new THREE.Group(), gold = mat('#f0b92a', { metalness: 0.3, roughness: 0.4 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), gold); cord.position.y = -0.11; g.add(cord);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), gold); knot.position.y = -0.225; g.add(knot);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.1, 6), gold);
    s.position.set(Math.cos(a) * 0.012, -0.29, Math.sin(a) * 0.012); g.add(s);
  }
  g.position.set(Math.cos(boardYaw) * 0.31, 0.78, -Math.sin(boardYaw) * 0.31);
  return g;
}

export function createMortarboard({ scale = 1, color = '#2b3070', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', yaw = 0.5;

  const head = new THREE.Group(); head.position.y = 0.5; const inner = new THREE.Group(); inner.position.y = -0.5; head.add(inner);
  const crown = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.5, 0.304, 4, 0.03), mat(color)); crown.position.y = 0.5;
  const band = new THREE.Mesh(new RoundedBoxGeometry(0.368, 0.05, 0.312, 3, 0.012), mat('#f0b92a', { metalness: 0.3 })); band.position.y = 0.27;
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.035, 0.66, 3, 0.012), mat('#171a40')); board.position.y = 0.795; board.rotation.y = yaw;
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), mat('#f0b92a', { metalness: 0.3 })); button.position.y = 0.82;
  const tas = tassel(yaw);
  inner.add(crown, band, board, button, tas); face(inner, blush);
  upper.add(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.013, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.013, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.09, HIP_Y, 0); hip.add(limb(0.21, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.04, 0.032, 0.06);
    shoe.position.set(0, -0.24, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { crown, board, tassel: tas, head, arms, legs, hands };

  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = tilt;
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
