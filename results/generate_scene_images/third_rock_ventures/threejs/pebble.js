// The Third Rock anchor: PEBBLE, a smooth grey stone character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~0.8 unit tall. createPebble({ scale = 1, stone = '#a8a29c', blush = true }) -> Group.
// userData.parts = { body, torso, head (=body group w/ face), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a pebble-local point.
// userData.lie(yaw = 0)  lies on its back, face up.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

const RX = 0.31, RY = 0.34, RZ = 0.27, CY = 0.42, HIP_Y = 0.16, SHOULDER = [0.27, 0.36, 0], ARM = 0.15;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const surfZ = (x, y) => RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - ((y - CY) / RY) ** 2));

// Flat disc bent onto the front of the ellipsoid.
function decal(rx, ry, color, cx, cy, parent, off = 0.012, extra = {}) {
  const g = new THREE.RingGeometry(0, 1, 36, 5), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = cx + p.getX(i) * rx, y = cy + p.getY(i) * ry;
    p.setXYZ(i, x, y, surfZ(x, y) + off);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat(color, { roughness: 0.4, ...extra })); parent.add(m); return m;
}

function body(stone) {
  const tex = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = stone; ctx.fillRect(0, 0, s, s); const r = rng(11);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(60,50,45,0.2)'; ctx.beginPath(); ctx.arc(r() * s, r() * s, 1 + r() * 3, 0, 7); ctx.fill(); }
  });
  const g = new THREE.SphereGeometry(1, 56, 40);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
  m.scale.set(RX, RY, RZ); m.position.y = CY; return m;
}

function face(group, blush) {
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = CY + 0.07;
    decal(0.068, 0.086, '#ffffff', x, y, group, 0.012);
    decal(0.056, 0.078, '#2b6f9e', x, y - 0.004, group, 0.016);
    decal(0.05, 0.034, '#7fd0e8', x, y - 0.036, group, 0.019);
    decal(0.03, 0.045, '#10161e', x, y - 0.002, group, 0.022);
    decal(0.02, 0.02, '#ffffff', x - 0.02, y + 0.03, group, 0.026);
    decal(0.009, 0.009, '#ffffff', x + 0.018, y - 0.04, group, 0.026);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(1, 0.026, 6, 28, Math.PI * 0.85), mat('#1a1410'));
    lid.scale.set(0.07, 0.088, 1); lid.rotation.z = Math.PI * 0.075; lid.position.set(x, y, surfZ(x, y + 0.07) + 0.02);
    group.add(lid);
    if (blush) decal(0.04, 0.022, '#ff7f8f', sx * 0.18, y - 0.1, group, 0.012, { transparent: true, opacity: 0.6 });
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, CY - 0.1, surfZ(0, CY - 0.07) + 0.012); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat(color));
  th.position.set(0.035, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createPebble({ scale = 1, stone = '#a8a29c', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#7d7784', head = new THREE.Group(), bd = body(stone);
  face(head, blush); upper.add(bd, head);
  // small stone bumps for a pebble silhouette
  const r = rng(5);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat(stone, { roughness: 0.8 }));
    const a = r() * 6.28; b.scale.set(0.05, 0.035, 0.04); b.position.set(Math.cos(a) * 0.2, CY + 0.28 + r() * 0.04, -0.05 - r() * 0.1); upper.add(b);
  }
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = mitten('#f2e8dc'); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.12, HIP_Y + 0.04, 0); hip.add(limb(0.17, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.035, 0.075);
    shoe.position.set(0, -0.19, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body: bd, torso, head, arms, legs, hands };

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
  root.userData.lie = (yaw = 0) => { root.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ'); root.position.y = RZ * scale; };
  return root;
}
