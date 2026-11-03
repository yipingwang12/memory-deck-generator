// The Flourish anchor: a living SACK of FLOUR, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.05 units tall. createFlour({ scale = 1, paper = '#f3e6c8' }) -> Group.
// userData.parts = { body, head: body group, arms:{l,r}, legs:{l,r}, hands:{l,r}, tie }   (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a sack-local point.
import * as THREE from 'three';

const A = 0.3, B = 0.36, C = 0.27, CY = 0.6, HIP_Y = 0.25, SH = [0.27, 0.66, 0.02], ARM = 0.14;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });

function disc(rx, ry, color, p, n, parent, off = 0) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.copy(p).addScaledVector(n, off);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); parent.add(m); return m;
}

function sackBody(paper) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat(paper, { roughness: 0.9 }));
  body.scale.set(A, B, C); body.position.y = CY; g.add(body);
  const neck = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 24), mat(paper, { roughness: 0.9 }));
  neck.position.y = CY + B + 0.04; g.add(neck);
  const frill = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.07, 0.15, 24, 1, true), mat(paper, { roughness: 0.9, side: THREE.DoubleSide }));
  frill.position.y = CY + B + 0.19; g.add(frill);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 10, 28), mat('#d8353a'));
  tie.rotation.x = Math.PI / 2; tie.position.y = CY + B + 0.1; g.add(tie);
  for (const s of [-1, 1]) { const bow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat('#d8353a')); bow.scale.set(1.3, 0.8, 0.8); bow.position.set(s * 0.04, CY + B + 0.09, 0.075); g.add(bow); }
  // soft blue stripe band (flour-sack print) with no letters
  const band = new THREE.Mesh(new THREE.SphereGeometry(1.004, 48, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.07), mat('#5b8fd6', { roughness: 0.9 }));
  band.scale.set(A, B, C); band.position.y = CY; g.add(band);
  return { g, tie };
}

function face(parent) {
  const surf = (x, y) => { const z = C * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - ((y - CY) / B) ** 2)); return new THREE.Vector3(x, y, z); };
  const nrm = (p) => new THREE.Vector3(p.x / A ** 2, (p.y - CY) / B ** 2, p.z / C ** 2).normalize();
  for (const sx of [-1, 1]) {
    const p = surf(sx * 0.1, 0.67), n = nrm(p);
    disc(0.062, 0.075, '#ffffff', p, n, parent, 0.003);
    disc(0.046, 0.066, '#3b6fb6', p.clone().add(new THREE.Vector3(0, -0.004, 0)), n, parent, 0.006);
    disc(0.03, 0.045, '#10162a', p, n, parent, 0.009);
    disc(0.017, 0.017, '#ffffff', p.clone().add(new THREE.Vector3(-0.016, 0.026, 0)), n, parent, 0.012);
    disc(0.007, 0.007, '#ffffff', p.clone().add(new THREE.Vector3(0.012, -0.03, 0)), n, parent, 0.012);
    const b = disc(0.034, 0.02, '#ff7f8f', surf(sx * 0.17, 0.57), nrm(surf(sx * 0.17, 0.57)), parent, 0.003);
    b.material.transparent = true; b.material.opacity = 0.6;
  }
  const pm = surf(0, 0.545), mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#8a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.copy(pm).add(new THREE.Vector3(0, 0.03, 0.006)); parent.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createFlour({ scale = 1, paper = '#f3e6c8' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const { g, tie } = sackBody(paper); upper.add(g); face(g);
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], SH[2]);
    sh.add(limb(ARM, 0.017, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat('#ffffff')); hand.scale.set(0.95, 1.1, 0.85); hand.position.y = -ARM; // glove
    el.add(hand); hands[k] = hand; sh.add(el); upper.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y + 0.02, 0); hip.add(limb(0.19, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.045, 0.036, 0.075);
    shoe.position.set(0, -0.2, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body: g, head: g, arms, legs, hands, tie };
  root.userData.pose = ({ lean = 0, tilt = 0, arms: Ar = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; torso.rotation.z = tilt;
    for (const [k, v] of Object.entries(Ar)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
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
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
