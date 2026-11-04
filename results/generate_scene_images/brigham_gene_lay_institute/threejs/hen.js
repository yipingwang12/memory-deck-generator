// The Gene Lay anchor: one chubby anime HEN, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.1 units tall incl. comb. createHen({ scale = 1, bodyColor = '#fff6e6', blush = true }) -> Group.
// userData.parts = { body, head, wings:{l,r}, legs:{l,r}, comb, beak }   (l = +x side)
// userData.pose({ lean, headTilt, wings:{l:[x,z], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; wing z>0 swings l out/up
// userData.reach('l'|'r', [x,y,z])  aims a wing at a hen-local point.
// userData.sit(depth = 0.16)  squats the body onto y = 0 (legs hidden), as when nesting.
import * as THREE from 'three';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const mesh = (geo, m, pos, scl = [1, 1, 1], parent) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.scale.set(...scl); parent.add(o); return o;
};
const SPH = new THREE.SphereGeometry(1, 36, 24);
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function face(head, blush) {
  const z = 0.185, st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.07, y = 0.03;
    disc(0.05, 0.062, '#ffffff', z, head, x, y);
    disc(0.04, 0.056, '#3a2a5a', z + st, head, x, y - 0.002);
    disc(0.036, 0.026, '#7b5cc0', z + 2 * st, head, x, y - 0.024);
    disc(0.02, 0.032, '#100818', z + 3 * st, head, x, y);
    disc(0.014, 0.014, '#ffffff', z + 4 * st, head, x - 0.014, y + 0.022);
    disc(0.006, 0.006, '#ffffff', z + 4 * st, head, x + 0.012, y - 0.026);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.052, 0.064, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    if (blush) { const b = disc(0.026, 0.014, '#ff7f8f', z - 0.004, head, sx * 0.115, -0.04); b.material.transparent = true; b.material.opacity = 0.6; }
  }
}

export function createHen({ scale = 1, bodyColor = '#fff6e6', blush = true } = {}) {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const feather = mat(bodyColor, { roughness: 0.8 }), shade = mat('#f1ddbb', { roughness: 0.8 });
  const red = mat('#e32f3a', { roughness: 0.5 }), orange = mat('#f59a1e', { roughness: 0.5 });

  mesh(SPH, feather, [0, 0.46, 0], [0.34, 0.31, 0.38], body);                     // torso
  mesh(SPH, shade, [0, 0.36, 0.05], [0.3, 0.2, 0.33], body);                      // belly
  const tail = new THREE.Group(); tail.position.set(0, 0.55, -0.32); body.add(tail);
  [[-0.14, 0.35, '#f1ddbb'], [0, 0.45, '#fff6e6'], [0.14, 0.35, '#f1ddbb']].forEach(([a, l, c]) => {
    const f = mesh(SPH, mat(c, { roughness: 0.8 }), [Math.sin(a * 4) * 0.12, l * 0.25, -0.02], [0.07, l / 2, 0.16], tail); f.rotation.set(-0.5, 0, a * 3);
  });

  const head = new THREE.Group(); head.position.set(0, 0.88, 0.1); body.add(head);
  mesh(SPH, feather, [0, 0, 0], [0.2, 0.19, 0.19], head);
  face(head, blush);
  const beak = new THREE.Group(); beak.position.set(0, -0.025, 0.185); head.add(beak);
  const up = mesh(new THREE.ConeGeometry(0.045, 0.1, 20), orange, [0, 0.006, 0.04], [1, 1, 0.8], beak); up.rotation.x = Math.PI / 2;
  const lo = mesh(new THREE.ConeGeometry(0.035, 0.07, 20), mat('#e08410', { roughness: 0.5 }), [0, -0.022, 0.025], [1, 1, 0.7], beak); lo.rotation.x = Math.PI / 2;
  mesh(SPH, red, [0, -0.1, 0.17], [0.03, 0.06, 0.025], head);                        // wattle
  const comb = new THREE.Group(); comb.position.set(0, 0.17, 0.03); head.add(comb);
  [[-0.07, -0.01, 0.05], [0, 0.02, 0.075], [0.07, -0.01, 0.05]].forEach(([x, y, r]) => mesh(SPH, red, [x, y + 0.03, 0], [r * 0.85, r, r * 0.7], comb));

  const wings = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const w = new THREE.Group(); w.position.set(s * 0.3, 0.6, 0.02); body.add(w);
    mesh(SPH, shade, [s * 0.03, -0.12, -0.02], [0.065, 0.19, 0.17], w);
    mesh(SPH, feather, [s * 0.04, -0.12, -0.02], [0.05, 0.17, 0.15], w);
    w.rotation.z = s * 0.15; wings[k] = w;
    const leg = new THREE.Group(); leg.position.set(s * 0.1, 0.22, 0.04); root.add(leg);
    const stem = mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.22, 10), orange, [0, -0.11, 0], [1, 1, 1], leg);
    for (const a of [-0.32, 0, 0.32]) { const toe = mesh(new THREE.CapsuleGeometry(0.012, 0.075, 4, 8), orange, [Math.sin(a) * 0.04, -0.215, 0.04], [1, 1, 1], leg); toe.rotation.set(Math.PI / 2, 0, a); }
    legs[k] = leg;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, wings, legs, comb, beak };

  root.userData.pose = ({ lean = 0, headTilt = 0, wings: W = {}, legs: L = {} } = {}) => {
    body.rotation.x = lean; head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(W)) wings[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const w = wings[key];
    const t = new THREE.Vector3(...target).sub(w.position.clone().add(body.position).add(new THREE.Vector3(0, 0, 0)));
    w.quaternion.setFromUnitVectors(Y, t.normalize());
  };
  root.userData.sit = (depth = 0.16) => { body.position.y = -depth; for (const l of Object.values(legs)) l.visible = false; };
  return root;
}
