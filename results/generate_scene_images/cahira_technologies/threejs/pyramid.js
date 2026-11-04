// The Cahira anchor: a cute sandstone PYRAMID character with big anime eyes, arms, legs. Reused in every scene.
// Faces +z, feet on y = 0, ~1.1 units tall, base 0.84 wide. createPyramid({ scale = 1, stone = '#e2b567', blush = true }) -> Group.
// userData.parts = { body, torso, cap, arms:{l,r}, hands:{l,r}, legs:{l,r}, face }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} }) radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a pyramid-local point.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

const B = 0.42, H = 0.82, LEG = 0.24, ARM = 0.17, SH = [0.235, 0.64, 0.06];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function blockTexture(stone) {
  return canvasTexture(512, (ctx, s) => {
    const r = rng(11); ctx.fillStyle = stone; ctx.fillRect(0, 0, s, s);
    const rows = 9, rh = s / rows;
    for (let i = 0; i < rows; i++) {
      const bw = s / 8; const off = (i % 2) * bw / 2;
      for (let j = -1; j < 9; j++) {
        const x = j * bw + off, l = Math.floor((r() - 0.5) * 26);
        ctx.fillStyle = `rgba(${l > 0 ? 255 : 90},${l > 0 ? 240 : 50},${l > 0 ? 200 : 20},${Math.abs(l) / 120})`; ctx.fillRect(x, i * rh, bw, rh);
        ctx.fillStyle = 'rgba(90,50,15,0.55)'; ctx.fillRect(x, i * rh, 3, rh);
      }
      ctx.fillStyle = 'rgba(90,50,15,0.65)'; ctx.fillRect(0, i * rh, s, 3);
    }
  }, { repeat: 1 });
}

function face(group, blush) {
  const t = Math.atan(B / H), yf = 0.5, zf = B * (1 - (yf - LEG) / H) + 0.004, step = 0.002;
  const f = new THREE.Group(); f.position.set(0, yf, zf); f.rotation.x = -t; group.add(f);
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = 0.07;
    disc(0.07, 0.092, '#ffffff', 0, f, x, y);
    disc(0.056, 0.082, '#2a1a3a', step, f, x, y - 0.004);
    disc(0.05, 0.04, '#8a4fd0', 2 * step, f, x, y - 0.035);
    disc(0.03, 0.05, '#0c0614', 3 * step, f, x, y - 0.004);
    disc(0.02, 0.02, '#ffffff', 4 * step, f, x - 0.02, y + 0.03);
    disc(0.009, 0.009, '#ffffff', 4 * step, f, x + 0.018, y - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#1a0f0a'));
    lid.scale.set(0.074, 0.096, 1); lid.position.set(x, y, 5 * step); f.add(lid);
    if (blush) { const b = disc(0.04, 0.022, '#ff6f86', 0, f, sx * 0.18, -0.06); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 20, Math.PI), mat('#7a2a2a'));
  m.rotation.z = Math.PI; m.position.set(0, -0.06, step); f.add(m);
  return f;
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function glove() {
  const g = new THREE.Group(), w = mat('#ffffff', { roughness: 0.5 });
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), w); p.scale.set(0.95, 1.05, 0.85);
  const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), w); th.position.set(0.04, 0.008, 0.02);
  g.add(p, th); g.position.y = -ARM; return g;
}

export function createPyramid({ scale = 1, stone = '#e2b567', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = LEG; upper.position.y = -LEG; torso.add(upper); root.add(torso);
  const tex = blockTexture(stone);
  const body = new THREE.Mesh(new THREE.ConeGeometry(B * Math.SQRT2, H, 4, 1, false), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  body.rotation.y = Math.PI / 4; body.position.y = LEG + H / 2;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.108 * Math.SQRT2, 0.21, 4), mat('#ffd23a', { metalness: 0.6, roughness: 0.3 }));
  cap.rotation.y = Math.PI / 4; cap.position.y = LEG + H - 0.1;
  const base = new THREE.Mesh(new THREE.BoxGeometry(B * 2 + 0.03, 0.03, B * 2 + 0.03), mat('#c79a4a')); base.position.y = LEG + 0.015;
  upper.add(body, cap, base);
  const faceG = face(upper, blush);

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = glove(); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.95; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.15, LEG, 0.08); hip.add(limb(0.2, 0.026, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.085);
    shoe.position.set(0, -0.215, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, cap, arms, hands, legs, face: faceG };

  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.set(lean, 0, tilt);
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
