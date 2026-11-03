// The Pfizer anchor: a living sun VISOR (blue band + white brim), reused in every scene.
// createVisor({ scale = 1, bandColor = '#1f6fd6' }) -> Group. Faces +z, feet on y = 0, ~0.9 tall (brim reaches z ~ +0.6).
// userData.parts = { band, brim, arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a visor-local point.
import * as THREE from 'three';

const R = 0.3, BAND_H = 0.44, BAND_Y = 0.56, ARM = 0.15, LEG = 0.26;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function bandMesh(color) {
  const h = BAND_H / 2, t = 0.02, b = 0.012;
  const pts = [[R - t, -h], [R - b, -h], [R, -h + b], [R, h - b], [R - b, h], [R - t, h]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat(color, { side: THREE.DoubleSide }));
  m.position.y = BAND_Y; return m;
}

function brimMesh(color) {
  const o = new THREE.Shape();
  o.moveTo(R + 0.005, 0);
  o.absellipse(0, 0, 0.5, 0.64, 0, Math.PI, false);
  o.lineTo(-R - 0.005, 0);
  o.absarc(0, 0, R + 0.005, Math.PI, 0, true);
  const g = new THREE.ExtrudeGeometry(o, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 });
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat(color));
  m.position.set(0, BAND_Y + BAND_H / 2 - 0.02, 0); m.rotation.x = 0.1; return m;
}

function face(group) {
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.rotation.y = s * 0.32; group.add(e);
    const z = R + 0.003, st = 0.0015, y = BAND_Y - 0.02;
    disc(0.062, 0.078, '#ffffff', z, e, 0, y);
    disc(0.048, 0.068, '#3b2a78', z + st, e, 0, y - 0.004);
    disc(0.04, 0.032, '#7b62d6', z + 2 * st, e, 0, y - 0.03);
    disc(0.024, 0.04, '#120c24', z + 3 * st, e, 0, y - 0.003);
    disc(0.017, 0.017, '#ffffff', z + 4 * st, e, -0.018, y + 0.026);
    disc(0.007, 0.007, '#ffffff', z + 4 * st, e, 0.016, y - 0.034);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#0d1a3a'));
    lid.scale.set(0.066, 0.084, 1); lid.position.set(0, y, z + 5 * st); e.add(lid);
    const b = disc(0.034, 0.018, '#ff8aa0', z, e, s * 0.07, y - 0.075); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20, Math.PI), mat('#7a1f3a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, BAND_Y - 0.115, R + 0.004); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat(color));
  th.position.set(0.034, 0.006, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createVisor({ scale = 1, bandColor = '#1f6fd6', brimColor = '#fbfbff' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group();
  torso.position.y = LEG; root.add(torso);
  const upper = new THREE.Group(); upper.position.y = -LEG; torso.add(upper);
  const band = bandMesh(bandColor), brim = brimMesh(brimColor);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.035, 48, 1, true), mat('#ffffff', { side: THREE.DoubleSide }));
  stripe.position.y = BAND_Y - 0.16;
  upper.add(band, brim, stripe); face(upper);
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (R + 0.01), BAND_Y - 0.1, 0);
    sh.add(limb(ARM, 0.017, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.12, LEG, 0); hip.add(limb(LEG - 0.03, 0.026, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e8483c')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -LEG + 0.01, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { band, brim, arms, legs, hands };
  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; torso.rotation.z = tilt;
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
