// The Dewpoint anchor: a solid teardrop DEWDROP with big anime eyes, arms and legs.
// Faces +z, feet on y = 0, ~1.25 units tall. createDewdrop({ scale = 1, color = '#3ea8f2' }) -> Group.
// userData.parts = { body, head (face group), arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a dewdrop-local point.
import * as THREE from 'three';

const R = 0.32, CY = 0.52, LEG = 0.22, ARM = 0.15, SH = [0.29, 0.5];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const basic = (color) => new THREE.MeshBasicMaterial({ color });

function bodyGeometry() {
  const pts = [];
  for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + (i / 20) * (Math.PI * 0.72); pts.push(new THREE.Vector2(Math.max(1e-4, R * Math.cos(a)), CY + R * Math.sin(a))); }
  const a0 = Math.PI * 0.22, r0 = R * Math.cos(a0), y0 = CY + R * Math.sin(a0), top = 1.24;
  for (let i = 1; i <= 14; i++) { const s = i / 14; pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.pow(1 - s, 1.25)), y0 + (top - y0) * (1 - Math.pow(1 - s, 1.6)) )); }
  return new THREE.LatheGeometry(pts, 48);
}

function disc(rx, ry, color, z, parent, x = 0, y = 0) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), basic(color));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
}

function face(parent) {
  const g = new THREE.Group(); parent.add(g);
  for (const sx of [-1, 1]) {
    const x = sx * 0.125, y = CY + 0.04, e = new THREE.Group();
    e.position.set(x, y, Math.sqrt(R * R - x * x - 0.04 * 0.04) - 0.004); e.rotation.y = Math.asin(x / R) * 0.9; g.add(e);
    disc(0.092, 0.115, '#ffffff', 0, e); disc(0.072, 0.098, '#1f3f8c', 0.002, e, 0, -0.004);
    disc(0.05, 0.075, '#0b1a44', 0.004, e, 0, -0.006); disc(0.04, 0.04, '#4fb0ff', 0.003, e, 0, -0.05);
    disc(0.03, 0.034, '#ffffff', 0.006, e, -0.026, 0.04); disc(0.013, 0.013, '#ffffff', 0.006, e, 0.025, -0.045);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.02, 32, 1, 0.15, Math.PI - 0.3), basic('#10224f'));
    lid.scale.set(0.095, 0.118, 1); lid.position.z = 0.007; e.add(lid);
    const b = disc(0.035, 0.02, '#ff7f9a', 0, g, sx * 0.19, CY - 0.08); b.position.z = Math.sqrt(R * R - 0.19 * 0.19 - 0.08 * 0.08); b.rotation.y = Math.asin(0.19 / R) * sx; b.rotation.y = Math.asin(0.19 / R) * sx;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI), basic('#10224f'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, CY - 0.12, Math.sqrt(R * R - 0.12 * 0.12) - 0.002); g.add(mouth);
  return g;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createDewdrop({ scale = 1, color = '#3ea8f2' } = {}) {
  const root = new THREE.Group(), tilt = new THREE.Group(), skin = '#cfeeff';
  tilt.position.y = LEG - 0.18; root.add(tilt);
  const body = new THREE.Mesh(bodyGeometry(), mat(color, { roughness: 0.4 })); tilt.add(body);
  const head = face(tilt);
  // highlight swooshes on the upper-left of the belly
  const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), basic('#e9f8ff'));
  hl.scale.set(0.035, 0.11, 0.02); hl.position.set(-0.165, CY + 0.17, 0.2); hl.rotation.set(0, -0.6, 0.35); tilt.add(hl);
  const hl2 = hl.clone(); hl2.scale.set(0.02, 0.02, 0.014); hl2.position.set(-0.12, CY + 0.26, 0.14); hl2.rotation.set(0, -0.4, 0); tilt.add(hl2);
  const tipHl = hl.clone(); tipHl.scale.set(0.016, 0.07, 0.012); tipHl.position.set(-0.035, 0.98, 0.04); tipHl.rotation.set(0, 0, 0.12); 

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.022, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.022, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), mat('#ffffff')); hand.position.y = -ARM - 0.01; el.add(hand);
    hands[k] = hand; sh.add(el); tilt.add(sh); sh.rotation.z = s * 0.7; el.rotation.x = -0.3; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.12, LEG, 0); hip.add(limb(LEG - 0.04, 0.026, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), mat('#ffb12a')); shoe.scale.set(0.06, 0.04, 0.095);
    shoe.position.set(0, -LEG + 0.03, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, arms, legs, hands, tilt };

  root.userData.pose = ({ lean = 0, tilt: t = 0, arms: A = {}, legs: L = {} } = {}) => {
    tilt.rotation.set(lean, 0, t);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    tilt.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(tilt.matrix.clone().invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.3, -0.5); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
