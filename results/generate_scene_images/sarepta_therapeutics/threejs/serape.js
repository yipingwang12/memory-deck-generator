// The Sarepta anchor: a striped SERAPE blanket with a face, arms, legs and a fringe, reused in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createSerape({ scale = 1 }) -> Group.
// userData.parts = { body, torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a serape-local point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const W = 0.52, H = 0.66, T = 0.1, HIP_Y = 0.3, SHOULDER = [0.28, 0.84, 0], ARM = 0.14;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
const STRIPES = ['#d8362f', '#f59a23', '#fbd24a', '#1f9e8f', '#c2328a', '#2b4f9e'];

function stripeTexture() {
  return canvasTexture(256, (ctx, s) => {
    const rows = 12;
    for (let i = 0; i < rows; i++) {
      ctx.fillStyle = STRIPES[[0, 1, 2, 3, 2, 1, 4, 5, 4, 1, 2, 0][i] % STRIPES.length];
      ctx.fillRect(0, i * s / rows, s, s / rows + 1);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = 0; x < s; x += 16) ctx.fillRect(x, i * s / rows + s / rows * 0.4, 8, 3);
    }
  });
}

function blanket() {
  const w = W / 2, h = H / 2, r = 0.05, s = new THREE.Shape();
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const b = 0.015, g = new THREE.ExtrudeGeometry(s, { depth: T - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3 });
  g.center();
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w) / W, (p.getY(i) + h) / H);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.8 }));
  m.position.y = HIP_Y + h; return m;
}

function fringe(group) {
  const n = 13;
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.09, 6), mat(i % 2 ? '#fff1d0' : '#d8362f'));
    c.position.set(-W / 2 + 0.02 + i * (W - 0.04) / (n - 1), HIP_Y - 0.035, 0); group.add(c);
  }
}

const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function face(group) {
  const z = T / 2 + 0.002, step = 0.0015, cy = 0.7;
  disc(0.2, 0.15, '#fff1d6', z, group, 0, cy - 0.02);
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, y = cy;
    disc(0.05, 0.062, '#ffffff', z + step, group, x, y);
    disc(0.038, 0.054, '#3a2416', z + 2 * step, group, x, y - 0.003);
    disc(0.033, 0.026, '#b4753a', z + 3 * step, group, x, y - 0.025);
    disc(0.019, 0.03, '#120a08', z + 4 * step, group, x, y);
    disc(0.013, 0.013, '#ffffff', z + 5 * step, group, x - 0.014, y + 0.02);
    disc(0.006, 0.006, '#ffffff', z + 5 * step, group, x - 0.014, y - 0.024);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.053, 0.066, 1); lid.position.set(x, y, z + 6 * step); group.add(lid);
    disc(0.03, 0.016, '#ff7f8f', z + 2 * step, group, sx * 0.135, cy - 0.065, { transparent: true, opacity: 0.6 });
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, cy - 0.07, z + 2 * step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), mat(color));
  th.position.set(0.028, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createSerape({ scale = 1 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffd9b3', body = blanket(), head = new THREE.Group();
  head.position.y = 0.7; const inner = new THREE.Group(); inner.position.y = -0.7; head.add(inner);
  body.position.y = HIP_Y + H / 2; face(inner); upper.add(body, head); fringe(upper);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.013, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.013, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0); hip.add(limb(0.25, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#7a3a1c')); shoe.scale.set(0.04, 0.032, 0.065);
    shoe.position.set(0, -0.27, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
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
