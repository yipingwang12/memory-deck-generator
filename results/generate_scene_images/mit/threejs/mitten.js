// The MIT anchor: a plump knitted MITTEN character reused (re-posed) in every scene.
// Faces +z, feet on y = 0, ~0.95 units tall, thumb on the +x side (visible from front and side).
// createMitten({ scale = 1, color = '#d8333b', cuffColor = '#fff4e0' }) -> Group.
// userData.parts = { body, thumb, cuff, head (face group), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a mitten-local point
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const HIP_Y = 0.3, ARM = 0.16, SH = [0.26, 0.5, 0.03], BY = 0.64, BS = [0.29, 0.34, 0.2];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const ball = (r, color, scl, pos, parent) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), mat(color)); m.scale.set(...scl); m.position.set(...pos); parent.add(m); return m;
};

function knitTexture(color, accent) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 3;
    for (let x = 0; x < s; x += 16) for (let y = 0; y < s; y += 16) {
      ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 8, y + 14); ctx.lineTo(x + 14, y + 2); ctx.stroke();
    }
    ctx.fillStyle = accent; ctx.fillRect(0, s * 0.18, s, s * 0.07); ctx.fillRect(0, s * 0.30, s, s * 0.03);
  }, { repeat: 1 });
}

function face(head, blush) {
  const z = 0.2, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = 0.7;
    disc(0.06, 0.078, '#ffffff', z, head, x, y);
    disc(0.05, 0.07, '#2d5fa8', z + st, head, x, y - 0.003);
    disc(0.042, 0.03, '#6fb0e8', z + 2 * st, head, x, y - 0.03);
    disc(0.026, 0.04, '#101018', z + 3 * st, head, x, y);
    disc(0.017, 0.017, '#ffffff', z + 4 * st, head, x - 0.017, y + 0.027);
    disc(0.008, 0.008, '#ffffff', z + 4 * st, head, x + 0.015, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#1a0f0a'));
    lid.scale.set(0.066, 0.084, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    if (blush) { const b = disc(0.034, 0.02, '#ff6f85', z - 0.004, head, sx * 0.16, 0.615); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.6, z - 0.004); head.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

export function createMitten({ scale = 1, color = '#d8333b', cuffColor = '#fff4e0', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const knit = new THREE.MeshStandardMaterial({ map: knitTexture(color, cuffColor), roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), knit); body.scale.set(...BS); body.position.y = BY; upper.add(body);
  const thumb = new THREE.Group(); thumb.position.set(0.26, 0.6, 0); thumb.rotation.z = -0.65; upper.add(thumb);
  ball(1, color, [0.12, 0.21, 0.11], [0, 0.1, 0], thumb);
  const cuff = new THREE.Group(); cuff.position.y = 0.37; upper.add(cuff);
  const cm = mat(cuffColor);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.2, 40), cm); cyl.scale.z = 0.78; cuff.add(cyl);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.243, 0.012, 8, 40), mat('#e8c9a0')); t.rotation.x = Math.PI / 2; t.scale.y = 0.78; t.position.y = -0.075 + i * 0.05; cuff.add(t); }
  const head = new THREE.Group(); upper.add(head); face(head, blush);

  const skin = cuffColor, arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.027, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, skin));
    ball(0.022, skin, [1, 1, 1], [0, 0, 0], el);
    const hand = new THREE.Group(); hand.position.y = -ARM; ball(0.045, cuffColor, [1, 1.1, 0.85], [0, -0.02, 0], hand); ball(0.02, cuffColor, [1, 1, 1], [s * 0.04, 0, 0.01], hand);
    el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.11, HIP_Y, 0); hip.add(limb(0.21, 0.032, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#7a3b1d')); shoe.scale.set(0.05, 0.04, 0.085); shoe.position.set(0, -0.225, 0.025); hip.add(shoe);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, thumb, cuff, head, arms, legs, hands };

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
