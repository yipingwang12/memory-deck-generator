// The ReMix anchor: a candy-red STAND MIXER character (head with big anime eyes, bowl, beater, arms, legs).
// Faces +z, feet on y = 0, ~1 unit tall. createMixer({ scale = 1, bodyColor = '#e0283a', blush = true, bowl = true }) -> Group.
// userData.parts = { head, beater, bowl, arms:{l,r}, hands:{l,r}, legs:{l,r}, blades }   (l = +x side)
// userData.pose({ headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a mixer-local point
// userData.spin(angle)  rotates the beater about its shaft.  userData.setBladeText(canvasTexture) puts a label on the beater blade.
// userData.beaterWorld(): world position of the beater tip.
import * as THREE from 'three';

const ARM = 0.2, SHOULDER = [0.24, 0.76, 0.02];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const mesh = (geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl); return o;
};

function roundedBlock(w, h, r, depth, bevel) {
  const s = new THREE.Shape(), x = w / 2 - bevel, y = h / 2 - bevel, rr = Math.min(r, x, y);
  s.moveTo(-x + rr, -y); s.lineTo(x - rr, -y); s.quadraticCurveTo(x, -y, x, -y + rr); s.lineTo(x, y - rr);
  s.quadraticCurveTo(x, y, x - rr, y); s.lineTo(-x + rr, y); s.quadraticCurveTo(-x, y, -x, y - rr);
  s.lineTo(-x, -y + rr); s.quadraticCurveTo(-x, -y, -x + rr, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 10 });
  g.center(); return g;
}

function face(head, zFront, blush) {
  const z = zFront + 0.003, st = 0.0015, ey = 0.035;
  for (const sx of [-1, 1]) {
    const x = sx * 0.095;
    disc(0.066, 0.086, '#ffffff', z, head, x, ey);
    disc(0.052, 0.076, '#3a2416', z + st, head, x, ey - 0.004);
    disc(0.046, 0.034, '#2f8fd0', z + 2 * st, head, x, ey - 0.03);
    disc(0.028, 0.048, '#120a08', z + 3 * st, head, x, ey - 0.004);
    disc(0.019, 0.019, '#ffffff', z + 4 * st, head, x - 0.02, ey + 0.032);
    disc(0.008, 0.008, '#ffffff', z + 4 * st, head, x - 0.018, ey - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.07, 0.09, 1); lid.position.set(x, ey, z + 5 * st); head.add(lid);
    if (blush) { const b = disc(0.036, 0.02, '#ff8fa0', z, head, sx * 0.15, -0.06); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#6a1a22'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.085, z + st); head.add(mouth);
}

function buildBowl() {
  const g = new THREE.Group(), steel = mat('#d8dde3', { metalness: 0.75, roughness: 0.22 });
  const pts = [[0, 0], [0.07, 0], [0.12, 0.02], [0.18, 0.09], [0.21, 0.18], [0.222, 0.27], [0.228, 0.3], [0.222, 0.305], [0.212, 0.29], [0.2, 0.18], [0.16, 0.1], [0.1, 0.05], [0, 0.04]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), steel); b.material.side = THREE.DoubleSide;
  g.add(b, mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 24), steel, [0, 0.015, 0]));
  return g;
}

function buildBeater() {
  const g = new THREE.Group(), steel = mat('#cfd5dc', { metalness: 0.8, roughness: 0.25 });
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 14), steel, [0, -0.06, 0]));
  const blades = new THREE.Group(); blades.position.y = -0.2; g.add(blades);
  blades.add(mesh(new THREE.TorusGeometry(0.1, 0.016, 8, 36), steel, [0, 0, 0], [0, Math.PI / 2, 0], [1.25, 1, 1]));
  blades.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 28), steel, [0, 0, 0], [0, Math.PI / 2, 0], [1.9, 1.3, 1]));
  for (const y of [-0.04, 0.04]) blades.add(mesh(new THREE.BoxGeometry(0.014, 0.012, 0.2), steel, [0, y, 0]));
  blades.add(mesh(new THREE.BoxGeometry(0.014, 0.17, 0.012), steel, [0, 0, 0]));
  g.userData.blades = blades; return g;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

function glove(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mat(color));
  th.position.set(0.034, 0.006, 0.014); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createMixer({ scale = 1, bodyColor = '#e0283a', blush = true, bowl = true } = {}) {
  const root = new THREE.Group(), body = mat(bodyColor, { roughness: 0.3 }), chrome = mat('#d8dde3', { metalness: 0.8, roughness: 0.25 });
  // base, pillar, legs
  root.add(mesh(roundedBlock(0.56, 0.1, 0.05, 0.72, 0.03), body, [0, 0.19, 0.04]));
  root.add(mesh(roundedBlock(0.3, 0.5, 0.1, 0.22, 0.03), body, [0, 0.43, -0.2]));
  const skin = '#ffe0c0', legs = {}, arms = {}, elbows = {}, hands = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.15, 0.15, 0.15);
    hip.add(limb(0.14, 0.03, skin));
    hip.add(mesh(new THREE.SphereGeometry(1, 16, 12), mat('#ffd23c'), [0, -0.15, 0.025], [0, 0, 0], [0.05, 0.035, 0.075]));
    root.add(hip); legs[k] = hip;
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 0.8, 0); root.add(head);
  const hg = roundedBlock(0.48, 0.38, 0.15, 0.66, 0.035); head.add(new THREE.Mesh(hg, body));
  hg.computeBoundingBox(); const zFront = hg.boundingBox.max.z;
  face(head, zFront, blush);
  head.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20), chrome, [0, -0.2, 0.15]));          // beater socket
  head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), chrome, [0.25, 0.04, -0.08], [0, 0, Math.PI / 2])); // speed knob
  head.add(mesh(new THREE.BoxGeometry(0.03, 0.025, 0.08), chrome, [-0.25, 0.06, -0.08]));
  // beater + bowl
  const beater = buildBeater(); beater.position.set(0, -0.23, 0.15); head.add(beater);
  const bw = buildBowl(); bw.position.set(0, 0.24, 0.15); bw.visible = bowl; root.add(bw);
  // arms
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.024, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.024, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mat(skin)));
    hands[k] = glove('#ffffff'); el.add(hands[k]); sh.add(el); root.add(sh);
    sh.rotation.z = s * 0.7; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, beater, bowl: bw, arms, hands, legs, blades: beater.userData.blades };

  root.userData.pose = ({ headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  root.userData.spin = (a) => { beater.rotation.y = a; };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.2, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
