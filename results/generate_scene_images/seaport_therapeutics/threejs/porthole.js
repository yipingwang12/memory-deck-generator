// Seaport anchor: a brass PORTHOLE character. Faces +z, feet on y = 0, ~1.16 tall.
// createPorthole({ scale = 1, brass = '#d9a233' }) -> Group.
// userData.parts = { ring, face, arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX]}, legs:{l:[x,z]} }) radians; arm z>0 swings l out.
// userData.reach('l'|'r', [x,y,z]) two-bone IK, hand to a porthole-local point.
// userData.happy(mouthOpen) not needed: mouth is painted; use userData.setMood('smile'|'worry'|'calm'|'open').
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const RO = 0.37, TUBE = 0.065, CY = 0.74, SH = [0.45, CY, 0], ARM = 0.2, HIP = 0.34;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function seaTexture() {
  return canvasTexture(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#bfe6ff'); g.addColorStop(0.5, '#8fd0f0'); g.addColorStop(0.55, '#2aa7c4'); g.addColorStop(1, '#0d5f86');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(s * 0.78, s * 0.25, s * 0.08, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
    for (const y of [0.66, 0.78, 0.9]) { ctx.beginPath(); for (let x = 0; x <= s; x += 8) ctx.lineTo(x, s * y + Math.sin(x / 12) * 4); ctx.stroke(); }
  });
}

function face(group) {
  const z = 0.035, st = 0.002, eyes = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.125, y = 0.0;
    disc(0.085, 0.108, '#ffffff', z, group, x, y);
    disc(0.062, 0.095, '#13566e', z + st, group, x, y - 0.006);
    disc(0.055, 0.06, '#27b6d4', z + 2 * st, group, x, y - 0.03);
    disc(0.03, 0.05, '#06141a', z + 3 * st, group, x, y - 0.006);
    disc(0.024, 0.024, '#ffffff', z + 4 * st, group, x - 0.022, y + 0.04);
    disc(0.011, 0.011, '#ffffff', z + 4 * st, group, x + 0.02, y - 0.05);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 32, 1, 0.1, Math.PI - 0.2), mat('#1a0f0a'));
    lid.scale.set(0.09, 0.115, 1); lid.position.set(x, y, z + 5 * st); group.add(lid);
    const b = disc(0.045, 0.024, '#ff7f8f', z, group, sx * 0.2, -0.105); b.material.transparent = true; b.material.opacity = 0.6;
    eyes.push(lid);
  }
  const mouths = {
    smile: () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI), mat('#7a2a2a')); m.rotation.z = Math.PI; m.position.set(0, -0.1, z + 0.01); return m; },
    worry: () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI), mat('#7a2a2a')); m.position.set(0, -0.135, z + 0.01); return m; },
    open: () => { const m = disc(0.045, 0.05, '#6a1c24', z + 0.01, group, 0, -0.115); m.add(disc(0.6, 0.45, '#ff8a8a', 0.001, new THREE.Group(), 0, -0.4)); return m; },
  };
  mouths.calm = mouths.smile;
  return mouths;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function glove() {
  const g = new THREE.Group(), p = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 14), mat('#ffffff'));
  p.scale.set(1, 1.1, 0.85); g.add(p); g.position.y = -ARM; return g;
}

export function createPorthole({ scale = 1, brass = '#d9a233' } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const metal = { metalness: 0.5, roughness: 0.35 };
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RO, TUBE, 20, 56), mat(brass, metal)); ring.position.y = CY; body.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(RO - TUBE, 0.02, 12, 56), mat('#8a5a14', metal)); inner.position.set(0, CY, 0.015); body.add(inner);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(RO - TUBE, 56), new THREE.MeshStandardMaterial({ map: seaTexture(), roughness: 0.5 }));
  glass.position.set(0, CY, 0.0); body.add(glass);
  const back = glass.clone(); back.rotation.y = Math.PI; back.position.z = -0.0; body.add(back);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, bolt = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), mat('#7a4f12', metal));
    bolt.position.set(Math.cos(a) * RO, CY + Math.sin(a) * RO, TUBE * 0.85); body.add(bolt);
  }
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.1), mat('#8a5a14', metal)); hinge.position.set(0, CY + RO + TUBE * 0.7, 0); body.add(hinge);
  const fg = new THREE.Group(); fg.position.set(0, CY, 0); body.add(fg);
  const mouths = face(fg); let mouth = null;
  const setMood = (k = 'smile') => { if (mouth) fg.remove(mouth); mouth = mouths[k](); fg.add(mouth); };
  setMood('smile');

  const arms = {}, hands = {}, elbows = {}, legs = {}, cream = '#fff1d6';
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.028, cream)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.028, cream));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat(cream)));
    hands[k] = glove(); el.add(hands[k]); sh.add(el); body.add(sh); sh.rotation.z = s * 0.45; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.15, HIP, 0); hip.add(limb(HIP - 0.04, 0.032, cream));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#7a3b1d')); shoe.scale.set(0.075, 0.05, 0.11);
    shoe.position.set(0, -HIP + 0.04, 0.04); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { ring, face: fg, arms, legs, hands };
  root.userData.setMood = setMood;
  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    body.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
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
