// The Blueprint anchor: a standing blue drawing sheet with rolled ends, grid lines, big anime eyes, tie ribbon.
// Faces +z, feet on y = 0, ~1 unit tall. createBlueprint({ scale = 1, blush = true }) -> Group.
// userData.parts = { body, torso, head (top roll + face), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a blueprint-local point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const HIP_Y = 0.27, SHOULDER = [0.2, 0.72, 0], ARM = 0.13, W = 0.36, PH = 0.58, FZ = 0.023;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function gridTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#2a6fd6'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 16; i++) { ctx.beginPath(); ctx.moveTo(i * s / 16, 0); ctx.lineTo(i * s / 16, s); ctx.moveTo(0, i * s / 16); ctx.lineTo(s, i * s / 16); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * s / 4, 0); ctx.lineTo(i * s / 4, s); ctx.moveTo(0, i * s / 4); ctx.lineTo(s, i * s / 4); ctx.stroke(); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.strokeRect(14, 14, s - 28, s - 28);
  });
}

function sheet() {
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W, PH, 0.04), new THREE.MeshStandardMaterial({ map: gridTexture(), roughness: 0.7 }));
  panel.position.y = HIP_Y + PH / 2; g.add(panel); return g;
}

function roll(y, r, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, W + 0.04, 28), mat(color));
  body.rotation.z = Math.PI / 2; g.add(body);
  for (const s of [-1, 1]) {
    for (const k of [1, 0.66, 0.33]) {
      const ring = new THREE.Mesh(new THREE.CircleGeometry(r * k, 24), mat(k === 0.66 ? '#9cc4f5' : '#eaf3ff', { roughness: 0.5 }));
      ring.rotation.y = s * Math.PI / 2; ring.position.x = s * (W / 2 + 0.0205 + (1 - k) * 0.002); g.add(ring);
    }
  }
  g.position.y = y; return g;
}

function ribbon() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 24), mat('#e8483c'));
  m.rotation.z = Math.PI / 2; m.position.set(0.1, 0.85, 0);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), mat('#e8483c')); knot.position.set(0.1, 0.9, 0.05);
  const g = new THREE.Group(); g.add(m, knot); return g;
}

function face(group, blush) {
  const z = FZ, step = 0.0015, cy = 0.64;
  for (const sx of [-1, 1]) {
    const x = sx * 0.07, y = cy;
    disc(0.045, 0.058, '#ffffff', z, group, x, y);
    disc(0.034, 0.05, '#1c2a5c', z + step, group, x, y - 0.003);
    disc(0.03, 0.022, '#4aa0e8', z + 2 * step, group, x, y - 0.022);
    disc(0.017, 0.027, '#0a0f24', z + 3 * step, group, x, y);
    disc(0.012, 0.012, '#ffffff', z + 4 * step, group, x - 0.012, y + 0.018);
    disc(0.0055, 0.0055, '#ffffff', z + 4 * step, group, x - 0.012, y - 0.02);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#0a1230'));
    lid.scale.set(0.048, 0.06, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.025, 0.014, '#ff7f8f', z, group, sx * 0.115, cy - 0.065); b.material.transparent = true; b.material.opacity = 0.65; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#ffffff'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, cy - 0.095, z + step); group.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mat(color));
  th.position.set(0.025, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createBlueprint({ scale = 1, blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffffff', body = sheet(), head = new THREE.Group();
  head.position.y = 0.7; const inner = new THREE.Group(); inner.position.y = -0.7; head.add(inner);
  inner.add(roll(HIP_Y + PH + 0.01, 0.055, '#3d86e6'), ribbon()); face(inner, blush);
  upper.add(body, roll(HIP_Y - 0.005, 0.042, '#3d86e6'), head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.012, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.012, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.18; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.085, HIP_Y - 0.04, 0); hip.add(limb(0.19, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e8483c')); shoe.scale.set(0.036, 0.03, 0.058);
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
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
