// The Intellia anchor: a round anime OWL, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.05 units tall. createOwl({ scale = 1, coat = '#8a5a34' }) -> Group.
// userData.parts = { body, head, wings:{l,r}, feet, beak }   (l = +x side)
// userData.pose({ headTilt, headTurn, wings:{l:[x,z], r:[x,z]} })  radians; wing z>0 swings l outward/up
// userData.reach('l'|'r', [x,y,z])  aims the wing at an owl-local point.
import * as THREE from 'three';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const ell = (parent, color, pos, scl, extra = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), mat(color, extra));
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};
const disc = (parent, color, rx, ry, pos) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(...pos); parent.add(m); return m;
};

function face(head) {
  // heart-shaped cream facial disc: two overlapping discs
  for (const s of [-1, 1]) disc(head, '#f6e6c8', 0.17, 0.19, [s * 0.1, -0.02, 0.255]);
  for (const s of [-1, 1]) {
    const x = s * 0.115, y = 0.0, z = 0.268;
    disc(head, '#ffffff', 0.098, 0.108, [x, y, z]);
    disc(head, '#e8a020', 0.082, 0.092, [x, y - 0.004, z + 0.002]);
    disc(head, '#2a140a', 0.05, 0.062, [x, y - 0.004, z + 0.004]);
    disc(head, '#ffffff', 0.026, 0.026, [x - 0.024, y + 0.032, z + 0.006]);
    disc(head, '#ffffff', 0.011, 0.011, [x + 0.022, y - 0.036, z + 0.006]);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 24, Math.PI * 0.8), mat('#4a2a14'));
    brow.scale.set(0.1, 0.1, 1); brow.position.set(x, y + 0.06, z + 0.003); brow.rotation.z = Math.PI * 0.1; head.add(brow);
    const blush = disc(head, '#ff8a8a', 0.04, 0.022, [s * 0.2, -0.1, z]); blush.material.transparent = true; blush.material.opacity = 0.5;
  }
}

export function createOwl({ scale = 1, coat = '#8a5a34' } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
  const dark = '#5b3720', cream = '#f1dcb4';
  // torso + belly + feather scallops
  ell(body, coat, [0, 0.4, -0.01], [0.32, 0.37, 0.28]);
  ell(body, cream, [0, 0.36, 0.1], [0.23, 0.29, 0.2]);
  for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) {
    if (r === 2 && c) continue;
    const s = ell(body, '#d9bd8a', [c * 0.1 + (r % 2) * 0.05 - 0.025, 0.46 - r * 0.1, 0.285 - 0.02 * Math.abs(c)], [0.045, 0.03, 0.02]);
    s.rotation.x = -0.2;
  }
  ell(body, dark, [0, 0.25, -0.2], [0.2, 0.28, 0.1]);   // back/tail tone
  const tail = ell(body, dark, [0, 0.1, -0.22], [0.14, 0.12, 0.08]); tail.rotation.x = 0.5;
  // head
  head.position.set(0, 0.8, 0.02);
  ell(head, coat, [0, 0, 0], [0.34, 0.29, 0.27]);
  face(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 16), mat('#f2a22a'));
  beak.rotation.x = Math.PI / 2 + 0.25; beak.position.set(0, -0.075, 0.285); head.add(beak);
  for (const s of [-1, 1]) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 16), mat(dark));
    tuft.position.set(s * 0.2, 0.26, 0); tuft.rotation.z = -s * 0.45; head.add(tuft);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 12), mat(cream));
    inner.position.set(s * 0.198, 0.25, 0.04); inner.rotation.z = -s * 0.45; head.add(inner);
  }
  // wings (shoulder pivots)
  const wings = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.3, 0.58, 0);
    const w = ell(sh, dark, [s * 0.04, -0.2, -0.02], [0.085, 0.27, 0.15]);
    ell(sh, coat, [s * 0.05, -0.2, 0.0], [0.075, 0.24, 0.13]);
    for (let i = 0; i < 3; i++) ell(sh, cream, [s * 0.05, -0.38 + i * 0, 0.02 + (i - 1) * 0.07], [0.04, 0.05, 0.04]);
    sh.rotation.z = s * 0.12; body.add(sh); wings[k] = sh;
  }
  // feet
  const feet = new THREE.Group();
  for (const s of [-1, 1]) for (const t of [-1, 0, 1]) {
    const toe = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), mat('#f2a22a'));
    toe.rotation.x = Math.PI / 2; toe.rotation.z = t * 0.3; toe.position.set(s * 0.1 + t * 0.03, 0.02, 0.28); feet.add(toe);
  }
  root.add(body, head, feet);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, wings, feet, beak };
  root.userData.pose = ({ headTilt = 0, headTurn = 0, wings: W = {} } = {}) => {
    head.rotation.z = headTilt; head.rotation.y = headTurn;
    for (const [k, v] of Object.entries(W)) wings[k].rotation.set(v[0] ?? 0, 0, (k === 'l' ? 1 : -1) * (v[1] ?? 0.12));
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const sh = wings[key], d = new THREE.Vector3(...target).sub(sh.position.clone().add(body.position)).normalize();
    sh.quaternion.setFromUnitVectors(Y, d);
  };
  return root;
}
