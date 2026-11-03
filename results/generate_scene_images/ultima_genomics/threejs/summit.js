// The Ultima anchor: SUMMIT, a snow-capped mountain peak with a face, arms and legs.
// Faces +z, feet on y = 0, ~1.1 units tall. createSummit({ scale = 1 }) -> Group.
// userData.parts = { body, cap, face, arms:{l,r}, hands:{l,r}, legs:{l,r} }  (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, lean })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a summit-local point.
// userData.TOP = y of the peak tip (local units).
import * as THREE from 'three';
import { canvasTexture, rng, noiseFill, tileNoise } from './kit.js';

const H = 1.1, R0 = 0.4, ARM = 0.17, SH = [0.27, 0.46];
const radius = (y) => R0 * Math.pow(Math.max(1 - y / H, 0), 0.78);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function rockTexture() {
  return canvasTexture(256, (ctx, s) => noiseFill(ctx, s, (u, v) => {
    const n = tileNoise(u * 4, v * 4, 4, 4), k = 0.7 + 0.5 * n;
    return [150 * k, 110 * k, 85 * k];
  }));
}

function lathe(y0, y1, grow, color, tex) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const y = y0 + (y1 - y0) * i / 14; pts.push(new THREE.Vector2(radius(y) + grow, y)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat(color, tex ? { map: tex, roughness: 0.9 } : { roughness: 0.5 }));
  return m;
}

function snowCap(y0) {
  const g = new THREE.Group(), r = rng(3);
  g.add(lathe(y0, H, 0.012, '#fbfdff'));
  for (let i = 0; i < 9; i++) {              // drips under the snow line
    const a = (i / 9) * Math.PI * 2 + r() * 0.3, len = 0.05 + r() * 0.09;
    const y = y0 - len * 0.2, d = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat('#fbfdff', { roughness: 0.5 }));
    d.scale.set(0.045, len, 0.03); d.position.set((radius(y) + 0.012) * Math.sin(a), y, (radius(y) + 0.012) * Math.cos(a)); d.rotation.y = a;
    g.add(d);
  }
  return g;
}

function face(group) {
  const z = 0.004, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.085, y = 0.04;
    disc(0.062, 0.078, '#ffffff', z, group, x, y);
    disc(0.05, 0.068, '#2a3f7a', z + step, group, x, y - 0.004);
    disc(0.042, 0.034, '#4f86d6', z + 2 * step, group, x, y - 0.03);
    disc(0.026, 0.04, '#0b1022', z + 3 * step, group, x, y - 0.004);
    disc(0.017, 0.017, '#ffffff', z + 4 * step, group, x - 0.016, y + 0.025);
    disc(0.008, 0.008, '#ffffff', z + 4 * step, group, x + 0.014, y - 0.035);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.066, 0.083, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.032, 0.018, '#ff7f8f', z, group, sx * 0.14, -0.06); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0055, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.075, z + step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

export function createSummit({ scale = 1 } = {}) {
  const root = new THREE.Group(), skin = '#ffe0c0';
  const body = lathe(0, H, 0, '#ffffff', rockTexture());
  const cap = snowCap(0.66);
  const faceG = new THREE.Group(), y = 0.38;
  faceG.position.set(0, y, radius(y) + 0.003);
  faceG.rotation.x = -Math.atan(-(radius(y + 0.01) - radius(y - 0.01)) / 0.02); // tilt to slope
  face(faceG);
  root.add(body, cap, faceG);

  const arms = {}, elbows = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0.05);
    sh.add(limb(ARM, 0.02, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand);
    hands[k] = hand; sh.add(el); root.add(sh); sh.rotation.z = s * 0.3; arms[k] = sh; elbows[k] = el;
    const leg = new THREE.Group(); leg.position.set(s * 0.14, 0.06, 0.2); leg.add(limb(0.12, 0.028, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.06, 0.04, 0.09);
    shoe.position.set(0, -0.13, 0.03); leg.add(shoe); root.add(leg); legs[k] = leg;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.TOP = H;
  root.userData.parts = { body, cap, face: faceG, arms, hands, legs };

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    root.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.2, -0.2); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
