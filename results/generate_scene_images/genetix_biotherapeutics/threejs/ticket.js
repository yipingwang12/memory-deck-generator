// The Genetix anchor: one procedural TICKET character, reused in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createTicket({ scale = 1, color = '#ff7a3d' }) -> Group.
// userData.parts = { body, torso, arms:{l,r}, legs:{l,r}, hands:{l,r} }  (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a ticket-local point.
import * as THREE from 'three';

const W = 0.6, H = 0.72, D = 0.07, BODY_Y = 0.62, HIP_Y = 0.27, SHOULDER = [0.31, 0.84, 0], ARM = 0.14, PERF = -0.19;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function slabShape(w, h, r, notch) {
  const s = new THREE.Shape(), x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  s.moveTo(x0 + r, y0);
  if (notch) { s.lineTo(PERF - notch, y0); s.absarc(PERF, y0, notch, Math.PI, 0, true); }
  s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  if (notch) { s.lineTo(PERF + notch, y1); s.absarc(PERF, y1, notch, 0, Math.PI, true); }
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
const slab = (w, h, r, depth, color, notch = 0) => {
  const g = new THREE.ExtrudeGeometry(slabShape(w, h, r, notch), { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -depth / 2); return new THREE.Mesh(g, mat(color));
};

function star(color, size) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? size * 0.42 : size, a = Math.PI / 2 + i * Math.PI / 5; s[i ? 'lineTo' : 'moveTo'](r * Math.cos(a), r * Math.sin(a)); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), mat(color, { metalness: 0.3, roughness: 0.4 }));
}

function face(group, z) {
  const step = 0.002, cx = 0.08;
  for (const sx of [-1, 1]) {
    const x = cx + sx * 0.075, y = 0.66;
    disc(0.05, 0.062, '#ffffff', z, group, x, y);
    disc(0.04, 0.054, '#3a2416', z + step, group, x, y - 0.003);
    disc(0.034, 0.025, '#b4753a', z + 2 * step, group, x, y - 0.025);
    disc(0.02, 0.03, '#120a08', z + 3 * step, group, x, y);
    disc(0.013, 0.013, '#ffffff', z + 4 * step, group, x - 0.014, y + 0.02);
    disc(0.006, 0.006, '#ffffff', z + 4 * step, group, x - 0.014, y - 0.024);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.054, 0.066, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.028, 0.015, '#ff7f8f', z, group, cx + sx * 0.125, 0.585); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(cx, 0.575, z + step); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(color));
  th.position.set(0.03, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createTicket({ scale = 1, color = '#ff7a3d' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', body = new THREE.Group(); body.position.y = BODY_Y;
  body.add(slab(W, H, 0.05, D, color, 0.045));
  const panel = slab(0.4, 0.58, 0.04, 0.012, '#ffffff'); panel.position.set(0.08, 0.0, D / 2); body.add(panel);
  const stub = slab(0.15, 0.58, 0.03, 0.012, '#ffe9c4'); stub.position.set(-0.235, 0, D / 2); body.add(stub);
  const st = star('#ffc21a', 0.055); st.position.set(-0.235, 0.1, D / 2 + 0.008); body.add(st);
  const st2 = star('#ffc21a', 0.04); st2.position.set(-0.235, -0.12, D / 2 + 0.008); body.add(st2);
  for (let i = 0; i < 9; i++) disc(0.008, 0.008, color, D / 2 + 0.013, body, PERF, -0.25 + i * 0.062);
  const bodyFace = new THREE.Group(); bodyFace.position.y = -BODY_Y; body.add(bodyFace); bodyFace.position.y = -BODY_Y + 0; // face coords are world-y
  face(bodyFace, D / 2 + 0.014);
  bodyFace.position.y = -BODY_Y;
  // barcode strip under the face
  const bar = new THREE.Group(); bar.position.set(0.08, -0.22, D / 2 + 0.014); body.add(bar);
  [0, 1, 2, 3, 4, 5, 6].forEach((i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.012 + (i % 3) * 0.008, 0.07, 0.004), mat('#3a2416')); m.position.x = (i - 3) * 0.035; bar.add(m); });
  upper.add(body);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.11, HIP_Y, 0); hip.add(limb(0.21, 0.024, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.046, 0.036, 0.07);
    shoe.position.set(0, -0.24, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, arms, legs, hands };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; body.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), Dd = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(Dd / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(Dd).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
