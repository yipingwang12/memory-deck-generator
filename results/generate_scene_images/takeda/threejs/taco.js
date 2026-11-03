// The Takeda anchor: a TACO character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~0.8 tall. createTaco({ scale = 1, shell = '#f1b744', blush = true }) -> Group.
// userData.parts = { body, torso, head (=torso face group), arms:{l,r}, legs:{l,r}, hands:{l,r}, filling }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a taco-local point.
// userData.setFilling(bool)  show/hide the filling on top.
import * as THREE from 'three';

const R = 0.45, CY = 0.66, DEPTH = 0.3, HIP_Y = 0.24, ARM = 0.16, SH = [0.4, 0.52, 0.0];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function shellBody(color) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, Math.PI, 2 * Math.PI, false); s.lineTo(-R, 0);
  const b = 0.03;
  const g = new THREE.ExtrudeGeometry(s, { depth: DEPTH - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 40 });
  g.translate(0, 0, -(DEPTH - 2 * b) / 2);
  const m = new THREE.Mesh(g, mat(color)); m.position.y = CY; return m;
}

function filling() {
  const g = new THREE.Group(), r = [[-0.3, 0x3fae3a, 0.1], [-0.15, 0xe5392b, 0.09], [0, 0xf6d044, 0.1], [0.15, 0x3fae3a, 0.1], [0.3, 0xe5392b, 0.085], [0.0, 0x3fae3a, 0.09]];
  r.forEach(([x, c, rad], i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), mat(c, { roughness: 0.5 }));
    m.scale.set(1.2, 0.8, 1); m.position.set(x, CY + 0.03 + (i === 5 ? 0.07 : 0), (i % 2 ? 0.05 : -0.05)); g.add(m);
  });
  return g;
}

function face(group, blush) {
  const z = DEPTH / 2 + 0.002, step = 0.0015, y = CY - 0.14;
  for (const sx of [-1, 1]) {
    const x = sx * 0.14;
    disc(0.075, 0.095, '#ffffff', z, group, x, y);
    disc(0.06, 0.082, '#3a2416', z + step, group, x, y - 0.004);
    disc(0.05, 0.04, '#b4753a', z + 2 * step, group, x, y - 0.035);
    disc(0.03, 0.048, '#120a08', z + 3 * step, group, x, y - 0.003);
    disc(0.02, 0.02, '#ffffff', z + 4 * step, group, x - 0.02, y + 0.03);
    disc(0.009, 0.009, '#ffffff', z + 4 * step, group, x - 0.02, y - 0.035);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.08, 0.1, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.045, 0.024, '#ff6f6f', z, group, sx * 0.25, y - 0.1); b.material.transparent = true; b.material.opacity = 0.55; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, y - 0.15, z + step); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), mat(color));
  th.position.set(0.034, 0.006, 0.014); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createTaco({ scale = 1, shell = '#f1b744', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = shellBody(shell), fill = filling();
  const faceG = new THREE.Group(); face(faceG, blush);
  upper.add(body, fill, faceG);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.14, HIP_Y, 0); hip.add(limb(0.17, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -0.19, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head: faceG, arms, legs, hands, filling: fill };
  root.userData.setFilling = (v) => { fill.visible = v; };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; torso.rotation.z = headTilt;
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
