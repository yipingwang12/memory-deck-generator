// The CRISPR anchor: one chunky CRISP (potato-chip) packet with face, arms, legs.
// Faces +z, feet on y = 0, ~1.1 units tall. createCrisp({ scale = 1, bagColor = '#e8352e' }) -> Group.
// userData.parts = { body, head(face group), arms:{l,r}, legs:{l,r}, hands:{l,r}, chip }  (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a crisp-local point.
// userData.lie(yaw = 0)  lies on its back, resting on y = 0.
import * as THREE from 'three';

const ARM = 0.2, SH = [0.37, 0.66, 0], CY = 0.62, RX = 0.37, RY = 0.43, RZ = 0.2, HIP_Y = 0.2;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function fin(y, flip) {
  const g = new THREE.Group(), n = 11, w = 0.56 / n, silver = mat('#f4c430', { metalness: 0.5, roughness: 0.35 });
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.085, 0.07), silver);
    b.position.set(-0.28 + w * (i + 0.5), 0, 0); b.rotation.x = (i % 2 ? 1 : -1) * 0.18; g.add(b);
  }
  g.position.y = y; return g;
}

function face(group) {
  const z = RZ + 0.004, st = 0.002, ey = CY + 0.14;
  for (const sx of [-1, 1]) {
    const x = sx * 0.125;
    disc(0.092, 0.115, '#ffffff', z, group, x, ey);
    disc(0.07, 0.1, '#3a2416', z + st, group, x, ey - 0.004);
    disc(0.06, 0.05, '#c0782e', z + 2 * st, group, x, ey - 0.04);
    disc(0.036, 0.062, '#120a08', z + 3 * st, group, x, ey - 0.004);
    disc(0.026, 0.026, '#ffffff', z + 4 * st, group, x - 0.024, ey + 0.035);
    disc(0.011, 0.011, '#ffffff', z + 4 * st, group, x - 0.02, ey - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.098, 0.122, 1); lid.position.set(x, ey, z + 5 * st); group.add(lid);
    const b = disc(0.05, 0.028, '#ff6f7f', z, group, sx * 0.235, ey - 0.12); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20, Math.PI), mat('#6a1a1a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, ey - 0.15, z + st); group.add(mouth);
}

function chip() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 24), mat('#ffd24a')); c.rotation.x = Math.PI / 2; g.add(c);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 8, 28), mat('#f0a21c')); g.add(rim);
  for (const [x, y] of [[-0.06, 0.04], [0.05, -0.04], [0.02, 0.08]]) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat('#c47a12')); d.position.set(x, y, 0.016); g.add(d);
  }
  g.position.set(0, CY - 0.17, RZ - 0.01); return g;
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createCrisp({ scale = 1, bagColor = '#e8352e' } = {}) {
  const root = new THREE.Group(), skin = '#ffe0c0';
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat(bagColor, { roughness: 0.4 }));
  body.scale.set(RX, RY, RZ); body.position.y = CY;
  const top = fin(CY + RY - 0.05), bot = fin(CY - RY + 0.05);
  const head = new THREE.Group(); face(head);
  const ch = chip();
  root.add(body, top, bot, head, ch);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.032, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.032, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), mat(skin)));
    const h = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 14), mat('#ffffff'));
    h.add(palm); h.position.y = -ARM - 0.02; el.add(h); hands[k] = h; sh.add(el); root.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.14, HIP_Y + 0.02, 0); hip.add(limb(0.17, 0.03, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#2a5db0')); shoe.scale.set(0.065, 0.045, 0.1);
    shoe.position.set(0, -0.18, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, arms, legs, hands, chip: ch };
  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    root.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  root.userData.lie = (yaw = 0) => { root.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ'); root.position.y = RZ * scale + 0.06; };
  return root;
}
