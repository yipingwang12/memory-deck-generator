// The Biogen anchor: a red-and-white channel BUOY with big anime eyes, little mitten arms, a glowing lantern on top.
// Faces +z, sits on y = 0, ~1 unit tall. createBuoy({ scale = 1 }) -> Group.
// userData.parts = { body, head (= face group), arms:{l,r}, hands:{l,r}, lantern }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, bob }) radians.  userData.reach('l'|'r',[x,y,z]) two-bone IK to a buoy-local point.
// userData.rash() adds a red butterfly rash across the cheeks.
import * as THREE from 'three';

const R = 0.22, SH = [0.215, 0.43, 0.02], ARM = 0.15;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...e });
const lathe = (pts, m) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40), m);
const disc = (rx, ry, color, parent, x, y, z) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function face(parent) {
  const st = 0.0015;
  for (const sx of [-1, 1]) {
    const a = sx * 0.36, g = new THREE.Group();
    g.position.set(R * Math.sin(a), 0.455, R * Math.cos(a) + 0.002); g.rotation.y = a; parent.add(g);
    disc(0.04, 0.05, '#ffffff', g, 0, 0, 0);
    disc(0.031, 0.044, '#2a1a4a', g, 0, -0.003, st);
    disc(0.027, 0.02, '#5c7fd8', g, 0, -0.02, 2 * st);
    disc(0.015, 0.025, '#0c0818', g, 0, 0, 3 * st);
    disc(0.011, 0.011, '#ffffff', g, -0.011, 0.016, 4 * st);
    disc(0.005, 0.005, '#ffffff', g, -0.011, -0.02, 4 * st);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f20'));
    lid.scale.set(0.043, 0.054, 1); lid.position.z = 5 * st; g.add(lid);
    const b = disc(0.026, 0.014, '#ff7f8f', g, sx * 0.025, -0.06, 0); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  m.rotation.z = Math.PI; m.position.set(0, 0.38, R + 0.003); parent.add(m);
}

export function createBuoy({ scale = 1 } = {}) {
  const root = new THREE.Group(), red = mat('#e8342c'), white = mat('#fbf6ee'), steel = mat('#4a525c', { metalness: 0.6, roughness: 0.35 });
  const body = new THREE.Group(); root.add(body);
  body.add(lathe([[0.001, 0], [0.30, 0], [0.31, 0.02], [0.30, 0.07], [0.25, 0.11], [0.22, 0.16], [0.22, 0.26]], red));
  body.add(lathe([[0.22, 0.26], [0.22, 0.58]], white));
  body.add(lathe([[0.22, 0.58], [0.20, 0.62], [0.15, 0.78], [0.12, 0.84]], red));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.014, 8, 40), red); ring.rotation.x = Math.PI / 2; ring.position.y = 0.58; body.add(ring);
  // lantern cage
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), new THREE.MeshStandardMaterial({ color: '#ffd24a', emissive: '#ffb020', emissiveIntensity: 1.2 }));
  lantern.position.y = 0.93; body.add(lantern);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, p = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 6), steel);
    p.position.set(0.1 * Math.cos(a), 0.9, 0.1 * Math.sin(a)); p.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); body.add(p);
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.06, 20), steel); cap.position.y = 1.02; body.add(cap);
  const head = new THREE.Group(); body.add(head); face(head);

  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]); sh.add(limb(ARM, 0.014, skin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin), new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    const h = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 12), mat(skin)); palm.scale.set(0.95, 1.1, 0.8);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(skin)); th.position.set(s * 0.03, 0.005, 0.012); h.add(palm, th); h.position.y = -ARM; el.add(h);
    hands[k] = h; sh.add(el); body.add(sh); sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, head, arms, hands, lantern };

  root.userData.pose = ({ arms: A = {} } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].quaternion.identity(); arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].quaternion.identity(); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.4, -0.5); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  root.userData.rash = () => {
    const rm = mat('#d6283c', { roughness: 0.6 }), dk = mat('#a01830', { roughness: 0.6 });
    const lobe = (rx, ry, a, y, rz, m, dz) => {
      const e = new THREE.Mesh(new THREE.CircleGeometry(1, 28), m); e.scale.set(rx, ry, 1);
      const g = new THREE.Group(); g.position.set(R * Math.sin(a), y, R * Math.cos(a) + dz); g.rotation.y = a; e.rotation.z = rz; g.add(e); head.add(g);
    };
    for (const sx of [-1, 1]) {
      lobe(0.085, 0.032, sx * 0.55, 0.385, sx * 0.28, rm, 0.0035);
      lobe(0.055, 0.028, sx * 0.5, 0.33, -sx * 0.3, rm, 0.0035);
      lobe(0.012, 0.012, sx * 0.55, 0.385, 0, dk, 0.0045); lobe(0.01, 0.01, sx * 0.5, 0.33, 0, dk, 0.0045);
    }
    lobe(0.04, 0.012, 0, 0.4, 0, rm, 0.0035);
  };
  return root;
}
