// The Broad anchor: a living BROADSWORD (blade up, face on the blade, arms from the crossguard, legs under the pommel).
// Faces +z, feet on y = 0, ~1.5 units tall. createBroadsword({ scale = 1, steel = '#cfe0ee', blush = true }) -> Group.
// userData.parts = { blade, torso, arms:{l,r}, legs:{l,r}, hands:{l,r}, tip }  (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians. lean = pitch about hips (+ forward), tilt = roll z.
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a sword-local point (root-local, un-leaned).
import * as THREE from 'three';

const HIP_Y = 0.34, ARM = 0.17, SH = [0.27, 0.66, 0];
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function bladeMesh(steel) {
  const s = new THREE.Shape(), w = 0.17, y0 = 0.7, y1 = 1.28, y2 = 1.62;
  s.moveTo(-w, y0); s.lineTo(w, y0); s.lineTo(w, y1); s.lineTo(0, y2); s.lineTo(-w, y1); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.015, bevelSegments: 3 });
  g.translate(0, 0, -0.025);
  const m = new THREE.Mesh(g, mat(steel, { metalness: 0.55, roughness: 0.3 }));
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.012), mat('#9fb6c8', { metalness: 0.6, roughness: 0.3 }));
  fuller.position.set(0, 1.1, 0.045); // faint centre ridge behind face region is hidden by the face; keep above
  fuller.position.y = 1.43; fuller.scale.y = 0.35; m.add(fuller);
  return m;
}

function face(parent, blush) {
  const z = 0.047, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, y = 0.98;
    disc(0.05, 0.066, '#ffffff', z, parent, x, y);
    disc(0.04, 0.058, '#2a5a9a', z + st, parent, x, y - 0.003);
    disc(0.034, 0.028, '#5aa2e0', z + 2 * st, parent, x, y - 0.026);
    disc(0.02, 0.034, '#0a1020', z + 3 * st, parent, x, y);
    disc(0.0135, 0.0135, '#ffffff', z + 4 * st, parent, x - 0.014, y + 0.022);
    disc(0.0065, 0.0065, '#ffffff', z + 4 * st, parent, x + 0.013, y - 0.026);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#101828'));
    lid.scale.set(0.055, 0.072, 1); lid.position.set(x, y, z + 5 * st); parent.add(lid);
    if (blush) { const b = disc(0.03, 0.016, '#ff7f8f', z, parent, sx * 0.115, 0.9); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.885, z + st); parent.add(mouth);
}

export function createBroadsword({ scale = 1, steel = '#cfe0ee', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', gold = mat('#e2b13c', { metalness: 0.7, roughness: 0.3 }), leather = mat('#7a3a22', { roughness: 0.8 });
  const blade = bladeMesh(steel); upper.add(blade); face(upper, blush);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.075, 0.1), gold); guard.position.y = 0.66; upper.add(guard);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), gold); c.position.set(s * 0.3, 0.66, 0); upper.add(c); }
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16), leather); grip.position.y = 0.52; upper.add(grip);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 6, 16), mat('#d9b878')); w.rotation.x = Math.PI / 2; w.position.y = 0.45 + i * 0.05; upper.add(w); }
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), gold); pommel.position.y = 0.37; upper.add(pommel);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat('#c0203a', { roughness: 0.2 })); jewel.position.set(0, 0.37, 0.075); upper.add(jewel);
  const tip = new THREE.Object3D(); tip.position.set(0, 1.62, 0); upper.add(tip);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0.02);
    sh.add(limb(ARM, 0.015, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.015, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), mat(skin)));
    const h = new THREE.Group(); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 12), mat(skin)); palm.scale.set(0.95, 1.1, 0.85);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)); th.position.set(s * 0.036, 0.008, 0.015); h.add(palm, th); h.position.y = -ARM; el.add(h);
    hands[k] = h; sh.add(el); upper.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.06, HIP_Y, 0.0); hip.add(limb(0.26, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.08); shoe.position.set(0, -0.29, 0.025); hip.add(shoe);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { blade, torso, arms, legs, hands, tip };
  root.userData.pose = ({ lean = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.set(lean, 0, tilt);
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
