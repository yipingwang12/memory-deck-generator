// The Beacon anchor: a stout stone fire-tower with a face, a bowl of living flame on its head, arms and legs.
// Faces +z, feet on y = 0, ~1.6 units tall. createBeacon({ scale = 1, stone = '#cf6b4c', blush = true }) -> Group.
// userData.parts = { body, flame, bowl, arms:{l,r}, hands:{l,r}, legs:{l,r} }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, flame: scaleY, mouth: 'smile'|'open'|'o' })
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a beacon-local point.
// Flames use MeshBasicMaterial so they stay glowing under toonify.
import * as THREE from 'three';

const R = 0.22, HIP_Y = 0.22, SHOULDER = [0.225, 0.74, 0.02], ARM = 0.17, FACE_Y = 0.56;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const glow = (color) => new THREE.MeshBasicMaterial({ color });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function body(color) {
  const g = new THREE.Group();
  const p = [[0, 0.2], [0.19, 0.2], [0.225, 0.26], [R, 0.4], [R, 0.74], [0.2, 0.84], [0.19, 0.9], [0, 0.9]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(p, 40), mat(color)));
  const band = new THREE.Mesh(new THREE.TorusGeometry(R + 0.002, 0.012, 8, 48), mat('#8f3f2e'));
  band.rotation.x = Math.PI / 2;
  for (const y of [0.33, 0.8]) { const b = band.clone(); b.position.y = y; g.add(b); }
  return g;
}

function bowl() {
  const g = new THREE.Group();
  const p = [[0.17, 0.9], [0.3, 0.97], [0.34, 1.07], [0.31, 1.07], [0.27, 0.99], [0.15, 0.93]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(p, 40), mat('#3a3342', { metalness: 0.4, roughness: 0.45 })));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.016, 8, 48), mat('#e2b13c', { metalness: 0.7, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.07; g.add(rim);
  return g;
}

function flameTongue(h, w, color, x, z, tilt) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), glow(color));
  m.scale.set(w, h, w * 0.8);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.1, 20), glow(color)); tip.position.y = 0.85;
  const t = new THREE.Group(); t.add(m, tip); t.scale.set(w, h, w * 0.8); m.scale.set(1, 1, 1);
  t.position.set(x, 1.05, z); t.rotation.z = tilt; return t;
}

function flame() {
  const g = new THREE.Group();
  g.add(flameTongue(0.2, 0.17, '#ff7a1a', 0.0, 0.0, 0), flameTongue(0.15, 0.12, '#ff7a1a', 0.18, 0, -0.45),
    flameTongue(0.15, 0.12, '#ff7a1a', -0.18, 0, 0.45), flameTongue(0.12, 0.1, '#ff7a1a', 0.0, 0.14, 0.12), flameTongue(0.12, 0.1, '#ff7a1a', 0.0, -0.14, -0.1));
  g.add(flameTongue(0.15, 0.11, '#ffc83a', 0.0, 0.02, 0), flameTongue(0.1, 0.08, '#ffc83a', 0.13, 0.02, -0.4), flameTongue(0.1, 0.08, '#ffc83a', -0.13, 0.02, 0.4));
  g.add(flameTongue(0.09, 0.065, '#fff4c0', 0.0, 0.04, 0));
  return g;
}

function face(group, blush) {
  const z = R + 0.004, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.078, y = FACE_Y;
    disc(0.056, 0.07, '#ffffff', z, group, x, y);
    disc(0.043, 0.062, '#3a2416', z + step, group, x, y - 0.003);
    disc(0.037, 0.028, '#b4753a', z + 2 * step, group, x, y - 0.03);
    disc(0.022, 0.034, '#120a08', z + 3 * step, group, x, y - 0.004);
    disc(0.015, 0.015, '#ffffff', z + 4 * step, group, x - 0.015, y + 0.026);
    disc(0.007, 0.007, '#ffffff', z + 4 * step, group, x - 0.015, y - 0.028);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.059, 0.074, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.03, 0.017, '#ff6f80', z, group, sx * 0.13, FACE_Y - 0.085); b.material.transparent = true; b.material.opacity = 0.6; }
  }
}

function mouths(group) {
  const z = R + 0.006, y = FACE_Y - 0.1, M = {};
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  smile.rotation.z = Math.PI; smile.position.set(0, y + 0.02, z);
  const open = new THREE.Group(); open.position.set(0, y, z);
  const d = disc(0.04, 0.035, '#5a1418', 0, open); const tg = disc(0.025, 0.014, '#ff7f8f', 0.001, open, 0, -0.016);
  const o = new THREE.Group(); o.position.set(0, y, z); disc(0.022, 0.03, '#5a1418', 0, o);
  M.smile = smile; M.open = open; M.o = o; group.add(smile, open, o);
  const set = (k) => { for (const [n, m] of Object.entries(M)) m.visible = n === k; }; set('smile');
  return set;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat(color));
  th.position.set(0.035, 0.008, 0.014); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createBeacon({ scale = 1, stone = '#cf6b4c', blush = true } = {}) {
  const root = new THREE.Group(), skin = '#ffd9b8';
  const bd = body(stone), bw = bowl(), fl = flame();
  const fc = new THREE.PointLight('#ff9a3a', 0, 0); root.add(bd, bw, fl); face(bd, blush);
  const setMouth = mouths(bd);
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); root.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0); hip.add(limb(0.17, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#3a5fa8')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -0.19, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body: bd, flame: fl, bowl: bw, arms, legs, hands };
  root.userData.pose = ({ arms: A = {}, legs: L = {}, flame: f = 1, mouth } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    fl.scale.set(1, f, 1); if (mouth) setMouth(mouth);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
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
