// The Dana-Farber anchor: a young FARMER (straw hat, plaid shirt, blue overalls), reused in every scene.
// Faces +z, feet on y = 0, ~1 unit tall (hat top ~1.02). createFarmer({ scale = 1 }) -> Group.
// userData.parts = { torso, head, hat, arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a farmer-local point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const HIP_Y = 0.4, SHOULDER = [0.17, 0.68, 0], ARM = 0.16;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const ell = (parent, color, pos, scl, geo = new THREE.SphereGeometry(1, 28, 20)) => {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color);
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const disc = (parent, rx, ry, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

function plaid() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#d63a30'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,230,200,0.55)';
    for (const p of [0, 64]) { ctx.fillRect(p, 0, 12, s); ctx.fillRect(0, p, s, 12); }
    ctx.fillStyle = 'rgba(90,10,10,0.35)'; ctx.fillRect(32, 0, 10, s); ctx.fillRect(0, 32, s, 10);
  }, { repeat: 2 });
}

function face(head) {
  const z = 0.128;
  for (const sx of [-1, 1]) {
    const x = sx * 0.05, y = -0.005;
    disc(head, 0.04, 0.05, '#ffffff', x, y, z);
    disc(head, 0.03, 0.045, '#4a2a14', x, y - 0.003, z + 0.002);
    disc(head, 0.026, 0.02, '#2f7bd0', x, y - 0.02, z + 0.003);
    disc(head, 0.016, 0.026, '#120a08', x, y, z + 0.004);
    disc(head, 0.011, 0.011, '#ffffff', x - 0.011, y + 0.017, z + 0.006);
    disc(head, 0.005, 0.005, '#ffffff', x - 0.011, y - 0.02, z + 0.006);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.043, 0.054, 1); lid.position.set(x, y, z + 0.007); head.add(lid);
    const b = disc(head, 0.022, 0.012, '#ff7f8f', sx * 0.085, -0.05, z - 0.012); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0035, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.058, z - 0.004); head.add(mouth);
}

export function createFarmer({ scale = 1 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), skin = '#ffe0c0', denim = '#2f5fb0';
  torso.position.y = HIP_Y; const upper = new THREE.Group(); upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);

  // torso: plaid shirt + overall bib/straps
  ell(upper, mat('#ffffff', { map: plaid() }), [0, 0.57, 0], [0.17, 0.2, 0.12]);
  ell(upper, denim, [0, 0.52, 0.045], [0.125, 0.14, 0.085]);
  for (const s of [-1, 1]) { const st = ell(upper, denim, [s * 0.08, 0.66, 0.095], [0.02, 0.12, 0.02]); st.rotation.z = s * 0.1; ell(upper, '#f2c230', [s * 0.085, 0.585, 0.112], [0.017, 0.017, 0.01]); }
  ell(upper, '#1f4488', [0, 0.54, 0.128], [0.06, 0.04, 0.012]);                     // bib pocket

  // head: skin, hair, hat, face
  const head = new THREE.Group(); head.position.y = 0.84; upper.add(head);
  ell(head, skin, [0, 0, 0], [0.14, 0.14, 0.13]);
  ell(head, '#7a4a22', [0, 0.02, -0.03], [0.148, 0.145, 0.125]);                    // hair mass behind/around
  ell(head, '#7a4a22', [0, 0.085, 0.07], [0.12, 0.05, 0.07]);                       // fringe
  const hat = new THREE.Group(); hat.position.y = 0.1; head.add(hat);
  ell(hat, '#e8c35a', [0, 0.01, 0], [0.25, 0.014, 0.25], new THREE.CylinderGeometry(1, 1, 1, 40)).position.y = 0.0;
  ell(hat, '#e8c35a', [0, 0.06, 0], [0.12, 0.07, 0.12], new THREE.CylinderGeometry(0.92, 1, 1, 32));
  ell(hat, '#c4372c', [0, 0.04, 0], [0.126, 0.018, 0.126], new THREE.CylinderGeometry(0.96, 1, 1, 32));
  ell(hat, '#e8c35a', [0, 0.098, 0], [0.11, 0.012, 0.11]);
  face(head);

  // arms (shirt sleeve upper, skin forearm, mitten)
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.034, '#d63a30')); sh.add(new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), mat('#d63a30')));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.028, '#d63a30'));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), mat('#d63a30')));
    const hand = new THREE.Group(); hand.position.y = -ARM;
    const palm = ell(hand, skin, [0, -0.025, 0], [0.036, 0.042, 0.03]); ell(hand, skin, [0.03, -0.01, 0.01], [0.016, 0.016, 0.016]);
    el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0);
    hip.add(limb(0.35, 0.045, denim));
    ell(hip, '#6a3d1c', [0, -0.365, 0.025], [0.056, 0.04, 0.085]);
    root.add(hip); legs[k] = hip;
  }
  ell(root, denim, [0, HIP_Y, 0], [0.15, 0.08, 0.1]);

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, hat, arms, legs, hands };

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
