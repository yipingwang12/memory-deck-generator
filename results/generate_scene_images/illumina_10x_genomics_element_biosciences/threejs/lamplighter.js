// Anchor: the LAMPLIGHTER (Illumina). createLamplighter({ scale = 1, coat = '#27527a' }) -> Group, faces +z, feet y = 0, ~1.05 tall.
// userData.parts = { head, torso, arms:{l,r}, hands:{l,r}, legs:{l,r}, pole }  (l = +x side)
// userData.pose({ lean, headTilt, headYaw, legs:{l:[x,z], r:[..]} })   userData.reach('l'|'r', [x,y,z]) two-bone IK (lamplighter-local)
// userData.holdPole(len = 1.5) puts a lit lamp-lighting pole in the right hand, tip up; returns the flame mesh group
import * as THREE from 'three';

const HIP_Y = 0.3, SH = [0.17, 0.66, 0], ARM = 0.17, HEAD_Y = 0.84, HR = 0.19;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
const Y = new THREE.Vector3(0, -1, 0);

function disc(parent, rx, ry, color, nx, ny, off = 0, emissive = false) {
  // place an elliptical disc on the head sphere at (x offset nx, y offset ny) from head centre
  const z = Math.sqrt(Math.max(HR * HR - nx * nx - ny * ny, 1e-5));
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.35 }));
  const n = new THREE.Vector3(nx, ny, z).normalize();
  m.position.set(nx, ny, z).addScaledVector(n, 0.001 + off);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  m.scale.set(rx, ry, 1); parent.add(m); return m;
}

function buildHead(skin) {
  const h = new THREE.Group(); h.position.y = HEAD_Y;
  h.add(new THREE.Mesh(new THREE.SphereGeometry(HR, 40, 28), mat(skin, { roughness: 0.55 })));
  const hair = mat('#5a3420');
  const back = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.04, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
  back.rotation.x = -0.35; back.position.set(0, 0.012, -0.012); h.add(back);
  for (const s of [-1, 1]) { // side locks + fringe
    const lock = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), hair); lock.scale.set(0.035, 0.1, 0.05); lock.position.set(s * 0.165, -0.04, 0.03); lock.rotation.z = s * 0.12; h.add(lock);
    const fr = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), hair); fr.scale.set(0.07, 0.05, 0.03); fr.position.set(s * 0.075, 0.125, 0.15); fr.rotation.z = -s * 0.5; h.add(fr);
  }
  for (const s of [-1, 1]) {
    const x = s * 0.07, y = -0.005;
    disc(h, 0.05, 0.062, '#ffffff', x, y);
    disc(h, 0.04, 0.056, '#3b2a1a', x, y - 0.003, 0.0012);
    disc(h, 0.035, 0.028, '#c9822e', x, y - 0.026, 0.0024);
    disc(h, 0.02, 0.034, '#0e0806', x, y - 0.003, 0.0036);
    disc(h, 0.014, 0.014, '#ffffff', x - 0.015, y + 0.022, 0.0048);
    disc(h, 0.006, 0.006, '#ffffff', x + 0.016, y - 0.03, 0.0048);
    const lid = disc(h, 0.054, 0.016, '#1a0f0a', x, y + 0.066, 0.0055); lid.rotation.z += s * -0.15;
    const bl = disc(h, 0.027, 0.014, '#ff8a8a', s * 0.105, -0.07, 0); bl.material.transparent = true; bl.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 8, 20, Math.PI), mat('#8a3030'));
  const mn = new THREE.Vector3(0, -0.085, Math.sqrt(HR * HR - 0.085 * 0.085)); mouth.position.copy(mn).multiplyScalar(1.004); mouth.rotation.z = Math.PI; h.add(mouth);
  // flat lamplighter cap with brim
  const capM = mat('#3a2a22');
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 32), capM); crown.position.set(0, 0.17, -0.005); crown.rotation.x = -0.12;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 40), capM); brim.position.set(0, 0.12, 0.0); brim.rotation.x = -0.12;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.17, 0.03, 32), mat('#e0a82e', { metalness: 0.4 })); band.position.set(0, 0.135, 0); band.rotation.x = -0.12;
  h.add(crown, brim, band);
  return h;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, len, 14), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createLamplighter({ scale = 1, coat = '#27527a' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), skin = '#ffdcbc', pants = '#3b3f55';
  torso.position.y = HIP_Y; const upper = new THREE.Group(); upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const pts = [[0, 0.2], [0.2, 0.2], [0.23, 0.26], [0.2, 0.45], [0.15, 0.6], [0.1, 0.7], [0, 0.72]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), mat(coat)); body.scale.z = 0.78; upper.add(body);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat('#e8b930', { metalness: 0.6, roughness: 0.3 })); b.position.set(0, 0.55 - i * 0.09, 0.14 + i * 0.012); upper.add(b); }
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.196, 0.016, 8, 36), mat('#3a2418')); belt.rotation.x = Math.PI / 2; belt.position.y = 0.3; belt.scale.y = 0.78; upper.add(belt);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 12, 28), mat('#d8453b')); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.7; upper.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.025), mat('#d8453b')); tail.position.set(0.07, 0.6, 0.12); tail.rotation.z = 0.15; upper.add(tail);
  const head = buildHead(skin); upper.add(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.03, coat)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, coat));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), mat(coat)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand); hands[k] = hand;
    sh.add(el); upper.add(sh); sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.09, HIP_Y, 0); hip.add(limb(0.23, 0.04, pants));
    const boot = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#3a2418')); boot.scale.set(0.05, 0.04, 0.085); boot.position.set(0, -0.26, 0.025); hip.add(boot);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, torso, arms, hands, legs };

  root.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, headPitch = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.set(headPitch, headYaw, headTilt);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(upper.matrixWorld).invert().multiply(root.matrixWorld);
    const t = new THREE.Vector3(...target).applyMatrix4(inv);
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.2, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  root.userData.holdPole = (len = 1.5) => {
    const g = new THREE.Group(), wood = mat('#8a5a2e');
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, len, 10), wood); rod.position.y = len / 2 - 0.3; g.add(rod);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 16, Math.PI * 1.5), mat('#b0b6bd', { metalness: 0.7 })); hook.position.y = len - 0.3 + 0.03; g.add(hook);
    const flame = new THREE.Group(); flame.position.y = len - 0.3 + 0.05;
    const fm = new THREE.MeshBasicMaterial({ color: '#ffb02e' });
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), fm); f1.scale.y = 1.7; f1.position.y = 0.05;
    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff5b0' })); f2.scale.y = 1.6; f2.position.y = 0.04;
    flame.add(f1, f2); g.add(flame);
    g.position.set(0, 0, 0); hands.r.add(g); g.userData.flame = flame; g.userData.rod = rod;
    root.userData.pole = g; return g;
  };
  return root;
}
