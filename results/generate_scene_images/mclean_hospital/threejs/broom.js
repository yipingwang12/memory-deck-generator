// The McLean anchor: a living BROOM character. Faces +z, bristles on y = 0, ~1.35 units tall.
// createBroom({ scale = 1, wood = '#c98a4a', straw = '#e3b84c' }) -> Group.
// userData.parts = { body, head, arms:{l,r}, hands:{l,r}, bristles, handle };  (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]} })  lean = tilt about the base (+ = forward, z-axis tip toward +z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK in broom-local space.
import * as THREE from 'three';

const PIV = 0.12, SH = [0.135, 0.78, 0.0], ARM = 0.16;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function bristles(straw) {
  const g = new THREE.Group(), cone = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.23, 0.38, 40, 1, true), mat(straw, { side: THREE.DoubleSide }));
  cone.position.y = 0.19; g.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.012, 8, 40), mat('#c99a30')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.01; g.add(rim);
  for (const [y, r] of [[0.1, 0.19], [0.2, 0.16], [0.3, 0.14]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 40), mat('#b98a2a')); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); }
  return g;
}

function face(parent, wood) {
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 40), mat('#e7b073')); plate.rotation.x = Math.PI / 2; plate.scale.set(0.12, 0.015, 0.14);
  plate.position.set(0, 0.64, 0.135); parent.add(plate);
  const z = 0.135 + 0.0075 + 0.002, st = 0.0015, y0 = 0.655;
  for (const sx of [-1, 1]) {
    const x = sx * 0.047;
    disc(0.034, 0.047, '#ffffff', z, parent, x, y0);
    disc(0.028, 0.042, '#2b3d6b', z + st, parent, x, y0 - 0.002);
    disc(0.024, 0.02, '#4f86c6', z + 2 * st, parent, x, y0 - 0.02);
    disc(0.015, 0.024, '#0c1020', z + 3 * st, parent, x, y0);
    disc(0.01, 0.01, '#ffffff', z + 4 * st, parent, x - 0.01, y0 + 0.017);
    disc(0.0045, 0.0045, '#ffffff', z + 4 * st, parent, x + 0.008, y0 - 0.02);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#2a160a'));
    lid.scale.set(0.037, 0.05, 1); lid.position.set(x, y0, z + 5 * st); parent.add(lid);
    const b = disc(0.02, 0.011, '#ff7f8f', z, parent, sx * 0.075, 0.598); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.6, z + st); parent.add(mouth);
}

export function createBroom({ scale = 1, wood = '#c98a4a', straw = '#e3b84c' } = {}) {
  const root = new THREE.Group(), tilt = new THREE.Group(); tilt.position.y = PIV; const upper = new THREE.Group(); upper.position.y = -PIV; tilt.add(upper); root.add(tilt);
  const brs = bristles(straw);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.13, 0.07, 32), mat('#7a4a2a')); band.position.y = 0.4;
  const twine = new THREE.Mesh(new THREE.TorusGeometry(0.133, 0.01, 8, 32), mat('#e8d9a8')); twine.rotation.x = Math.PI / 2; twine.position.y = 0.4;
  const pts = [[0, 0], [0.12, 0], [0.135, 0.06], [0.135, 0.3], [0.1, 0.4], [0.04, 0.46], [0.03, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat(wood)); body.position.y = 0.44;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.62, 16), mat(wood)); handle.position.y = 1.03;
  const knob = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20), mat('#7a4a2a')); knob.position.y = 1.37; knob.rotation.y = 0;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mat(wood)); cap.position.y = 1.34;
  const head = new THREE.Group(); head.position.y = 0.64; const inner = new THREE.Group(); inner.position.y = -0.64; head.add(inner);
  face(inner, wood);
  upper.add(brs, band, twine, body, handle, cap, knob, head);
  // swirl grain lines
  for (const y of [0.55, 0.78]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1 - (y > 0.7 ? 0.03 : 0), 0.004, 6, 24, Math.PI), mat('#8d5a2a')); t.position.set(0, y, 0); t.rotation.x = Math.PI / 2; t.rotation.z = Math.PI; upper.add(t); t.visible = false; }

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    const h = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat('#fff6e8')); palm.scale.set(0.95, 1.1, 0.85); h.add(palm); h.position.y = -ARM; el.add(h); hands[k] = h;
    sh.add(el); upper.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, arms, hands, bristles: brs, handle };
  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {} } = {}) => {
    tilt.rotation.x = lean; head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    tilt.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(tilt.matrix.clone().multiply(upper.matrix).invert());
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
