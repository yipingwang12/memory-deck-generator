// The Foghorn anchor: a little red-and-white horn-keeper with a big brass bell, reused in every scene.
// Faces +z, feet on y = 0, ~1.1 units tall. createFoghorn({ scale = 1 }) -> Group.
// userData.parts = { body, horn, arms:{l,r}, legs:{l,r}, hands }   (l = +x side)
// userData.pose({ lean, aim:[pitch, yaw], arms:{l:[x,z], r:[x,z]}, legs:{l:[x,z], r:[x,z]} })  radians
//   aim = horn tilt: pitch (+ = up from level), yaw (+ = turn toward +x).
// userData.bell() -> world position of the bell mouth centre; userData.bellDir() -> world unit vector out of the bell.
import * as THREE from 'three';

const R = 0.17, BODY_Y0 = 0.22, BODY_H = 0.6, TOP = BODY_Y0 + BODY_H;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, parent, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function bodyMesh() {
  const g = new THREE.Group();
  const lathe = (pts, color, extra) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40), mat(color, extra));
  g.add(lathe([[0, BODY_Y0], [R * 0.9, BODY_Y0], [R, BODY_Y0 + 0.04], [R, BODY_Y0 + 0.16], [R * 0.97, BODY_Y0 + 0.2], [0, BODY_Y0 + 0.2]], '#d8342c'));
  g.add(lathe([[R * 0.97, BODY_Y0 + 0.2], [R * 1.005, BODY_Y0 + 0.2], [R * 1.005, BODY_Y0 + 0.4], [R * 0.97, BODY_Y0 + 0.4]], '#fbf6ea'));
  g.add(lathe([[R * 0.97, BODY_Y0 + 0.4], [R, BODY_Y0 + 0.4], [R, TOP - 0.05], [R * 0.9, TOP - 0.01], [R * 0.6, TOP + 0.02], [0, TOP + 0.03]], '#d8342c'));
  const collar = new THREE.Mesh(new THREE.TorusGeometry(R * 0.5, 0.02, 10, 28), mat('#e8b23c', { metalness: 0.6, roughness: 0.3 }));
  collar.rotation.x = Math.PI / 2; collar.position.y = TOP + 0.03; g.add(collar);
  return g;
}

function hornMesh() {
  const g = new THREE.Group(); g.position.set(0, TOP + 0.02, -0.02);
  const brass = mat('#f0b93c', { metalness: 0.65, roughness: 0.28, side: THREE.DoubleSide });
  const pts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(0.045 + 0.2 * Math.pow(t, 2.4), 0.05 + t * 0.62)); }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 36), brass));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.015, 10, 40), mat('#c8902a', { metalness: 0.6, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.67; g.add(rim);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.24, 36), mat('#6b3a12', { side: THREE.DoubleSide }));
  inner.rotation.x = -Math.PI / 2; inner.position.y = 0.5; g.add(inner);
  const pivot = new THREE.Group(); pivot.position.copy(g.position); g.position.set(0, 0, 0);
  pivot.add(g); return pivot;
}

function face(group) {
  const y = 0.52, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.062, e = new THREE.Group();
    const zs = Math.sqrt(R * R - x * x) + 0.003;
    e.position.set(x, y, zs); e.rotation.y = Math.asin(x / R); group.add(e);
    disc(0.042, 0.054, '#ffffff', e, 0, 0, 0);
    disc(0.033, 0.047, '#3a2416', e, 0, -0.003, step);
    disc(0.029, 0.022, '#b4753a', e, 0, -0.02, 2 * step);
    disc(0.016, 0.027, '#120a08', e, 0, 0, 3 * step);
    disc(0.011, 0.011, '#ffffff', e, -0.012, 0.017, 4 * step);
    disc(0.005, 0.005, '#ffffff', e, -0.012, -0.02, 4 * step);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.045, 0.057, 1); lid.position.z = 5 * step; e.add(lid);
    const b = disc(0.024, 0.013, '#ff7f8f', group, sx * 0.1, 0.45, Math.sqrt(R * R - 0.01) + 0.002);
    b.rotation.y = Math.asin(sx * 0.1 / R); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.425, R + 0.002); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

export function createFoghorn({ scale = 1 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = BODY_Y0; upper.position.y = -BODY_Y0; torso.add(upper); root.add(torso);
  const body = bodyMesh(), horn = hornMesh();
  face(body);
  upper.add(body, horn);
  horn.rotation.set(1.05, 0, 0, 'YXZ');

  const skin = '#ffe0c0', arms = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (R + 0.01), 0.68, 0);
    sh.add(limb(0.25, 0.017, '#fbf6ea'));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat(skin)); hand.position.y = -0.25; sh.add(hand);
    sh.rotation.z = s * 0.4; upper.add(sh); arms[k] = sh; hands[k] = hand;
    const hip = new THREE.Group(); hip.position.set(s * 0.085, BODY_Y0 + 0.02, 0); hip.add(limb(0.2, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#2f3b6b')); shoe.scale.set(0.045, 0.035, 0.07);
    shoe.position.set(0, -0.2, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, horn, arms, legs, hands };

  root.userData.pose = ({ lean = 0, aim, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean;
    if (aim) horn.rotation.set(Math.PI / 2 - aim[0], aim[1], 0, 'YXZ');
    for (const [k, v] of Object.entries(A)) arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  root.userData.bell = () => { root.updateMatrixWorld(true); return horn.localToWorld(new THREE.Vector3(0, 0.72, -0.02 * 0)); };
  root.userData.bellDir = () => {
    root.updateMatrixWorld(true);
    return new THREE.Vector3(0, 1, 0).transformDirection(horn.matrixWorld);
  };
  return root;
}
