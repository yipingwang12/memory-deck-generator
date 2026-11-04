// The Axoft anchor: one living AXE, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~1.05 units tall. createAxe({ scale = 1, handleColor = '#c98a4b', steel = '#aab8c8', blush = true }) -> Group.
// userData.parts = { head (steel head + face), handle, torso, arms:{l,r}, legs:{l,r}, hands:{l,r}, edge }   (l = +x side, the blade side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to an axe-local point.
// userData.lie(yaw = 0)  lies on its back, resting on y = 0.
import * as THREE from 'three';

const HIP_Y = 0.3, SHOULDER = [0.062, 0.6, 0], ARM = 0.15, HR = 0.045;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function headShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.16, 0.13); s.lineTo(-0.16, -0.13); s.lineTo(0.0, -0.16);
  s.quadraticCurveTo(0.2, -0.3, 0.3, -0.27); s.quadraticCurveTo(0.37, 0, 0.3, 0.27);
  s.quadraticCurveTo(0.2, 0.3, 0.0, 0.16); s.closePath();
  return s;
}

function axeHead(steel) {
  const g = new THREE.ExtrudeGeometry(headShape(), { depth: 0.14, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 3 });
  g.translate(0, 0, -0.07);
  return new THREE.Mesh(g, mat(steel, { metalness: 0.35, roughness: 0.35 }));
}

function edgeStrip() {
  const g = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.011, 8, 32, 1.35), mat('#f2f7fb', { metalness: 0.5, roughness: 0.25 }));
  g.rotation.z = -0.675; g.position.set(0.02, 0, 0); g.scale.set(1, 1.05, 1); return g;
}

function face(group, blush) {
  const z = 0.092, step = 0.0015, cx = 0.045;
  for (const sx of [-1, 1]) {
    const x = cx + sx * 0.068, y = 0.02;
    disc(0.05, 0.065, '#ffffff', z, group, x, y);
    disc(0.04, 0.058, '#2a3f6a', z + step, group, x, y - 0.003);
    disc(0.036, 0.028, '#4d86d6', z + 2 * step, group, x, y - 0.026);
    disc(0.02, 0.034, '#0b1020', z + 3 * step, group, x, y);
    disc(0.014, 0.014, '#ffffff', z + 4 * step, group, x - 0.015, y + 0.024);
    disc(0.006, 0.006, '#ffffff', z + 4 * step, group, x - 0.014, y - 0.024);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.054, 0.069, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    if (blush) { const b = disc(0.026, 0.014, '#ff7f8f', z, group, cx + sx * 0.125, -0.07); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(cx, -0.085, z + step); group.add(mouth);
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.85); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), mat(color));
  th.position.set(0.03, 0.006, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createAxe({ scale = 1, handleColor = '#c98a4b', steel = '#aab8c8', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0';
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(HR, HR * 1.12, 0.62, 20), mat(handleColor, { roughness: 0.7 }));
  handle.position.y = 0.55;
  const wrap = new THREE.Mesh(new THREE.TorusGeometry(HR * 1.15, 0.01, 8, 20), mat('#e8505b'));
  wrap.rotation.x = Math.PI / 2; wrap.position.y = 0.42;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.3, 16, 12), mat(handleColor, { roughness: 0.7 })); knob.position.y = 0.25;
  const head = new THREE.Group(); head.position.set(0, 0.84, 0);
  const hm = axeHead(steel); head.add(hm, edgeStrip()); face(head, blush);
  upper.add(handle, wrap, knob, head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.04, HIP_Y - 0.02, 0); hip.add(limb(0.23, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.04, 0.034, 0.065);
    shoe.position.set(0, -0.26, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, handle, torso, arms, legs, hands, edge: hm };

  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt; head.position.x = -Math.sin(headTilt) * 0 ;
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
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };

  root.userData.lie = (yaw = 0) => { root.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ'); root.position.y = 0.09 * scale; };
  return root;
}
