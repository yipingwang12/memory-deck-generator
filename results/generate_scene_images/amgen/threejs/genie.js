// The Amgen anchor: GENIE, a friendly blue genie with a smoke-curl tail, turban, big anime eyes.
// Faces +z, tail tip at y ~ 0, head top ~1.4 units. createGenie({ scale = 1, skin = '#3fa4ea' }) -> Group.
// userData.parts = { upper, head, arms:{l,r}, hands:{l,r}, tail, mouth }   (l = +x side)
// userData.pose({ lean, headTilt, headTurn, arms:{l:[x,z,elbowX], r:[..]} })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a genie-local point.
// userData.setMouth(open 0..1)  0 = smile, 1 = wide open (swallowing).
import * as THREE from 'three';

const ARM = 0.2, SHOULDER = [0.215, 0.86, 0], HEAD_Y = 1.03, HR = 0.19, PIV_Y = 0.55;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const gold = () => mat('#f2b82a', { metalness: 0.6, roughness: 0.3 });

function feature(parent, x, y, rx, ry, color, layer, basic = false) {
  const dir = new THREE.Vector3(x, y, Math.sqrt(Math.max(0.01, HR * HR - x * x - y * y))).normalize();
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), basic ? new THREE.MeshBasicMaterial({ color }) : mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1);
  m.position.copy(dir).multiplyScalar(HR + 0.0015 + layer * 0.0012);
  m.lookAt(dir.clone().multiplyScalar(3)); parent.add(m); return m;
}

function buildFace(head, skin) {
  head.add(new THREE.Mesh(new THREE.SphereGeometry(HR, 40, 28), mat(skin)));
  for (const s of [-1, 1]) {
    const x = s * 0.075, y = 0.0;
    feature(head, x, y, 0.052, 0.062, '#ffffff', 0);
    feature(head, x, y - 0.004, 0.04, 0.056, '#2a1a5a', 1);
    feature(head, x, y - 0.022, 0.034, 0.028, '#7a5ae0', 2);
    feature(head, x, y - 0.004, 0.02, 0.032, '#0a0618', 3);
    feature(head, x - 0.014, y + 0.02, 0.014, 0.014, '#ffffff', 4);
    feature(head, x + 0.012, y - 0.026, 0.0065, 0.0065, '#ffffff', 4);
    const brow = feature(head, s * 0.082, y + 0.07, 0.04, 0.009, '#1b1030', 1); brow.rotation.z += s * -0.12;
    const blush = feature(head, s * 0.115, y - 0.058, 0.026, 0.014, '#ff7fa0', 0); blush.material.transparent = true; blush.material.opacity = 0.6;
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 16), mat(skin));
    ear.position.set(s * 0.185, 0.03, -0.01); ear.rotation.z = -s * 1.25; head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.11, 12), mat('#ffa9c0'));
    inner.position.set(s * 0.185, 0.03, 0.01); inner.rotation.z = -s * 1.25; head.add(inner);
  }
  feature(head, 0, -0.03, 0.007, 0.01, '#2a78b8', 1);
  const mouth = new THREE.Group(), smile = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#5a1030'));
  smile.rotation.z = Math.PI; smile.position.z = 0; mouth.add(smile);
  const dark = feature(head, 0, -0.09, 0.03, 0.001, '#4a0c22', 1), tongue = feature(head, 0, -0.09, 0.02, 0.001, '#ff7f90', 2);
  dark.visible = tongue.visible = false;
  const dir = new THREE.Vector3(0, -0.075, 1).normalize().multiplyScalar(HR + 0.003);
  mouth.position.copy(dir); mouth.lookAt(dir.clone().multiplyScalar(3)); head.add(mouth);
  const goatee = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 14), mat('#1f2a6e'));
  goatee.position.set(0, -0.178, 0.07); goatee.rotation.x = Math.PI + 0.35; head.add(goatee);
  return { mouth, smile, dark, tongue };
}

function buildTurban() {
  const g = new THREE.Group(), cloth = mat('#e8433a'), cloth2 = mat('#c92f2f');
  const wrap = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.04, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), cloth);
  wrap.position.y = 0.04; g.add(wrap);
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(HR * (0.93 - i * 0.045), 0.026, 10, 40), i % 2 ? cloth2 : cloth);
    t.rotation.x = Math.PI / 2 + 0.12; t.position.set(0, 0.075 + i * 0.05, -0.005); g.add(t);
  }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 14), cloth); top.position.y = 0.2; top.scale.y = 0.8; g.add(top);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), mat('#7ee8ff', { metalness: 0.3, roughness: 0.15 }));
  gem.position.set(0, 0.095, HR * 0.93); gem.scale.set(1, 1.3, 0.7); g.add(gem);
  const setting = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 24), gold()); setting.position.copy(gem.position); setting.position.z -= 0.004; g.add(setting);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat(i % 2 ? '#ffe9a8' : '#fff6d8'));
    f.scale.set(0.022, 0.045, 0.008); f.position.set(0.0 + i * 0.012, 0.26 + i * 0.045, 0.0 - i * 0.018); f.rotation.z = -0.25 - i * 0.12; g.add(f);
  }
  return g;
}

export function createGenie({ scale = 1, skin = '#3fa4ea' } = {}) {
  const root = new THREE.Group(), upper = new THREE.Group(), head = new THREE.Group(), tail = new THREE.Group();
  upper.position.y = PIV_Y; const inner = new THREE.Group(); inner.position.y = -PIV_Y; upper.add(inner);

  // smoke tail: curling taper of spheres
  const N = 14;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), r = 0.045 + 0.2 * Math.pow(t, 0.8);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(i % 2 ? skin : '#58b4f0'));
    m.scale.setScalar(r); m.position.set(0.3 * Math.pow(1 - t, 2) * Math.sin(t * 5 + 0.3) - 0.1 * (1 - t), 0.05 + t * 0.52, 0.02 * (1 - t)); tail.add(m);
  }
  root.add(tail, upper);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), mat(skin)); torso.scale.set(0.24, 0.3, 0.19); torso.position.y = 0.72;
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 10, 36), mat('#f2b82a', { metalness: 0.5, roughness: 0.3 })); sash.rotation.x = Math.PI / 2; sash.position.y = 0.54; sash.scale.set(1.05, 0.85, 1);
  const vest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 16, 0, Math.PI * 2, 0.5, 1.2), mat('#7a2ad0')); vest.position.set(0, 0.68, 0.015); vest.scale.set(1.12, 1.3, 0.92);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32, Math.PI), gold()); chain.position.set(0, 0.88, 0.1); chain.rotation.set(0.2, 0, Math.PI);
  inner.add(torso, vest, sash, chain);
  head.position.y = 1.1; head.scale.setScalar(1.3); const face = buildFace(head, skin); head.add(buildTurban()); inner.add(head);

  const arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    const limb = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, ARM, 14), mat(skin)); m.geometry.translate(0, -ARM / 2, 0); return m; };
    sh.add(limb(), new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), mat('#7a2ad0')));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(), new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), mat(skin)));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.014, 8, 20), gold()); band.rotation.x = Math.PI / 2; band.position.y = -ARM * 0.8; el.add(band);
    const hand = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 14), mat(skin)); palm.scale.set(0.95, 1.1, 0.8);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(skin)); th.position.set(s * -0.04, 0.01, 0.025); hand.add(palm, th); hand.position.y = -ARM - 0.02; el.add(hand);
    hands[k] = hand; sh.add(el); inner.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { upper, head, arms, hands, tail, mouth: face };

  root.userData.pose = ({ lean = 0, headTilt = 0, headTurn = 0, arms: A = {} } = {}) => {
    upper.rotation.x = lean; head.rotation.z = headTilt; head.rotation.y = headTurn;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  root.userData.setMouth = (open) => {
    face.smile.visible = open < 0.05; face.dark.visible = face.tongue.visible = open >= 0.05;
    face.dark.scale.set(0.03 + 0.04 * open, 0.001 + 0.075 * open, 1); face.tongue.scale.set(0.022 + 0.03 * open, 0.001 + 0.03 * open, 1);
    face.tongue.position.y -= 0; face.tongue.position.y = face.dark.position.y - 0.02 * open;
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    root.updateMatrixWorld(true);
    const t = inner.worldToLocal(root.localToWorld(new THREE.Vector3(...target)));
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.4, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
