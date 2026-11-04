// The Ziv Williams lab anchor: a kitchen SIEVE character, reused (re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createSieve({ scale = 1, blush = true, handle = true }) -> Group.
// userData.parts = { disc, rim, handle, head(=disc group), arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a sieve-local point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const R = 0.3, CY = 0.55, ARM = 0.17, HIP_Y = 0.27;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function meshTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#c9d2dc'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#8b97a6'; ctx.lineWidth = 3;
    for (let i = 0; i <= 32; i++) { const p = i * s / 32; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, s); ctx.moveTo(0, p); ctx.lineTo(s, p); ctx.stroke(); }
  });
}

function face(g, blush) {
  const z = 0.09;
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = CY + 0.04, st = 0.0015;
    disc(0.07, 0.09, '#ffffff', z, g, x, y);
    disc(0.056, 0.078, '#3a2a5a', z + st, g, x, y - 0.004);
    disc(0.05, 0.035, '#7a62b8', z + 2 * st, g, x, y - 0.035);
    disc(0.03, 0.045, '#120a1e', z + 3 * st, g, x, y);
    disc(0.018, 0.018, '#ffffff', z + 4 * st, g, x - 0.02, y + 0.03);
    disc(0.008, 0.008, '#ffffff', z + 4 * st, g, x - 0.018, y - 0.035);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.075, 0.095, 1); lid.position.set(x, y, z + 5 * st); g.add(lid);
    if (blush) { const b = disc(0.04, 0.022, '#ff7f8f', z, g, sx * 0.18, CY - 0.06); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#7a2a2a'));
  m.rotation.z = Math.PI; m.position.set(0, CY - 0.1, z + 0.002); g.add(m);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createSieve({ scale = 1, blush = true, handle = true } = {}) {
  const root = new THREE.Group(), head = new THREE.Group(), steel = mat('#dfe5ec', { metalness: 0.7, roughness: 0.3 });
  const tex = meshTexture();
  // bowl: shallow cylinder (axis z) with mesh front
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.92, 0.16, 48, 1, true), steel);
  bowl.rotation.x = Math.PI / 2; bowl.position.set(0, CY, 0);
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: tex, color: '#ffffff', roughness: 0.5, metalness: 0.2 }));
  front.position.set(0, CY, 0.085);
  const back = new THREE.Mesh(new THREE.SphereGeometry(R * 0.93, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }));
  back.rotation.x = -Math.PI / 2; back.scale.set(1, 0.5, 1); back.position.set(0, CY, -0.08);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.02, 12, 56), steel); rim.position.set(0, CY, 0.08);
  const rim2 = rim.clone(); rim2.position.z = -0.06; rim2.scale.setScalar(0.95);
  head.add(bowl, front, back, rim, rim2); face(head, blush); root.add(head);
  const hnd = new THREE.Group();
  if (handle) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.3, 14), mat('#c8483c')); shaft.position.set(0, CY + R + 0.15, 0);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 20), steel); loop.position.set(0, CY + R + 0.33, 0);
    hnd.add(shaft, loop); root.add(hnd);
  }
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (R + 0.02), CY - 0.03, 0.0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    const h = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), mat(skin)); palm.scale.set(0.95, 1.1, 0.8);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), mat(skin)); th.position.set(0.03, 0.005, 0.012); h.add(palm, th); h.position.y = -ARM; el.add(h);
    hands[k] = h; sh.add(el); root.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y + 0.02, 0); hip.add(limb(0.22, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.04, 0.035, 0.065); shoe.position.set(0, -0.25, 0.02);
    hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { disc: front, rim, handle: hnd, head, arms, legs, hands };
  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    head.rotation.z = headTilt; head.rotation.x = lean; hnd.rotation.z = headTilt;
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
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
