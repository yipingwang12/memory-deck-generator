// The Cognixion anchor: one procedural COG (gear wheel) character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createCog({ scale = 1, color = '#f2a51d', teeth = 12, blush = true }) -> Group.
// userData.parts = { wheel, arms:{l,r}, legs:{l,r}, hands:{l,r}, centerY }   (l = +x side)
// userData.pose({ spin, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out; spin = roll of wheel (z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a cog-local point (elbow bends back/out).
import * as THREE from 'three';

const R = 0.34, CY = 0.64, DEPTH = 0.16, BEV = 0.014, FRONT = DEPTH / 2 + BEV, ARM = 0.15, HIP_Y = 0.3;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function gearGeometry(teeth) {
  const s = new THREE.Shape(), ri = R * 0.84, ro = R, n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, phase = i % 4, r = (phase === 1 || phase === 2) ? ro : ri;
    const aa = a - Math.PI / n * 0.0;
    s[i ? 'lineTo' : 'moveTo'](r * Math.cos(aa), r * Math.sin(aa));
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: DEPTH - 2 * BEV, bevelEnabled: true, bevelSize: BEV, bevelThickness: BEV, bevelSegments: 3 });
  g.translate(0, 0, -(DEPTH - 2 * BEV) / 2);
  return g;
}

function face(group, blush) {
  const z = FRONT + 0.001, step = 0.0015, hubR = R * 0.74;
  disc(hubR, hubR, '#ffe9a8', z, group);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(hubR, 0.012, 8, 48), mat('#b9710f'));
  ring.position.z = z; group.add(ring);
  for (const sx of [-1, 1]) {
    const x = sx * 0.085, y = 0.03;
    disc(0.056, 0.07, '#ffffff', z + step, group, x, y);
    disc(0.046, 0.064, '#3a2416', z + 2 * step, group, x, y - 0.004);
    disc(0.04, 0.03, '#b4753a', z + 3 * step, group, x, y - 0.03);
    disc(0.023, 0.036, '#120a08', z + 4 * step, group, x, y);
    disc(0.015, 0.015, '#ffffff', z + 5 * step, group, x - 0.017, y + 0.026);
    disc(0.007, 0.007, '#ffffff', z + 5 * step, group, x - 0.017, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.06, 0.074, 1); lid.position.set(x, y, z + 6 * step); group.add(lid);
    if (blush) { const b = disc(0.034, 0.02, '#ff7f8f', z + step, group, sx * 0.14, -0.065); b.material.transparent = true; b.material.opacity = 0.55; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.075, z + 2 * step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), mat(color));
  th.position.set(0.028, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createCog({ scale = 1, color = '#f2a51d', teeth = 12, blush = true } = {}) {
  const root = new THREE.Group(), wheel = new THREE.Group();
  wheel.position.y = CY; root.add(wheel);
  wheel.add(new THREE.Mesh(gearGeometry(teeth), mat(color, { roughness: 0.4, metalness: 0.15 })));
  face(wheel, blush);

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (R * 0.9), CY - 0.02, 0);
    sh.add(limb(ARM, 0.013, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.013, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); root.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0); hip.add(limb(0.24, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.04, 0.034, 0.065);
    shoe.position.set(0, -0.27, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { wheel, arms, legs, hands, centerY: CY };

  root.userData.pose = ({ spin = 0, arms: A = {}, legs: L = {} } = {}) => {
    wheel.rotation.z = spin;
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
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
