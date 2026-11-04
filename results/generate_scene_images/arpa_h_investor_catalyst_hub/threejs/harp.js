// The ARPA-H anchor: a chubby living HARP with a big-eyed face on its sound box, arms and little legs.
// Faces +z, feet on y = 0, ~1.4 units tall. createHarp({ scale = 1, wood = '#cf7a2c', blush = true }) -> Group.
// userData.parts = { box, head (face group), arms:{l,r}, hands:{l,r}, legs:{l,r}, strings:[Mesh] }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, tilt })  radians; arm z>0 swings l out; tilt = roll about feet (z)
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a harp-local point.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ARM = 0.2, SHOULDER = [0.4, 0.5, 0.06], BOX_Y = 0.46, BOX_D = 0.32, FRONT = BOX_D / 2;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

function face(group, blush) {
  const z = FRONT + 0.004, st = 0.0015, y = BOX_Y + 0.03;
  for (const sx of [-1, 1]) {
    const x = sx * 0.15;
    disc(0.1, 0.125, '#ffffff', z, group, x, y);
    disc(0.08, 0.108, '#2c1a3a', z + st, group, x, y - 0.006);
    disc(0.07, 0.05, '#5b7cff', z + 2 * st, group, x, y - 0.045);
    disc(0.04, 0.062, '#0d0714', z + 3 * st, group, x, y - 0.005);
    disc(0.03, 0.03, '#ffffff', z + 4 * st, group, x - 0.03, y + 0.04);
    disc(0.013, 0.013, '#ffffff', z + 4 * st, group, x + 0.025, y - 0.05);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.105, 0.13, 1); lid.position.set(x, y, z + 5 * st); group.add(lid);
    if (blush) { const b = disc(0.05, 0.027, '#ff6f8f', z, group, sx * 0.25, y - 0.14); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, y - 0.17, z + st); group.add(mouth);
}

export function createHarp({ scale = 1, wood = '#cf7a2c', blush = true } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const gold = mat('#ffd24a', { metalness: 0.6, roughness: 0.3 }), skin = '#ffe0c0';
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.5, BOX_D, 5, 0.07), mat(wood));
  box.position.y = BOX_Y; body.add(box);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.05, BOX_D + 0.03, 3, 0.02), gold); trim.position.y = BOX_Y + 0.26; body.add(trim);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.8, 20), mat(wood)); pillar.position.set(-0.33, 1.0, 0); body.add(pillar);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), gold); cap.position.set(-0.33, 1.4, 0); body.add(cap);
  // neck: bezier from pillar top down to the sound box's right edge
  const P = [new THREE.Vector2(-0.33, 1.36), new THREE.Vector2(0.12, 1.36), new THREE.Vector2(0.36, 0.76)];
  const bez = (t) => new THREE.Vector2().addScaledVector(P[0], (1 - t) ** 2).addScaledVector(P[1], 2 * t * (1 - t)).addScaledVector(P[2], t * t);
  const neckPts = Array.from({ length: 24 }, (_, i) => { const p = bez(i / 23); return new THREE.Vector3(p.x, p.y, 0); });
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts), 40, 0.05, 10), mat(wood)); body.add(neck);
  const strings = [], N = 11, topY = BOX_Y + 0.28;
  for (let i = 0; i < N; i++) {
    const x = -0.24 + i * (0.6 / (N - 1)); let best = P[0].y;
    for (let k = 0; k <= 200; k++) { const p = bez(k / 200); if (Math.abs(p.x - x) < 0.004) best = p.y; }
    const len = best - topY, s = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, len, 6), gold);
    s.position.set(x, topY + len / 2, 0); body.add(s); strings.push(s);
  }
  const head = new THREE.Group(); face(head, blush); body.add(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.022, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.022, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), mat(skin)));
    const hand = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat(skin)); palm.scale.set(0.95, 1.1, 0.8);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), mat(skin)); th.position.set(0.04, 0.01, 0.015);
    hand.add(palm, th); hand.position.y = -ARM; el.add(hand); sh.add(el); body.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el; hands[k] = hand;
    const hip = new THREE.Group(); hip.position.set(s * 0.18, 0.21, 0); hip.add(limb(0.14, 0.028, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.06, 0.04, 0.09); shoe.position.set(0, -0.16, 0.03);
    hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { box, head, arms, hands, legs, strings };
  root.userData.pose = ({ tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    body.rotation.z = tilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.4, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
