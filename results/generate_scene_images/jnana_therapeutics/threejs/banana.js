// The Jnana anchor: one procedural BANANA with a big-eyed anime face, arms and legs, re-posed in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createBanana({ scale = 1, green = 0 }) -> Group.  green 0..1 = unripe tint.
// userData.parts = { body, upper, arms:{l,r}, hands:{l,r}, legs:{l,r} }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; lean = pitch about hips, tilt = roll.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: glove to a banana-local point (elbow bends back/out).
import * as THREE from 'three';

const HIP_Y = 0.27, ARM = 0.17, LEG = 0.22, T_SH = 0.5;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const cx = (t) => -0.13 * Math.sin(Math.PI * t) + 0.06 * t;
const cy = (t) => 0.26 + 0.74 * t;
const rad = (t) => 0.03 + 0.14 * Math.pow(Math.sin(Math.PI * t), 0.55);

const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function bodyMesh(green) {
  const N = 48, M = 24, pos = [], col = [], idx = [];
  const yellow = new THREE.Color('#ffd51f'), leaf = new THREE.Color('#a8c43a'), c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const t = i / N, dx = -0.13 * Math.PI * Math.cos(Math.PI * t) + 0.06, dy = 0.74;
    const L = Math.hypot(dx, dy), B = [dy / L, -dx / L]; // in-plane perpendicular (to the +x side)
    c.copy(yellow).lerp(leaf, Math.min(1, green + 0.5 * Math.pow(Math.abs(2 * t - 1), 4)));
    for (let j = 0; j < M; j++) {
      const a = j / M * Math.PI * 2, r = rad(t) * (1 + 0.035 * Math.cos(5 * a));
      pos.push(cx(t) + r * Math.cos(a) * B[0], cy(t) + r * Math.cos(a) * B[1], r * Math.sin(a));
      const sh = 1 - 0.06 * Math.cos(5 * a); col.push(c.r * sh, c.g * sh, c.b * sh);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, d = (i + 1) * M + j, e = (i + 1) * M + (j + 1) % M;
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }));
}

function face(group) {
  const T = 0.58, R = rad(T) * 0.97, x0 = cx(T), y0 = cy(T), step = 0.0015;
  for (const sx of [-1, 1]) {
    const dx = sx * 0.063, a = Math.asin(dx / R), eg = new THREE.Group();
    eg.position.set(x0 + dx, y0 + 0.02, R * Math.cos(a) + 0.004); eg.rotation.y = a; group.add(eg);
    disc(0.056, 0.07, '#ffffff', 0, eg);
    disc(0.045, 0.062, '#3a2416', step, eg, 0, -0.003);
    disc(0.04, 0.03, '#b4753a', 2 * step, eg, 0, -0.025);
    disc(0.024, 0.036, '#120a08', 3 * step, eg, 0, -0.003);
    disc(0.016, 0.016, '#ffffff', 4 * step, eg, -0.017, 0.022);
    disc(0.007, 0.007, '#ffffff', 4 * step, eg, -0.015, -0.028);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#2a1a0a'));
    lid.scale.set(0.06, 0.075, 1); lid.position.set(0, 0, 5 * step); eg.add(lid);
    const b = disc(0.03, 0.017, '#ff7f8f', 0, eg, sx * 0.03, -0.088); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mg = new THREE.Group(); mg.position.set(x0, y0 - 0.075, R + 0.003); group.add(mg);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mg.add(mouth);
  const tongue = disc(0.016, 0.01, '#ff8a8a', 0.001, mg, 0, -0.026);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function glove() {
  const g = new THREE.Group(), w = '#ffffff';
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(w)); palm.scale.set(0.95, 1.1, 0.85);
  const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat(w)); th.position.set(0.034, 0.008, 0.012);
  g.add(palm, th); g.position.y = -ARM; return g;
}

export function createBanana({ scale = 1, green = 0 } = {}) {
  const root = new THREE.Group(), upper = new THREE.Group(), skin = '#4a2e1c';
  upper.position.y = HIP_Y; const inner = new THREE.Group(); inner.position.y = -HIP_Y; upper.add(inner); root.add(upper);
  const body = bodyMesh(green); inner.add(body);
  face(inner);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 14), mat('#6b5a22'));
  const top = new THREE.Vector3(-0.13 * Math.PI * Math.cos(Math.PI) + 0.06, 0.74, 0).normalize();
  stem.position.set(cx(1) + top.x * 0.05, cy(1) + 0.05, 0); stem.rotation.z = -Math.atan2(top.x, top.y);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), mat('#3a2a14')); cap.position.set(cx(1) + top.x * 0.11, cy(1) + 0.11, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 14, 10), mat('#2e2216')); tip.position.set(cx(0), cy(0) - 0.01, 0);
  inner.add(stem, cap, tip);

  const arms = {}, elbows = {}, hands = {}, legs = {};
  const shY = cy(T_SH), shR = rad(T_SH) - 0.01;
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(cx(T_SH) + s * shR, shY, 0);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = glove(); el.add(hands[k]); sh.add(el); inner.add(sh);
    sh.rotation.z = s * 0.7; el.rotation.z = -s * 0.5; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(cx(0.04) + s * 0.07, HIP_Y, 0); hip.add(limb(LEG, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#d0382c')); shoe.scale.set(0.05, 0.04, 0.085);
    shoe.position.set(0, -LEG - 0.01, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, upper, arms, hands, legs };

  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    upper.rotation.set(lean, 0, tilt);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(upper.matrix.clone().invert()).add(new THREE.Vector3(0, HIP_Y, 0));
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
