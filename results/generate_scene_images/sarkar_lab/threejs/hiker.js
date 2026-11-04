// The Sarkar Lab anchor: a tiny cyber HIKER, reused (and re-posed) in every scene.
// Faces +z, boots on y = 0, ~1 unit tall. createHiker({ scale = 1, jacket = '#2f9e8f', pack = '#d9552b' }) -> Group.
// userData.parts = { torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, pack, antenna }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a hiker-local point.
// userData.holdPole('l'|'r', len) adds a trekking pole in that hand and returns it.
import * as THREE from 'three';

const HIP_Y = 0.3, SHOULDER = [0.15, 0.58, 0], ARM = 0.14, HEAD_R = 0.2, HEAD_Y = 0.82;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const glow = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.3 });
const disc = (rx, ry, color, parent, ang, elev, step) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  const r = HEAD_R + 0.001 + step;
  const dir = new THREE.Vector3(Math.sin(ang) * Math.cos(elev), Math.sin(elev), Math.cos(ang) * Math.cos(elev));
  m.position.copy(dir.clone().multiplyScalar(r)); m.lookAt(dir.clone().multiplyScalar(2 * r));
  m.scale.set(rx, ry, 1); parent.add(m); return m;
};
const ball = (parent, color, pos, scl, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), typeof color === 'string' ? mat(color, extra) : color);
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function buildHead(head) {
  const skin = '#ffd9b8';
  ball(head, skin, [0, 0, 0], [HEAD_R, HEAD_R * 0.95, HEAD_R]);
  // hair under the hat
  ball(head, '#3a2a22', [0, 0.02, -0.03], [HEAD_R * 1.04, HEAD_R * 0.95, HEAD_R * 0.95]);
  ball(head, skin, [0, -0.01, 0.015], [HEAD_R * 0.96, HEAD_R * 0.9, HEAD_R * 0.96]);
  for (const sx of [-1, 1]) {
    const a = sx * 0.37, e = -0.03;
    disc(0.062, 0.078, '#ffffff', head, a, e, 0);
    disc(0.049, 0.068, '#1f6f7a', head, a, e - 0.005, 0.0012);
    disc(0.04, 0.045, '#4fd6e0', head, a, e - 0.04, 0.0024);
    disc(0.025, 0.042, '#081418', head, a, e - 0.005, 0.0036);
    disc(0.017, 0.017, '#ffffff', head, a - 0.07, e + 0.06, 0.0048);
    disc(0.008, 0.008, '#ffffff', head, a + 0.05, e - 0.08, 0.0048);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#1a0f0a'));
    const dir = new THREE.Vector3(Math.sin(a), Math.sin(e), Math.cos(a)).normalize();
    lid.position.copy(dir.clone().multiplyScalar(HEAD_R + 0.007)); lid.lookAt(dir.clone().multiplyScalar(2 * HEAD_R));
    lid.scale.set(0.066, 0.083, 1); head.add(lid);
    const b = disc(0.035, 0.018, '#ff7f8f', head, sx * 0.62, -0.3, 0.0005); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#8a2f2f'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.105, HEAD_R * 0.96); head.add(mouth);
  // hat: brim + dome + band
  const hat = '#d9552b';
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 40), mat(hat)); brim.position.set(0, 0.1, 0.02); head.add(brim);
  const dome = ball(head, hat, [0, 0.11, 0], [0.205, 0.17, 0.205]);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.205, 0.04, 40), mat('#f5d36b')); band.position.set(0, 0.125, 0); head.add(band);
  // cyber: glowing antenna + ear module
  const ant = new THREE.Group(); ant.position.set(0.08, 0.27, 0); head.add(ant);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), mat('#cfd6dc', { metalness: 0.6 })); rod.position.y = 0.07; ant.add(rod);
  ball(ant, glow('#3ff0ff'), [0, 0.15, 0], [0.026, 0.026, 0.026]);
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 20), mat('#3b4a57', { metalness: 0.5 }));
    m.rotation.z = Math.PI / 2; m.position.set(sx * (HEAD_R + 0.005), -0.01, -0.02); head.add(m);
    const g = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), glow('#3ff0ff'));
    g.rotation.y = sx * Math.PI / 2; g.position.set(sx * (HEAD_R + 0.025), -0.01, -0.02); head.add(g);
  }
  return ant;
}

export function createHiker({ scale = 1, jacket = '#2f9e8f', pack = '#d9552b' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffd9b8';
  // body
  const chest = ball(upper, jacket, [0, 0.46, 0], [0.19, 0.2, 0.15]);
  ball(upper, jacket, [0, 0.36, 0], [0.18, 0.12, 0.145]);
  ball(upper, '#5a4a3a', [0, 0.3, 0], [0.19, 0.04, 0.155]); // belt
  ball(upper, glow('#3ff0ff'), [0, 0.47, 0.14], [0.05, 0.04, 0.012]); // chest chip
  // backpack
  const bp = new THREE.Group(); bp.position.set(0, 0.42, -0.19); upper.add(bp);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.16), mat(pack)); bp.add(body);
  ball(bp, pack, [0, 0.19, 0], [0.13, 0.05, 0.085]);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), mat('#3f6fb5')); roll.rotation.z = Math.PI / 2; roll.position.set(0, -0.2, 0.0); bp.add(roll);
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.05), mat('#a83f1e')); pocket.position.set(0, -0.03, -0.09); bp.add(pocket);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.02), mat('#4a3b30'));
  for (const sx of [-1, 1]) { const s = strap.clone(); s.position.set(sx * 0.09, 0.47, 0.1); s.rotation.x = -0.05; upper.add(s); }
  // head
  const head = new THREE.Group(); head.position.y = HEAD_Y; upper.add(head);
  const antenna = buildHead(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    ball(sh, jacket, [0, 0, 0], [0.05, 0.05, 0.05]);
    sh.add(limb(ARM, 0.025, jacket)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.022, jacket));
    ball(el, jacket, [0, 0, 0], [0.026, 0.026, 0.026]);
    const hand = new THREE.Group(); hand.position.y = -ARM; ball(hand, '#6b5b4b', [0, -0.01, 0], [0.036, 0.04, 0.034]); ball(hand, glow('#3ff0ff'), [0, 0.025, 0], [0.026, 0.008, 0.026]);
    hands[k] = hand; el.add(hand); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.15; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.085, HIP_Y, 0);
    hip.add(limb(0.2, 0.034, '#5b4b6e'));
    const boot = ball(hip, '#6b3f26', [0, -0.235, 0.025], [0.058, 0.05, 0.095]);
    ball(hip, '#3a2418', [0, -0.275, 0.03], [0.06, 0.02, 0.1]);
    ball(hip, '#e9e2d0', [0, -0.19, 0], [0.045, 0.02, 0.045]); // sock
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, arms, legs, hands, pack: bp, antenna };

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
  root.userData.holdPole = (key, len = 1) => {
    const p = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 8), mat('#cfd6dc', { metalness: 0.5 })); shaft.position.y = len / 2 - len * 0.35; p.add(shaft);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 10), mat('#d9552b')); grip.position.y = 0.02; p.add(grip);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 8), mat('#333')); tip.rotation.x = Math.PI; tip.position.y = -len * 0.35 - 0.02; p.add(tip);
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    hands[key].add(p); return p;
  };
  return root;
}
