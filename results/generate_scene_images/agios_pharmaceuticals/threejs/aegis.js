// The Agios anchor: a bronze round AEGIS shield with a face, arms and legs. Faces +z, feet on y = 0, ~0.95 tall.
// createAegis({ scale = 1 }) -> Group. userData: parts{shield,arms,legs,hands}, pose({arms:{l:[x,z,elbowX],r}, legs:{l:[x,z],r}}),
// reach('l'|'r',[x,y,z]) two-bone IK in root-local coords (l = +x side).
import * as THREE from 'three';

const CY = 0.62, R = 0.32, ARM = 0.15, HIP_Y = 0.33;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function face(g) {
  const z = 0.027, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.11, y = 0.03;
    disc(0.062, 0.078, '#ffffff', z, g, x, y);
    disc(0.048, 0.068, '#3a2416', z + st, g, x, y - 0.004);
    disc(0.042, 0.032, '#2f8f9a', z + 2 * st, g, x, y - 0.03);
    disc(0.024, 0.038, '#120a08', z + 3 * st, g, x, y);
    disc(0.016, 0.016, '#ffffff', z + 4 * st, g, x - 0.017, y + 0.026);
    disc(0.007, 0.007, '#ffffff', z + 4 * st, g, x - 0.017, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#2a160a'));
    lid.scale.set(0.066, 0.082, 1); lid.position.set(x, y, z + 5 * st); g.add(lid);
    const b = disc(0.034, 0.02, '#ff6f7f', z, g, sx * 0.19, -0.07); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.09, z + st); g.add(mouth);
}

export function createAegis({ scale = 1 } = {}) {
  const root = new THREE.Group(), sh = new THREE.Group(), skin = '#ffe0c0';
  sh.position.y = CY; root.add(sh);
  const bronze = mat('#c98a3a', { metalness: 0.45, roughness: 0.4 }), dark = mat('#8a5a22', { metalness: 0.4, roughness: 0.45 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.05, 56), bronze); plate.rotation.x = Math.PI / 2; sh.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.028, 12, 56), mat('#e0a24a', { metalness: 0.5, roughness: 0.3 })); sh.add(rim);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.008, 8, 56), dark); ring.position.z = 0.026; sh.add(ring);
  const back = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.008, 8, 56), dark); back.position.z = -0.026; sh.add(back);
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat('#3fb7c4', { roughness: 0.2 })); gem.scale.z = 0.5; gem.position.set(0, 0.21, 0.03); sh.add(gem);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const s = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), dark); s.position.set(Math.cos(a) * (R - 0.025), Math.sin(a) * (R - 0.025), 0.03); sh.add(s); }
  face(sh);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const a = new THREE.Group(); a.position.set(s * (R + 0.01), CY, 0.0); a.add(limb(ARM, 0.014, skin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin), new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    const h = new THREE.Group(); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 14), mat(skin)); palm.scale.set(0.95, 1.1, 0.8);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), mat(skin)); th.position.set(0.032, 0.006, 0.012); h.add(palm, th); h.position.y = -ARM; el.add(h);
    a.add(el); root.add(a); a.rotation.z = s * 0.35; arms[k] = a; elbows[k] = el; hands[k] = h;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0); hip.add(limb(0.22, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#2f6f8f')); shoe.scale.set(0.044, 0.038, 0.07); shoe.position.set(0, -0.235, 0.022); hip.add(shoe);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { shield: sh, arms, legs, hands };
  root.userData.pose = ({ arms: A = {}, legs: L = {} } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, a = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(a.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.4, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const ang = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(ang)).addScaledVector(pole, Math.sin(ang));
    a.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = a.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(a.position).sub(elbowPos).applyQuaternion(a.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
