// The Editas anchor: one procedural PENCIL, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createPencil({ scale = 1, bodyColor = '#f7c820', blush = true }) -> Group.
// userData.parts = { body, torso, head (eraser+ferrule+face), arms:{l,r}, legs:{l,r}, hands:{l,r}, tip }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
//   lean = torso pitch about the hips (+ = forward), headTilt = roll of head (z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a pencil-local point (elbow bends back/out).
// userData.lie(yaw = 0)  lies on its back (face up, eraser toward -z), resting on y = 0; set position.x/z after.
import * as THREE from 'three';

const R = 0.14, APO = R * Math.cos(Math.PI / 6), HIP_Y = 0.27, SHOULDER = [0.15, 0.72, 0], ARM = 0.13;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function hexBody(color) {
  const s = new THREE.Shape(), b = 0.012, r = R - b;
  for (let i = 0; i < 6; i++) s[i ? 'lineTo' : 'moveTo'](r * Math.cos(i * Math.PI / 3), r * Math.sin(i * Math.PI / 3));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.5 - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3 });
  g.center(); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat(color)); m.position.y = 0.61; return m;
}

function eraser() {
  const pts = [[0, 0], [0.118, 0], [0.122, 0.008], [0.122, 0.05], [0.112, 0.07], [0.06, 0.082], [0, 0.085]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), mat('#f4909c', { roughness: 0.8 })); m.position.y = 0.925; return m;
}

function ferrule() {
  const g = new THREE.Group(), silver = mat('#d6dbe0', { metalness: 0.7, roughness: 0.3 }), gold = mat('#e2b13c', { metalness: 0.7, roughness: 0.3 });
  const band = (y, h, r, m) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), m); c.position.y = y; g.add(c); };
  band(0.895, 0.07, 0.133, silver);
  for (const y of [0.868, 0.922]) band(y, 0.014, 0.137, gold);
  return g;
}

function face(group, blush) {
  const z = APO + 0.002, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.038, y = 0.725;
    disc(0.029, 0.037, '#ffffff', z, group, x, y);
    disc(0.0225, 0.032, '#3a2416', z + step, group, x, y - 0.002);
    disc(0.0195, 0.015, '#b4753a', z + 2 * step, group, x, y - 0.014);
    disc(0.011, 0.018, '#120a08', z + 3 * step, group, x, y);
    disc(0.0075, 0.0075, '#ffffff', z + 4 * step, group, x - 0.008, y + 0.012);
    disc(0.0035, 0.0035, '#ffffff', z + 4 * step, group, x - 0.008, y - 0.014);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.031, 0.039, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.016, 0.009, '#ff7f8f', z, group, sx * 0.062, 0.688); b.material.transparent = true; b.material.opacity = 0.55; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0028, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.686, z + step); group.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mat(color));
  th.position.set(0.025, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createPencil({ scale = 1, bodyColor = '#f7c820', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = hexBody(bodyColor), head = new THREE.Group();
  head.position.y = 0.7; const inner = new THREE.Group(); inner.position.y = -0.7; head.add(inner);
  inner.add(eraser(), ferrule()); face(inner, blush);

  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.92 * R, 0.0376, 0.17, 32), mat('#efc58a')); wood.position.y = 0.275;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0376, 0.07, 24), mat('#2b2b30', { roughness: 0.4 })); tip.position.y = 0.155; tip.rotation.x = Math.PI;
  upper.add(body, wood, tip, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.011, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.011, skin));
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), mat(skin)); el.add(joint);
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.085, HIP_Y, 0); hip.add(limb(0.21, 0.018, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.034, 0.03, 0.055);
    shoe.position.set(0, -0.24, 0.018); hip.add(shoe); root.add(hip); legs[k] = hip;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head, arms, legs, hands, tip };

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
    root.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ'); root.position.y = APO * scale;
  };
  return root;
}
