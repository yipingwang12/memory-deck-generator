// The Kernal anchor: one plump corn KERNEL character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createKernel({ scale = 1, color = '#ffc42b', sprout = false }) -> Group.
// userData.parts = { body, upper, head(face group), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a kernel-local point.
import * as THREE from 'three';

const HIP_Y = 0.2, ARM = 0.17, SH = [0.36, 0.6, 0.02], ZS = 0.88;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
// body radius at height y (crown wide, base tapered)
const rad = (y) => { const t = Math.min(1, Math.max(0, (y - 0.17) / 0.82)); return 0.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.35)), 0.55); };
const zAt = (x, y) => ZS * Math.sqrt(Math.max(0.0001, rad(y) ** 2 - x * x));

function bodyMesh(color) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const y = 0.17 + 0.82 * i / 40; pts.push(new THREE.Vector2(Math.max(rad(y), 0.001), y)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat(color, { roughness: 0.45 }));
  m.scale.z = ZS; return m;
}

function disc(rx, ry, color, x, y, parent, dz = 0, extra = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, zAt(x, y) + 0.004 + dz); m.rotation.x = -0.05; parent.add(m); return m;
}

function face(g, blush) {
  const step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.135, y = 0.66;
    disc(0.095, 0.115, '#ffffff', x, y, g, 0);
    disc(0.075, 0.1, '#3a2416', x, y - 0.006, g, step);
    disc(0.066, 0.045, '#b4753a', x, y - 0.045, g, 2 * step);
    disc(0.042, 0.062, '#120a08', x, y - 0.004, g, 3 * step);
    disc(0.026, 0.026, '#ffffff', x - 0.03, y + 0.04, g, 4 * step);
    disc(0.012, 0.012, '#ffffff', x - 0.02, y - 0.05, g, 4 * step);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.1, 0.12, 1); lid.position.set(x, y, zAt(x, y) + 0.004 + 5 * step); lid.rotation.x = -0.05; g.add(lid);
    if (blush) { const b = disc(0.05, 0.027, '#ff6f7f', sx * 0.24, 0.55, g, 0); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.545, zAt(0, 0.545) + 0.006); g.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(color) {
  const g = new THREE.Group(), p = new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), mat('#fff6e6'));
  p.scale.set(0.95, 1.05, 0.85); g.add(p); g.position.y = -ARM; return g;
}

export function createKernel({ scale = 1, color = '#ffc42b', blush = true, sprout = false } = {}) {
  const root = new THREE.Group(), upper = new THREE.Group(), face_g = new THREE.Group();
  upper.position.y = HIP_Y; const inner = new THREE.Group(); inner.position.y = -HIP_Y; upper.add(inner); root.add(upper);
  const body = bodyMesh(color); inner.add(body, face_g);
  face(face_g, blush);
  // pale tip + crown dimple + side shading ridges
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), mat('#fff0c0')); tip.position.y = 0.2; tip.scale.set(1, 0.9, 0.85); inner.add(tip);
  const dimple = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12), mat('#f0a818')); dimple.scale.set(1.3, 0.35, 0.9); dimple.position.set(0, 0.98, 0.0); inner.add(dimple);
  if (sprout) {
    const green = mat('#4fbf4a'), st = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.16, 8), green); st.position.set(0, 1.07, 0); inner.add(st);
    for (const s of [-1, 1]) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), green); lf.scale.set(1.5, 0.28, 0.7); lf.position.set(s * 0.12, 1.17, 0); lf.rotation.z = s * 0.45; inner.add(lf); }
  }

  const skin = '#f2b866', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.027, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.45; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.14, HIP_Y, 0.02); hip.add(limb(0.17, 0.032, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#d6483c')); shoe.scale.set(0.065, 0.045, 0.1);
    shoe.position.set(0, -0.19, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, upper, head: face_g, arms, legs, hands };

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    upper.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(upper.matrix.clone().invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.2, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
