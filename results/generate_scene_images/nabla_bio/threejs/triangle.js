// The Nabla Bio anchor: one thick, downward-pointing TRIANGLE (nabla) with a face, arms and legs.
// Faces +z, feet on y = 0, ~1 unit tall (body y 0.30..1.0). createTriangle({ scale = 1, color = '#ff8a3d', blush = true }) -> Group.
// userData.parts = { body, upper, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a triangle-local point.
import * as THREE from 'three';

const TOP = 1.0, APEX = 0.3, HW = 0.44, HIP_Y = 0.34, SHOULDER = [0.4, 0.92, 0], ARM = 0.17, LEG = 0.28, DEPTH = 0.2, BEV = 0.045;
const CY = (2 * TOP + APEX) / 3;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function triShape(r = 0.07) {
  const V = [[-HW, TOP], [HW, TOP], [0, APEX]], s = new THREE.Shape();
  const toward = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) / l * d, a[1] + (b[1] - a[1]) / l * d]; };
  V.forEach((v, i) => {
    const p = toward(v, V[(i + 2) % 3], r), n = toward(v, V[(i + 1) % 3], r);
    s[i ? 'lineTo' : 'moveTo'](...p); s.quadraticCurveTo(v[0], v[1], ...n);
  });
  s.closePath(); return s;
}

function bodyMesh(color) {
  const g = new THREE.ExtrudeGeometry(triShape(), { depth: DEPTH, bevelEnabled: true, bevelSize: BEV, bevelThickness: BEV, bevelSegments: 4, curveSegments: 10 });
  g.translate(0, 0, -DEPTH / 2);
  return new THREE.Mesh(g, mat(color));
}

function face(group, blush) {
  const z = DEPTH / 2 + BEV + 0.002, step = 0.0015;
  const inset = new THREE.Mesh(new THREE.ShapeGeometry(triShape(0.05), 12), mat('#ffc78f', { roughness: 0.6 }));
  inset.scale.set(0.8, 0.8, 1); inset.position.set(0, CY * 0.2, z + 0.004); group.add(inset);
  for (const sx of [-1, 1]) {
    const x = sx * 0.14, y = 0.8, zz = z + 0.009;
    disc(0.07, 0.092, '#ffffff', zz, group, x, y);
    disc(0.055, 0.082, '#2a3b8f', zz + step, group, x, y - 0.004);
    disc(0.048, 0.04, '#5a86e8', zz + 2 * step, group, x, y - 0.035);
    disc(0.03, 0.05, '#0a0f2a', zz + 3 * step, group, x, y);
    disc(0.02, 0.02, '#ffffff', zz + 4 * step, group, x - 0.02, y + 0.035);
    disc(0.009, 0.009, '#ffffff', zz + 4 * step, group, x + 0.02, y - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#2a1408'));
    lid.scale.set(0.076, 0.1, 1); lid.position.set(x, y, zz + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.04, 0.022, '#ff6f86', zz, group, sx * 0.2, 0.69); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#7a2020'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.64, z + 0.006); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), mat(color));
  th.position.set(0.04, 0.01, 0.02); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createTriangle({ scale = 1, color = '#ff8a3d', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', glove = '#ffffff', body = bodyMesh(color);
  upper.add(body); face(upper, blush);
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.02, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), mat(skin)));
    hands[k] = mitten(glove); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0); hip.add(limb(LEG, 0.03, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8283c')); shoe.scale.set(0.055, 0.045, 0.09);
    shoe.position.set(0, -LEG - 0.01, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, upper, torso, arms, legs, hands };

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean;
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
