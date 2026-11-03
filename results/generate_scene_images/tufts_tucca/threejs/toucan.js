// The TUCCA anchor: a cartoon TOUCAN reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createToucan({ scale = 1 }) -> Group.
// userData.parts = { body, head, beak, wings:{l,r}, tail, legs:{l,r} }   (l = +x side)
// userData.pose({ lean, headTilt, headYaw, wings:{l:[x,z], r:[x,z]} })  radians; wing z>0 swings l out; x>0 swings forward
// userData.crouch(k)  sinks the body k units (feet stay planted) for nesting/sitting poses.
import * as THREE from 'three';

const mat = (color, extra = {}) => new THREE.MeshToonMaterial({ color, ...extra });
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const ell = (rx, ry, rz, m, pos = [0, 0, 0], parent) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m); o.scale.set(rx, ry, rz); o.position.set(...pos);
  if (parent) parent.add(o); return o;
};
const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), std(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function eye(head, sx) {
  const g = new THREE.Group(), step = 0.0015;
  g.position.set(sx * 0.082, 0.81, 0.118); g.rotation.y = sx * 0.5; g.rotation.x = -0.05; g.scale.setScalar(1.3);
  disc(0.058, 0.062, '#2f8fd8', 0, g);                       // blue eye-skin ring
  disc(0.043, 0.05, '#ffffff', step, g);
  disc(0.034, 0.045, '#3a2416', 2 * step, g, 0, -0.002);
  disc(0.03, 0.026, '#c07a34', 3 * step, g, 0, -0.02);
  disc(0.018, 0.03, '#120a08', 4 * step, g);
  disc(0.011, 0.011, '#ffffff', 5 * step, g, -0.011, 0.016);
  disc(0.005, 0.005, '#ffffff', 5 * step, g, -0.01, -0.02);
  const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.25, Math.PI - 0.5), std('#101018'));
  lid.scale.set(0.048, 0.056, 1); lid.position.z = 6 * step; g.add(lid);
  head.add(g);
}

function beak() {
  const g = new THREE.Group();
  const upper = ell(0.07, 0.085, 0.27, mat('#ffb21a'), [0, 0.012, 0.2], g);
  ell(0.072, 0.03, 0.22, mat('#ff6a1a'), [0, 0.075, 0.2], g).scale.y = 0.03;      // orange ridge
  ell(0.066, 0.05, 0.2, mat('#ff7a1c'), [0, -0.05, 0.18], g);                       // lower mandible
  ell(0.03, 0.035, 0.05, mat('#2a1a20'), [0, 0.02, 0.455], g);                      // dark tip
  ell(0.075, 0.09, 0.03, mat('#2c9ad8'), [0, 0.0, 0.0], g);                         // blue base band
  g.position.set(0, 0.69, 0.1); g.rotation.x = 0.16;
  g.userData.upper = upper; return g;
}

export function createToucan({ scale = 1 } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
  const black = mat('#1d2030'), white = mat('#fff8e8'), cream = mat('#ffe27a'), orange = mat('#ff8a1e');

  ell(0.2, 0.27, 0.19, black, [0, 0.4, -0.02], body);                              // torso
  ell(0.14, 0.2, 0.1, white, [0, 0.46, 0.115], body);                              // white bib
  ell(0.12, 0.07, 0.08, cream, [0, 0.62, 0.1], body);                              // yellow throat
  ell(0.17, 0.15, 0.17, black, [0, 0.74, 0], head);                                // head
  ell(0.11, 0.09, 0.09, white, [0, 0.69, 0.08], head);                             // white chin
  eye(head, 1); eye(head, -1);
  const bk = beak(); head.add(bk);
  const cheek = (s) => { const c = disc(0.025, 0.014, '#ff7f8f', 0, head, s * 0.1, 0.71, { transparent: true, opacity: 0.6 });
    c.position.z = 0.125; c.rotation.y = s * 0.7; };
  cheek(1); cheek(-1);
  body.add(head);

  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.15); tail.rotation.x = 0.7;
  ell(0.09, 0.03, 0.26, black, [0, 0, -0.16], tail); ell(0.08, 0.02, 0.1, mat('#e8283a'), [0, -0.03, -0.06], tail);
  body.add(tail);

  const wings = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const w = new THREE.Group(); w.position.set(s * 0.19, 0.58, -0.02);
    ell(0.05, 0.22, 0.12, black, [0, -0.18, 0], w); ell(0.03, 0.05, 0.1, mat('#2f8fd8'), [0, -0.38, 0], w);
    w.rotation.z = s * 0.12; wings[k] = w; body.add(w);

    const leg = new THREE.Group(); leg.position.set(s * 0.08, 0.2, 0.02);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 12), mat('#4aa8e0')); shin.position.y = -0.09; leg.add(shin);
    for (const a of [-0.35, 0, 0.35]) { const t = ell(0.016, 0.014, 0.065, orange, [Math.sin(a) * 0.05, -0.19, 0.045 * Math.cos(a)], leg); t.rotation.y = a; }
    legs[k] = leg; root.add(leg);
  }
  body.position.y = 0;
  root.add(body);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, beak: bk, wings, tail, legs };
  root.userData.pose = ({ lean = 0, headTilt = 0, headYaw = 0, wings: W = {} } = {}) => {
    body.rotation.x = lean; head.rotation.z = headTilt; head.rotation.y = headYaw; head.position.set(0, 0, 0);
    for (const [k, v] of Object.entries(W)) wings[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  root.userData.crouch = (k) => { body.position.y = -k; for (const l of Object.values(legs)) l.visible = k < 0.1; };
  return root;
}
