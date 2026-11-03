// The Alto anchor: one procedural alto SAXOPHONE character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.25 units tall; bell curves up behind (-z). createSax({ scale = 1, color = '#f2b72e', blush = true }) -> Group.
// userData.parts = { upper, head (face plate), arms:{l,r}, legs:{l,r}, hands:{l,r}, mouthpiece, bellTop, headTop }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; lean = pitch about the hips (+ = forward).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a sax-local point.
import * as THREE from 'three';

const HIP_Y = 0.36, SHOULDER = [0.15, 0.98, 0.02], ARM = 0.16, LEG = 0.27, FACE_Y = 0.86, FACE_Z = 0.118;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Tube along a curve with per-t radius [t, r] stops; open ends. */
function variableTube(curve, stops, seg = 140, radial = 28) {
  const rAt = (t) => {
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [t0, r0] = stops[i - 1], [t1, r1] = stops[i], k = (t - t0) / (t1 - t0);
      return r0 + (r1 - r0) * (k * k * (3 - 2 * k));
    }
    return stops[stops.length - 1][1];
  };
  const pos = [], idx = [], frames = curve.computeFrenetFrames(seg, false);
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, p = curve.getPointAt(t), r = rAt(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, rAt };
}

const SAX_PATH = [[0.16, 1.22], [0.08, 1.2], [0.01, 1.12], [0, 1.0], [0, 0.7], [0, 0.45], [-0.01, 0.34], [-0.08, 0.24], [-0.2, 0.22], [-0.32, 0.3], [-0.37, 0.45], [-0.38, 0.62], [-0.39, 0.74]];
const SAX_RADII = [[0, 0.03], [0.1, 0.05], [0.2, 0.105], [0.55, 0.115], [0.75, 0.11], [0.88, 0.14], [1, 0.22]];

function body(color) {
  const g = new THREE.Group(), gold = mat(color), pale = mat('#ffd466');
  const curve = new THREE.CatmullRomCurve3(SAX_PATH.map(([z, y]) => new THREE.Vector3(0, y, z)), false, 'centripetal');
  const { geo } = variableTube(curve, SAX_RADII);
  g.add(new THREE.Mesh(geo, gold));
  const end = curve.getPointAt(1);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 10, 40), pale); rim.rotation.x = Math.PI / 2; rim.position.copy(end).y += 0.005; g.add(rim);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(0.21, 36), mat('#3a1c10', { roughness: 0.9 })); dark.rotation.x = -Math.PI / 2; dark.position.copy(end).y -= 0.012; g.add(dark);
  for (const t of [0.12, 0.2, 0.62]) {   // seam collars
    const p = curve.getPointAt(t), tg = curve.getTangentAt(t), r = SAX_RADII.find(([k]) => k >= t)[1];
    const c = new THREE.Mesh(new THREE.TorusGeometry(r + 0.004, 0.011, 8, 28), pale); c.position.copy(p);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg); g.add(c);
  }
  // flat face plate so the eyes sit on a plane
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.236, 40), mat('#f7c444'));
  plate.rotation.x = Math.PI / 2; plate.scale.set(0.125, 1, 0.17); plate.position.set(0, FACE_Y, 0); g.add(plate);
  // side keys
  const silver = mat('#e4e9ee', { roughness: 0.3 }), pearl = mat('#fff7e6', { roughness: 0.25 });
  for (const s of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 8), silver); rod.position.set(s * 0.12, 0.66, 0.0); g.add(rod);
    [0.42, 0.52, 0.6, 0.7, 0.8, 1.0].forEach((y, i) => {
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), i % 2 ? pearl : silver);
      k.scale.set(0.8, 1, 1); k.position.set(s * 0.123, y, 0.01 * (i % 2)); g.add(k);
    });
  }
  // mouthpiece + reed + ligature
  const mp = new THREE.Group(); mp.position.set(0, 1.22, 0.16); mp.rotation.x = Math.PI / 2 - 0.12;
  const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.036, 0.17, 20), mat('#1c1c22', { roughness: 0.3 })); piece.position.y = 0.085; mp.add(piece);
  const lig = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 20), pale); lig.position.y = 0.04; mp.add(lig);
  const reed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.007), mat('#e9c887')); reed.position.set(0, 0.1, -0.026); mp.add(reed);
  g.add(mp);
  return { group: g, mouthpiece: mp, bellTop: new THREE.Vector3(0, 0.78, -0.39) };
}

function face(group, blush) {
  const z = FACE_Z + 0.002, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.052, y = FACE_Y + 0.045;
    disc(0.035, 0.045, '#ffffff', z, group, x, y);
    disc(0.027, 0.04, '#3a2416', z + step, group, x, y - 0.002);
    disc(0.023, 0.018, '#b4753a', z + 2 * step, group, x, y - 0.017);
    disc(0.0135, 0.022, '#120a08', z + 3 * step, group, x, y);
    disc(0.009, 0.009, '#ffffff', z + 4 * step, group, x - 0.01, y + 0.015);
    disc(0.004, 0.004, '#ffffff', z + 4 * step, group, x - 0.01, y - 0.017);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.038, 0.048, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.02, 0.011, '#ff7f8f', z, group, sx * 0.085, FACE_Y - 0.03); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0034, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, FACE_Y - 0.04, z + step); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };
function glove(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(color));
  th.position.set(0.03, 0.005, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createSax({ scale = 1, color = '#f2b72e', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const b = body(color); upper.add(b.group); face(upper, blush);
  const skin = '#fff3df', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), mat(skin)));
    hands[k] = glove('#ffffff'); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.4; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.065, HIP_Y, 0.03); hip.add(limb(LEG, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#7a3b2a')); shoe.scale.set(0.04, 0.034, 0.065);
    shoe.position.set(0, -LEG - 0.02, 0.022); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { upper, arms, legs, hands, mouthpiece: b.mouthpiece, bellTop: b.bellTop, headTop: new THREE.Vector3(0, 1.25, 0.1) };

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.8, -0.3, -0.5); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
