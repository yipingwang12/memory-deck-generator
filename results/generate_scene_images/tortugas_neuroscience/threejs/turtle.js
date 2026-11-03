// Tortugas anchor: an upright chibi TURTLE. Faces +z, feet on y = 0, ~1 unit tall.
// createTurtle({ scale = 1, shell = true, shellColor = '#2f9e57', crown = false }) -> Group
// userData.parts = { head, arms:{l,r}, hands:{l,r}, legs:{l,r}, shell }   (l = +x side)
// userData.pose({ headTilt, headYaw, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a turtle-local point.
// createShell({ color }) -> empty hollow shell dome (open side down), ~0.8 wide.
import * as THREE from 'three';

const ARM = 0.13, SH = [0.25, 0.55, 0.1];
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
const ell = (parent, m, pos, scl) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m); o.position.set(...pos); o.scale.set(...scl); parent.add(o); return o;
};
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function shellTexture(color) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#17562f'; x.lineWidth = 9; x.fillStyle = 'rgba(255,255,255,0.10)';
  for (let r = -1; r < 8; r++) for (let q = -1; q < 6; q++) {
    const cx = q * 110 + (r & 1) * 55, cy = r * 64, R = 52; x.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; x[i ? 'lineTo' : 'moveTo'](cx + R * Math.cos(a), cy + R * Math.sin(a)); }
    x.closePath(); x.fill(); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function createShell({ color = '#2f9e57' } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: shellTexture(color), roughness: 0.5, side: THREE.DoubleSide }));
  m.scale.set(0.42, 0.34, 0.36); g.add(m);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 10, 48), mat('#f3dca0'));
  rim.rotation.x = Math.PI / 2; rim.scale.set(0.42, 0.36, 0.1); rim.scale.set(0.42, 0.36, 1); g.add(rim);
  rim.scale.set(0.42, 0.36, 0.4);
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return g;
}

function face(head) {
  const z = 0.168;
  for (const s of [-1, 1]) {
    const x = s * 0.085, y = 0.02;
    disc(0.062, 0.078, '#ffffff', z, head, x, y);
    const zz = z + 0.002;
    disc(0.048, 0.066, '#2a1a10', zz, head, x, y - 0.004);
    disc(0.04, 0.03, '#6f9a3a', zz + 0.0015, head, x, y - 0.03);
    disc(0.024, 0.04, '#0d0806', zz + 0.003, head, x, y);
    disc(0.016, 0.016, '#fff', zz + 0.005, head, x - 0.016, y + 0.026);
    disc(0.007, 0.007, '#fff', zz + 0.005, head, x + 0.014, y - 0.03);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.25, Math.PI - 0.5), mat('#10331c'));
    lid.scale.set(0.066, 0.082, 1); lid.position.set(x, y + 0.002, zz + 0.006); head.add(lid);
    const b = disc(0.03, 0.017, '#ff8f9a', zz, head, s * 0.135, -0.065); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20, Math.PI), mat('#6b2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.075, 0.17); head.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createTurtle({ scale = 1, shell = true, shellColor = '#2f9e57', crown = false } = {}) {
  const root = new THREE.Group(), skin = '#78c850', belly = '#f6e3a8';
  ell(root, mat(belly), [0, 0.42, 0.02], [0.24, 0.27, 0.19]);        // belly
  ell(root, mat(skin), [0, 0.5, -0.02], [0.2, 0.24, 0.16]);          // torso (under belly, shows at sides)
  let shellMesh = null;
  if (shell) {
    shellMesh = createShell({ color: shellColor }); shellMesh.position.set(0, 0.5, -0.1); shellMesh.rotation.x = -Math.PI / 2; shellMesh.scale.setScalar(1.0);
    root.add(shellMesh);
  }
  // tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 12), mat(skin)); tail.position.set(0, 0.16, -0.2); tail.rotation.x = -2.0; root.add(tail);
  const head = new THREE.Group(); head.position.set(0, 0.82, 0.02);
  ell(head, mat(skin), [0, 0, 0], [0.22, 0.19, 0.17]);
    face(head); root.add(head);
  if (crown) {
    const c = new THREE.Group(), gold = mat('#ffcc2a', { metalness: 0.6, roughness: 0.3 });
    c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.06, 16), gold));
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 8), gold); const a = i / 5 * Math.PI * 2; t.position.set(0.085 * Math.cos(a), 0.06, 0.085 * Math.sin(a)); c.add(t); }
    c.position.set(0, 0.19, 0); head.add(c);
  }
  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.034, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.032, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), mat('#8fd460')); hand.position.y = -ARM; el.add(hand); hands[k] = hand;
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.22, 0.02); hip.add(limb(0.17, 0.045, skin));
    const foot = ell(hip, mat('#5aa83a'), [0, -0.19, 0.04], [0.065, 0.035, 0.1]); foot.castShadow = true; root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, arms, hands, legs, shell: shellMesh };
  root.userData.pose = ({ headTilt = 0, headYaw = 0, arms: A = {}, legs: L = {} } = {}) => {
    head.rotation.z = headTilt; head.rotation.y = headYaw;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.3, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
