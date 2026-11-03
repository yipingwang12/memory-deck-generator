// The Sonde anchor: a cream weather BALLOON with a big-eyed face, mitten arms, a knotted neck,
// a string and a small orange radiosonde box. Faces +z; body centre y = 1 (above string end near y = -0.7).
// createBalloon({ scale = 1, color, string = 0.7, sonde = true, mood = 'happy'|'listen'|'sad' }) -> Group
// userData.parts = { body, face, arms:{l,r}, hands:{l,r}, sonde, stringEnd }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, tilt })  radians. userData.reach('l'|'r', [x,y,z]) two-bone IK (balloon-local).
import * as THREE from 'three';

const R = 0.5, SY = 1.12, CY = 1.0, ARM = 0.2;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const surfZ = (x, y) => R * Math.sqrt(Math.max(0.01, 1 - (x / R) ** 2 - ((y - CY) / (R * SY)) ** 2));

function bodyGeo() {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * R * (a > 1.9 ? 1 - (a - 1.9) * 0.28 : 1), CY + Math.cos(a) * R * SY)); }
  pts.reverse(); // lathe wants bottom -> top; guarantee outward normals
  return new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p.x, 0.0001), p.y)).reverse(), 48);
}

function face(group, mood) {
  const step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.17, y = CY + 0.06, z = surfZ(x, y) + 0.004;
    if (mood === 'listen') {
      const lid = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 6, 20, Math.PI), mat('#2a1a10'));
      lid.scale.set(0.075, 0.06, 1); lid.rotation.z = Math.PI; lid.position.set(x, y, z); group.add(lid);
    } else {
      disc(0.095, 0.115, '#ffffff', z, group, x, y);
      disc(0.07, 0.1, '#3a2416', z + step, group, x, y - 0.006);
      disc(0.06, 0.045, '#4a90d9', z + 2 * step, group, x, y - 0.045);
      disc(0.04, 0.062, '#120a08', z + 3 * step, group, x, y - 0.006);
      disc(0.026, 0.026, '#ffffff', z + 4 * step, group, x - 0.026, y + 0.04);
      disc(0.012, 0.012, '#ffffff', z + 4 * step, group, x - 0.026, y - 0.045);
      const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
      lid.scale.set(0.1, 0.122, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    }
    const b = disc(0.05, 0.028, '#ff7f8f', surfZ(sx * 0.3, CY - 0.1) + 0.004, group, sx * 0.3, CY - 0.1);
    b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mz = surfZ(0, CY - 0.13) + 0.004;
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20, Math.PI), mat('#7a2a2a'));
  if (mood === 'sad') mouth.position.set(0, CY - 0.17, mz); else { mouth.rotation.z = Math.PI; mouth.position.set(0, CY - 0.11, mz); }
  group.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createBalloon({ scale = 1, color = '#ffffff', string = 0.7, sonde = true, mood = 'happy' } = {}) {
  const root = new THREE.Group(), body = new THREE.Mesh(bodyGeo(), mat(color, { roughness: 0.35 }));
  const faceG = new THREE.Group(); face(faceG, mood);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.09, 0.14, 16), mat(color)); neck.position.y = CY - R * SY - 0.05;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), mat('#e0453a')); knot.position.y = neck.position.y - 0.09;
  const top = CY - R * SY - 0.14;
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, string, 6), mat('#3a2a20')); str.position.y = top - string / 2;
  root.add(body, faceG, neck, knot, str);
  const end = top - string, parts = { body, face: faceG, stringEnd: new THREE.Vector3(0, end, 0) };
  if (sonde) {
    const s = new THREE.Group(); s.position.y = end - 0.09;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.1), mat('#ff8a1f', { roughness: 0.4 }));
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 6), mat('#333')); ant.position.set(0.05, 0.18, 0);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), mat('#7dff7d', { emissive: '#3dff3d', emissiveIntensity: 1 })); led.position.set(-0.04, 0.03, 0.052);
    s.add(box, ant, led); root.add(s); parts.sonde = s;
  }
  const arms = {}, hands = {}, elbows = {};
  for (const [k, sd] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(sd * 0.46, CY - 0.12, 0.08);
    sh.add(limb(ARM, 0.025, color)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.025, color));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), mat('#ffffff')); hand.position.y = -ARM; el.add(hand);
    sh.add(el); root.add(sh); sh.rotation.z = sd * 0.5; arms[k] = sh; elbows[k] = el; hands[k] = hand;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale); Object.assign(parts, { arms, hands });
  root.userData.parts = parts;
  root.userData.pose = ({ arms: A = {}, tilt = 0 } = {}) => {
    root.rotation.z = tilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.8, -0.3, -0.3); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
