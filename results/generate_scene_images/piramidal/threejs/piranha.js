// The Piramidal anchor: a chibi upright PIRANHA (underbite, teeth, big anime eyes). Faces +z, feet on y = 0, ~0.9 tall.
// createPiranha({ scale = 1 }) -> Group.  userData.parts = { body, head(eyes+jaw), arms:{l,r}, hands:{l,r}, legs:{l,r}, tail, jaw }  (l = +x)
// userData.pose({ lean, jaw, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; jaw = mouth open amount.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to piranha-local point.
import * as THREE from 'three';

const ARM = 0.13, SH = [0.3, 0.5, 0.02];
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const blob = (p, m, pos, scl, rot = [0, 0, 0]) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), m); o.position.set(...pos); o.scale.set(...scl); o.rotation.set(...rot); p.add(o); return o;
};
const cone = (p, m, pos, r, h, rot = [0, 0, 0]) => {
  const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), m); o.position.set(...pos); o.rotation.set(...rot); p.add(o); return o;
};
const limb = (len, r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(c)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createPiranha({ scale = 1 } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(), jaw = new THREE.Group();
  root.add(body);
  const back = '#4f7894', belly = '#ff7a45', fin = '#e8492f', white = '#ffffff';
  const bMat = mat(back), oMat = mat(belly), fMat = mat(fin, { side: THREE.DoubleSide }), tooth = mat(white, { roughness: 0.3 });

  blob(body, bMat, [0, 0.52, 0], [0.34, 0.35, 0.3]);
  blob(body, oMat, [0, 0.36, 0.05], [0.31, 0.2, 0.27]);
  for (const [x, y] of [[-0.14, 0.7], [0.1, 0.74], [0.2, 0.55], [-0.2, 0.52], [0.02, 0.6]]) blob(body, mat('#cfe6f2', { roughness: 0.3 }), [x, y, -0.05 - 0.1 * (1 - Math.abs(x) * 2)], [0.025, 0.025, 0.02]);
  // fins + tail
  const dorsal = cone(body, fMat, [0, 0.93, -0.1], 0.16, 0.3, [-0.5, 0, 0]); dorsal.scale.set(0.35, 1, 1);
  const tail = new THREE.Group(); tail.position.set(0, 0.42, -0.3); body.add(tail);
  cone(tail, bMat, [0, 0, -0.07], 0.1, 0.22, [-Math.PI / 2, 0, 0]);
  blob(tail, fMat, [0, 0.02, -0.25], [0.025, 0.22, 0.17]);

  // head: eyes + mouth on front
  head.position.set(0, 0, 0); body.add(head);
  const dark = mat('#1d1210', { roughness: 0.3 });
  for (const s of [-1, 1]) {
    const x = s * 0.13, y = 0.64, z = 0.255;
    blob(head, mat(white, { roughness: 0.3 }), [x, y, z], [0.1, 0.115, 0.045]);
    blob(head, mat('#3b2a1d'), [x, y - 0.004, z + 0.03], [0.078, 0.095, 0.03]);
    blob(head, mat('#e0a23a'), [x, y - 0.03, z + 0.048], [0.068, 0.05, 0.02]);
    blob(head, dark, [x, y, z + 0.056], [0.04, 0.062, 0.02]);
    blob(head, mat(white, { roughness: 0.2 }), [x - 0.026, y + 0.04, z + 0.075], [0.022, 0.026, 0.01]);
    blob(head, mat(white, { roughness: 0.2 }), [x + 0.02, y - 0.04, z + 0.075], [0.01, 0.01, 0.008]);
    // angry-ish brow
    const brow = blob(head, dark, [x, y + 0.115, z + 0.03], [0.1, 0.017, 0.03], [0, 0, s * 0.28]);
    blob(head, mat('#ff8f9a'), [s * 0.2, 0.52, 0.245], [0.04, 0.022, 0.02]).material.transparent = true;
  }
  // mouth cavity + upper teeth
  blob(head, dark, [0, 0.42, 0.255], [0.17, 0.07, 0.05]);
  for (let i = 0; i < 6; i++) cone(head, tooth, [(i - 2.5) * 0.054, 0.44, 0.29], 0.024, 0.07, [Math.PI, 0, 0]);
  // underbite jaw (hinged)
  jaw.position.set(0, 0.4, 0.2); head.add(jaw);
  blob(jaw, oMat, [0, -0.025, 0.1], [0.17, 0.045, 0.13]);
  for (let i = 0; i < 6; i++) cone(jaw, tooth, [(i - 2.5) * 0.056, 0.02, 0.2], 0.022, 0.075);

  // arms (fins with mitten hands) and legs
  const arms = {}, elbows = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]); sh.add(limb(ARM, 0.02, fin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, fin));
    const hand = new THREE.Group(); hand.position.y = -ARM; blob(hand, mat(fin), [0, -0.02, 0], [0.04, 0.05, 0.03]); el.add(hand);
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el; hands[k] = hand;
    const hip = new THREE.Group(); hip.position.set(s * 0.12, 0.2, 0.02); hip.add(limb(0.17, 0.022, fin));
    blob(hip, fMat, [0, -0.18, 0.04], [0.06, 0.025, 0.09]); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, jaw, tail, arms, hands, legs };
  root.userData.pose = ({ lean = 0, jaw: j = 0, arms: A = {}, legs: L = {} } = {}) => {
    body.rotation.x = lean; jaw.rotation.x = j;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
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
