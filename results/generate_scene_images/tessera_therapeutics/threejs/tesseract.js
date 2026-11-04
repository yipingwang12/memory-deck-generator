// The Tessera anchor: a TESSERACT (cube within a cube) character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createTesseract({ scale = 1, outer = '#3a6bff', inner = '#fff4dc', strut = '#ffc23a' }) -> Group.
// Outer cube = solid edge frame (open faces, so no transparency needed); inner cube = solid, carries the face; 8 gold struts join them.
// userData.parts = { frame, core, face, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, headTilt }) radians; arm z>0 swings l out.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a tesseract-local point.
import * as THREE from 'three';

const H = 0.33, CY = 0.62, IH = 0.19, ARM = 0.15, EDGE = 0.032;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const bar = (a, b, r, m) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), m);
  c.position.copy(A).add(B).multiplyScalar(0.5);
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c;
};
const cubeCorners = (h, cy) => { const out = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) out.push([x * h, cy + y * h, z * h]); return out; };

function frame(color, strutColor) {
  const g = new THREE.Group(), m = mat(color, { metalness: 0.2 }), sm = mat(strutColor, { metalness: 0.5, roughness: 0.35 });
  const O = cubeCorners(H, CY), I = cubeCorners(IH, CY);
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const diff = [0, 1, 2].filter((k) => O[i][k] !== O[j][k]).length;
    if (diff === 1) g.add(bar(O[i], O[j], EDGE / 2, m));
  }
  for (const c of O) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.075), m); k.position.set(...c); g.add(k); }
  for (let i = 0; i < 8; i++) g.add(bar(I[i], O[i], 0.017, sm));
  return g;
}

function face(group) {
  const z = IH + 0.002, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = CY + 0.035;
    disc(0.055, 0.07, '#ffffff', z, group, x, y);
    disc(0.045, 0.062, '#2a3f9a', z + step, group, x, y - 0.002);
    disc(0.04, 0.03, '#5fb4ff', z + 2 * step, group, x, y - 0.03);
    disc(0.022, 0.036, '#0a0f28', z + 3 * step, group, x, y);
    disc(0.015, 0.015, '#ffffff', z + 4 * step, group, x - 0.016, y + 0.025);
    disc(0.007, 0.007, '#ffffff', z + 4 * step, group, x - 0.016, y - 0.028);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a1030'));
    lid.scale.set(0.058, 0.074, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.03, 0.017, '#ff7f9f', z, group, sx * 0.125, CY - 0.05); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#8a2a3a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, CY - 0.07, z + step); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createTesseract({ scale = 1, outer = '#3a6bff', inner = '#fff4dc', strut = '#ffc23a' } = {}) {
  const root = new THREE.Group(), skin = '#ffe0c0';
  const core = new THREE.Mesh(new THREE.BoxGeometry(2 * IH, 2 * IH, 2 * IH), mat(inner, { emissive: '#ffe9b0', emissiveIntensity: 0.25 }));
  core.position.y = CY;
  const faceG = new THREE.Group(); face(faceG);
  const fr = frame(outer, strut);
  root.add(core, faceG, fr);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * H, CY, H);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand);
    hands[k] = hand; sh.add(el); root.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.17, CY - H, H * 0.6); hip.add(limb(CY - H - 0.03, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e0483c')); shoe.scale.set(0.055, 0.04, 0.085);
    shoe.position.set(0, -(CY - H - 0.03), 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { frame: fr, core, face: faceG, arms, legs, hands };

  root.userData.pose = ({ arms: A = {}, legs: L = {}, headTilt = 0 } = {}) => {
    root.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.3, -0.5); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
