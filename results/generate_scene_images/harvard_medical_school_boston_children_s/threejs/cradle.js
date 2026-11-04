// The Boston Children's anchor: a baby CRADLE character, reused in every scene.
// Head end (arched headboard + face) faces +z, rockers touch y = 0, ~1 unit tall, ~1.1 long.
// createCradle({ scale = 1, blush = true }) -> Group.
// userData.parts = { rig, headboard, bowl, rockers, arms:{l,r}, hands:{l,r} }   (l = +x side)
// userData.rock(angle)  rolls on the rockers (radians, + = head end down); contact point stays fixed.
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]} })  radians; arm z>0 swings l out.
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a cradle-local point.
import * as THREE from 'three';

const RR = 1.0, ARC = 1.55, ARM = 0.2, SHOULDER = [0.36, 0.5, 0.45];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.userData.flat = true; m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl); parent.add(o); return o;
};

function archPlate(w, h, depth, color) {
  const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(w, 0); s.lineTo(w, h); s.absarc(0, h, w, 0, Math.PI, false); s.lineTo(-w, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3, curveSegments: 32 });
  return new THREE.Mesh(g, mat(color, { roughness: 0.55 }));
}

function face(parent, z, blush) {
  const step = 0.0015, ey = 0.58;
  for (const sx of [-1, 1]) {
    const x = sx * 0.125;
    disc(0.075, 0.095, '#ffffff', z, parent, x, ey);
    disc(0.06, 0.085, '#2a5fae', z + step, parent, x, ey - 0.004);
    disc(0.05, 0.03, '#6fc3e8', z + 2 * step, parent, x, ey - 0.04);
    disc(0.03, 0.05, '#101428', z + 3 * step, parent, x, ey - 0.004);
    disc(0.024, 0.024, '#ffffff', z + 4 * step, parent, x - 0.022, ey + 0.032);
    disc(0.011, 0.011, '#ffffff', z + 4 * step, parent, x + 0.02, ey - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.15, Math.PI - 0.3), mat('#2a1810'));
    lid.scale.set(0.08, 0.1, 1); lid.position.set(x, ey, z + 5 * step); parent.add(lid);
    if (blush) { const b = disc(0.04, 0.022, '#ff8a9a', z, parent, sx * 0.215, ey - 0.1); b.material.transparent = true; b.material.opacity = 0.6; }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#8a2f35'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, ey - 0.12, z + step); parent.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

export function createCradle({ scale = 1, blush = true } = {}) {
  const root = new THREE.Group(), rig = new THREE.Group(), body = new THREE.Group();
  rig.position.y = RR; body.position.y = -RR; rig.add(body); root.add(rig);
  const wood = '#a2653a', cream = '#f8e6c4';

  // rockers + posts
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.rotation.y = Math.PI / 2; pivot.position.set(sx * 0.3, RR, 0); body.add(pivot);
    add(pivot, new THREE.TorusGeometry(RR, 0.035, 10, 60, ARC), mat(wood), [0, 0, 0], [0, 0, -Math.PI / 2 - ARC / 2], [1, 1, 1.7]);
    for (const z of [-0.5, 0.5]) add(body, new THREE.CylinderGeometry(0.028, 0.028, 0.34, 12), mat(wood), [sx * 0.3, 0.2, z]);
  }
  add(body, new THREE.BoxGeometry(0.62, 0.04, 0.05), mat(wood), [0, 0.12, 0.02]);

  // bowl, rim, blanket
  const bowl = add(body, new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#d9a066', { side: THREE.DoubleSide }), [0, 0.5, 0], [0, 0, 0], [0.32, 0.3, 0.62]);
  add(body, new THREE.TorusGeometry(1, 0.1, 10, 64), mat('#b9783f'), [0, 0.5, 0], [Math.PI / 2, 0, 0], [0.32, 0.62, 0.3]);
  add(body, new THREE.SphereGeometry(1, 40, 20), mat('#ff9fb3'), [0, 0.5, -0.05], [0, 0, 0], [0.28, 0.14, 0.52]);
  add(body, new THREE.TorusGeometry(0.2, 0.03, 8, 30), mat('#fff0f4'), [0, 0.6, 0.12], [Math.PI / 2, 0, 0], [1.2, 1, 1]);

  // headboard with face, footboard
  const head = archPlate(0.34, 0.34, 0.05, cream); head.position.set(0, 0.2, 0.62); body.add(head);
  const foot = archPlate(0.34, 0.08, 0.05, cream); foot.position.set(0, 0.2, -0.67); body.add(foot);
  const trim = add(body, new THREE.TorusGeometry(0.32, 0.018, 8, 40, Math.PI), mat('#e58a8a'), [0, 0.54, 0.685]);
  face(body, 0.682, blush);
  for (const sx of [-1, 1]) add(body, new THREE.SphereGeometry(0.035, 12, 10), mat('#e8b04a', { metalness: 0.5 }), [sx * 0.34, 0.2 + 0.34, 0.645]);

  // arms
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    sh.add(limb(ARM, 0.017, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, skin));
    el.add(add(new THREE.Group(), new THREE.SphereGeometry(0.019, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand);
    sh.add(el); body.add(sh); sh.rotation.z = s * 1.25; arms[k] = sh; elbows[k] = el; hands[k] = hand;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  head.receiveShadow = false;
  root.traverse((o) => { if (o.userData.flat) o.castShadow = o.receiveShadow = false; });
  root.scale.setScalar(scale);
  root.userData.parts = { rig, headboard: head, bowl, arms, hands };

  root.userData.rock = (a) => { rig.rotation.x = a; rig.position.z = RR * a; };
  root.userData.pose = ({ arms: A = {} } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target).add(new THREE.Vector3(0, RR, 0));
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.6, -0.5, -0.3); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
