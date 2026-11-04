// The Brain-GATE anchor: a TURNSTILE character (tripod rotor on a boxy head, steel body, limbs). Faces +z, feet y=0, ~1.1 tall.
// createTurnstile({ scale = 1, bodyColor = '#e8a020', blush = true }) -> Group.
// userData.parts = { body, torso, head, rotor, arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r}, legs:{l:[x,z], r} })
// userData.reach('l'|'r', [x,y,z]) two-bone IK to turnstile-local point.   userData.spin(angle) turns the rotor about y.
import * as THREE from 'three';

const HIP_Y = 0.27, SHOULDER = [0.15, 0.55, 0], ARM = 0.15, HW = 0.22, HH = 0.17, HD = 0.17, HEAD_Y = 0.74;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function roundedBox(w, h, d, r, color) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const b = 0.015, g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return new THREE.Mesh(g, mat(color));
}

function face(group, blush) {
  const z = HD + 0.016, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.09, y = 0.005;
    disc(0.066, 0.082, '#ffffff', z, group, x, y);
    disc(0.052, 0.072, '#3a2416', z + st, group, x, y - 0.004);
    disc(0.045, 0.034, '#b4753a', z + 2 * st, group, x, y - 0.032);
    disc(0.026, 0.042, '#120a08', z + 3 * st, group, x, y);
    disc(0.017, 0.017, '#ffffff', z + 4 * st, group, x - 0.018, y + 0.027);
    disc(0.008, 0.008, '#ffffff', z + 4 * st, group, x - 0.018, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.07, 0.088, 1); lid.position.set(x, y, z + 5 * st); group.add(lid);
    if (blush) { const b = disc(0.034, 0.02, '#ff7f8f', z, group, sx * 0.14, -0.075); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.082, z + st); group.add(mouth);
}

function rotor() {
  const g = new THREE.Group(), steel = mat('#d9dfe6', { metalness: 0.7, roughness: 0.28 }), red = mat('#d8402e');
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.07, 28), steel); hub.position.y = 0.035; g.add(hub);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group(); arm.rotation.y = i * Math.PI * 2 / 3 + Math.PI / 2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 14), steel);
    bar.rotation.z = Math.PI / 2 - 0.5; bar.position.set(0.18, 0.06, 0);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), red); ball.position.set(0.31, -0.07, 0);
    arm.add(bar, ball); g.add(arm);
  }
  return g;
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(color));
  th.position.set(0.03, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createTurnstile({ scale = 1, bodyColor = '#e8a020', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0';
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.4, 32), mat(bodyColor)); body.position.y = 0.45;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.05, 32), mat('#2c3a4a')); band.position.y = 0.4;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.02), mat('#222a33')); slot.position.set(0, 0.52, 0.16);
  const head = new THREE.Group(); head.position.y = HEAD_Y; const inner = new THREE.Group(); inner.position.y = -HEAD_Y; head.add(inner);
  const box = roundedBox(HW * 2, HH * 2, HD * 2, 0.06, '#c9d2dc'); box.position.y = HEAD_Y; box.material.metalness = 0.35;
  const plate = roundedBox(HW * 2 - 0.05, HH * 2 - 0.05, 0.02, 0.05, '#fffaf0'); plate.position.set(0, HEAD_Y, HD + 0.01);
  const faceG = new THREE.Group(); faceG.position.y = HEAD_Y; face(faceG, blush);
  const rot = rotor(); rot.position.y = HEAD_Y + HH + 0.02;
  inner.add(box, plate, faceG, rot);
  upper.add(body, band, slot, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1] - 0.02, 0);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.085, HIP_Y, 0); hip.add(limb(0.21, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -0.24, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head, rotor: rot, arms, legs, hands };
  root.userData.spin = (a) => { rot.rotation.y = a; };
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
  return root;
}
