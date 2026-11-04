// The Cellarity anchor: a little arched CELLAR DOOR in a stone frame, with face, arms, legs.
// Faces +z, feet on y = 0, ~1.1 units tall. createCellar({ scale = 1, doorColor = '#a8652f', blush = true }) -> Group.
// userData.parts = { frame, door, arms:{l,r}, legs:{l,r}, hands:{l,r}, face }   (l = +x side)
// userData.pose({ arms:{l:[rotX, rotZ], r:[..]}, legs:{l:[rotX], r:[..]}, tilt }) radians; rotX<0 raises arm forward; rotZ>0 swings l out.
import * as THREE from 'three';

const BASE = 0.22;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const archShape = (w, h) => {
  const s = new THREE.Shape(), r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return s;
};
const extrude = (shape, depth, bevel, color, z0) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3 });
  const m = new THREE.Mesh(g, mat(color)); m.position.z = z0; return m;
};
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function buildFace(g, blush) {
  const z = 0.19, st = 0.0015, y = BASE + 0.46;
  for (const sx of [-1, 1]) {
    const x = sx * 0.11;
    disc(0.075, 0.095, '#ffffff', z, g, x, y);
    disc(0.06, 0.085, '#3a2416', z + st, g, x, y - 0.004);
    disc(0.05, 0.045, '#c0803a', z + 2 * st, g, x, y - 0.04);
    disc(0.03, 0.05, '#120a08', z + 3 * st, g, x, y);
    disc(0.02, 0.02, '#ffffff', z + 4 * st, g, x - 0.02, y + 0.035);
    disc(0.009, 0.009, '#ffffff', z + 4 * st, g, x + 0.02, y - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.08, 0.1, 1); lid.position.set(x, y, z + 5 * st); g.add(lid);
    if (blush) { const b = disc(0.04, 0.022, '#ff6f80', z, g, sx * 0.19, y - 0.11); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI), mat('#5a1a1a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, BASE + 0.31, z + st); g.add(mouth);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), mat('#e6b43a', { metalness: 0.6, roughness: 0.3 }));
  knob.position.set(0, BASE + 0.375, z + 0.01); g.add(knob);
}

export function createCellar({ scale = 1, doorColor = '#a8652f', blush = true } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); body.position.y = BASE; root.add(body);
  const frame = extrude(archShape(0.74, 0.88), 0.26, 0.02, '#a7a39b', -0.13);
  const door = extrude(archShape(0.56, 0.76), 0.05, 0.008, doorColor, 0.13);
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.3), mat('#cfcac0')); key.position.set(0, 0.86, 0);
  const moss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat('#5f9a3e')); moss.scale.set(1.3, 0.5, 0.9); moss.position.set(-0.22, 0.84, 0.05);
  body.add(frame, door, key, moss);
  const iron = mat('#2f2f36', { metalness: 0.5, roughness: 0.4 });
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.7, 0.01), mat('#6a3a18')); p.position.set(sx * 0.2, 0.37, 0.19); body.add(p);
  }
  for (const y of [0.1, 0.66]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.012), iron); s.position.set(0, y, 0.187); body.add(s); }
  const faceG = new THREE.Group(); faceG.position.y = -BASE; body.add(faceG); buildFace(faceG, blush);

  const skin = '#6b4a2b', arms = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.4, 0.5, 0);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 12), mat(skin)); a.geometry.translate(0, -0.13, 0);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 14), mat('#fff6e6')); h.position.y = -0.28;
    sh.add(a, h); sh.rotation.z = s * 0.25; body.add(sh); arms[k] = sh; hands[k] = h;
    const lg = new THREE.Group(); lg.position.set(s * 0.16, 0, 0);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), mat(skin)); l.geometry.translate(0, -0.1, 0);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.07, 0.05, 0.1); shoe.position.set(0, -0.2, 0.03);
    lg.add(l, shoe); root.add(lg); lg.position.y = BASE; legs[k] = lg;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { frame, door, arms, legs, hands, face: faceG };
  root.userData.pose = ({ arms: A = {}, legs: L = {}, tilt = 0 } = {}) => {
    body.rotation.z = tilt;
    for (const [k, v] of Object.entries(A)) arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, 0);
  };
  return root;
}
