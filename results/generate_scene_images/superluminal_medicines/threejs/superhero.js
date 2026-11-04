// Superluminal anchor: a generic chibi SUPERHERO (blue suit, red cape, gold star emblem, red headband).
// Faces +z, feet on y = 0, ~1.05 units tall. createSuperhero({ scale = 1, cape = 0.25 }) -> Group.
// userData.parts = { torso, head, cape, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a hero-local point.
// userData.lie(yaw)  flying pose: horizontal, face down, cape trailing (set position after).
import * as THREE from 'three';

const HIP_Y = 0.3, SH = [0.2, 0.6, 0], ARM = 0.15, HR = 0.21, HEAD_Y = 0.84;
const mat = (color, e = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...e });
const SUIT = '#2a6fd6', RED = '#e0262d', GOLD = '#f5b81c', SKIN = '#ffd9b8', HAIR = '#1d2347';
const mesh = (geo, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); return o;
};
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 }), [x, y, z], [rx, ry, 1]);
  parent.add(m); return m;
};
function star(R, r, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; s[i ? 'lineTo' : 'moveTo'](q * Math.cos(a), q * Math.sin(a)); }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
}
function emblem(radius) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(radius, radius, 0.02, 32), mat(RED), [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(radius, 0.012, 8, 32), mat(GOLD, { metalness: 0.4 })));
  g.add(mesh(star(radius * 0.8, radius * 0.34, 0.012), mat(GOLD, { metalness: 0.4 }), [0, 0, 0.01]));
  return g;
}

function buildCape(amount) {
  const W0 = 0.2, W1 = 0.4, L = 0.7, NX = 8, NY = 10, pos = [], idx = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const v = j / NY, u = i / NX - 0.5, w = W0 + (W1 - W0) * v;
    const wave = Math.sin(u * Math.PI * 2) * 0.03 * v;
    pos.push(u * 2 * w, -v * L, -0.04 - v * (0.1 + amount * 0.25) + wave);
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(mesh(geo, mat(RED, { side: THREE.DoubleSide, roughness: 0.7 })));
  const em = emblem(0.085); em.position.set(0, -0.3, -0.04 - 0.43 * (0.1 + amount * 0.25) - 0.012); em.rotation.y = Math.PI; g.add(em);
  g.position.set(0, 0.64, -0.12); return g;
}

function face(head) {
  const R = HR;
  const onSphere = (x, y) => Math.sqrt(R * R - x * x - y * y);
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = -0.005, z = onSphere(x, y) + 0.002, st = 0.0015;
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = sx * 0.4; head.add(grp);
    disc(0.05, 0.062, '#ffffff', 0, grp);
    disc(0.04, 0.056, '#2d4fa8', st, grp, 0, -0.003);
    disc(0.034, 0.03, '#5f9cf0', 2 * st, grp, 0, -0.022);
    disc(0.02, 0.034, '#0c1030', 3 * st, grp, 0, -0.003);
    disc(0.014, 0.014, '#ffffff', 4 * st, grp, -0.015, 0.025);
    disc(0.006, 0.006, '#ffffff', 4 * st, grp, 0.015, -0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#1a1020'));
    lid.scale.set(0.054, 0.066, 1); lid.position.z = 5 * st; grp.add(lid);
    const brow = mesh(new THREE.BoxGeometry(0.07, 0.014, 0.01), mat(HAIR), [x * 1.05, y + 0.088, onSphere(x, y + 0.088) + 0.003], [1, 1, 1], [0, sx * 0.4, sx * -0.2]);
    head.add(brow);
    const b = disc(0.026, 0.014, '#ff7f8f', 0, head, sx * 0.125, -0.07); b.position.z = onSphere(sx * 0.125, -0.07) + 0.002;
    b.material.transparent = true; b.material.opacity = 0.55; b.rotation.y = sx * 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#8a2a30'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.088, onSphere(0, -0.088) + 0.002); head.add(mouth);
}

function buildHead() {
  const head = new THREE.Group(); head.position.y = HEAD_Y;
  head.add(mesh(new THREE.SphereGeometry(HR, 40, 28), mat(SKIN)));
  face(head);
  // hair: back cap + spiky fringe
  head.add(mesh(new THREE.SphereGeometry(HR + 0.012, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(HAIR), [0, 0.005, -0.015]));
  const spikes = [[0, 0.2, 0.1, 0.9, 0.25], [-0.09, 0.2, 0.07, 0.8, 0.5], [0.09, 0.2, 0.07, 0.8, -0.5], [-0.16, 0.14, 0.04, 0.6, 0.9], [0.16, 0.14, 0.04, 0.6, -0.9], [0, 0.21, -0.08, 0.9, 0.5]];
  for (const [x, y, z, h, tz] of spikes) head.add(mesh(new THREE.ConeGeometry(0.05, 0.16 * h + 0.04, 12), mat(HAIR), [x, y + 0.03, z], [1, 1, 1], [z < 0 ? -0.5 : 0.3, 0, tz]));
  // headband with star
  head.add(mesh(new THREE.TorusGeometry(HR * 0.93, 0.02, 10, 40), mat(RED), [0, 0.095, -0.01], [1, 1, 1.0], [Math.PI / 2, 0, 0]));
  const hs = mesh(star(0.04, 0.017, 0.01), mat(GOLD, { metalness: 0.4 }), [0, 0.1, 0.205]); head.add(hs);
  return head;
}

function limb(len, r, color) { const m = mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; }

export function createSuperhero({ scale = 1, cape = 0.25 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  // body
  const chest = mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.34, 20), mat(SUIT), [0, 0.46, 0], [1, 1, 0.7]);
  const belt = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.04, 20), mat(GOLD, { metalness: 0.4 }), [0, 0.3, 0], [1, 1, 0.72]);
  const buckle = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), mat(RED), [0, 0.3, 0.1]);
  const em = emblem(0.085); em.position.set(0, 0.5, 0.118); em.scale.set(1, 1, 1);
  const capeG = buildCape(cape);
  const head = buildHead();
  upper.add(chest, belt, buckle, em, capeG, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(mesh(new THREE.SphereGeometry(0.036, 12, 10), mat(RED)));
    sh.add(limb(ARM, 0.027, SUIT));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.025, SUIT));
    el.add(mesh(new THREE.SphereGeometry(0.027, 10, 8), mat(SUIT)));
    el.add(mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 12), mat(GOLD, { metalness: 0.3 }), [0, -ARM + 0.04, 0]));
    const hand = new THREE.Group(); hand.add(mesh(new THREE.SphereGeometry(0.037, 14, 10), mat(SKIN))); hand.position.y = -ARM - 0.01; el.add(hand);
    hands[k] = hand; sh.add(el); upper.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0);
    hip.add(limb(0.2, 0.04, SUIT));
    hip.add(mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.12, 14), mat(GOLD, { metalness: 0.3 }), [0, -0.2, 0]));
    hip.add(mesh(new THREE.SphereGeometry(1, 16, 12), mat(GOLD, { metalness: 0.3 }), [0, -0.26, 0.02], [0.05, 0.045, 0.08]));
    root.add(hip); legs[k] = hip;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, cape: capeG, arms, legs, hands };

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

  root.userData.lie = (yaw = 0) => {
    root.rotation.set(Math.PI / 2, yaw, 0, 'YXZ');
    root.userData.pose({ arms: { l: [Math.PI, 0.1, 0], r: [Math.PI, -0.1, 0] }, legs: { l: [0, 0.05], r: [0, -0.05] } });
    capeG.rotation.x = -1.2; head.rotation.x = -0.9;
  };
  return root;
}
