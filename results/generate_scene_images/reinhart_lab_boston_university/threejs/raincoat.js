// Reinhart anchor: a yellow RAINCOAT character with hood, anime face, arms and boots.
// Faces +z, feet y=0, ~1.1 tall. createRaincoat({ scale=1, color='#ffcc1f' }) -> Group.
// userData.parts = { coat, head, hood, arms:{l,r}, hands:{l,r}, legs:{l,r} }  (l = +x)
// userData.pose({ headTilt, headYaw, arms:{l:[x,z,elbowX], r}, legs:{l:[x,z], r} })
// userData.reach('l'|'r',[x,y,z]) two-bone IK to a raincoat-local point.
import * as THREE from 'three';

const ARM = 0.14, SH = [0.2, 0.62, 0], HR = 0.17, HY = 0.86;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, c, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(c, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 14), mat(c)); m.geometry.translate(0, -len / 2, 0); return m; };

function face(head) {
  const zAt = (x, y) => Math.sqrt(HR * HR - x * x - (y - HY) ** 2) + 0.002, st = 0.0012;
  for (const sx of [-1, 1]) {
    const x = sx * 0.06, y = HY + 0.01, z = zAt(x, y);
    disc(0.04, 0.052, '#ffffff', z, head, x, y);
    disc(0.032, 0.046, '#2a4a8a', z + st, head, x, y - 0.002);
    disc(0.028, 0.022, '#5fa8e8', z + 2 * st, head, x, y - 0.02);
    disc(0.017, 0.028, '#0b1020', z + 3 * st, head, x, y);
    disc(0.011, 0.011, '#fff', z + 4 * st, head, x - 0.012, y + 0.018);
    disc(0.005, 0.005, '#fff', z + 4 * st, head, x - 0.012, y - 0.02);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.043, 0.055, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    const b = disc(0.024, 0.013, '#ff7f8f', zAt(sx * 0.1, HY - 0.04), head, sx * 0.1, HY - 0.04);
    b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, HY - 0.075, zAt(0, HY - 0.07) + 0.004); head.add(mouth);
}

export function createRaincoat({ scale = 1, color = '#ffcc1f' } = {}) {
  const root = new THREE.Group(), skin = '#ffe0c0', dark = '#d99a00';
  const prof = [[0.001, 0.2], [0.27, 0.2], [0.275, 0.225], [0.23, 0.4], [0.19, 0.58], [0.16, 0.7], [0.1, 0.73], [0.001, 0.73]].map(([x, y]) => new THREE.Vector2(x, y));
  const coat = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), mat(color)); root.add(coat);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.014, 8, 40), mat(dark)); hem.rotation.x = Math.PI / 2; hem.position.y = 0.215; root.add(hem);
  for (let i = 0; i < 4; i++) { // button placket
    const y = 0.3 + i * 0.1, r = 0.235 - i * 0.017;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 10), mat('#c8483c')); b.position.set(0, y, r); root.add(b);
  }
  const head = new THREE.Group(); head.position.y = HY; root.add(head);
  const hi = new THREE.Group(); hi.position.y = -HY; head.add(hi);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(HR, 36, 28), mat(skin, { roughness: 0.7 })); skull.position.y = HY; hi.add(skull);
  face(hi);
  const hood = new THREE.Group(); hi.add(hood);
  const gap = 0.5, shell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 28, Math.PI - gap, Math.PI * 2 - (Math.PI - 2 * gap)), mat(color));
  shell.material.side = THREE.DoubleSide; shell.position.set(0, HY + 0.005, -0.02); hood.add(shell);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.02, 10, 32, Math.PI * 1.0), mat(color)); brim.position.set(0, HY - 0.02, 0.045); brim.rotation.x = -0.25; hood.add(brim);
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 24), mat(dark)); cord.rotation.x = Math.PI / 2; cord.position.y = 0.715; root.add(cord);
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 10, 28), mat(color)); hoodCollar.rotation.x = Math.PI / 2; hoodCollar.position.y = 0.72; root.add(hoodCollar);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.036, color)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.034, color));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mat(color)));
    const hd = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 14), mat(skin)); palm.scale.set(0.95, 1.1, 0.85);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)); th.position.set(s * -0.03, 0.005, 0.015);
    hd.add(palm, th); hd.position.y = -ARM - 0.01; el.add(hd); hands[k] = hd;
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.2, 0); hip.add(limb(0.12, 0.028, skin));
    const boot = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); boot.scale.set(0.058, 0.055, 0.09); boot.position.set(0, -0.14, 0.025); hip.add(boot);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), mat('#c8483c')); cuff.position.y = -0.09; hip.add(cuff);
    root.add(hip); legs[k] = hip;
  }
  root.position.y = 0.0; const inner = new THREE.Group(); // lift so boots touch y=0
  while (root.children.length) inner.add(root.children[0]);
  root.add(inner);
  inner.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { coat, head, hood, arms, hands, legs };
  root.userData.pose = ({ headTilt = 0, headYaw = 0, arms: A = {}, legs: L = {} } = {}) => {
    head.rotation.set(0, headYaw, headTilt);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target).sub(inner.position);
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
