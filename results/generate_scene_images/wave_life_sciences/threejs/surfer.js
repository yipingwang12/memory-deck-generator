// The Wave anchor: a chibi SURFER with a surfboard. Faces +z, feet on y = 0, ~1.05 units tall.
// createSurfer({ scale=1, suit, trim, hair, boardColor, board=true, boardX=0.5 }) -> Group
// createBoard({ color, trim, len=1.3, wid=0.34 }) -> Group  (length along y, top face +z, centred on origin)
// userData.parts = { torso, head, arms:{l,r}, legs:{l,r}, hands:{l,r}, board }   (l = +x side)
// userData.pose({ lean, headTilt, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })
// userData.reach('l'|'r', [x,y,z])  two-bone IK in surfer-local coords
// userData.holdBoard()  board standing beside the surfer, left hand on its rail (default)
import * as THREE from 'three';

const HIP_Y = 0.36, SHOULDER = [0.155, 0.64, 0], ARM = 0.14, R = 0.19;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const ball = (r, color, pos, scl = [1, 1, 1], parent) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(color)); m.position.set(...pos); m.scale.set(...scl); parent?.add(m); return m;
};

export function createBoard({ color = '#ff5a3c', trim = '#ffe14a', len = 1.3, wid = 0.34 } = {}) {
  const g = new THREE.Group(), s = new THREE.Shape();
  s.moveTo(0, -len / 2); s.bezierCurveTo(wid * 0.75, -len / 2, wid * 0.7, len * 0.12, 0, len / 2);
  s.bezierCurveTo(-wid * 0.7, len * 0.12, -wid * 0.75, -len / 2, 0, -len / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 });
  geo.translate(0, 0, -0.02);
  const body = new THREE.Mesh(geo, mat(color, { roughness: 0.35 }));
  const stripe = new THREE.Mesh(geo, mat(trim, { roughness: 0.35 })); stripe.scale.set(0.2, 0.97, 1.08);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 3), mat('#22303f')); fin.scale.set(0.35, 1, 1);
  fin.position.set(0, -len / 2 + 0.2, -0.07);
  g.add(body, stripe, fin);
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return g;
}

function face(head) {
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, y = -0.012, z = 0.95 * Math.sqrt(R * R - x * x - y * y) + 0.002;
    const e = new THREE.Group(); e.position.set(x, y, z); e.rotation.y = sx * 0.38; head.add(e);
    const st = 0.0015;
    disc(0.05, 0.062, '#ffffff', 0, e);
    disc(0.04, 0.056, '#14506b', st, e, 0, -0.002);
    disc(0.034, 0.03, '#3cc2c4', 2 * st, e, 0, -0.022);
    disc(0.022, 0.034, '#07131a', 3 * st, e, 0, 0);
    disc(0.014, 0.014, '#ffffff', 4 * st, e, -0.014, 0.022);
    disc(0.006, 0.006, '#ffffff', 4 * st, e, 0.015, -0.025);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.04, 32, 1, 0.15, Math.PI - 0.3), mat('#2a1a10'));
    lid.scale.set(0.052, 0.066, 1); lid.position.z = 5 * st; e.add(lid);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.011, 0.01), mat('#a8741e'));
    brow.position.set(0, 0.085, 0.002); brow.rotation.z = -sx * 0.18; e.add(brow);
    const b = disc(0.026, 0.014, '#ff7f8f', 0, e, sx * 0.012, -0.075); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mz = 0.95 * Math.sqrt(R * R - 0.0064 - 0.0121) + 0.002;
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20, Math.PI), mat('#8a2f2f'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.11 + 0.01, mz); head.add(mouth);
}

function hairDo(head, color) {
  const h = mat(color, { roughness: 0.5 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), h);
  cap.position.set(0, 0.012, -0.02); cap.rotation.x = -0.35; head.add(cap);
  const spike = (x, y, z, rx, rz, len, w) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(w, len, 6), h); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); head.add(c);
  };
  [-0.12, -0.06, 0, 0.06, 0.12].forEach((x, i) => spike(x, 0.135 - Math.abs(x) * 0.25, 0.135 - Math.abs(x) * 0.4, 2.45, -x * 3, 0.11, 0.04));
  [[-0.1, 0.19, -0.04, 0.4, 0.7], [0.1, 0.19, -0.04, 0.4, -0.7], [0, 0.22, -0.05, 0.25, 0], [-0.04, 0.2, -0.1, -0.5, 0.3], [0.05, 0.2, -0.1, -0.5, -0.3]]
    .forEach(([x, y, z, rx, rz]) => spike(x, y, z, rx, rz, 0.15, 0.045));
  [-1, 1].forEach((s) => { const side = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), h); side.position.set(s * R * 0.95, 0.04, -0.03); side.scale.set(0.6, 1.2, 1); head.add(side); });
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

export function createSurfer({ scale = 1, suit = '#1f6fd6', trim = '#ff8a2a', hair = '#f4c542', boardColor = '#ff5a3c', board = true, boardX = 0.52 } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffd6b0';

  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.2, 8, 20), mat(suit)); chest.position.y = 0.52; chest.scale.set(1.05, 1, 0.8);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.04, 24), mat(trim)); band.position.y = 0.56; band.scale.set(1.05, 1, 0.8);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.14, 0.17, 24), mat(trim)); shorts.position.y = 0.39; shorts.scale.set(1.05, 1, 0.82);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 12), mat(skin)); neck.position.y = 0.71;
  upper.add(chest, band, shorts, neck);

  const head = new THREE.Group(); head.position.y = 0.86; upper.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mat(skin, { roughness: 0.5 })); skull.scale.set(1, 0.97, 0.95); head.add(skull);
  face(head); hairDo(head, hair);

  const arms = {}, elbows = {}, hands = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.034, suit), ball(0.036, suit, [0, 0, 0], [1, 1, 1], sh));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, skin), ball(0.028, skin, [0, 0, 0], [1, 1, 1], el));
    const hand = new THREE.Group(); hand.position.y = -ARM; ball(0.036, skin, [0, -0.01, 0], [1, 1.1, 0.85], hand); ball(0.016, skin, [s * 0.03, 0.005, 0.015], [1, 1, 1], hand);
    el.add(hand); sh.add(el); upper.add(sh); sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el; hands[k] = hand;

    const hip = new THREE.Group(); hip.position.set(s * 0.07, HIP_Y, 0); hip.add(limb(0.33, 0.04, skin));
    const foot = ball(1, skin, [0, -0.345, 0.03], [0.045, 0.028, 0.075]); hip.add(foot); root.add(hip); legs[k] = hip;
  }

  const brd = createBoard({ color: boardColor, trim });
  root.add(brd);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);

  root.userData.parts = { torso, head, arms, legs, hands, board: brd };
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
  root.userData.holdBoard = () => {
    brd.visible = true; brd.rotation.set(0, 0, -0.06); brd.position.set(boardX, 0.65, -0.04);
    root.userData.reach('l', [boardX - 0.15, 0.5, 0.0]);
  };
  if (board) root.userData.holdBoard(); else brd.visible = false;
  return root;
}
