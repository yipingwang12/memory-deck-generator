// Thermo Fisher anchor: one THERMOS flask character. Faces +z, feet y=0, ~1 unit tall.
// createThermos({ scale=1, bodyColor='#d8372c', blush=true }) -> Group. Same API as pencil.js:
// userData.parts, pose({lean,headTilt,arms:{l:[x,z,elbowX],r},legs:{l:[x,z],r}}), reach('l'|'r',[x,y,z]).
import * as THREE from 'three';
const R = 0.14, HIP_Y = 0.25, SHOULDER = [0.15, 0.6, 0], ARM = 0.13, FACE_Y = 0.6;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const zOn = (x) => Math.sqrt(R * R - x * x);
const disc = (rx, ry, color, x, y, z, parent) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
function bodyMesh(color) {
  const pts = [[0, 0.2], [0.1, 0.2], [0.135, 0.225], [R, 0.27], [R, 0.8], [0.13, 0.84], [0.12, 0.86], [0, 0.86]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat(color, { roughness: 0.35, metalness: 0.2 }));
}
function cap() {
  const g = new THREE.Group(), steel = mat('#dfe4ea', { metalness: 0.7, roughness: 0.28 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.138, 0.13, 40), steel); cup.position.y = 0.93;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.139, 0.012, 10, 40), steel); ring.rotation.x = Math.PI / 2; ring.position.y = 0.87;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat('#2b2b30')); knob.position.y = 1.0; knob.scale.y = 0.7;
  g.add(cup, ring, knob); return g;
}
function face(group, blush) {
  const step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.045, y = FACE_Y, z = zOn(x) + 0.002;
    disc(0.03, 0.039, '#ffffff', x, y, z, group);
    disc(0.0235, 0.033, '#3a2416', x, y - 0.002, z + step, group);
    disc(0.02, 0.015, '#b4753a', x, y - 0.014, z + 2 * step, group);
    disc(0.011, 0.018, '#120a08', x, y, z + 3 * step, group);
    disc(0.0078, 0.0078, '#ffffff', x - 0.008, y + 0.012, z + 4 * step, group);
    disc(0.0036, 0.0036, '#ffffff', x - 0.008, y - 0.014, z + 4 * step, group);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.032, 0.04, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const bx = sx * 0.075, b = disc(0.017, 0.009, '#ffb0b8', bx, 0.56, zOn(bx) + 0.002, group); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 8, 20, Math.PI), mat('#5a1a1a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.555, zOn(0) + 0.003); group.add(mouth);
}
const limb = (len, r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(c)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(c) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mat(c));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mat(c));
  th.position.set(0.025, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}
export function createThermos({ scale = 1, bodyColor = '#d8372c', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = bodyMesh(bodyColor), head = new THREE.Group();
  head.position.y = 0.86; const inner = new THREE.Group(); inner.position.y = -0.86; head.add(inner); inner.add(cap());
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.05, 48), mat('#dfe4ea', { metalness: 0.7, roughness: 0.3 })); band.position.y = 0.3;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.002, R + 0.002, 0.03, 48), mat('#f5f0e6')); stripe.position.y = 0.76;
  upper.add(body, band, stripe, head); face(upper, blush);
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.011, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.011, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh); sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0); hip.add(limb(0.21, 0.018, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#2f4fa0')); shoe.scale.set(0.034, 0.03, 0.055);
    shoe.position.set(0, -0.22, 0.018); hip.add(shoe); root.add(hip); legs[k] = hip;
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
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
