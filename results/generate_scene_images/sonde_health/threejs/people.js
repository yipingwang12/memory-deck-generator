// Simple posable humans for the Sonde scenes. Faces +z, feet on y = 0, ~1.8 tall.
// createPerson({ coat, pants, skin, hair, hat:'puritan'|'none', collar, tie, stern, scale }) -> Group
// userData.reach('l'|'r', [x,y,z]) two-bone IK to a person-local point; userData.pose({ arms:{l:[x,z],r:[..]}, legs:{l:[x,z],r:[..]}, lean }) radians.
import * as THREE from 'three';
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
const put = (p, geo, m, pos, scl = [1, 1, 1], rot = [0, 0, 0]) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.scale.set(...scl); o.rotation.set(...rot); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
const SPH = new THREE.SphereGeometry(1, 24, 16);
const ARM = 0.3, SH = [0.25, 1.4, 0], HIP = 0.92;
const limb = (len, r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 12), mat(c)); m.geometry.translate(0, -len / 2, 0); m.castShadow = true; return m; };

function faceOn(head, skin, stern, y = 0) {
  for (const s of [-1, 1]) {
    put(head, SPH, mat('#fff', { roughness: 0.3 }), [s * 0.065, y + 0.02, 0.17], [0.038, 0.045, 0.01]);
    put(head, SPH, mat('#2a1a12'), [s * 0.065, y + 0.015, 0.178], [0.026, 0.034, 0.008]);
    put(head, SPH, mat('#fff'), [s * 0.057, y + 0.03, 0.184], [0.009, 0.009, 0.005]);
    const brow = put(head, new THREE.BoxGeometry(0.09, 0.016, 0.015), mat('#2a1a12'), [s * 0.065, y + 0.085, 0.178]);
    brow.rotation.z = s * (stern ? 0.45 : -0.1);
  }
  const mouth = put(head, new THREE.BoxGeometry(0.07, 0.012, 0.01), mat('#7a2a2a'), [0, y - 0.09, 0.18]);
  if (stern) mouth.scale.set(1, 1.2, 1);
}

export function createPerson({ coat = '#2a2a33', pants = '#2a2a33', skin = '#f2c9a5', hair = '#3a2a1c', hat = 'none', collar = false, tie = null, stern = false, scale = 1 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(); torso.position.y = HIP; root.add(torso);
  const up = new THREE.Group(); up.position.y = -HIP; torso.add(up);
  // body
  if (hat === 'puritan') {
    const pts = [[0.001, 0.12], [0.46, 0.12], [0.4, 0.5], [0.3, 1.0], [0.2, 1.38], [0.001, 1.42]].map(([x, y]) => new THREE.Vector2(x, y));
    put(up, new THREE.LatheGeometry(pts, 28), mat(coat), [0, 0, 0]);
  } else {
    put(up, new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), mat(coat), [0, 1.1, 0], [1, 1, 0.72]);
    put(up, new THREE.CylinderGeometry(0.21, 0.22, 0.22, 20), mat(pants), [0, 0.88, 0], [1, 1, 0.75]);
  }
  put(up, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), mat(skin), [0, 1.44, 0]);
  if (collar) put(up, new THREE.TorusGeometry(0.17, 0.05, 8, 24), mat('#ffffff'), [0, 1.42, 0.0], [1, 1, 0.5], [Math.PI / 2, 0, 0]);
  if (tie) put(up, new THREE.ConeGeometry(0.04, 0.3, 4), mat(tie), [0, 1.25, 0.145], [1, 1, 0.4], [Math.PI, 0, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); up.add(head);
  put(head, SPH, mat(skin), [0, 0, 0], [0.19, 0.21, 0.19]);
  faceOn(head, skin, stern);
  if (hat === 'puritan') {
    const hm = mat('#17171c');
    put(head, new THREE.CylinderGeometry(0.17, 0.2, 0.34, 24), hm, [0, 0.34, 0]);
    put(head, new THREE.CylinderGeometry(0.34, 0.34, 0.03, 32), hm, [0, 0.17, 0]);
    put(head, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24), mat('#ffffff'), [0, 0.2, 0], [1.02, 1, 1.02]);
    put(head, new THREE.BoxGeometry(0.12, 0.1, 0.02), mat('#f2c230', { metalness: 0.6, roughness: 0.3 }), [0, 0.22, 0.205]);
    put(head, new THREE.BoxGeometry(0.07, 0.05, 0.03), mat('#17171c'), [0, 0.22, 0.208]);
  } else put(head, SPH, mat(hair), [0, 0.07, -0.025], [0.2, 0.19, 0.2]);
  // arms
  const arms = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    put(sh, SPH, mat(coat), [0, 0, 0], [0.065, 0.065, 0.065]);
    sh.add(limb(ARM, 0.045, coat)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.04, coat));
    put(el, SPH, mat(skin), [0, -ARM, 0], [0.05, 0.055, 0.05]);
    sh.add(el); up.add(sh); sh.rotation.z = s * 0.12; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP, 0);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, HIP - 0.05, 12), mat(pants)); lg.geometry.translate(0, -(HIP - 0.05) / 2, 0); lg.castShadow = true; hip.add(lg);
    put(hip, SPH, mat('#1c1412'), [0, -HIP + 0.04, 0.05], [0.07, 0.05, 0.13]);
    root.add(hip); legs[k] = hip;
  }
  root.scale.setScalar(scale);
  root.userData.pose = ({ arms: A = {}, legs: L = {}, lean = 0 } = {}) => {
    torso.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); up.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(up.matrix).invert());
    const d = t.sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.5, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
