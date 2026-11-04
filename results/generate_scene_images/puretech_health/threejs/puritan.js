// The PureTech anchor: a PURITAN settler (tall buckled hat, white collar). Faces +z, feet on y = 0, ~1.0 unit tall (hat top).
// createPuritan({ scale = 1 }) -> Group.  userData.parts = { head, arms:{l,r}, hands:{l,r}, hat }   (l = +x side)
// userData.pose({ headTilt, arms:{l:[x,z,elbowX], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a puritan-local point.
// Also exports addFace(group, R, {y, eyeX, size}) used by other characters (babies, Zorro).
import * as THREE from 'three';

const ARM = 0.12, SHOULDER = [0.125, 0.55, 0], HEAD_Y = 0.72, HR = 0.12;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const part = (geo, m, pos = [0, 0, 0], parent) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); parent?.add(o); return o; };

/** Big anime eyes + catchlights, blush, smile on a sphere of radius R centred at the group origin (+y offset y). */
export function addFace(group, R, { y = 0, eyeX = 0.38, size = 0.27, blush = true } = {}) {
  for (const sx of [-1, 1]) {
    const ex = sx * eyeX * R, ey = y - 0.04 * R;
    const z = Math.sqrt(R * R - ex * ex - (ey - y) ** 2) + 0.002;
    const e = new THREE.Group(); e.position.set(ex, ey, z); e.rotation.y = sx * Math.asin(ex / R); group.add(e);
    const w = size * R, h = w * 1.3, st = 0.0012 * R / 0.12;
    disc(w, h, '#ffffff', 0, e); disc(w * 0.78, h * 0.86, '#3a2416', st, e, 0, -h * 0.05);
    disc(w * 0.7, h * 0.4, '#c98a46', 2 * st, e, 0, -h * 0.4); disc(w * 0.4, h * 0.5, '#120a08', 3 * st, e, 0, -h * 0.05);
    disc(w * 0.27, w * 0.27, '#ffffff', 4 * st, e, -w * 0.3, h * 0.3); disc(w * 0.12, w * 0.12, '#ffffff', 4 * st, e, w * 0.25, -h * 0.4);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.04, 32, 1, 0.15, Math.PI - 0.3), mat('#1a0f0a'));
    lid.scale.set(w * 1.05, h * 1.0, 1); lid.position.z = 5 * st; e.add(lid);
    if (blush) {
      const bx = sx * 0.62 * R, bz = Math.sqrt(R * R - bx * bx - (0.35 * R) ** 2) + 0.002;
      const b = new THREE.Group(); b.position.set(bx, y - 0.34 * R, bz); b.rotation.y = sx * Math.asin(bx / R); group.add(b);
      const d = disc(0.17 * R, 0.09 * R, '#ff7f8f', 0, b); d.material.transparent = true; d.material.opacity = 0.55;
    }
  }
  const mz = Math.sqrt(R * R - (0.42 * R) ** 2) + 0.002;
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1 * R, 0.022 * R, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, y - 0.42 * R + 0.06 * R, mz); group.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createPuritan({ scale = 1 } = {}) {
  const root = new THREE.Group(), skin = '#ffe0c0', black = '#26262e', white = '#fbf7ec', gold = '#e2b13c';
  // robe
  const pts = [[0, 0.13], [0.17, 0.13], [0.16, 0.2], [0.125, 0.34], [0.1, 0.48], [0.092, 0.56], [0.06, 0.6], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  root.add(part(new THREE.LatheGeometry(pts, 36), mat(black)));
  // white apron + gold belt buckle
  part(new THREE.BoxGeometry(0.1, 0.24, 0.02), mat(white), [0, 0.32, 0.125], root).rotation.x = 0.2;
  part(new THREE.BoxGeometry(0.05, 0.035, 0.02), mat(gold, { metalness: 0.6, roughness: 0.3 }), [0, 0.47, 0.098], root);
  // legs + buckled shoes
  for (const s of [-1, 1]) {
    part(new THREE.CylinderGeometry(0.022, 0.02, 0.15, 10), mat('#e8e8ee'), [s * 0.05, 0.075, 0], root);
    const shoe = part(new THREE.SphereGeometry(1, 16, 12), mat(black), [s * 0.05, 0.025, 0.025], root); shoe.scale.set(0.04, 0.028, 0.065);
    part(new THREE.BoxGeometry(0.03, 0.026, 0.008), mat(gold, { metalness: 0.6, roughness: 0.3 }), [s * 0.05, 0.04, 0.085], root);
  }
  // wide white collar
  const collar = part(new THREE.CylinderGeometry(0.175, 0.095, 0.05, 40), mat(white), [0, 0.605, 0], root);
  // head
  const head = new THREE.Group(); head.position.y = HEAD_Y; root.add(head);
  part(new THREE.SphereGeometry(HR, 36, 28), mat(skin), [0, 0, 0], head);
  const hair = part(new THREE.SphereGeometry(HR * 1.04, 28, 20), mat('#7a4a28'), [0, 0.012, -0.03], head); hair.scale.set(1, 1, 0.95);
  for (const s of [-1, 1]) part(new THREE.SphereGeometry(0.045, 14, 10), mat('#7a4a28'), [s * 0.105, -0.04, 0.0], head);
  addFace(head, HR);
  // tall buckled hat
  const hat = new THREE.Group(); hat.position.y = 0.07; head.add(hat);
  part(new THREE.CylinderGeometry(0.2, 0.2, 0.022, 40), mat('#2c2c38'), [0, 0, 0], hat);
  part(new THREE.CylinderGeometry(0.105, 0.125, 0.22, 36), mat('#2c2c38'), [0, 0.12, 0], hat);
  part(new THREE.CylinderGeometry(0.108, 0.108, 0.012, 36), mat('#2c2c38'), [0, 0.232, 0], hat);
  part(new THREE.CylinderGeometry(0.128, 0.132, 0.05, 36), mat('#f2ead2'), [0, 0.045, 0], hat);
  const bk = new THREE.Group(); bk.position.set(0, 0.045, 0.135); hat.add(bk);
  const gm = mat(gold, { metalness: 0.6, roughness: 0.3 });
  part(new THREE.BoxGeometry(0.1, 0.075, 0.012), gm, [0, 0, 0], bk); part(new THREE.BoxGeometry(0.066, 0.042, 0.016), mat('#2c2c38'), [0, 0, 0.002], bk);
  // arms
  const arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.022, black)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, black));
    part(new THREE.SphereGeometry(0.022, 10, 8), mat(black), [0, 0, 0], el);
    part(new THREE.CylinderGeometry(0.03, 0.026, 0.025, 14), mat(white), [0, -ARM + 0.012, 0], el);
    const hand = part(new THREE.SphereGeometry(0.032, 16, 12), mat(skin), [0, -ARM - 0.02, 0], el); hand.scale.set(0.95, 1.1, 0.85);
    hands[k] = hand; sh.add(el); root.add(sh); sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, arms, hands, hat };
  root.userData.pose = ({ headTilt = 0, arms: A = {} } = {}) => {
    head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target), d = t.clone().sub(sh.position);
    const reach = ARM + ARM + 0.02, D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
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
