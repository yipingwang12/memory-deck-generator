// The Valo Health anchor: one chunky anime VIOLA with face, scroll, strings, arms and legs.
// Faces +z, feet on y = 0, ~1.15 units tall. createViola({ scale = 1, bodyColor = '#c2501c', plateColor = '#f0922e' }) -> Group.
// userData.parts = { body, torso, scroll, arms:{l,r}, legs:{l,r}, hands:{l,r}, chest }   (l = +x side); chest = [x,y,z] local belly point.
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; tilt = roll of the whole body (z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a viola-local point.
import * as THREE from 'three';

const DEPTH = 0.14, BEV = 0.02, Y0 = 0.25, HIP_Y = 0.27, ARM = 0.16, FRONT = DEPTH / 2 + BEV;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Figure-eight outline (local y 0..0.55), scaled about its centre by k. */
function outline(k = 1) {
  const half = [[0, 0], [0.025, 0.12], [0.07, 0.19], [0.15, 0.215], [0.23, 0.19], [0.29, 0.13], [0.33, 0.115], [0.38, 0.15], [0.44, 0.17], [0.5, 0.145], [0.535, 0.07], [0.55, 0]];
  const pts = [...half.map(([y, w]) => [w, y]), ...half.slice(1, -1).reverse().map(([y, w]) => [-w, y])]
    .map(([x, y]) => new THREE.Vector3(x * k, 0.275 + (y - 0.275) * k, 0));
  const c = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  return new THREE.Shape(c.getPoints(160).map((p) => new THREE.Vector2(p.x, p.y)));
}

function buildBody(bodyColor, plateColor) {
  const g = new THREE.Group(); g.position.y = Y0;
  const ribs = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(), { depth: DEPTH, bevelEnabled: true, bevelSize: BEV, bevelThickness: BEV, bevelSegments: 4, curveSegments: 4 }), mat(bodyColor));
  ribs.geometry.translate(0, 0, -DEPTH / 2);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(0.9), { depth: 0.012, bevelEnabled: false }), mat(plateColor));
  plate.position.z = FRONT - 0.002;
  g.add(ribs, plate);
  return g;
}

function face(parent) {
  const z = FRONT + 0.013, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.085, y = 0.65;
    disc(0.052, 0.066, '#ffffff', z, parent, x, y);
    disc(0.042, 0.058, '#5b2a99', z + st, parent, x, y - 0.002);
    disc(0.037, 0.028, '#c58af2', z + 2 * st, parent, x, y - 0.025);
    disc(0.022, 0.034, '#140a1e', z + 3 * st, parent, x, y);
    disc(0.015, 0.015, '#ffffff', z + 4 * st, parent, x - 0.014, y + 0.022);
    disc(0.007, 0.007, '#ffffff', z + 4 * st, parent, x + 0.012, y - 0.026);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.056, 0.07, 1); lid.position.set(x, y, z + 5 * st); parent.add(lid);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.005, 6, 16, Math.PI * 0.6), mat('#3a1a10'));
    brow.rotation.z = Math.PI * 0.2 + (sx > 0 ? 0 : -0.0); brow.position.set(x, 0.715, z); parent.add(brow);
    const bl = disc(0.025, 0.013, '#ff7f8f', z, parent, sx * 0.13, 0.575); bl.material.transparent = true; bl.material.opacity = 0.6;
    const fh = disc(0.009, 0.036, '#2a120a', z, parent, sx * 0.1, 0.495); fh.rotation.z = sx * 0.25;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 8, 24, Math.PI), mat('#7a1f1f'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.46, z + st); parent.add(mouth);
}

function fittings(parent) {
  const dark = mat('#1d1210', { roughness: 0.3 }), light = mat('#f4dca0'), gold = mat('#f0d060', { metalness: 0.5, roughness: 0.3 });
  const fz = FRONT + 0.012;
  // fingerboard (tapered) from neck down onto the plate
  const fb = new THREE.Shape([[-0.016, 0.98], [0.016, 0.98], [0.032, 0.575], [-0.032, 0.575]].map(([x, y]) => new THREE.Vector2(x, y)));
  const fbm = new THREE.Mesh(new THREE.ExtrudeGeometry(fb, { depth: 0.014, bevelEnabled: false }), dark); fbm.position.z = fz - 0.004; parent.add(fbm);
  // neck behind the fingerboard + pegbox
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.07), mat('#a8431a')); neck.position.set(0, 0.88, 0.065); parent.add(neck);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.075), mat('#a8431a')); box.position.set(0, 1.0, 0.065); parent.add(box);
  for (const [i, y] of [0.975, 1.025].entries()) for (const s of [-1, 1]) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 10), dark);
    peg.rotation.z = Math.PI / 2; peg.position.set(s * 0.058, y + (s > 0 ? 0 : 0.0) , 0.065); parent.add(peg);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), light); cap.position.set(s * 0.088, y, 0.065); parent.add(cap);
  }
  // scroll: spiral tube curling in the front plane
  const sp = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = Math.PI * 0.5 + t * Math.PI * 3.6, r = 0.072 * (1 - 0.72 * t); sp.push(new THREE.Vector3(0.0 + Math.cos(a) * r + 0.0, 1.14 + Math.sin(a) * r - 0.07 + 0.0, 0.065)); }
  const scroll = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 90, 0.026, 12), mat('#c2501c'));
  parent.add(scroll);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), mat('#c2501c')); eye.position.copy(sp[60]); parent.add(eye);
  // bridge + strings
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), light); bridge.position.set(0, 0.5, fz + 0.015); parent.add(bridge);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.07, 3), dark); tail.rotation.z = Math.PI; tail.scale.z = 0.4; tail.position.set(0, 0.305, fz + 0.01); parent.add(tail);
  for (const x of [-0.033, -0.011, 0.011, 0.033]) {
    const a = new THREE.Vector3(x, 0.5, fz + 0.034), b = new THREE.Vector3(x * 0.3, 0.985, fz + 0.012);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, a.distanceTo(b), 6), mat('#f6f0d0', { metalness: 0.6, roughness: 0.25 }));
    s.position.copy(a).add(b).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    parent.add(s);
  }
  return scroll;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function glove(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(color));
  th.position.set(0.03, 0.006, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createViola({ scale = 1, bodyColor = '#c2501c', plateColor = '#f0922e' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#fff0d8', body = buildBody(bodyColor, plateColor);
  const fx = new THREE.Group(); face(fx); const scroll = fittings(fx);
  upper.add(body, fx);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.15, 0.56, 0.0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    hands[k] = glove('#ffffff'); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.5; el.rotation.z = -s * 0.5; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0); hip.add(limb(0.2, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#4a2a8a')); shoe.scale.set(0.045, 0.036, 0.07);
    shoe.position.set(0, -0.225, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, scroll, arms, legs, hands, chest: [0, Y0 + 0.18, FRONT + 0.012] };

  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.set(lean, 0, tilt);
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
  root.userData.pose({});
  return root;
}
