// Broad Stanley anchor: a living gold TROPHY cup (the Stanley Cup). Faces +z, feet on y=0, ~1.03 units tall.
// createTrophy({ scale = 1 }) -> Group. userData: parts{bowl,torso,head=bowl,arms,legs,hands}, pose({lean,headTilt,arms:{l:[x,z,elbowX],r},legs:{l:[x,z],r}}),
//   reach('l'|'r',[x,y,z]) two-bone IK (root-local target), faceZ(x,y) surface z of bowl.
// Also exports makeRig (shared limb rig for people) and animeEye.
import * as THREE from 'three';

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Big anime eye (white, iris, pupil, catchlights, lid line) at local (x,y,z), size multiplier s. */
export function animeEye(parent, x, y, z, s = 1, iris = '#b4753a', rotY = 0) {
  const g = new THREE.Group(), st = 0.0015 * s;
  g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
  disc(0.029 * s, 0.037 * s, '#ffffff', 0, g);
  disc(0.0225 * s, 0.032 * s, '#3a2416', st, g, 0, -0.002 * s);
  disc(0.0195 * s, 0.015 * s, iris, 2 * st, g, 0, -0.014 * s);
  disc(0.011 * s, 0.018 * s, '#120a08', 3 * st, g);
  disc(0.0075 * s, 0.0075 * s, '#ffffff', 4 * st, g, -0.008 * s, 0.012 * s);
  disc(0.0035 * s, 0.0035 * s, '#ffffff', 4 * st, g, -0.008 * s, -0.014 * s);
  const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
  lid.scale.set(0.031 * s, 0.039 * s, 1); lid.position.z = 5 * st; g.add(lid);
  return g;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

/** Two-armed, two-legged rig. Returns { torso, upper (add body here, root-local coords), arms, elbows, hands, legs, pose, reach }. */
export function makeRig(root, { shoulder, arm, hipY, hipX, legLen, r = 0.016, limbColor = '#fff1d6', handColor = '#ffffff', shoe = '#c8483c', shoeScale = [0.045, 0.034, 0.065] }) {
  const torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = hipY; upper.position.y = -hipY; torso.add(upper); root.add(torso);
  const arms = {}, elbows = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * shoulder[0], shoulder[1], 0);
    sh.add(limb(arm, r, limbColor));
    const el = new THREE.Group(); el.position.y = -arm; el.add(limb(arm, r, limbColor));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 10, 8), mat(limbColor)));
    const hand = new THREE.Group(); hand.position.y = -arm;
    const palm = new THREE.Mesh(new THREE.SphereGeometry(r * 2.3, 20, 14), mat(handColor)); palm.scale.set(0.95, 1.1, 0.85);
    const th = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 12, 10), mat(handColor)); th.position.set(s * r * 2, r * 0.5, r);
    hand.add(palm, th); el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * hipX, hipY, 0); hip.add(limb(legLen, r * 1.15, limbColor));
    const sh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat(shoe)); sh2.scale.set(...shoeScale);
    sh2.position.set(0, -legLen - 0.005, shoeScale[2] * 0.35); hip.add(sh2); root.add(hip); legs[k] = hip;
  }
  const pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; torso.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  const reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * arm - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * arm));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, arm);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return { torso, upper, arms, elbows, hands, legs, pose, reach };
}

export function createTrophy({ scale = 1 } = {}) {
  const root = new THREE.Group();
  const rig = makeRig(root, { shoulder: [0.23, 0.68, 0], arm: 0.16, hipY: 0.27, hipX: 0.075, legLen: 0.24, r: 0.017 });
  const gold = mat('#f2b82a', { metalness: 0.25, roughness: 0.35 }), dark = mat('#c98a12', { metalness: 0.25, roughness: 0.4 });
  gold.side = THREE.DoubleSide;
  const V = (r, y) => new THREE.Vector2(r, y);
  // pedestal tiers
  const ped = [V(0, 0.27), V(0.17, 0.27), V(0.17, 0.31), V(0.145, 0.33), V(0.145, 0.37), V(0.11, 0.39), V(0.11, 0.41), V(0.075, 0.43), V(0.075, 0.48), V(0.095, 0.5), V(0, 0.5)];
  rig.upper.add(new THREE.Mesh(new THREE.LatheGeometry(ped, 40), gold));
  // bowl: smooth outer wall, rim, inner wall
  const outer = [V(0.09, 0.5), V(0.15, 0.56), V(0.205, 0.64), V(0.225, 0.73), V(0.215, 0.84), V(0.215, 0.92), V(0.25, 0.99), V(0.275, 1.04)];
  const curve = new THREE.SplineCurve(outer).getPoints(48);
  const wall = [...curve, V(0.268, 1.05), V(0.255, 1.03), V(0.2, 0.95), V(0.15, 0.9), V(0, 0.88)];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(wall, 56), gold); rig.upper.add(bowl);
  for (const [y, r, h] of [[0.52, 0.12, 0.025], [0.915, 0.222, 0.03]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, h, 10, 48), dark); ring.rotation.x = Math.PI / 2; ring.position.y = y; rig.upper.add(ring);
  }
  const bowlR = (y) => { for (let i = 1; i < curve.length; i++) { const a = curve[i - 1], b = curve[i]; if (y >= a.y && y <= b.y) return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y || 1); } return 0.22; };
  const faceZ = (x, y) => Math.sqrt(Math.max(bowlR(y) ** 2 - x * x, 1e-4));
  // face
  const face = new THREE.Group(); rig.upper.add(face);
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = 0.765;
    animeEye(face, x, y, faceZ(x, y) + 0.004, 1.45, '#3f8fd8', Math.atan2(x, faceZ(x, y)));
    const bx = sx * 0.135, by = 0.675, b = disc(0.026, 0.014, '#ff6f86', faceZ(bx, by) + 0.003, face, bx, by, { transparent: true, opacity: 0.6 });
    b.rotation.y = Math.atan2(bx, faceZ(bx, by));
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0055, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.655, faceZ(0, 0.655) + 0.004); face.add(mouth);
  rig.mouth = mouth;
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData = { parts: { bowl, torso: rig.torso, head: face, arms: rig.arms, legs: rig.legs, hands: rig.hands }, pose: rig.pose, reach: rig.reach, faceZ, mouth };
  return root;
}
