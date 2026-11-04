// RA Capital anchor: a chibi SCARAB beetle. Faces +z, feet on y = 0, ~0.97 long, 0.45 tall.
// createScarab({ scale = 1, shell = '#1f56b8', gold = '#f2c230' }) -> Group
// userData.parts = { head, elytra:{l,r}, arms:{l,r}, hands:{l,r} }   (l = +x side)
// userData.open(angle)  lifts both wing-cases outward (radians, 0 = closed)
// userData.reach('l'|'r', [x,y,z])  two-bone IK for the front legs (arms), root-local target
// Also exports animeEye(parent, sx, pos, rotY, k, iris) used by the people in kid.js.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

export function animeEye(parent, sx, pos, rotY, k = 1, iris = '#2a6bd1') {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; g.scale.setScalar(k); parent.add(g);
  const st = 0.0018;
  disc(0.05, 0.062, '#ffffff', 0, g);
  disc(0.04, 0.056, iris, st, g, 0, -0.002);
  disc(0.036, 0.022, '#7fc0ff', 2 * st, g, 0, -0.026).material.transparent = true;
  disc(0.022, 0.038, '#0d0a14', 3 * st, g, 0, 0);
  disc(0.014, 0.014, '#ffffff', 4 * st, g, -0.013, 0.02);
  disc(0.007, 0.007, '#ffffff', 4 * st, g, 0.012, -0.022);
  const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#140c10'));
  lid.scale.set(0.054, 0.066, 1); lid.position.z = 5 * st; g.add(lid);
  return g;
}

function shellTexture() {
  return canvasTexture(256, (ctx, s) => {
    const gr = ctx.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, '#3f7fe0'); gr.addColorStop(1, '#17408f');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#f2c230';
    for (let i = 1; i < 6; i++) ctx.fillRect(i * s / 6 - 3, 0, 6, s);
    ctx.fillRect(0, s * 0.93, s, s * 0.07);
  });
}

export function createScarab({ scale = 1, gold = '#f2c230' } = {}) {
  const root = new THREE.Group();
  const goldM = mat(gold, { metalness: 0.5, roughness: 0.3 }), dark = mat('#1a2650');
  const ell = (rx, ry, rz, m, pos, parent = root) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m);
    o.scale.set(rx, ry, rz); o.position.set(...pos); parent.add(o); return o;
  };
  ell(0.23, 0.12, 0.28, mat('#ffe9a8'), [0, 0.2, -0.08]);        // soft body seen when the shell opens

  const shellM = new THREE.MeshStandardMaterial({ map: shellTexture(), roughness: 0.3, metalness: 0.25, side: THREE.DoubleSide });
  const elytra = {};
  for (const [k, sx] of [['l', 1], ['r', -1]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 0.25, 0.2, -0.08);
    const geo = new THREE.SphereGeometry(1, 28, 16, sx > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI, 0, Math.PI / 2);
    const m = new THREE.Mesh(geo, shellM); m.scale.set(0.25, 0.2, 0.3); m.position.x = -sx * 0.25; piv.add(m);
    root.add(piv); elytra[k] = piv;
  }
  ell(0.2, 0.1, 0.13, mat('#c98f1a', { metalness: 0.5, roughness: 0.35 }), [0, 0.29, 0.2]);   // pronotum

  const head = new THREE.Group(); head.position.set(0, 0.27, 0.44); root.add(head);
  ell(0.19, 0.16, 0.15, mat('#2a58b8', { roughness: 0.35 }), [0, 0, 0], head);
  for (const [x, s] of [[-0.055, 0.7], [0, 1], [0.055, 0.7]]) {                              // clypeus teeth
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.03 * s, 0.09 * s, 10), goldM);
    c.position.set(x, 0.13, 0.1); c.rotation.x = 1.0; head.add(c);
  }
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, y = 0.02, z = 0.15 * Math.sqrt(1 - (x / 0.19) ** 2 - (y / 0.16) ** 2) + 0.006;
    animeEye(head, sx, [x, y, z], sx * 0.4, 1);
    const b = disc(0.03, 0.017, '#ff7f8f', 0, head, 0, 0); b.material.transparent = true; b.material.opacity = 0.55;
    b.position.set(sx * 0.13, -0.05, 0.15 * Math.sqrt(1 - (0.13 / 0.19) ** 2 - (0.07 / 0.16) ** 2) + 0.005); b.rotation.y = sx * 0.85;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.14, 8), dark);          // antenna
    st.position.set(sx * 0.07, 0.19, 0.06); st.rotation.set(0.4, 0, -sx * 0.35); head.add(st);
    ell(0.025, 0.04, 0.012, goldM, [sx * 0.105, 0.265, 0.1], head);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.07, 0.15 * Math.sqrt(1 - 0.19) + 0.004); head.add(mouth);

  const seg = (a, b, r, m, parent = root) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), m);
    c.position.copy(A).add(B).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(c);
  };
  for (const sx of [-1, 1]) for (const [z, spread, dz] of [[0.0, 0.24, 0.06], [-0.24, 0.22, -0.08]]) {
    const hip = [sx * 0.2, 0.2, z], knee = [sx * (0.2 + spread * 0.7), 0.25, z + dz * 0.4], foot = [sx * (0.2 + spread), 0.03, z + dz];
    seg(hip, knee, 0.032, dark); seg(knee, foot, 0.028, dark);
    ell(0.036, 0.036, 0.036, goldM, knee); ell(0.04, 0.025, 0.05, goldM, [foot[0], 0.025, foot[2] + 0.01]);
  }

  const ARM = 0.15, arms = {}, elbows = {}, hands = {};
  for (const [k, sx] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.21, 0.22, 0.3);
    const lim = (g) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.027, ARM, 10), dark); m.position.y = -ARM / 2; g.add(m); };
    lim(sh); const el = new THREE.Group(); el.position.y = -ARM; lim(el);
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 10), goldM));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), goldM); hand.position.y = -ARM; el.add(hand);
    sh.add(el); root.add(sh); arms[k] = sh; elbows[k] = el; hands[k] = hand;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.8, 0.8, -0.3); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  root.userData.open = (a) => { elytra.l.rotation.z = -a; elytra.r.rotation.z = a; };
  root.userData.parts = { head, elytra, arms, hands };
  root.userData.reach('l', [0.28, 0.03, 0.5]); root.userData.reach('r', [-0.28, 0.03, 0.5]);
  return root;
}
