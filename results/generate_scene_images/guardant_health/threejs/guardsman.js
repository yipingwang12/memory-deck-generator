// Guardant anchor: royal GUARDSMAN in a bearskin hat. Faces +z, feet on y=0, ~1 unit tall (to hat top ~1.1).
// createGuardsman({ scale = 1 }) -> Group. userData.parts = { head, hat, arms:{l,r}, hands:{l,r}, legs:{l,r} } (l = +x side)
// userData.pose({ headTilt, headYaw, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a guardsman-local point.
import * as THREE from 'three';

const ARM = 0.14, SHOULDER = [0.17, 0.63, 0];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const sph = (parent, color, pos, scl, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat(color, extra)); m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const cyl = (parent, color, rt, rb, h, pos, extra) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 28), mat(color, extra)); m.position.set(...pos); parent.add(m); return m;
};

function face(head) {
  const z = 0.1, st = 0.0015;
  for (const s of [-1, 1]) {
    const x = s * 0.045, y = 0.0;
    disc(0.03, 0.038, '#ffffff', z, head, x, y);
    disc(0.023, 0.033, '#3a2a1a', z + st, head, x, y - 0.002);
    disc(0.02, 0.015, '#5b86b8', z + 2 * st, head, x, y - 0.014);
    disc(0.011, 0.018, '#0c0a10', z + 3 * st, head, x, y);
    disc(0.0075, 0.0075, '#ffffff', z + 4 * st, head, x - 0.008, y + 0.012);
    disc(0.0035, 0.0035, '#ffffff', z + 4 * st, head, x - 0.008, y - 0.014);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#2a1a10'));
    lid.scale.set(0.032, 0.04, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.007, 0.006), mat('#4a3020')); br.position.set(x, y + 0.058, z - 0.008); br.rotation.z = -s * 0.12; head.add(br);
    const b = disc(0.017, 0.009, '#ff8a8a', z - 0.004, head, s * 0.07, -0.04); b.material.transparent = true; b.material.opacity = 0.5;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 8, 20, Math.PI), mat('#8a3030'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.058, z - 0.012); head.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createGuardsman({ scale = 1 } = {}) {
  const root = new THREE.Group(), RED = '#c8202a', GOLD = '#e2b13c', WHITE = '#f4f1ea', NAVY = '#23304f', SKIN = '#ffdcbc';
  // torso: tunic
  const tunic = sph(root, RED, [0, 0.46, 0], [0.19, 0.22, 0.13]);
  cyl(root, RED, 0.17, 0.2, 0.2, [0, 0.4, 0]);
  cyl(root, '#3a2a1a', 0.2, 0.2, 0.035, [0, 0.33, 0]);   // belt
  cyl(root, GOLD, 0.2, 0.2, 0.012, [0, 0.33, 0]).scale.set(1.02, 1, 1.02);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.01), mat(GOLD, { metalness: 0.7, roughness: 0.3 })); buckle.position.set(0, 0.33, 0.135); root.add(buckle);
  for (const s of [-1, 1]) { // white crossbelts
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.46, 0.012), mat(WHITE)); sash.position.set(0, 0.5, 0.125); sash.rotation.z = s * 0.45; sash.scale.y = 0.95; root.add(sash);
  }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) sph(root, GOLD, [s * 0.075, 0.57 - i * 0.065, 0.122], [0.012, 0.012, 0.008], { metalness: 0.7 });
  // shoulders + epaulettes
  for (const s of [-1, 1]) { sph(root, RED, [s * 0.17, 0.62, 0], [0.065, 0.06, 0.06]); sph(root, GOLD, [s * 0.18, 0.66, 0], [0.06, 0.018, 0.05], { metalness: 0.6 }); }
  // legs: dark trousers + boots
  const legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.075, 0.3, 0); root.add(hip);
    const l = limb(0.24, 0.045, NAVY); hip.add(l);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.2, 0.09), mat(RED)); stripe.position.set(s * 0.044, -0.12, 0); hip.add(stripe);
    sph(hip, '#16161c', [0, -0.27, 0.02], [0.05, 0.035, 0.08], { roughness: 0.3 });
    legs[k] = hip;
  }
  // head
  const head = new THREE.Group(); head.position.y = 0.78; root.add(head);
  sph(head, SKIN, [0, 0, 0], [0.115, 0.11, 0.108]);
  face(head);
  sph(head, '#6a4425', [0, 0.065, -0.02], [0.118, 0.07, 0.108]);     // hair under hat
  sph(head, '#6a4425', [0, 0.02, -0.07], [0.115, 0.1, 0.06]);
  // bearskin hat: tall furry black cylinder
  const hat = new THREE.Group(); hat.position.y = 0.06; head.add(hat);
  const fur = mat('#1d1a1c', { roughness: 0.95 });
  const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.27, 28), fur); hm.position.y = 0.13; hat.add(hm);
  sph(hat, '#1d1a1c', [0, 0.262, 0], [0.115, 0.045, 0.115], { roughness: 0.95 });
  sph(hat, '#1d1a1c', [0, 0.01, 0], [0.145, 0.03, 0.145], { roughness: 0.95 });
  const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.1, 10), mat(WHITE)); plume.position.set(0.1, 0.2, 0.0); hat.add(plume);
  sph(hat, WHITE, [0.1, 0.255, 0], [0.025, 0.02, 0.025]);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.007, 8, 30, Math.PI), mat(GOLD, { metalness: 0.6 })); strap.position.set(0, -0.03, 0.01); strap.rotation.set(Math.PI, 0, 0); strap.scale.set(1, 1.1, 1); hat.add(strap);

  // arms
  const arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.026, RED)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.023, RED));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), mat(RED)));
    const cuff = cyl(el, WHITE, 0.027, 0.027, 0.03, [0, -ARM + 0.02, 0]);
    const hand = new THREE.Group(); const palm = sph(hand, '#f6f6f2', [0, 0, 0], [0.032, 0.036, 0.028]); hand.position.y = -ARM - 0.015;
    el.add(hand); hands[k] = hand; sh.add(el); root.add(sh);
    sh.rotation.z = s * 0.14; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, hat, arms, hands, legs };
  root.userData.pose = ({ headTilt = 0, headYaw = 0, arms: A = {}, legs: L = {} } = {}) => {
    head.rotation.z = headTilt; head.rotation.y = headYaw;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.3, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
