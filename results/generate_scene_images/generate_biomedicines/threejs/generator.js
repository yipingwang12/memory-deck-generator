// GENERATOR anchor: a portable power generator with a face on its front panel, reused in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createGenerator({ scale = 1, color = '#f2831f' }) -> Group.
// userData.parts = { body, face, arms:{l,r}, legs:{l,r}, hands:{l,r}, bolt }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK in generator-local space.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const SH = [0.34, 0.62, 0.0], ARM = 0.15, HIP_Y = 0.24;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function boltShape() {
  const s = new THREE.Shape(); [[0.03, 0.09], [-0.045, -0.01], [-0.005, -0.01], [-0.03, -0.09], [0.05, 0.015], [0.008, 0.015], [0.04, 0.09]].forEach(([x, y], i) => s[i ? 'lineTo' : 'moveTo'](x, y));
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), mat('#ffe44a', { emissive: '#ffb800', emissiveIntensity: 0.6 }));
}

function face(group, z) {
  const step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = 0.66;
    disc(0.06, 0.075, '#ffffff', z, group, x, y);
    disc(0.047, 0.066, '#1f3d5c', z + step, group, x, y - 0.003);
    disc(0.04, 0.03, '#3f86c4', z + 2 * step, group, x, y - 0.028);
    disc(0.023, 0.037, '#0a121a', z + 3 * step, group, x, y);
    disc(0.016, 0.016, '#ffffff', z + 4 * step, group, x - 0.017, y + 0.024);
    disc(0.007, 0.007, '#ffffff', z + 4 * step, group, x - 0.017, y - 0.028);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.064, 0.08, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.032, 0.018, '#ff7f8f', z, group, sx * 0.17, 0.58); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.575, z + step); group.add(mouth);
}

export function createGenerator({ scale = 1, color = '#f2831f' } = {}) {
  const root = new THREE.Group(), body = new THREE.Group();
  const chassis = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.62, 0.5, 5, 0.06), mat(color));
  chassis.position.y = 0.56; body.add(chassis);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.36, 0.02, 3, 0.01), mat('#3a3f48'));
  panel.position.set(0, 0.52, 0.255); body.add(panel);
  const faceG = new THREE.Group(); body.add(faceG); face(faceG, 0.267);
  // roll cage
  const tube = mat('#2d3138', { metalness: 0.5, roughness: 0.4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.74, 10), tube); v.position.set(sx * 0.33, 0.55, sz * 0.27); body.add(v);
  }
  for (const sz of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.66, 10), tube); h.rotation.z = Math.PI / 2; h.position.set(0, 0.92, sz * 0.27); body.add(h); }
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.54, 10), tube); h.rotation.x = Math.PI / 2; h.position.set(sx * 0.33, 0.92, 0); body.add(h); }
  // fuel tank, cap, exhaust, outlets, bolt, pull handle
  const tank = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.1, 0.36, 4, 0.04), mat('#c8322e')); tank.position.set(0, 0.9, 0); body.add(tank);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), mat('#222')); cap.position.set(0.1, 0.96, 0.05); body.add(cap);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 14), mat('#8b9099', { metalness: 0.7, roughness: 0.3 })); pipe.position.set(-0.2, 0.99, -0.12); body.add(pipe);
  for (const sx of [-1, 1]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), mat('#1d1d20')); o.rotation.x = Math.PI / 2; o.position.set(sx * 0.15, 0.4, 0.26); body.add(o); }
  const bolt = boltShape(); bolt.position.set(0.0, 0.43, 0.26); bolt.scale.setScalar(0.7); body.add(bolt);
  const side = boltShape(); side.rotation.y = Math.PI / 2; side.position.set(0.312, 0.56, 0); side.scale.setScalar(1.8); body.add(side);
  root.add(body);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  const skin = '#2d3138';
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.017, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat('#f4f1ea')); hand.position.y = -ARM; el.add(hand); hands[k] = hand;
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.16, HIP_Y, 0.02); hip.add(limb(0.2, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e8e2d6')); shoe.scale.set(0.05, 0.04, 0.08); shoe.position.set(0, -0.215, 0.025); hip.add(shoe);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, face: faceG, arms, legs, hands, bolt };
  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    body.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.3, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
