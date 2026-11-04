// Dyno anchor: a chubby green anime DINOSAUR. Faces +z, feet on y = 0, ~1.05 units tall.
// createDinosaur({ scale = 1, body = '#4fbf6a', belly = '#f6e7a8', crown = false }) -> Group
// userData.parts = { torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, tail, mouth }   (l = +x side)
// userData.pose({ lean, headTilt, headYaw, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, tailYaw }) radians
// userData.openMouth(bool)  open (O) mouth instead of smile.  pose also takes headPitch (+ = look down).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a dinosaur-local point.
import * as THREE from 'three';

const HIP_Y = 0.3, ARM = 0.12, SH = [0.2, 0.52, 0.1];
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
const ell = (parent, color, pos, scl, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat(color, extra));
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
// flat disc glued onto a sphere surface (center c, radii r) at direction (dx,dy) in head space
function onSphere(parent, c, r, dx, dy, rx, ry, color, lift = 0) {
  const z = Math.sqrt(Math.max(r * r - dx * dx - dy * dy, 0.0001));
  const p = new THREE.Vector3(dx, dy, z);
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(color, { roughness: 0.35 }));
  m.scale.set(rx, ry, 1);
  m.position.set(c[0] + p.x, c[1] + p.y, c[2] + p.z + lift);
  m.lookAt(m.position.clone().add(p)); parent.add(m); return m;
}

function eyes(head, C, R) {
  let k = 0.002;
  for (const s of [-1, 1]) {
    const x = s * 0.112, y = 0.03;
    onSphere(head, C, R, x, y, 0.078, 0.092, '#ffffff', k);
    onSphere(head, C, R, x, y - 0.004, 0.062, 0.08, '#2a6b8f', k * 2);
    onSphere(head, C, R, x, y - 0.03, 0.058, 0.04, '#58c0d8', k * 3);
    onSphere(head, C, R, x, y - 0.004, 0.032, 0.05, '#0b1a22', k * 4);
    onSphere(head, C, R, x - 0.022, y + 0.03, 0.02, 0.02, '#ffffff', k * 5);
    onSphere(head, C, R, x + 0.02, y - 0.04, 0.009, 0.009, '#ffffff', k * 5);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#10242b'));
    lid.scale.set(0.082, 0.098, 1);
    const p = new THREE.Vector3(x, y, Math.sqrt(R * R - x * x - y * y));
    lid.position.set(C[0] + p.x, C[1] + p.y, C[2] + p.z + k * 6); lid.lookAt(lid.position.clone().add(p)); head.add(lid);
    const b = onSphere(head, C, R, s * 0.19, -0.07, 0.04, 0.022, '#ff7f8f', k); b.material.transparent = true; b.material.opacity = 0.6;
  }
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

export function createDinosaur({ scale = 1, body = '#4fbf6a', belly = '#f6e7a8', crown = false } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const dark = '#2f9a52', plateC = '#ff9a3c';

  ell(upper, body, [0, 0.42, 0], [0.27, 0.3, 0.3]);
  ell(upper, belly, [0, 0.38, 0.1], [0.2, 0.24, 0.24]);
  for (let i = 0; i < 4; i++) {                       // back plates
    const z = -0.1 - 0.06 * i, top = 0.42 + 0.3 * Math.sqrt(1 - (z / 0.3) ** 2);
    const pl = new THREE.Mesh(new THREE.ConeGeometry(0.08 - 0.012 * i, 0.17 - 0.02 * i, 4), mat(plateC));
    pl.position.set(0, top + 0.02, z); pl.rotation.x = -0.35 - 0.2 * i; upper.add(pl);
  }

  // head
  const head = new THREE.Group(); head.position.set(0, 0.77, 0.08); upper.add(head);
  const C = [0, 0, 0], R = 0.3;
  ell(head, body, C, [R, R * 0.92, R]);
  ell(head, body, [0, -0.1, 0.25], [0.15, 0.1, 0.12]);          // snout
  ell(head, belly, [0, -0.15, 0.27], [0.12, 0.05, 0.1]);        // chin
  for (const s of [-1, 1]) ell(head, dark, [s * 0.05, -0.08, 0.36], [0.014, 0.012, 0.01]);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 20, Math.PI), mat('#6a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.1, 0.37); head.add(mouth);
  const open = new THREE.Group(); open.visible = false; head.add(open);
  const hole = ell(open, '#4a1020', [0, -0.1, 0.372], [0.07, 0.065, 0.02]); ell(open, '#ff7f8f', [0, -0.13, 0.375], [0.04, 0.025, 0.015]);
  eyes(head, C, R);
  for (let i = 0; i < 3; i++) {                                  // head horns
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 10), mat(plateC));
    h.position.set(0, 0.28 - 0.02 * i, -0.04 - 0.07 * i); h.rotation.x = -0.4 - 0.25 * i; head.add(h);
  }
  if (crown) {
    const cr = new THREE.Group(), gold = mat('#ffd23c', { metalness: 0.6, roughness: 0.3 });
    cr.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.07, 20), gold));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 8), gold); sp.position.set(Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.14); cr.add(sp); }
    cr.position.set(0, 0.3, -0.02); head.add(cr);
  }

  // tail: chain of shrinking spheres
  const tail = new THREE.Group(); tail.position.set(0, 0.28, -0.22); upper.add(tail);
  for (let i = 0; i < 7; i++) ell(tail, i % 2 ? body : body, [0, -0.015 * i + (i > 4 ? 0.03 * (i - 4) : 0), -0.1 * i - 0.05], [0.17 - 0.02 * i, 0.15 - 0.018 * i, 0.12]);
  const tp = ell(tail, plateC, [0, 0.07, -0.78], [0.03, 0.03, 0.03]);

  // arms (IK-capable) and legs
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.034, body));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.032, body));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mat(body)));
    const hand = new THREE.Group(); hand.position.y = -ARM; hand.add(new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), mat(body)));
    for (let f = -1; f <= 1; f++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 6), mat('#fff6dc')); c.position.set(f * 0.026, -0.04, 0.02); c.rotation.x = Math.PI; hand.add(c); }
    el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.13, HIP_Y, 0);
    hip.add(limb(0.24, 0.07, body));
    const foot = ell(hip, body, [0, -0.25, 0.05], [0.085, 0.05, 0.13]);
    for (let f = -1; f <= 1; f++) ell(hip, '#fff6dc', [f * 0.04, -0.255, 0.17], [0.018, 0.02, 0.02]);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, arms, legs, hands, tail, mouth };

  root.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, headPitch = 0, tailYaw = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt; head.rotation.y = headYaw; head.rotation.x = headPitch; tail.rotation.y = tailYaw;
    for (const [k, v] of Object.entries(A)) { arms[k].quaternion.identity(); arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].quaternion.identity(); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  root.userData.openMouth = (v = true) => { open.visible = v; mouth.visible = !v; };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.3, -0.5); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
