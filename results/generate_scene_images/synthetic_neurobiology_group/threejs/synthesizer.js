// Anchor: a living SYNTHESIZER keyboard. Faces +z, feet on y=0, ~1 unit tall.
// createSynthesizer({ scale=1, bodyColor='#d8452e' }) -> Group
// userData.parts = { body, head(face panel+knobs), arms:{l,r}, legs:{l,r}, hands:{l,r}, keys }  (l = +x)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })
// userData.reach('l'|'r',[x,y,z]) two-bone IK to a synth-local point.
import * as THREE from 'three';

const W = 0.8, D = 0.24, HIP = 0.22, TOP = 0.84, ARM = 0.17, SH = [0.4, 0.62];
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const rbox = (w, h, d, c, r = 0.02) => {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x - r, -y); s.lineTo(-x - r, y); s.quadraticCurveTo(-x - r, y + r, -x, y + r); s.lineTo(x, y + r);
  s.quadraticCurveTo(x + r, y + r, x + r, y); s.lineTo(x + r, -y); s.quadraticCurveTo(x + r, -y - r, x, -y - r);
  s.lineTo(-x, -y - r); s.quadraticCurveTo(-x - r, -y - r, -x - r, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r * .8, bevelThickness: r * .8, bevelSegments: 3 });
  g.translate(0, 0, -(d - 2 * r) / 2); return new THREE.Mesh(g, mat(c));
};
const disc = (rx, ry, color, z, parent, x, y) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

// Big anime eyes + catchlights on a flat panel facing +z at depth z0.
export function animeEyes(parent, z0, x0, y0, sp, k = 1, blush = true) {
  const st = 0.0015;
  for (const sx of [-1, 1]) {
    const x = x0 + sx * sp, y = y0;
    disc(0.06 * k, 0.078 * k, '#ffffff', z0, parent, x, y);
    disc(0.048 * k, 0.07 * k, '#3a2416', z0 + st, parent, x, y - 0.004 * k);
    disc(0.042 * k, 0.034 * k, '#2f9fb5', z0 + 2 * st, parent, x, y - 0.03 * k);
    disc(0.024 * k, 0.04 * k, '#120a08', z0 + 3 * st, parent, x, y);
    disc(0.017 * k, 0.017 * k, '#ffffff', z0 + 4 * st, parent, x - 0.018 * k, y + 0.026 * k);
    disc(0.008 * k, 0.008 * k, '#ffffff', z0 + 4 * st, parent, x - 0.018 * k, y - 0.03 * k);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.064 * k, 0.082 * k, 1); lid.position.set(x, y, z0 + 5 * st); parent.add(lid);
    if (blush) { const b = disc(0.035 * k, 0.019 * k, '#ff7f8f', z0, parent, x0 + sx * (sp + 0.075 * k), y0 - 0.09 * k); b.material.transparent = true; b.material.opacity = 0.6; }
  }
}

function keyTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, 512, 160);
  const n = 14, w = 512 / n;
  x.fillStyle = '#6b6b6b'; for (let i = 1; i < n; i++) x.fillRect(i * w - 1.5, 0, 3, 160);
  x.fillStyle = '#17171c';
  for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) x.fillRect((i + 1) * w - w * 0.3, 0, w * 0.6, 98);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createSynthesizer({ scale = 1, bodyColor = '#d8452e' } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP; upper.position.y = -HIP; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0';
  const body = rbox(W, TOP - HIP, D, bodyColor, 0.03); body.position.y = (TOP + HIP) / 2; upper.add(body);
  // face panel (upper half), cream
  const head = new THREE.Group(); head.position.y = 0.66; const inner = new THREE.Group(); inner.position.y = -0.66; head.add(inner);
  const panel = rbox(W - 0.08, 0.27, 0.03, '#f6e8c9', 0.012); panel.position.set(0, 0.69, D / 2); inner.add(panel);
  animeEyes(inner, D / 2 + 0.032, 0, 0.7, 0.14, 1);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.625, D / 2 + 0.033); inner.add(mouth);
  // knobs + sliders on the top edge (head-side), pitch wheel on the side
  const knobC = ['#ffd23c', '#3fb6c9', '#ffffff', '#ff8fb0', '#8fdc5a'];
  for (let i = 0; i < 5; i++) {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 20), mat(knobC[i], { roughness: 0.35 }));
    k.position.set(-0.28 + i * 0.14, TOP + 0.025, 0); inner.add(k);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.052, 0.03), mat('#222')); t.position.set(-0.28 + i * 0.14, TOP + 0.052, 0.018); inner.add(t);
  }
  // keyboard strip (lower half), slightly proud of body, with 3D black keys
  const ledge = rbox(W - 0.04, 0.3, 0.05, '#2a2a30', 0.015); ledge.position.set(0, 0.37, D / 2 + 0.01); upper.add(ledge);
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, 0.24), new THREE.MeshStandardMaterial({ map: keyTexture(), roughness: 0.4 }));
  keys.position.set(0, 0.37, D / 2 + 0.037); upper.add(keys);
  upper.add(head);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * (W / 2 + 0.01), SH[1], 0.0);
    sh.add(limb(ARM, 0.02, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.02, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(skin)));
    const hand = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat('#fff3e0'));
    palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), mat('#fff3e0')); th.position.set(0.04 * s, 0.01, 0.02);
    hand.add(palm, th); hand.position.y = -ARM; hands[k] = hand; el.add(hand); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.2, HIP + 0.02, 0); hip.add(limb(0.18, 0.03, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#2b6cb0')); shoe.scale.set(0.06, 0.04, 0.09);
    shoe.position.set(0, -0.2, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, torso, head, arms, legs, hands, keys };
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
    const d = t.clone().sub(sh.position), Dd = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.1, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(Dd / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(Dd).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
