// The Quanterix anchor: one procedural QUARTER (coin) with a face, arms and legs, reused in every scene.
// Faces +z, feet on y = 0, ~1.05 units tall; coin radius 0.4, thickness 0.16 (never edge-on thin).
// createQuarter({ scale = 1, blush = true }) -> Group.
// userData.parts = { coin, head (=coin, for tilt), arms:{l,r}, legs:{l,r}, hands:{l,r}, cy, R }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK in quarter-local space; hand to a point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const R = 0.4, T = 0.16, LEG = 0.24, CY = LEG + R - 0.02, ARM = 0.16;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.35 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function reeded() {
  const t = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#c9ced6'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 64; i++) { ctx.fillStyle = i % 2 ? '#8e96a3' : '#e8ecf2'; ctx.fillRect(i * s / 64, 0, s / 128, s); }
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); return t;
}

function coinBody() {
  const g = new THREE.Group();
  const silver = mat('#eef1f7', { metalness: 0.1, roughness: 0.4 });
  const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 72, 1, true), new THREE.MeshStandardMaterial({ map: reeded(), roughness: 0.35, metalness: 0.4 }));
  side.rotation.x = Math.PI / 2; g.add(side);
  for (const s of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(R, 72), silver); cap.position.z = s * T / 2; if (s < 0) cap.rotation.y = Math.PI; g.add(cap);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.018, 0.02, 10, 72), mat('#eef1f6', { metalness: 0.5, roughness: 0.25 })); rim.position.z = s * T / 2; g.add(rim);
  }
  const inner = new THREE.Mesh(new THREE.CircleGeometry(R * 0.86, 72), mat('#dfe4ee', { metalness: 0.1, roughness: 0.45 })); inner.position.z = T / 2 + 0.002; g.add(inner);
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.86, R * 0.89, 72), mat('#9aa3b3', { metalness: 0.4 })); ring.position.z = T / 2 + 0.003; g.add(ring);
  return g;
}

function face(group, blush) {
  const z = T / 2 + 0.005, st = 0.0015, ey = 0.05;
  for (const sx of [-1, 1]) {
    const x = sx * 0.15;
    disc(0.095, 0.125, '#ffffff', z, group, x, ey);
    disc(0.075, 0.108, '#2b5fb0', z + st, group, x, ey - 0.006);
    disc(0.06, 0.05, '#5fa8e8', z + 2 * st, group, x, ey - 0.05);
    disc(0.04, 0.064, '#0e1730', z + 3 * st, group, x, ey - 0.004);
    disc(0.03, 0.03, '#ffffff', z + 4 * st, group, x - 0.03, ey + 0.045);
    disc(0.013, 0.013, '#ffffff', z + 4 * st, group, x + 0.03, ey - 0.05);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40, 1, 0.15, Math.PI - 0.3), mat('#1a1a2a'));
    lid.scale.set(0.1, 0.132, 1); lid.position.set(x, ey, z + 5 * st); group.add(lid);
    if (blush) { const b = disc(0.05, 0.03, '#ff7f9a', z, group, sx * 0.25, -0.1); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 24, Math.PI), mat('#8a2a3a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.11, z + st); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

export function createQuarter({ scale = 1, blush = true } = {}) {
  const root = new THREE.Group(), skin = '#ffd9b8';
  const coin = new THREE.Group(); coin.position.y = CY; root.add(coin);
  coin.add(coinBody()); face(coin, blush);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (R + 0.01), CY - 0.02, 0);
    sh.add(limb(ARM, 0.022, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.022, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), mat('#ffffff')); hand.position.y = -ARM - 0.01; el.add(hand);
    hands[k] = hand; sh.add(el); root.add(sh); sh.rotation.z = s * 0.7; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.14, CY - R + 0.03, 0); hip.add(limb(LEG - 0.03, 0.03, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#d8453c')); shoe.scale.set(0.07, 0.04, 0.1);
    shoe.position.set(0, -(LEG - 0.01), 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { coin, head: coin, arms, legs, hands, cy: CY, R };

  root.userData.pose = ({ arms: A = {}, legs: L = {} } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.3, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
