// The Korro anchor: a chibi black CROW, reused in every scene. Faces +z, feet on y = 0, ~1.15 units tall.
// createCrow({ scale = 1 }) -> Group.  userData.parts = { head, beak, jaw, wings:{l,r}, tail, body, legs }   (l = +x side)
// userData.pose({ lean, headTilt, headYaw, headPitch, beak, wing:{l:[out, fwd, fold], r:[...]} })  radians.
//   wing out: 0 = hanging at side, ~1.5 = horizontal spread; fwd: swing toward +z; fold: elbow bend (0..1).
//   beak: lower-jaw open angle.
import * as THREE from 'three';

const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const INK = '#26263a', INK2 = '#3b3b56', BEAK = '#4a4a55';
const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl); p.add(o); return o;
};
const sph = new THREE.SphereGeometry(1, 28, 20);

function disc(parent, rx, ry, color, pos, normal, lift = 0) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.35 }));
  m.scale.set(rx, ry, 1);
  const n = new THREE.Vector3(...normal).normalize();
  m.position.set(...pos).addScaledVector(n, lift);
  m.lookAt(m.position.clone().add(n)); parent.add(m); return m;
}

function eyes(head, R) {
  for (const s of [-1, 1]) {
    const x = s * 0.092, y = 0.035, z = Math.sqrt(R * R - x * x - y * y) - 0.004;
    const nrm = [x, y, z], p = [x, y, z];
    disc(head, 0.062, 0.07, '#ffffff', p, nrm, 0.0);
    disc(head, 0.05, 0.063, '#14224a', p, nrm, 0.003);
    disc(head, 0.046, 0.058, '#2e5fb8', [x, y - 0.006, z], nrm, 0.005);
    disc(head, 0.028, 0.04, '#06060c', p, nrm, 0.007);
    disc(head, 0.017, 0.017, '#ffffff', [x - 0.014 * s * -1 * -1 + 0.0, y + 0.028, z], nrm, 0.010);
    disc(head, 0.008, 0.008, '#ffffff', [x + 0.016, y - 0.026, z], nrm, 0.010);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 24, Math.PI * 0.8), mat('#0a0a14'));
    brow.scale.set(0.063, 0.072, 1); brow.position.set(x, y, z + 0.006); brow.lookAt(brow.position.clone().add(new THREE.Vector3(...nrm)));
    brow.rotateZ(Math.PI * 0.1); head.add(brow);
  }
}

function makeWing(s) {
  const root = new THREE.Group(), el = new THREE.Group(); root.add(el);
  const f = mat(INK), f2 = mat(INK2);
  add(root, sph, f, [s * 0.03, -0.14, 0], [0, 0, 0], [0.05, 0.2, 0.15]);         // upper arm
  el.position.set(s * 0.03, -0.3, 0);
  add(el, sph, f, [s * 0.03, -0.18, 0], [0, 0, 0], [0.045, 0.24, 0.16]);          // forearm
  for (let i = 0; i < 5; i++) {                                                    // primaries fan
    const a = (i - 2) * 0.17;
    const fe = add(el, new THREE.ConeGeometry(0.05, 0.42, 10), i % 2 ? f2 : f, [0, -0.5, 0], [0, 0, 0], [0.45, 1, 1.9]);
    fe.geometry = fe.geometry.clone().translate(0, -0.21, 0); fe.geometry.rotateX(Math.PI); fe.geometry.translate(0, -0.0, 0);
    fe.position.set(s * 0.03, -0.3, 0); fe.rotation.z = a; fe.scale.set(0.5, 1, 2);
  }
  return { root, el };
}

export function createCrow({ scale = 1 } = {}) {
  const g = new THREE.Group(), ink = mat(INK), ink2 = mat(INK2), bodyG = new THREE.Group(); g.add(bodyG);
  const body = add(bodyG, sph, ink, [0, 0.5, 0], [0, 0, 0], [0.27, 0.32, 0.25]);
  add(bodyG, sph, ink2, [0, 0.46, 0.08], [0, 0, 0], [0.2, 0.25, 0.2]);            // chest sheen
  const head = new THREE.Group(); head.position.set(0, 0.9, 0.02); bodyG.add(head);
  const R = 0.25; add(head, sph, ink, [0, 0, 0], [0, 0, 0], [R, R * 0.96, R * 0.98]);
  add(head, sph, ink, [0, 0.12, -0.08], [0, 0, 0], [0.2, 0.15, 0.17]);            // ruffled crown
  eyes(head, R * 0.99);
  const bm = mat(BEAK, { roughness: 0.35 });
  const up = add(head, new THREE.ConeGeometry(0.085, 0.3, 20), bm, [0, -0.025, R + 0.08], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.07, R - 0.02); head.add(jaw);
  add(jaw, new THREE.ConeGeometry(0.065, 0.22, 16), mat('#3a3a44', { roughness: 0.35 }), [0, 0, 0.1], [Math.PI / 2, 0, 0], [1, 1, 0.7]);
  add(jaw, sph, mat('#c4505e'), [0, 0.01, 0.05], [0, 0, 0], [0.045, 0.012, 0.07]);   // tongue
  for (const s of [-1, 1]) add(head, sph, mat('#1a1a2c'), [s * 0.07, -0.015, R + 0.045], [0, 0, 0], [0.012, 0.01, 0.012]);
  const wings = {}, wl = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const w = makeWing(s); const piv = new THREE.Group(); piv.position.set(s * 0.25, 0.68, -0.02); piv.add(w.root);
    bodyG.add(piv); wings[k] = piv; wl[k] = w;
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.2); bodyG.add(tail);
  for (let i = 0; i < 3; i++) { const t = add(tail, new THREE.ConeGeometry(0.07, 0.4, 10), i === 1 ? ink2 : ink, [(i - 1) * 0.07, -0.1, -0.1 - 0.0], [-2.1, 0, (i - 1) * -0.25], [1, 1, 0.4]); }
  const legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.11, 0.22, 0.02); g.add(lg);
    add(lg, new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), mat('#6a5648'), [0, -0.11, 0]);
    for (let t = -1; t <= 1; t++) add(lg, new THREE.CylinderGeometry(0.014, 0.012, 0.13, 6), mat('#6a5648'), [t * 0.035, -0.215, 0.06], [Math.PI / 2, 0, t * 0.35]);
    add(lg, new THREE.CylinderGeometry(0.012, 0.01, 0.09, 6), mat('#6a5648'), [0, -0.215, -0.04], [Math.PI / 2, 0, 0]);
    legs[k] = lg;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.scale.setScalar(scale);
  g.userData.parts = { head, beak: up, jaw, wings, tail, body, legs };
  g.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, headPitch = 0, beak = 0, wing = {} } = {}) => {
    bodyG.rotation.x = lean; head.rotation.set(headPitch, headYaw, headTilt); jaw.rotation.x = beak;
    for (const [k, v] of Object.entries(wing)) {
      const s = k === 'l' ? 1 : -1;
      wings[k].rotation.set(-(v[1] ?? 0), 0, s * (v[0] ?? 0), 'YXZ');
      wl[k].el.rotation.z = s * (v[2] ?? 0);
    }
  };
  g.userData.pose({ wing: { l: [0.12, 0, 0], r: [0.12, 0, 0] } });
  return g;
}
