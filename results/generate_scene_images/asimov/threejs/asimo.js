// The Asimov anchor: a chibi white ASIMO-style astronaut robot (black visor with big glowing anime eyes, orange ear pods, backpack).
// Faces +z, feet on y = 0, ~1 unit tall. createAsimo({ scale = 1, accent = '#ff8a1f', eye = '#35d6ff' }) -> Group.
// userData.parts = { torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, chest }   (l = +x side)
// userData.pose({ lean, headTilt, headYaw, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to an asimo-local point.
import * as THREE from 'three';

const HIP_Y = 0.3, SHOULDER = [0.17, 0.56, 0], ARM = 0.125;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
const ell = (parent, color, pos, scl, extra = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(color, extra));
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const cyl = (parent, color, r0, r1, h, pos, rot = [0, 0, 0], extra = {}) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 24), mat(color, extra));
  m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
};

function buildHead(accent, eye) {
  const h = new THREE.Group(), white = '#f6f7fb';
  ell(h, white, [0, 0, 0], [0.21, 0.185, 0.19]);
  ell(h, '#12141c', [0, -0.005, 0.07], [0.175, 0.13, 0.145], { roughness: 0.12, metalness: 0.3 });
  const visorZ = (x, y) => 0.07 + 0.145 * Math.sqrt(Math.max(0, 1 - (x / 0.175) ** 2 - ((y + 0.005) / 0.13) ** 2));
  for (const s of [-1, 1]) {
    const x = s * 0.068, y = 0.0, z = visorZ(x, y);
    const layer = (color, sx, sy, dx, dy, k, extra = {}) =>
      ell(h, color, [x + dx, y + dy, z + 0.002 + k * 0.004], [sx, sy, 0.01], { roughness: 0.2, ...extra });
    layer('#bff4ff', 0.052, 0.066, 0, 0, 0, { emissive: eye, emissiveIntensity: 0.9 });
    layer(eye, 0.044, 0.058, 0, -0.004, 1, { emissive: eye, emissiveIntensity: 0.6 });
    layer('#0a3f7a', 0.028, 0.04, 0, -0.008, 2);
    layer('#04122a', 0.016, 0.026, 0, -0.006, 3);
    layer('#ffffff', 0.014, 0.014, -0.012, 0.022, 4, { emissive: '#ffffff', emissiveIntensity: 1 });
    layer('#ffffff', 0.007, 0.007, 0.014, -0.025, 4, { emissive: '#ffffff', emissiveIntensity: 1 });
    ell(h, accent, [s * 0.205, -0.01, 0.0], [0.045, 0.075, 0.075]);               // ear pod
    cyl(h, '#ffd7a0', 0.03, 0.03, 0.02, [s * 0.248, -0.01, 0], [0, 0, Math.PI / 2]);
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 20, Math.PI), mat('#8fd8ff', { emissive: '#8fd8ff', emissiveIntensity: 0.6 }));
  m.rotation.z = Math.PI; m.position.set(0, -0.058, visorZ(0, -0.058) + 0.004); h.add(m);          // smile
  cyl(h, '#cfd3dc', 0.008, 0.008, 0.07, [0, 0.215, -0.02]);                                            // antenna
  ell(h, accent, [0, 0.255, -0.02], [0.022, 0.022, 0.022], { emissive: accent, emissiveIntensity: 0.5 });
  return h;
}

function limb(len, r, color) {
  const g = new THREE.Group();
  cyl(g, color, r, r * 0.92, len, [0, -len / 2, 0]);
  return g;
}

export function createAsimo({ scale = 1, accent = '#ff8a1f', eye = '#35d6ff' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const white = '#f6f7fb', grey = '#9aa3b4';

  ell(upper, white, [0, 0.4, 0], [0.165, 0.2, 0.125]);                                             // torso
  ell(upper, white, [0, 0.31, 0], [0.12, 0.08, 0.1]);                                              // waist
  const chest = new THREE.Group(); chest.position.set(0, 0.43, 0.115); upper.add(chest);
  cyl(chest, '#2a4fa8', 0.045, 0.045, 0.02, [0, 0, 0.004], [Math.PI / 2, 0, 0]);
  cyl(chest, accent, 0.026, 0.026, 0.02, [0, 0, 0.012], [Math.PI / 2, 0, 0], { emissive: accent, emissiveIntensity: 0.4 });
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.1), mat('#aab2c4')); pack.position.set(0, 0.42, -0.15); upper.add(pack);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.04, 0.105), mat(accent)); stripe.position.set(0, 0.48, -0.15); upper.add(stripe);
  const head = new THREE.Group(); head.position.set(0, 0.73, 0.01); head.add(buildHead(accent, eye)); upper.add(head);
  ell(upper, grey, [0, 0.62, 0], [0.06, 0.04, 0.06]);                                              // neck

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    ell(sh, accent, [0, 0, 0], [0.055, 0.055, 0.055]);
    sh.add(limb(ARM, 0.034, white));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.032, white)); ell(el, grey, [0, 0, 0], [0.036, 0.036, 0.036]);
    const hand = new THREE.Group(); hand.position.y = -ARM - 0.02;
    ell(hand, '#e9ecf4', [0, 0, 0], [0.05, 0.058, 0.044]); ell(hand, '#e9ecf4', [s * 0.04, 0.012, 0.012], [0.02, 0.03, 0.02]);
    el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.22; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.075, HIP_Y, 0);
    hip.add(limb(0.22, 0.05, white));
    cyl(hip, accent, 0.052, 0.052, 0.03, [0, -0.17, 0]);
    ell(hip, '#2a4fa8', [0, -0.255, 0.03], [0.065, 0.045, 0.1]);                                    // foot
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, arms, legs, hands, chest };

  root.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt; head.rotation.y = headYaw;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key], R = 2 * ARM + 0.02;
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), R - 0.02 - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(Math.min(1, D / (2 * ARM)));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
