// The Arctop anchor: one procedural spinning TOP character, reused in every scene.
// Faces +z, tip touches y = 0, ~0.8 unit tall. createTop({ scale = 1, bodyColor = '#e8453c' }) -> Group.
// userData.parts = { body, arms:{l,r}, hands:{l,r}, face }   (l = +x side)
// userData.pose({ arms:{l:[x,z], r:[x,z]}, tilt }) radians; arm z>0 swings l out; tilt = roll of whole top (z).
// userData.spin(angle) rotates the striped body only (face stays put so it always reads).
import * as THREE from 'three';

const RB = 0.21, YF = 0.3;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function bodyGeo() {
  const pts = [[0, 0], [0.02, 0.012], [0.06, 0.07], [0.15, 0.18], [RB, 0.26], [RB + 0.02, 0.3], [RB, 0.36], [0.17, 0.43], [0.09, 0.48], [0.045, 0.5]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 48);
}

function stripes(parent) {
  const cols = ['#ffd23c', '#2fa7a0'];
  [[0.2, 0.22, 0.012], [0.38, 0.17, 0.012]].forEach(([y, r, h], i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, h, 10, 48), mat(cols[i], { roughness: 0.4 }));
    t.rotation.x = Math.PI / 2; t.position.y = y; parent.add(t);
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RB + 0.022, 0.016, 10, 48), mat('#ffd23c'));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; parent.add(rim);
}

function face(group) {
  for (const sx of [-1, 1]) {
    const a = Math.asin(0.075 / RB), z = Math.cos(a) * (RB + 0.022) + 0.002, step = 0.0015;
    const g = new THREE.Group(); g.rotation.y = sx * a; g.position.set(sx * 0.075 * 1.0, YF + 0.03, 0);
    g.position.x = Math.sin(a) * sx * (RB + 0.022); g.position.z = Math.cos(a) * (RB + 0.022) + 0.002;
    disc(0.034, 0.044, '#ffffff', 0, g);
    disc(0.027, 0.039, '#3a2416', step, g, 0, -0.002);
    disc(0.023, 0.018, '#2a8fd0', 2 * step, g, 0, -0.017);
    disc(0.013, 0.022, '#120a08', 3 * step, g);
    disc(0.009, 0.009, '#ffffff', 4 * step, g, -0.01, 0.015);
    disc(0.004, 0.004, '#ffffff', 4 * step, g, -0.01, -0.017);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.037, 0.047, 1); lid.position.z = 5 * step; g.add(lid);
    group.add(g);
    const b = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#ff7f8f', transparent: true, opacity: 0.55 }));
    b.scale.set(0.02, 0.011, 1); b.rotation.y = sx * Math.asin(0.12 / RB);
    b.position.set(sx * 0.12, YF - 0.025, Math.sqrt((RB + 0.022) ** 2 - 0.12 ** 2) + 0.002); group.add(b);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0034, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, YF - 0.035, RB + 0.024); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
};

export function createTop({ scale = 1, bodyColor = '#e8453c' } = {}) {
  const root = new THREE.Group(), tilt = new THREE.Group(), spinner = new THREE.Group(), faceG = new THREE.Group();
  root.add(tilt); tilt.add(spinner, faceG);
  const body = new THREE.Mesh(bodyGeo(), mat(bodyColor)); spinner.add(body); stripes(spinner);
  // handle: stem + knob
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 20), mat('#f1d9a8')); stem.position.y = 0.6; spinner.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 18), mat('#2fa7a0')); knob.position.y = 0.72; spinner.add(knob);
  const tipM = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 14), mat('#2b2b30', { metalness: 0.5 })); tipM.rotation.x = Math.PI; tipM.position.y = 0.012; spinner.add(tipM);
  face(faceG);

  const arms = {}, hands = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (RB + 0.01), 0.31, 0.02);
    sh.add(limb(0.16, 0.014, '#ffe0c0'));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat('#ffe0c0')); hand.position.y = -0.17; sh.add(hand);
    sh.rotation.z = s * 0.9; faceG.add(sh); arms[k] = sh; hands[k] = hand;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, arms, hands, face: faceG };
  root.userData.pose = ({ arms: A = {}, tilt: t = 0 } = {}) => {
    tilt.rotation.z = t;
    for (const [k, v] of Object.entries(A)) arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  root.userData.spin = (a) => { spinner.rotation.y = a; };
  return root;
}
