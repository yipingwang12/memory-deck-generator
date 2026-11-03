// APE TIGER (apitegromab): a striped orange ape with a tiger face, long arms, curled tail. Faces +z, feet on y = 0, ~1.55 tall.
// createApeTiger({ scale = 1 }) -> Group.  userData.parts = { head, arms:{l,r}, hands:{l,r}, torso }  (l = +x side)
// userData.headTop = local point on top of the head (stand the anchor there).
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} }); userData.reach('l'|'r', [x,y,z]) two-bone IK.
import * as THREE from 'three';

const SH = [0.43, 1.0, 0], ARM = 0.42, HIP_Y = 0.5;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });

function stripeTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f08a24'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#1c1210';
  for (let i = 0; i < 14; i++) {
    const cx = i * 512 / 14 + 10, w = 8 + (i % 3) * 3;
    x.beginPath(); x.moveTo(cx - w / 2, 20);
    for (let y = 20; y <= 236; y += 8) x.lineTo(cx + Math.sin(y * 0.06 + i) * 7 - w / 2 * (1 - Math.abs(y - 128) / 130), y);
    for (let y = 236; y >= 20; y -= 8) x.lineTo(cx + Math.sin(y * 0.06 + i) * 7 + w / 2 * (1 - Math.abs(y - 128) / 130), y);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const part = (parent, geo, m, pos, scl = [1, 1, 1], rot = [0, 0, 0]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.scale.set(...scl); o.rotation.set(...rot); parent.add(o); return o;
};
const ball = (parent, m, pos, scl, rot) => part(parent, new THREE.SphereGeometry(1, 28, 20), m, pos, scl, rot);
const disc = (parent, rx, ry, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m);
};
const limb = (len, r, m) => { const g = new THREE.CylinderGeometry(r, r * 0.9, len, 14); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, m); };

export function createApeTiger({ scale = 1 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(); root.add(torso);
  const stripe = mat('#ffffff', { map: stripeTexture() }), orange = mat('#f08a24'), cream = mat('#fff1d8'), dark = mat('#1c1210');
  ball(torso, stripe, [0, 0.82, 0], [0.4, 0.46, 0.33]);
  ball(torso, cream, [0, 0.76, 0.14], [0.26, 0.32, 0.22]);

  const head = new THREE.Group(); head.position.set(0, 1.4, 0.04); torso.add(head);
  ball(head, stripe, [0, 0, 0], [0.3, 0.26, 0.26]);
  ball(head, cream, [0, -0.07, 0.17], [0.17, 0.12, 0.12]);
  ball(head, mat('#e8707a'), [0, -0.01, 0.275], [0.04, 0.03, 0.025]);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 16, Math.PI), dark); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.085, 0.272); head.add(mouth);
  for (const s of [-1, 1]) {
    ball(head, orange, [s * 0.22, 0.2, -0.02], [0.09, 0.09, 0.05]);
    ball(head, cream, [s * 0.22, 0.2, 0.01], [0.055, 0.055, 0.03]);
    ball(head, cream, [s * 0.27, -0.08, 0.04], [0.07, 0.09, 0.08]);
    const x = s * 0.115, y = 0.06, z = 0.23;
    disc(head, 0.05, 0.062, '#ffffff', x, y, z); disc(head, 0.04, 0.054, '#2a5a2a', x, y - 0.002, z + 0.002);
    disc(head, 0.019, 0.03, '#0a0a0a', x, y, z + 0.004); disc(head, 0.013, 0.013, '#ffffff', x - 0.014, y + 0.02, z + 0.006);
    disc(head, 0.006, 0.006, '#ffffff', x - 0.014, y - 0.022, z + 0.006);
    part(head, new THREE.BoxGeometry(0.07, 0.014, 0.01), dark, [x, y + 0.085, z - 0.005], [1, 1, 1], [0, 0, -s * 0.25]);
  }
  for (const s of [-1, 1]) for (const i of [0, 1]) part(head, new THREE.BoxGeometry(0.014, 0.05, 0.01), dark, [s * (0.0 + 0.0), 0.2 + i * 0, 0.24], [0, 0, 0]).visible = false;
  part(head, new THREE.BoxGeometry(0.02, 0.07, 0.01), dark, [0, 0.2, 0.2], [1, 1, 1], [0.5, 0, 0]);

  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.17, HIP_Y, 0); root.add(hip);
    hip.add(limb(0.38, 0.1, stripe)); ball(hip, orange, [0, -0.43, 0.06], [0.11, 0.07, 0.17]);
    root.userData['leg' + (s > 0 ? 'l' : 'r')] = hip;
  }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.55, -0.25], [0, 0.4, -0.55], [0.3, 0.45, -0.75], [0.5, 0.8, -0.65], [0.45, 1.05, -0.5]].map((p) => new THREE.Vector3(...p))), 24, 0.045, 8), orange);
  torso.add(tail);

  const arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0); torso.add(sh);
    sh.add(limb(ARM, 0.085, stripe)); ball(sh, orange, [0, 0, 0], [0.12, 0.12, 0.12]);
    const el = new THREE.Group(); el.position.y = -ARM; sh.add(el); el.add(limb(ARM, 0.08, orange));
    ball(el, orange, [0, 0, 0], [0.085, 0.085, 0.085]);
    const hand = new THREE.Group(); hand.position.y = -ARM; el.add(hand); ball(hand, mat('#c9661a'), [0, -0.03, 0], [0.1, 0.1, 0.095]);
    sh.rotation.z = s * 0.15; arms[k] = sh; elbows[k] = el; hands[k] = hand;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, torso, arms, hands };
  root.userData.headTop = new THREE.Vector3(0, 1.4 + 0.26 * 0.97, 0.04);

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) root.userData['leg' + k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.2, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
