// Verve anchor: a chibi BALLERINA, ~1 unit tall, faces +z, feet at y=0.
// createBallerina({ scale=1, tutu='#ff8fb8', bodice='#ffffff' }) -> Group
// userData.pose({ lean, headTilt, spin, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} }) radians; l = +x side
// userData.reach('l'|'r',[x,y,z]) two-bone IK in ballerina-local space.
// userData.parts = { torso, head, arms, legs, hands }
import * as THREE from 'three';

const HIP_Y = 0.36, SHOULDER = [0.085, 0.62, 0], ARM = 0.115;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, c, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(c, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const ell = (parent, c, pos, scl) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(c)); m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const limb = (len, r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 12), mat(c)); m.geometry.translate(0, -len / 2, 0); return m; };

function buildHead(skin, hair) {
  const h = new THREE.Group(), R = 0.13;
  ell(h, skin, [0, 0, 0], [R, R * 0.97, R]);
  // hair cap + bun
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair));
  cap.rotation.x = -0.35; cap.position.set(0, 0.012, -0.012); h.add(cap);
  ell(h, hair, [0, R * 1.0, -0.05], [0.07, 0.07, 0.07]);
  const bunRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 24), mat('#ff8fb8')); bunRing.position.set(0, R * 1.0, -0.05); bunRing.rotation.x = Math.PI / 2; h.add(bunRing);
  // fringe
  for (const x of [-0.06, 0, 0.06]) ell(h, hair, [x, 0.085, 0.09], [0.05, 0.035, 0.03]);
  // face
  const z = R * 0.93;
  for (const s of [-1, 1]) {
    const x = s * 0.05, y = -0.005, zz = z - 0.012 * Math.abs(x) * 10;
    const g = new THREE.Group(); g.position.set(x, y, 0.123); g.rotation.y = s * 0.3; h.add(g);
    disc(0.036, 0.046, '#ffffff', 0.0, g);
    disc(0.03, 0.042, '#2b4a9a', 0.002, g, 0, -0.002);
    disc(0.017, 0.026, '#0b1030', 0.004, g, 0, 0);
    disc(0.011, 0.011, '#ffffff', 0.006, g, -0.01, 0.015);
    disc(0.005, 0.005, '#ffffff', 0.006, g, 0.01, -0.018);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#1a0f0a')); lid.scale.set(0.039, 0.049, 1); lid.position.z = 0.008; g.add(lid);
    const b = disc(0.02, 0.011, '#ff7f8f', 0.0, h, s * 0.085, -0.05); b.position.z = 0.118; b.rotation.y = s * 0.6; b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 8, 20, Math.PI), mat('#a03040')); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.062, 0.117); h.add(mouth);
  return h;
}

export function createBallerina({ scale = 1, tutu = '#ff8fb8', bodice = '#ffffff' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), skin = '#ffe0c8', hair = '#6b3a24';
  torso.position.y = HIP_Y; root.add(torso);
  const up = new THREE.Group(); up.position.y = -HIP_Y; torso.add(up);
  // bodice
  const bod = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.062, 0.26, 20), mat(bodice)); bod.position.y = 0.5; bod.scale.z = 0.8; up.add(bod);
  ell(up, bodice, [0, 0.63, 0], [0.078, 0.04, 0.062]);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 10), mat(skin)); neck.position.y = 0.67; up.add(neck);
  // tutu: flared layered discs
  const tut = new THREE.Group(); tut.position.y = 0.4;
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.1 + i * 0.03, 0.2 + i * 0.07, 0.035, 36, 1), mat(i % 2 ? '#ffb3d1' : tutu, { roughness: 0.8 }));
    cone.position.y = -i * 0.016; tut.add(cone);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 24), mat('#ff5c9a')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.025; tut.add(rim);
  up.add(tut);
  const head = buildHead(skin, hair); head.position.y = 0.8; up.add(head);

  const arms = {}, hands = {}, els = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.012, skin)); ell(sh, bodice, [0, 0, 0], [0.022, 0.022, 0.022]);
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.011, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), mat(skin)); hand.position.y = -ARM; hand.scale.set(0.9, 1.15, 0.7); el.add(hand);
    sh.add(el); up.add(sh); sh.rotation.z = s * 0.3; arms[k] = sh; els[k] = el; hands[k] = hand;

    const hip = new THREE.Group(); hip.position.set(s * 0.04, HIP_Y, 0);
    hip.add(limb(0.30, 0.024, '#ffd9e8'));
    const shoe = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.1, 12), mat('#ff9ec4')); shoe.position.set(0, -0.32, 0.01); shoe.rotation.x = 0.0; hip.add(shoe);
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 14), mat('#ff5c9a')); ribbon.position.y = -0.27; ribbon.rotation.x = Math.PI / 2; hip.add(ribbon);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, arms, legs, hands };
  root.userData.pose = ({ lean = 0, headTilt = 0, spin = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.set(lean, spin, 0); head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].quaternion.setFromEuler(new THREE.Euler(v[0] ?? 0, 0, v[1] ?? 0)); els[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = els[key];
    torso.updateMatrix(); up.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(up.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.2, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
