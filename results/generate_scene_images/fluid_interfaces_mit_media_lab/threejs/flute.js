// The Fluid Interfaces anchor: one chunky anime FLUTE (sky-blue lacquer, gold keys), re-posed per scene.
// Faces +z, feet on y = 0, ~1.1 units tall. createFlute({ scale = 1, bodyColor = '#6fc3ee', blush = true }) -> Group.
// userData.parts = { body, torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a flute-local point.
import * as THREE from 'three';

const R = 0.15, HIP_Y = 0.27, TOP = 1.25, SHOULDER = [R + 0.005, 0.8, 0], ARM = 0.18;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const gold = () => mat('#f2b632', { metalness: 0.6, roughness: 0.3 });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
/** Sub-group hugging the cylinder at angle a (radians about y), local +z = surface normal. */
const patch = (parent, a, y) => {
  const g = new THREE.Group(); g.rotation.y = a; g.position.set(R * Math.sin(a), y, R * Math.cos(a)); parent.add(g); return g;
};

function tube(color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TOP - HIP_Y, 40), mat(color, { roughness: 0.3 }));
  b.position.y = (TOP + HIP_Y) / 2; g.add(b);
  const band = (y, h, r) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), gold()); c.position.y = y; g.add(c); };
  band(TOP, 0.05, R + 0.012); band(HIP_Y + 0.02, 0.04, R + 0.012); for (const y of [0.62, 0.88, 1.1]) band(y, 0.022, R + 0.008);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R + 0.012, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), gold());
  cap.scale.y = 0.3; cap.position.y = TOP + 0.02; g.add(cap);
  // embouchure: gold lip plate + dark blow hole above the face
  const plate = patch(g, 0, 1.14); disc(0.07, 0.045, '#f2b632', 0.003, plate);
  disc(0.04, 0.024, '#241410', 0.006, plate);
  // key column: gold domes down the front below the mouth
  for (let i = 0; i < 5; i++) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 12), gold()); k.scale.z = 0.55;
    const p = patch(g, 0, 0.5 - i * 0.06); p.add(k);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.007, 8, 24), gold()); p.add(ring);
  }
  return g;
}

function face(group, blush) {
  const step = 0.0015, ey = 0.8;
  for (const sx of [-1, 1]) {
    const p = patch(group, sx * 0.45, ey), z = 0.003;
    disc(0.05, 0.068, '#ffffff', z, p);
    disc(0.04, 0.062, '#1d3f78', z + step, p, 0, -0.003);
    disc(0.036, 0.026, '#5cb4f0', z + 2 * step, p, 0, -0.03);
    disc(0.022, 0.04, '#0a1226', z + 3 * step, p, 0, -0.002);
    disc(0.014, 0.014, '#ffffff', z + 4 * step, p, -0.014, 0.025);
    disc(0.006, 0.006, '#ffffff', z + 4 * step, p, 0.014, -0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#101820'));
    lid.scale.set(0.054, 0.072, 1); lid.position.z = z + 5 * step; p.add(lid);
    if (blush) { const q = patch(group, sx * 0.7, 0.71); const b = disc(0.03, 0.016, '#ff7f8f', 0.003, q); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const m = patch(group, 0, 0.705);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.z = 0.005; m.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), mat(color));
  th.position.set(0.038, 0.007, 0.015); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createFlute({ scale = 1, bodyColor = '#6fc3ee', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = tube(bodyColor), head = new THREE.Group();
  head.position.y = 0.8; const inner = new THREE.Group(); inner.position.y = -0.8; head.add(inner);
  face(inner, blush); upper.add(body, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.017, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.09, HIP_Y, 0); hip.add(limb(0.2, 0.026, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e0584a')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -0.22, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head, arms, legs, hands };

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
