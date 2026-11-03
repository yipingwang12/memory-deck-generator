// The Tempus anchor: a cartoon HOURGLASS (wood caps, glass bulbs, gold sand, big anime eyes on the upper bulb).
// Faces +z, feet on y = 0, ~1.05 units tall. createHourglass({ scale = 1, sand = '#f2b640' }) -> Group.
// userData.parts = { glass, sandTop, sandBot, head (face group), arms:{l,r}, legs:{l,r}, hands:{l,r}, caps }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, tilt }) radians; arm z>0 swings l out; tilt = roll of whole body about feet.
// userData.reach('l'|'r', [x,y,z]) two-bone IK: hand to a hourglass-local point.
import * as THREE from 'three';

const ARM = 0.17, SHOULDER = [0.075, 0.65], LEG = 0.25;
const PROFILE = [[0.29, 0.17], [0.31, 0.2], [0.38, 0.225], [0.46, 0.21], [0.54, 0.14], [0.6, 0.065], [0.65, 0.028]];
const FULL = [...PROFILE, ...PROFILE.slice(0, -1).reverse().map(([y, r]) => [1.3 - y, r])];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

/** Outer radius of the glass at height y (piecewise linear). */
function radiusAt(y) {
  for (let i = 0; i < FULL.length - 1; i++) {
    const [y0, r0] = FULL[i], [y1, r1] = FULL[i + 1];
    if (y >= y0 && y <= y1) return r0 + (r1 - r0) * (y - y0) / (y1 - y0);
  }
  return 0.1;
}

function lathe(pts, m) { return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([y, r]) => new THREE.Vector2(r, y)), 40), m); }

function sandShape(scale, yLo, yHi, dome) {
  const inner = FULL.filter(([y]) => y >= yLo && y <= yHi).map(([y, r]) => [y, r * scale]);
  return dome ? [[yLo, 0.001], ...inner, [yHi, 0.001]] : [[yLo, 0.001], ...inner, [yHi, 0.001]];
}

function disc(rx, ry, color, z, parent, x = 0, y = 0) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
}

/** Eyes + mouth, each placed on the glass surface and oriented along its normal. */
function face(parent, blush) {
  const cy = 0.9, step = 0.0015;
  const onGlass = (x, y) => {
    const r = radiusAt(y), z = Math.sqrt(Math.max(r * r - x * x, 1e-4)) + 0.003;
    const g = new THREE.Group(); g.position.set(x, y, z);
    const slope = (radiusAt(y + 0.01) - radiusAt(y - 0.01)) / 0.02;
    g.lookAt(new THREE.Vector3(x * 2, y - slope * r, z + r * 0.5).add(new THREE.Vector3(0, 0, 0)));
    g.rotation.set(Math.atan(slope), Math.asin(x / r), 0, 'YXZ');
    parent.add(g); return g;
  };
  for (const sx of [-1, 1]) {
    const g = onGlass(sx * 0.07, cy);
    disc(0.05, 0.06, '#ffffff', 0, g);
    disc(0.038, 0.052, '#3a2416', step, g, 0, -0.003);
    disc(0.033, 0.025, '#b4753a', 2 * step, g, 0, -0.022);
    disc(0.019, 0.03, '#120a08', 3 * step, g);
    disc(0.012, 0.012, '#ffffff', 4 * step, g, -0.014, 0.02);
    disc(0.006, 0.006, '#ffffff', 4 * step, g, -0.014, -0.022);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.053, 0.063, 1); lid.position.z = 5 * step; g.add(lid);
    if (blush) { const b = onGlass(sx * 0.115, cy - 0.065); const d = disc(0.025, 0.014, '#ff7f8f', 0, b); d.material.transparent = true; d.material.opacity = 0.6; }
  }
  const g = onGlass(0, cy - 0.075);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; g.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat(color));
  th.position.set(0.034, 0.006, 0.014); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createHourglass({ scale = 1, sand = '#f2b640', blush = true } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const wood = mat('#8a4b24', { roughness: 0.5 }), gold = mat('#e2b13c', { metalness: 0.6, roughness: 0.3 });
  const glass = lathe(FULL, mat('#bfe6f5', { transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.1, depthWrite: false }));
  const sandBot = lathe(sandShape(0.93, 0.292, 0.42), mat(sand, { roughness: 0.9, side: THREE.DoubleSide }));
  const sandTop = lathe(sandShape(0.93, 0.74, 0.8), mat(sand, { roughness: 0.9, side: THREE.DoubleSide }));
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), mat(sand)); stream.position.y = 0.6;
  const caps = [];
  for (const y of [0.27, 1.03]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.045, 32), wood); c.position.y = y;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.012, 8, 40), gold); rim.rotation.x = Math.PI / 2; rim.position.y = y + (y < 0.5 ? -0.02 : 0.02);
    body.add(c, rim); caps.push(c);
  }
  for (const a of [0, 2 * Math.PI / 3, 4 * Math.PI / 3]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.76, 10), wood);
    p.position.set(0.215 * Math.cos(a + 0.5), 0.65, 0.215 * Math.sin(a + 0.5)); body.add(p);
  }
  const head = new THREE.Group(); face(head, blush);
  body.add(glass, sandBot, sandTop, stream, head);

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0.0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); body.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.27, 0); hip.add(limb(LEG, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.04, 0.035, 0.065);
    shoe.position.set(0, -LEG, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  glass.castShadow = false; glass.renderOrder = 10;
  root.scale.setScalar(scale);
  root.userData.parts = { glass, sandTop, sandBot, head, arms, legs, hands, caps };

  root.userData.pose = ({ tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    root.rotation.z = tilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
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
