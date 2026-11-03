// The Merck anchor: a murky-green POND sprite (water dome, lily-pad hat, big anime eyes), reused in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createPond({ scale = 1, water = '#5aa6a0', blush = true }) -> Group.
// userData.parts = { body, head (= whole dome group), arms:{l,r}, legs:{l,r}, hands:{l,r}, pad }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a pond-local point.
import * as THREE from 'three';

const RX = 0.34, RY = 0.4, RZ = 0.32, CY = 0.5, ARM = 0.15, SH = [0.31, 0.5, 0];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const ell = (x, y) => RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - ((y - CY) / RY) ** 2));
const disc = (rx, ry, color, x, y, dz, parent) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, ell(x, y) + dz); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function face(g, blush) {
  for (const s of [-1, 1]) {
    const x = s * 0.115, y = 0.56, st = 0.003;
    disc(0.062, 0.078, '#ffffff', x, y, 0.004, g);
    disc(0.05, 0.068, '#2a4a3a', x, y - 0.004, 0.004 + st, g);
    disc(0.042, 0.032, '#7ec9a0', x, y - 0.03, 0.004 + 2 * st, g);
    disc(0.024, 0.04, '#0c1612', x, y, 0.004 + 3 * st, g);
    disc(0.016, 0.016, '#ffffff', x - 0.016, y + 0.026, 0.004 + 4 * st, g);
    disc(0.007, 0.007, '#ffffff', x - 0.016, y - 0.03, 0.004 + 4 * st, g);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#12261c'));
    lid.scale.set(0.066, 0.082, 1); lid.position.set(x, y, ell(x, y) + 0.004 + 5 * st); g.add(lid);
    if (blush) { const b = disc(0.034, 0.018, '#ff8f9a', s * 0.19, 0.46, 0.003, g); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#6a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.45, ell(0, 0.45) + 0.004); g.add(mouth);
}

export function createPond({ scale = 1, water = '#5aa6a0', blush = true } = {}) {
  const root = new THREE.Group(), dome = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat(water, { roughness: 0.35 }));
  body.scale.set(RX, RY, RZ); body.position.y = CY; dome.add(body);
  face(dome, blush);
  // puddle skirt with ripple rings
  const puddle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.04, 48), mat('#4a8f86', { roughness: 0.3 }));
  puddle.position.y = 0.02; root.add(puddle);
  for (const r of [0.42, 0.48]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 56), mat('#a9dcc0')); t.rotation.x = Math.PI / 2; t.position.y = 0.042; root.add(t); }
  // lily-pad hat + flower + reed
  const pad = new THREE.Group(); pad.position.set(0.0, 0.86, 0.02); pad.rotation.set(-0.12, 0.6, 0.12);
  const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.025, 36, 1, false, 0.6, Math.PI * 2 - 0.5), mat('#4fc060'));
  pad.add(leaf);
  const fl = new THREE.Group(); fl.position.set(0.03, 0.03, 0);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat('#ff9fc0')); p.scale.set(0.04, 0.012, 0.022); const a = i * Math.PI / 3; p.position.set(Math.cos(a) * 0.04, 0.012, Math.sin(a) * 0.04); p.rotation.y = -a; fl.add(p); }
  const ctr = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mat('#ffe066')); ctr.position.y = 0.025; fl.add(ctr);
  pad.add(fl); dome.add(pad);
  for (const [x, h] of [[-0.42, 0.62], [-0.48, 0.46]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, h, 8), mat('#6b8f3a')); st.position.set(x, 0.1 + h / 2, -0.05); st.rotation.z = 0.1; root.add(st);
    const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 12), mat('#7a4a28')); ck.position.set(x - 0.015, 0.1 + h + 0.03, -0.05); root.add(ck);
  }
  root.add(dome);

  const skin = '#a8e0d0', arms = {}, elbows = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0); sh.add(limb(ARM, 0.02, skin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, skin), new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand); hands[k] = hand;
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.14, 0.12, 0.02); hip.add(limb(0.1, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e8a73a')); shoe.scale.set(0.05, 0.035, 0.07); shoe.position.set(0, -0.1, 0.02); hip.add(shoe);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head: dome, arms, legs, hands, pad };

  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    dome.rotation.set(lean, 0, tilt);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
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
