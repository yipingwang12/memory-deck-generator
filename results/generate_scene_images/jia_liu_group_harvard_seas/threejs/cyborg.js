// The Jia Liu anchor: a small CYBORG kid (half human face, half cyan machine). Faces +z, feet y=0, ~1 unit tall.
// createCyborg({ scale = 1, suit = '#f2f6fa', glow = '#33e0ff' }) -> Group.
// userData.parts = { torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, core }  (l = +x side; l arm is the robotic one)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a cyborg-local point.
import * as THREE from 'three';

const HIP_Y = 0.3, SHOULDER = [0.13, 0.55, 0], ARM = 0.14, HR = 0.19, HEAD_Y = 0.75;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0, op = 1) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, transparent: op < 1, opacity: op }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const ball = (r, color, pos, scl = [1, 1, 1], extra = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat(color, extra)); m.scale.set(...scl); m.position.set(...pos); return m;
};
const limb = (len, r, color, extra) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat(color, extra)); m.geometry.translate(0, -len / 2, 0); return m;
};

function face(head, glow) {
  const zAt = (x, y) => Math.sqrt(HR * HR - x * x - (y) * (y)) + 0.004;
  for (const sx of [-1, 1]) {
    const x = sx * 0.07, y = 0.0, z = zAt(x, y), st = 0.0015, robot = sx > 0;
    disc(0.043, 0.054, '#ffffff', z, head, x, y);
    disc(0.034, 0.048, robot ? '#0a6f8c' : '#3a2416', z + st, head, x, y - 0.002);
    disc(0.029, 0.022, robot ? glow : '#b4753a', z + 2 * st, head, x, y - 0.02);
    disc(0.017, 0.027, '#0a0a14', z + 3 * st, head, x, y);
    disc(0.011, 0.011, '#ffffff', z + 4 * st, head, x - 0.012, y + 0.018);
    disc(0.005, 0.005, '#ffffff', z + 4 * st, head, x - 0.01, y - 0.02);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.046, 0.058, 1); lid.position.set(x, y, z + 5 * st); head.add(lid);
    const b = disc(0.022, 0.012, '#ff7f8f', zAt(sx * 0.1, -0.06), head, sx * 0.1, -0.06, 0.55);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.085, zAt(0, -0.085) + 0.003); head.add(mouth);
}

export function createCyborg({ scale = 1, suit = '#f2f6fa', glow = '#33e0ff' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', metal = '#aab4c0', dark = '#2a3340', glowM = { emissive: glow, emissiveIntensity: 1.2 };

  const body = ball(0.15, suit, [0, 0.45, 0], [1, 1.45, 0.85]);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.04, 28), mat(dark)); belt.position.y = 0.33;
  const core = ball(0.03, glow, [0, 0.5, 0.125], [1, 1, 0.5], glowM);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.007, 8, 28), mat(metal, { metalness: 0.7 })); ring.position.set(0, 0.5, 0.125);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.006, 8, 28), mat(glow, glowM)); stripe.rotation.x = Math.PI / 2; stripe.position.y = 0.42; stripe.scale.set(1.05, 1, 0.9);
  upper.add(body, belt, core, ring, stripe);

  const head = new THREE.Group(); head.position.y = HEAD_Y; const inner = new THREE.Group(); head.add(inner);
  inner.add(ball(HR, skin, [0, 0, 0], [1, 1.02, 1]));
  const hair = ball(HR + 0.012, '#1f2a4a', [0, 0.03, -0.012], [1, 1, 1]);
  hair.geometry = new THREE.SphereGeometry(HR + 0.012, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.46); hair.position.y = 0.0; hair.rotation.x = -0.25;
  inner.add(hair);
  const fringe = ball(0.07, '#1f2a4a', [-0.07, 0.115, 0.115], [1.5, 0.7, 0.7]); inner.add(fringe);
  const plate = new THREE.Mesh(new THREE.SphereGeometry(HR + 0.006, 28, 16, Math.PI * 0.05, Math.PI * 0.4, Math.PI * 0.3, Math.PI * 0.45), mat(metal, { metalness: 0.75, roughness: 0.3, side: THREE.DoubleSide }));
  plate.rotation.y = 0.0; inner.add(plate);
  const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 20), mat(metal, { metalness: 0.7, roughness: 0.3 })); ear.rotation.z = Math.PI / 2; ear.position.set(HR + 0.008, 0, -0.01); inner.add(ear);
  const earGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 20), mat(glow, glowM)); earGlow.rotation.z = Math.PI / 2; earGlow.position.copy(ear.position); earGlow.position.x += 0.004; inner.add(earGlow);
  const earL = ball(0.03, skin, [-HR - 0.003, 0, -0.01], [0.5, 1, 0.8]); inner.add(earL);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), mat(metal, { metalness: 0.7 })); ant.position.set(0.09, HR + 0.07, -0.02); ant.rotation.z = -0.25; inner.add(ant);
  inner.add(ball(0.018, glow, [0.1, HR + 0.135, -0.02], [1, 1, 1], glowM));
  face(inner, glow);
  upper.add(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const robot = k === 'l', c = robot ? metal : skin, ex = robot ? { metalness: 0.7, roughness: 0.3 } : {};
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(ball(0.03, robot ? dark : suit, [0, 0, 0]), limb(ARM, 0.017, c, ex));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(ball(0.02, robot ? glow : c, [0, 0, 0], [1, 1, 1], robot ? glowM : {}), limb(ARM, 0.015, c, ex));
    const hand = new THREE.Group(); const palm = ball(0.032, c, [0, 0, 0], [0.95, 1.1, 0.8], ex); hand.add(palm, ball(0.014, c, [0.027, 0.005, 0.01], [1, 1, 1], ex));
    hand.position.y = -ARM; hands[k] = hand; el.add(hand); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.065, HIP_Y, 0); hip.add(limb(0.22, 0.026, robot ? metal : '#37507a', ex));
    const shoe = ball(1, robot ? dark : '#e0584c', [0, -0.265, 0.02], [0.045, 0.035, 0.07]); hip.add(shoe);
    if (robot) hip.add(ball(0.03, glow, [0, -0.1, 0], [1, 1, 1], glowM));
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, head, arms, legs, hands, core };
  root.userData.pose = ({ lean = 0, headTilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean; head.rotation.z = headTilt;
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
  return root;
}
