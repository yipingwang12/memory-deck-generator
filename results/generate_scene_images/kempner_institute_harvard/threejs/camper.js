// The Kempner anchor: a cute CAMPER van character, reused in every scene.
// Faces +z, wheels on y = 0, ~1.05 units tall, ~1.24 long. createCamper({ scale = 1 }) -> Group.
// userData.parts = { arms:{l,r}, hands:{l,r}, wheels, body, cabin, popTop }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]} })  radians, arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a camper-local point
// userData.bounce(h) lifts the van off the ground (jump).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ARM = 0.17, SHOULDER = [0.44, 0.46, 0.3];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const rbox = (w, h, d, r, color, pos, parent, extra) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat(color, extra)); m.position.set(...pos); parent.add(m); return m;
};
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function face(g) {
  const z = 0.524, st = 0.0016;
  for (const sx of [-1, 1]) {
    const x = sx * 0.17, y = 0.7;
    disc(0.115, 0.135, '#ffffff', z, g, x, y);
    disc(0.088, 0.115, '#1f6f78', z + st, g, x, y - 0.006);
    disc(0.075, 0.05, '#4ec3bd', z + 2 * st, g, x, y - 0.05);
    disc(0.05, 0.075, '#0b1c22', z + 3 * st, g, x, y - 0.004);
    disc(0.03, 0.03, '#ffffff', z + 4 * st, g, x - 0.028, y + 0.04);
    disc(0.014, 0.014, '#ffffff', z + 4 * st, g, x + 0.03, y - 0.05);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#10202a'));
    lid.scale.set(0.12, 0.145, 1); lid.position.set(x, y, z + 5 * st); g.add(lid);
    const b = disc(0.05, 0.028, '#ff7f8f', 0.627, g, sx * 0.3, 0.4); b.material.transparent = true; b.material.opacity = 0.6;
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), mat('#fff3a0', { emissive: '#ffd84a', emissiveIntensity: 0.6 }));
    hl.scale.z = 0.5; hl.position.set(sx * 0.36, 0.26, 0.625); g.add(hl);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.42, 0.627); g.add(mouth);
}

function wheel(x, z) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.13, 28), mat('#26262c', { roughness: 0.9 }));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.14, 20), mat('#dfe5ea', { metalness: 0.6, roughness: 0.3 }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 12), mat('#ffb02e'));
  g.add(tyre, hub, cap); g.rotation.z = Math.PI / 2; g.position.set(x, 0.16, z); return g;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createCamper({ scale = 1 } = {}) {
  const root = new THREE.Group(), g = new THREE.Group(); root.add(g);
  const teal = '#2fb3a8', cream = '#fff1d6', orange = '#ff9a3c', glass = '#5a93c4';
  const body = rbox(0.86, 0.42, 1.24, 0.09, teal, [0, 0.33, 0], g);
  const cabin = rbox(0.8, 0.4, 1.02, 0.09, cream, [0, 0.7, -0.05], g);
  rbox(0.9, 0.045, 1.28, 0.02, orange, [0, 0.54, 0], g);
  rbox(0.66, 0.31, 0.03, 0.01, glass, [0, 0.7, 0.505], g, { roughness: 0.2 });
  for (const s of [-1, 1]) rbox(0.03, 0.26, 0.5, 0.01, glass, [s * 0.4, 0.72, -0.2], g, { roughness: 0.2 });
  const popTop = rbox(0.7, 0.14, 0.86, 0.06, orange, [0, 0.97, -0.05], g);
  rbox(0.5, 0.03, 0.7, 0.01, '#ffffff', [0, 1.05, -0.05], g);
  rbox(0.78, 0.07, 0.06, 0.03, '#dfe5ea', [0, 0.2, 0.65], g, { metalness: 0.6, roughness: 0.3 });
  rbox(0.4, 0.05, 0.03, 0.01, '#2a8b82', [0, 0.28, 0.627], g);
  face(g);
  const wheels = [];
  for (const sx of [-1, 1]) for (const z of [0.4, -0.4]) { const w = wheel(sx * 0.44, z); g.add(w); wheels.push(w); }

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.028, skin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.028, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 14), mat('#ffffff')); hand.position.y = -ARM - 0.01;
    el.add(hand); hands[k] = hand; sh.add(el); g.add(sh); sh.rotation.z = s * 0.6; arms[k] = sh; elbows[k] = el;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { arms, hands, wheels, body, cabin, popTop };

  root.userData.pose = ({ arms: A = {} } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].quaternion.identity(); arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].quaternion.identity(); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.8, 0.5, -0.3); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  root.userData.bounce = (h) => { g.position.y = h; };
  return root;
}
