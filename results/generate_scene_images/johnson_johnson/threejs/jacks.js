// The J&J anchor: ONE big JACK (six-pointed game piece) with a face and mitten hands; same character in every scene.
// Faces +z, rests on y = 0, ~1 unit tall. createJacks({ scale = 1, color = '#e8453c', tip = '#ffd23f', blush = true }) -> Group.
// userData.parts = { body, frame, hands:{l,r}, feet:{l,r}, arms:{l,r}, legs:{l,r} }  (l = +x side)
// userData.pose({ lean, tilt, arms:{l:[x,z], r:[..]}, legs:{l:[x,z], r:[..]} }) radians; arm z>0 swings l out/up.
// Six jack points = frame spikes (ball tips); plus small noodle arms/legs so it can act.
import * as THREE from 'three';

const BR = 0.34, CY = 0.0;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });

function spike(dir, color, tip, L = 0.5, r0 = 0.1) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, r0, L, 16), mat(color));
  cyl.position.y = L / 2 + 0.1;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 16), mat(tip, { roughness: 0.35 }));
  ball.position.y = L + 0.12;
  g.add(cyl, ball);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return g;
}

// ellipse lens hugging the body sphere at direction (lon, lat) from +z
function lens(parent, lon, lat, rx, ry, color, layer, extra = {}) {
  const n = new THREE.Vector3(Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat));
  const g = new THREE.Group(); g.position.copy(n).multiplyScalar(BR + 0.0015 * layer);
  g.lookAt(n.clone().multiplyScalar(2));
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 0.006); g.add(m); parent.add(g); return m;
}

function face(body, blush) {
  for (const s of [-1, 1]) {
    const lon = s * 0.36, lat = 0.12;
    lens(body, lon, lat, 0.07, 0.09, '#ffffff', 1);
    lens(body, lon, lat - 0.015, 0.057, 0.077, '#3a2416', 2);
    lens(body, lon, lat - 0.05, 0.048, 0.036, '#b4753a', 3);
    lens(body, lon, lat - 0.01, 0.029, 0.048, '#120a08', 4);
    lens(body, lon - s * 0.05, lat + 0.07, 0.016, 0.016, '#ffffff', 5);
    lens(body, lon + s * 0.03, lat - 0.09, 0.008, 0.008, '#ffffff', 5);
    lens(body, lon + s * 0.0, lat + 0.15, 0.065, 0.012, '#2a120c', 5);
    if (blush) lens(body, s * 0.62, -0.17, 0.045, 0.026, '#ff7f8f', 1, { transparent: true, opacity: 0.6 });
  }
  const m = lens(body, 0, -0.2, 0.05, 0.028, '#7a2a2a', 1);
  const t = lens(body, 0, -0.18, 0.04, 0.02, '#fff0e8', 2);
  m.scale.z = t.scale.z = 0.006;
  return { m, t };
}

function noodle(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

export function createJacks({ scale = 1, color = '#e8453c', tip = '#ffd23f', blush = true } = {}) {
  const root = new THREE.Group(), lean = new THREE.Group(), frame = new THREE.Group(), body = new THREE.Group();
  root.add(lean);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(BR, 40, 28), mat(color));
  body.add(sphere); const mouth = face(body, blush); lean.add(body);

  // six points in an asterisk: crown, short tail, two arms (up-out), two legs (down-out); balls = hands/feet
  const arms = {}, legs = {}, D = (deg) => new THREE.Vector3(Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180), 0);
  const top = spike(D(90), color, tip, 0.34); frame.add(top);
  frame.add(spike(D(-90), color, tip, 0.16));
  frame.add(spike(new THREE.Vector3(0, 0.25, -1), color, tip, 0.3));
  frame.add(spike(new THREE.Vector3(0, -0.75, 0.66), color, tip, 0.05));
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const pivot = (deg, L) => { const p = new THREE.Group(); p.add(spike(D(deg), color, tip, L)); frame.add(p); return p; };
    arms[k] = pivot(s > 0 ? 28 : 152, 0.55); legs[k] = pivot(s > 0 ? -50 : -130, 0.5);
  }
  lean.add(frame);
  const hands = { l: arms.l, r: arms.r }, feet = { l: legs.l, r: legs.r };
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  // rest on y = 0
  root.updateMatrixWorld(true);
  const minY = new THREE.Box3().setFromObject(root, true).min.y; root.position.y = -minY * scale;
  root.scale.setScalar(scale);
  const bases = { l: D(28), r: D(152) }, tmp = new THREE.Vector3();
  // aim arm k at a world point (call after positioning root); hand ball world position
  root.userData.aim = (k, p) => {
    root.updateMatrixWorld(true);
    const d = frame.worldToLocal(tmp.copy(p)).normalize();
    arms[k].quaternion.setFromUnitVectors(bases[k], d);
  };
  root.userData.handPos = (k) => { root.updateMatrixWorld(true); return arms[k].children[0].children[1].getWorldPosition(new THREE.Vector3()); };
  root.userData.mouth = (open = 0) => { mouth.m.scale.y = 0.028 + 0.05 * open; mouth.t.visible = open < 0.3; mouth.m.material.color.set(open ? '#6a1420' : '#7a2a2a'); };
  root.userData.parts = { body, frame, hands, feet, arms, legs };
  root.userData.pose = ({ lean: ln = 0, tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    lean.rotation.set(ln, 0, tilt);
    for (const [k, v] of Object.entries(A)) arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  return root;
}
