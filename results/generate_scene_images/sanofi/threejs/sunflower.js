// The Sanofi anchor: a SUNFLOWER character. Faces +z, base on y = 0, ~1 unit tall.
// createSunflower({ scale = 1 }) -> Group. userData.parts = { head, arms:{l,r}, hands:{l,r}, stem }
// userData.pose({ headTilt, headYaw, lean, arms:{l:[x,z,elbowX], r:[..]} })
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a local point.
import * as THREE from 'three';

const ARM = 0.13, SH_Y = 0.42, DISC_R = 0.17, HEAD_Y = 0.8;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function petalGeo() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.09, 0.08, 0, 0.27); s.quadraticCurveTo(-0.09, 0.08, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  return g;
}

function leaf(color) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.1, 0.1, 0, 0.26); s.quadraticCurveTo(-0.1, 0.1, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
  return new THREE.Mesh(g, mat(color));
}

function buildHead() {
  const head = new THREE.Group(), z0 = 0.0;
  const pg = petalGeo();
  for (const [n, r, col, rot] of [[16, 0.15, '#f2a413', 0.1], [16, 0.16, '#ffd21f', 0.0]]) {
    for (let i = 0; i < n; i++) {
      const a = (i + rot * 10) / n * Math.PI * 2;
      const p = new THREE.Mesh(pg, mat(col)); p.position.set(Math.cos(a) * 0.1 * (r / 0.15), Math.sin(a) * 0.1 * (r / 0.15), col === '#ffd21f' ? 0.02 : 0);
      p.rotation.z = a - Math.PI / 2; head.add(p);
    }
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DISC_R, 36, 24), mat('#7a4a22', { roughness: 0.85 }));
  dome.scale.z = 0.12; dome.position.z = 0.0; head.add(dome);
  // seed dots on the rim of the disc
  const dot = new THREE.SphereGeometry(0.008, 6, 5), dm = mat('#4a2a12');
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const d = new THREE.Mesh(dot, dm); d.position.set(Math.cos(a) * 0.158, Math.sin(a) * 0.158, 0.02); head.add(d); }
  // face on the disc
  const z = 0.0 + 0.052, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.06, y = 0.025;
    disc(0.05, 0.062, '#ffffff', z + 0.003, head, x, y);
    disc(0.039, 0.054, '#3a2416', z + 0.003 + step, head, x, y - 0.003);
    disc(0.034, 0.025, '#4aa0d8', z + 0.003 + 2 * step, head, x, y - 0.024);
    disc(0.019, 0.03, '#120a08', z + 0.003 + 3 * step, head, x, y);
    disc(0.013, 0.013, '#ffffff', z + 0.003 + 4 * step, head, x - 0.014, y + 0.02);
    disc(0.006, 0.006, '#ffffff', z + 0.003 + 4 * step, head, x - 0.014, y - 0.024);
    const b = disc(0.026, 0.015, '#ff7f8f', z + 0.003, head, sx * 0.1, -0.055); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.06, z + 0.006); head.add(mouth);
  // dome is domed: lift face discs along its surface by pushing all face parts forward a bit
  head.children.forEach((c) => { if (c.geometry && c.geometry.type === 'CircleGeometry') c.position.z += 0.0; });
  return head;
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

export function createSunflower({ scale = 1 } = {}) {
  const root = new THREE.Group(), green = '#4ea73a';
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, HEAD_Y, 16), mat(green)); stem.position.y = HEAD_Y / 2; root.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.06, 24), mat('#7a5230')); base.position.y = 0.03; root.add(base);
  const head = buildHead(); head.position.set(0, HEAD_Y + 0.12, 0); root.add(head);
  // two big leaves on the stem, low
  for (const s of [-1, 1]) {
    const l = leaf('#3f9a32'); l.position.set(0, 0.2, 0); l.rotation.set(0, s * 1.2, s * -1.1); root.add(l);
  }
  const arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.04, SH_Y, 0);
    sh.add(limb(ARM, 0.017, green)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, green));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(green)));
    const hand = new THREE.Group(), lf = leaf('#5cc040'); lf.scale.setScalar(0.22); lf.rotation.set(Math.PI, 0, 0); lf.position.y = 0.03;
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), mat('#5cc040')); hand.add(palm); hand.position.y = -ARM; el.add(hand); hands[k] = hand;
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, arms, hands, stem };
  root.userData.pose = ({ headTilt = 0, headYaw = 0, lean = 0, arms: A = {} } = {}) => {
    head.rotation.z = headTilt; head.rotation.y = headYaw; root.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
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
