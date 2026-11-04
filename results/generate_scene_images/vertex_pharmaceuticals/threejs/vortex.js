// The Vertex anchor: VORTEX, a solid spiral whirlpool cone with banded ridges, face, arms and legs.
// Faces +z, feet on y = 0, ~1 unit tall (top rim y = 1). createVortex({ scale = 1 }) -> Group.
// userData.parts = { body, face, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, spin })  radians; spin = body yaw about its axis
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a vortex-local point.
import * as THREE from 'three';

const Y0 = 0.24, Y1 = 1.0, ARM = 0.16, T_SH = 0.72;
const radius = (t) => 0.05 + 0.29 * Math.pow(t, 0.8);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Spiral cone: ridges and colour bands wind 4.5 turns from tip to rim. */
function spiralBody() {
  const NA = 96, NT = 90, pos = [], col = [], idx = [];
  const palette = [new THREE.Color('#1b4fd1'), new THREE.Color('#2f8bf0'), new THREE.Color('#5fd0f5'), new THREE.Color('#eaffff')];
  for (let j = 0; j <= NT; j++) {
    const t = j / NT;
    for (let i = 0; i <= NA; i++) {
      const th = (i / NA) * Math.PI * 2, phase = 4.5 * t - i / NA, f = phase - Math.floor(phase);
      const r = radius(t) * (1 + 0.1 * Math.sin(f * Math.PI * 2 - 0.6) * Math.min(1, t * 4));
      pos.push(r * Math.sin(th), Y0 + (Y1 - Y0) * t, r * Math.cos(th));
      const c = f < 0.5 ? palette[0].clone().lerp(palette[1], f * 2) : f < 0.78 ? palette[1].clone().lerp(palette[2], (f - 0.5) / 0.28) : palette[2].clone().lerp(palette[3], (f - 0.78) / 0.22);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < NT; j++) for (let i = 0; i < NA; i++) {
    const a = j * (NA + 1) + i, b = a + NA + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat('#ffffff', { vertexColors: true, roughness: 0.4, side: THREE.DoubleSide }));
}

function face(group) {
  const t = 0.58, y = Y0 + (Y1 - Y0) * t, r = radius(t), z0 = r * 0.82;
  const plate = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#e8fbff', { roughness: 0.5 }));
  plate.scale.set(0.2, 0.15, 0.09); plate.position.set(0, y, z0); group.add(plate);
  const z = z0 + 0.088, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.07, ey = y + 0.015;
    disc(0.05, 0.065, '#ffffff', z, group, x, ey);
    disc(0.04, 0.056, '#16337a', z + step, group, x, ey - 0.003);
    disc(0.034, 0.026, '#2fa8e8', z + 2 * step, group, x, ey - 0.026);
    disc(0.02, 0.03, '#06122e', z + 3 * step, group, x, ey);
    disc(0.0135, 0.0135, '#ffffff', z + 4 * step, group, x - 0.014, ey + 0.022);
    disc(0.0065, 0.0065, '#ffffff', z + 4 * step, group, x - 0.012, ey - 0.024);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#0c1a40'));
    lid.scale.set(0.054, 0.069, 1); lid.position.set(x, ey, z + 5 * step); group.add(lid);
    const b = disc(0.026, 0.014, '#ff7f9f', z, group, sx * 0.115, y - 0.05); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2040'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, y - 0.07, z + step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

export function createVortex({ scale = 1 } = {}) {
  const root = new THREE.Group(), skin = '#f2fbff';
  const body = spiralBody(); root.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius(1) * 1.04, 0.022, 10, 64), mat('#eaffff'));
  rim.rotation.x = Math.PI / 2; rim.position.y = Y1; root.add(rim);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(radius(1), 48), mat('#1d5fd8')); pool.rotation.x = -Math.PI / 2; pool.position.y = Y1 - 0.01; root.add(pool);
  for (let k = 0; k < 2; k++) { const w = new THREE.Mesh(new THREE.TorusGeometry(radius(1) * (0.7 - k * 0.35), 0.012, 8, 48), mat('#bff1ff')); w.rotation.x = Math.PI / 2; w.position.y = Y1 - 0.005; root.add(w); }
  const faceG = new THREE.Group(); root.add(faceG); face(faceG);

  const sy = Y0 + (Y1 - Y0) * T_SH, sx = radius(T_SH) * 0.96;
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * sx, sy, 0.02);
    sh.add(limb(ARM, 0.027, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand);
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.9; arms[k] = sh; elbows[k] = el; hands[k] = hand;
    const hip = new THREE.Group(); hip.position.set(s * 0.035, Y0 + 0.02, 0.01); hip.add(limb(0.19, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#ff9e2c')); shoe.scale.set(0.052, 0.04, 0.085);
    shoe.position.set(0, -0.2, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip; hip.rotation.z = s * -0.18;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, face: faceG, arms, legs, hands };

  root.userData.pose = ({ arms: A = {}, legs: L = {}, spin = 0 } = {}) => {
    body.rotation.y = spin;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.3, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
