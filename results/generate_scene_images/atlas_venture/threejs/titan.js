// Atlas Venture anchor: a friendly TITAN (big-eyed chibi giant, white hair + beard, orange kilt). Faces +z, feet on y = 0, ~1.1 units tall.
// createTitan({ scale = 1, armLen = 1 }) -> Group.  userData.parts = { head, arms:{l,r}, hands:{l,r}, legs:{l,r} }  (l = +x side)
// userData.pose({ headTilt, lean, legs:{l:[x,z], r:[..]} })   radians.
// userData.reach('l'|'r', [x,y,z], pole = [side,-0.3,-0.2])  two-bone IK: hand to a titan-local point.
import * as THREE from 'three';

const SH = [0.27, 0.62, 0], UP0 = 0.2, LO0 = 0.19, HEAD_Y = 0.86;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
const blob = (parent, m, pos, scl) => { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), m); o.position.set(...pos); o.scale.set(...scl); parent.add(o); return o; };
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r0, r1, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 16), m); o.geometry.translate(0, -len / 2, 0); return o; };

function buildFace(head, skin) {
  const R = 0.21, zAt = (x, y) => Math.sqrt(R * R - x * x - (y * y)) - 0.003, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = -0.005, z = zAt(x, y);
    disc(0.056, 0.066, '#ffffff', z, head, x, y);
    disc(0.045, 0.06, '#2a5aa8', z + st, head, x, y - 0.003);
    disc(0.03, 0.04, '#7fb4ee', z + 2 * st, head, x, y - 0.02);
    disc(0.024, 0.036, '#0c1a38', z + 3 * st, head, x, y);
    disc(0.015, 0.015, '#ffffff', z + 4 * st, head, x - 0.016, y + 0.022);
    disc(0.007, 0.007, '#ffffff', z + 4 * st, head, x + 0.014, y - 0.028);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#2a1a10'));
    lid.scale.set(0.062, 0.072, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    const brow = blob(head, mat('#f4f1ea'), [sx * 0.085, 0.085, zAt(sx * 0.085, 0.085) - 0.004], [0.062, 0.016, 0.02]); brow.rotation.z = -sx * 0.18;
    const b = disc(0.03, 0.017, '#ff7f8f', zAt(sx * 0.13, -0.07), head, sx * 0.13, -0.07); b.material.transparent = true; b.material.opacity = 0.55;
    blob(head, mat(skin), [sx * 0.205, -0.01, 0], [0.04, 0.06, 0.03]); // ears
  }
  blob(head, mat('#e89f6e'), [0, -0.06, R - 0.005], [0.03, 0.026, 0.026]); // nose
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.098, zAt(0, -0.1) + 0.005); head.add(mouth);
}

export function createTitan({ scale = 1, armLen = 1 } = {}) {
  const UP = UP0 * armLen, LO = LO0 * armLen;
  const root = new THREE.Group(), upper = new THREE.Group(); root.add(upper);
  const skin = '#f0b383', white = mat('#f4f1ea'), gold = mat('#e8b53c', { metalness: 0.6, roughness: 0.35 });
  const skinM = mat(skin), kilt = mat('#e0553a'), teal = mat('#1f9aa8');

  // torso, kilt, belt, sash
  blob(upper, skinM, [0, 0.52, 0], [0.25, 0.25, 0.19]);
  const k = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.2, 32, 1, true), kilt); k.material.side = THREE.DoubleSide; k.position.y = 0.32; upper.add(k);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.05, 32), gold); belt.position.y = 0.42; upper.add(belt);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.035, 10, 40, Math.PI * 1.1), teal);
  sash.scale.set(1, 1, 0.8); sash.rotation.set(0.1, 0, 0.9); sash.position.set(0, 0.52, 0); upper.add(sash);

  // head: sphere + hair + beard
  const head = new THREE.Group(); head.position.y = HEAD_Y; upper.add(head);
  blob(head, skinM, [0, 0, 0], [0.21, 0.2, 0.2]);
  buildFace(head, skin);
  for (let i = 0; i < 13; i++) { // hair cap, curls back/top, bangs
    const a = (i / 13) * Math.PI * 2, r = 0.19;
    blob(head, white, [Math.cos(a) * r * 0.95, 0.1 + Math.abs(Math.sin(a)) * 0.04, Math.sin(a) * r * 0.9 - 0.04], [0.065, 0.06, 0.065]);
  }
  blob(head, white, [0, 0.14, -0.02], [0.17, 0.09, 0.17]);
  for (const sx of [-1, 1]) { blob(head, white, [sx * 0.2, 0.0, -0.04], [0.045, 0.08, 0.05]); blob(head, white, [sx * 0.06, 0.15, 0.13], [0.075, 0.045, 0.06]); }
  blob(head, white, [0, 0.16, 0.14], [0.06, 0.04, 0.05]);
  for (let i = 0; i < 7; i++) { // beard curls
    const t = (i - 3) / 3, a = t * 1.15;
    blob(head, white, [Math.sin(a) * 0.19, -0.16 - 0.03 * (1 - Math.abs(t)) * 0 - Math.abs(t) * -0.02, Math.cos(a) * 0.17 - 0.0], [0.06, 0.055, 0.055]);
  }
  blob(head, white, [0, -0.2, 0.14], [0.08, 0.06, 0.06]);
  blob(head, white, [0, -0.095, 0.185], [0.075, 0.016, 0.02]); // moustache
  blob(head, white, [-0.045, -0.08, 0.185], [0.045, 0.02, 0.02]); blob(head, white, [0.045, -0.08, 0.185], [0.045, 0.02, 0.02]);

  // arms
  const arms = {}, elbows = {}, hands = {};
  for (const [kk, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    blob(sh, skinM, [0, 0, 0], [0.085, 0.085, 0.085]);
    sh.add(limb(UP, 0.07, 0.058, skinM));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.014, 8, 24), gold); band.rotation.x = Math.PI / 2; band.position.y = -0.1; sh.add(band);
    const el = new THREE.Group(); el.position.y = -UP; blob(el, skinM, [0, 0, 0], [0.062, 0.062, 0.062]); el.add(limb(LO, 0.058, 0.05, skinM));
    const hand = new THREE.Group(); hand.position.y = -LO - 0.02; blob(hand, skinM, [0, 0, 0], [0.075, 0.075, 0.07]);
    blob(hand, skinM, [s * 0.05, 0.02, 0.03], [0.026, 0.04, 0.026]); el.add(hand); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.35; arms[kk] = sh; elbows[kk] = el; hands[kk] = hand;
  }
  // legs + sandals
  const legs = {};
  for (const [kk, s] of [['l', 1], ['r', -1]]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.27, 0); hip.add(limb(0.2, 0.075, 0.065, skinM));
    const shoe = blob(hip, mat('#7a4a2a'), [0, -0.235, 0.03], [0.08, 0.045, 0.115]);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 8, 20), gold); strap.rotation.x = Math.PI / 2; strap.position.y = -0.17; hip.add(strap);
    root.add(hip); legs[kk] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, arms, hands, legs };
  root.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, legs: L = {} } = {}) => {
    upper.rotation.x = lean; head.rotation.set(0, headYaw, headTilt);
    for (const [kk, v] of Object.entries(L)) legs[kk].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target, polev) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    root.updateMatrixWorld(true); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(upper.matrix.clone().invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), UP + LO - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(...(polev ?? [s, -0.3, -0.2])); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(Math.min(1, (UP * UP + D * D - LO * LO) / (2 * UP * D)));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, UP);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
