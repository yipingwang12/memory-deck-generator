// Beam anchor: a steel I-BEAM GIRDER with hard hat, big anime eyes, arms and legs. Faces +z, feet on y = 0, ~1.08 tall.
// createGirder({ scale = 1, color = '#ee6a1f', blush = true }) -> Group.
// userData.parts = { body, torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a girder-local point.
import * as THREE from 'three';

const W = 0.36, D = 0.30, FT = 0.055, WT = 0.07, H = 0.68, HIP_Y = 0.27, ARM = 0.2, SHOULDER = [0.215, 0.82, 0];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function iBeam(color) {
  const a = W / 2, b = D / 2, w = WT / 2, s = new THREE.Shape();
  [[-a, b], [a, b], [a, b - FT], [w, b - FT], [w, -b + FT], [a, -b + FT], [a, -b], [-a, -b], [-a, -b + FT], [-w, -b + FT], [-w, b - FT], [-a, b - FT]]
    .forEach(([x, y], i) => s[i ? 'lineTo' : 'moveTo'](x, y));
  const bv = 0.012, g = new THREE.ExtrudeGeometry(s, { depth: H - 2 * bv, bevelEnabled: true, bevelSize: bv, bevelThickness: bv, bevelSegments: 3 });
  g.center(); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat(color, { metalness: 0.25 })); m.position.y = HIP_Y + H / 2; return m;
}

function hardHat() {
  const g = new THREE.Group(), yel = mat('#ffd21f', { roughness: 0.35 });
  const pts = [[0, 0], [0.2, 0], [0.21, 0.015], [0.19, 0.03], [0.17, 0.06], [0.12, 0.1], [0.05, 0.125], [0, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
  const dome = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), yel); dome.scale.set(1, 1, 0.85);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.014, 32), yel); brim.scale.set(1, 1, 1.0); brim.position.set(0, 0.004, 0.11);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.34), mat('#f1b800')); ridge.position.set(0, 0.12, 0);
  g.add(dome, brim, ridge); g.position.y = HIP_Y + H + 0.012; return g;
}

function face(group, blush) {
  const z = D / 2 + 0.013 + 0.002, st = 0.0015, ey = HIP_Y + H - 0.2;
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = ey;
    disc(0.062, 0.078, '#ffffff', z, group, x, y);
    disc(0.05, 0.07, '#2a4a8a', z + st, group, x, y - 0.004);
    disc(0.044, 0.03, '#5fa0e8', z + 2 * st, group, x, y - 0.034);
    disc(0.026, 0.04, '#0a0f1c', z + 3 * st, group, x, y);
    disc(0.017, 0.017, '#ffffff', z + 4 * st, group, x - 0.017, y + 0.026);
    disc(0.008, 0.008, '#ffffff', z + 4 * st, group, x - 0.014, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.066, 0.082, 1); lid.position.set(x, y, z + 5 * st); group.add(lid);
    if (blush) { const b = disc(0.034, 0.018, '#ff6f7f', z, group, sx * 0.14, ey - 0.095); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#6a1f1f'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, ey - 0.115, z + st); group.add(mouth);
}

function rivets(group) {
  const m = mat('#9aa3ad', { metalness: 0.6, roughness: 0.3 }), z = D / 2 + 0.013;
  for (const x of [-0.14, 0.14]) for (const y of [HIP_Y + 0.05, HIP_Y + H - 0.06, HIP_Y + 0.3])
    { const r = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), m); r.scale.z = 0.5; r.position.set(x, y, z); group.add(r); }
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color, { metalness: 0.3 })); m.geometry.translate(0, -len / 2, 0); return m; };
function glove() {
  const g = new THREE.Group(), m = mat('#ffd21f'), palm = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 14), m);
  palm.scale.set(1, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), m); th.position.set(0.045, 0.01, 0.02);
  g.add(palm, th); g.position.y = -ARM; return g;
}

export function createGirder({ scale = 1, color = '#ee6a1f', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const body = iBeam(color), head = new THREE.Group(); head.position.y = HIP_Y + H - 0.2; const inner = new THREE.Group(); inner.position.y = -(HIP_Y + H - 0.2); head.add(inner);
  inner.add(hardHat()); face(inner, blush); rivets(inner);
  upper.add(body, head);
  const steel = '#5b6573', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.022, steel)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.022, steel));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mat('#9aa3ad', { metalness: 0.5 })));
    hands[k] = glove(); el.add(hands[k]); sh.add(el); upper.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0); hip.add(limb(0.2, 0.03, steel));
    const boot = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#3a2a22')); boot.scale.set(0.062, 0.045, 0.1); boot.position.set(0, -0.22, 0.03); hip.add(boot);
    root.add(hip); legs[k] = hip;
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
    const d = t.clone().sub(sh.position), D2 = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D2 / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D2).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
