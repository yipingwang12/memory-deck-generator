// The Zander anchor: an upright anime pike-perch (fish) with big glassy eyes, spiny dorsal fin, tail fin, fin-arms and legs.
// Faces +z, feet on y = 0, ~1 unit tall. createZander({ scale = 1, bodyColor = '#5f9a8a', blush = true }) -> Group.
// userData.parts = { body, torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, mouth }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a zander-local point.
// userData.lie(yaw = 0)  lies on its back, resting on y = 0.
import * as THREE from 'three';

const HIP_Y = 0.25, SHOULDER = [0.19, 0.62, 0.0], ARM = 0.14, HEAD_Y = 0.8;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const ell = (parent, color, pos, scl, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(color, extra)); m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.35 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Flat fin outline in the (z,y) plane (x = thickness), extruded along x. */
function fin(points, color, thick = 0.03) {
  const s = new THREE.Shape(); points.forEach(([z, y], i) => s[i ? 'lineTo' : 'moveTo'](z, y));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
  g.translate(0, 0, -thick / 2); g.rotateY(-Math.PI / 2);
  return new THREE.Mesh(g, mat(color, { roughness: 0.5, side: THREE.DoubleSide }));
}

function face(head, blush) {
  const z = 0.2;
  for (const sx of [-1, 1]) {
    const x = sx * 0.082, y = 0.015;
    ell(head, '#ffffff', [x, y, z - 0.03], [0.062, 0.07, 0.04], { roughness: 0.3 });
    const f = z + 0.012, st = 0.0015;
    disc(0.05, 0.058, '#e8b92e', f, head, x, y);
    disc(0.034, 0.044, '#16202a', f + st, head, x, y);
    disc(0.016, 0.016, '#ffffff', f + 2 * st, head, x - 0.014, y + 0.02);
    disc(0.007, 0.007, '#ffffff', f + 2 * st, head, x + 0.012, y - 0.02);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#10241f'));
    lid.scale.set(0.058, 0.066, 1); lid.position.set(x, y + 0.002, f + 3 * st); head.add(lid);
    if (blush) { const b = disc(0.026, 0.014, '#ff8a8a', z - 0.008, head, sx * 0.125, -0.068); b.material.transparent = true; b.material.opacity = 0.6; }
    const gill = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.005, 6, 20, 1.6), mat('#2f5f55'));
    gill.rotation.set(0, sx * Math.PI / 2, 0); gill.position.set(sx * 0.188, -0.01, -0.02); head.add(gill);
  }
  // jaw + mouth + little fangs
  const jaw = ell(head, '#7fb6a0', [0, -0.088, 0.168], [0.1, 0.05, 0.075]);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0045, 8, 20, Math.PI), mat('#6a2230'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.072, 0.238); head.add(mouth);
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.022, 8), mat('#ffffff')); t.rotation.x = Math.PI; t.position.set(sx * 0.02, -0.086, 0.236); head.add(t); }
  return { jaw, mouth };
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

function hand(color) {
  const g = new THREE.Group(), p = ell(g, color, [0, 0, 0], [0.03, 0.034, 0.024]);
  ell(g, color, [0.025, 0.005, 0.01], [0.013, 0.013, 0.013]); g.position.y = -ARM; return g;
}

export function createZander({ scale = 1, bodyColor = '#5f9a8a', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const body = new THREE.Group(), orange = '#f08a3c', belly = '#f3ecd2';
  ell(body, bodyColor, [0, 0.5, 0], [0.205, 0.34, 0.175]);
  ell(body, belly, [0, 0.47, 0.065], [0.15, 0.29, 0.125]);
  for (const t of [-0.22, -0.08, 0.06, 0.2]) {                       // dark pike-perch bands around the back
    const r = Math.sqrt(1 - (t / 0.34) ** 2), ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 40, Math.PI * 1.2), mat('#2c5448'));
    ring.rotation.set(Math.PI / 2, 0, Math.PI * 0.4 + Math.PI * 0.5 + 0.0); ring.scale.set(0.205 * r + 0.004, 0.175 * r + 0.004, 1);
    ring.position.set(0, 0.5 + t, 0); ring.rotation.set(Math.PI / 2, 0, Math.PI + 0.0 - 0.6 * 0 + Math.PI * 0 - Math.PI * 0.1); body.add(ring);
  }
  // spiny dorsal fin on the back (-z)
  const dorsal = fin([[-0.15, 0.45], [-0.3, 0.62], [-0.27, 0.72], [-0.31, 0.8], [-0.26, 0.9], [-0.28, 1.0], [-0.18, 0.97], [-0.14, 0.9]], orange);
  body.add(dorsal);
  for (const [z, y0, z1, y1] of [[-0.15, 0.55, -0.3, 0.62], [-0.15, 0.62, -0.27, 0.72], [-0.15, 0.7, -0.31, 0.8], [-0.15, 0.78, -0.26, 0.9], [-0.15, 0.86, -0.28, 1.0]]) {
    const a = new THREE.Vector3(0, y0, z), b = new THREE.Vector3(0, y1, z1), d = b.clone().sub(a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, d.length(), 6), mat('#8a3a1c'));
    c.position.copy(a.clone().add(b).multiplyScalar(0.5)); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); body.add(c);
  }
  // forked tail fin trailing behind and below
  body.add(fin([[-0.1, 0.28], [-0.2, 0.2], [-0.4, 0.1], [-0.3, 0.02], [-0.42, -0.1], [-0.18, -0.03], [-0.1, 0.12]], orange));

  const head = new THREE.Group(); head.position.y = HEAD_Y;
  const inner = new THREE.Group(); inner.position.y = -HEAD_Y; head.add(inner);
  const hh = new THREE.Group(); hh.position.y = HEAD_Y; inner.add(hh);
  ell(hh, bodyColor, [0, 0, 0], [0.21, 0.185, 0.2]);
  ell(hh, '#3f7a6a', [0, 0.1, -0.02], [0.18, 0.1, 0.17]);        // darker brow/back of head
  const { mouth } = face(hh, blush);
  upper.add(body, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.014, bodyColor)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.013, bodyColor));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), mat(bodyColor)));
    hands[k] = hand(belly); el.add(hands[k]); sh.add(el);
    const pf = fin([[-0.01, 0.0], [-0.07, -0.06], [-0.05, -0.12], [0.0, -0.1]], orange, 0.01); pf.position.set(0, 0, 0); pf.rotation.y = 0; sh.add(pf);
    upper.add(sh); sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.085, HIP_Y, 0); hip.add(limb(0.2, 0.022, bodyColor));
    const foot = ell(hip, orange, [0, -0.225, 0.03], [0.045, 0.02, 0.075]); foot.castShadow = true;
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head, arms, legs, hands, mouth };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt;
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
  root.userData.lie = (yaw = 0) => { root.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ'); root.position.y = 0.2 * scale; };
  return root;
}
