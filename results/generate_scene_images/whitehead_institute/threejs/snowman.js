// The Whitehead anchor: a SNOWMAN with big anime eyes, reused (and re-posed) in every scene.
// Faces +z, base on y = 0, ~1 unit tall (+hat). createSnowman({ scale = 1, hat = 'top'|'crown'|'beanie'|'none', scarf = '#d8323a' }) -> Group.
// userData.parts = { head, mid, base, arms:{l,r}, hands:{l,r}, hat }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, headTilt })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK to a snowman-local point.
import * as THREE from 'three';

const ARM = 0.17, SH = [0.165, 0.6, 0], HEAD_Y = 0.82, HEAD_R = 0.155;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
const ball = (r, y, color) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat(color, { roughness: 0.85 })); m.position.y = y; return m; };
const disc = (rx, ry, color, z, parent, x = 0, y = 0, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function face(head) {
  const step = 0.0012;
  for (const s of [-1, 1]) {
    const eye = new THREE.Group(), n = new THREE.Vector3(s * 0.36, 0.1, 1).normalize();
    eye.position.copy(n).multiplyScalar(HEAD_R + 0.001); eye.lookAt(n.clone().multiplyScalar(2)); head.add(eye);
    disc(0.036, 0.046, '#ffffff', 0, eye);
    disc(0.029, 0.04, '#2d3f78', step, eye, 0, -0.002);
    disc(0.025, 0.02, '#4e8fd8', 2 * step, eye, 0, -0.017);
    disc(0.014, 0.022, '#0b1230', 3 * step, eye, 0, 0);
    disc(0.0095, 0.0095, '#ffffff', 4 * step, eye, -0.01, 0.015);
    disc(0.0045, 0.0045, '#ffffff', 4 * step, eye, 0.01, -0.017);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a1a2a'));
    lid.scale.set(0.039, 0.049, 1); lid.position.z = 5 * step; eye.add(lid);
    const bn = new THREE.Vector3(s * 0.62, -0.2, 1).normalize(), b = new THREE.Group();
    b.position.copy(bn).multiplyScalar(HEAD_R + 0.001); b.lookAt(bn.clone().multiplyScalar(2)); head.add(b);
    const bl = disc(0.022, 0.012, '#ff7f8f', 0, b); bl.material.transparent = true; bl.material.opacity = 0.6;
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.14, 20), mat('#ff7a1a', { roughness: 0.5 }));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.03, HEAD_R + 0.055); head.add(nose);
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45, c = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), mat('#222'));
    const v = new THREE.Vector3(Math.sin(a) * 0.45, -0.52 + 0.1 * Math.cos(a * 1.1) * 0.8 - 0.1 * (1 - Math.cos(a)) * 0, 1).normalize();
    v.y = -0.5 + 0.12 * (1 - Math.cos(a * 1.6)) * -1 + 0.1; v.normalize();
    c.position.copy(v).multiplyScalar(HEAD_R); head.add(c);
  }
}

const put = (g, o, x, y, z) => { o.position.set(x, y, z); g.add(o); return o; };
function hatMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'top') {
    const m = mat('#23232b', { roughness: 0.5 });
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 36), m), 0, 0, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.125, 0.19, 32), m), 0, 0.105, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.127, 0.127, 0.04, 32), mat('#c8323a')), 0, 0.04, 0);
  } else if (kind === 'crown') {
    const gold = mat('#f2c230', { metalness: 0.6, roughness: 0.3 });
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.105, 0.07, 32, 1, true), gold), 0, 0.035, 0);
    g.children[0].material.side = THREE.DoubleSide;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, p = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 12), gold);
      p.position.set(Math.cos(a) * 0.115, 0.1, Math.sin(a) * 0.115); g.add(p);
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(i % 2 ? '#d8323a' : '#3a7be0')); j.position.set(Math.cos(a) * 0.115, 0.15, Math.sin(a) * 0.115); g.add(j);
    }
  } else if (kind === 'beanie') {
    const m = mat('#3a7be0');
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), m); b.position.y = -0.01; g.add(b);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 32), mat('#ffffff')); r.rotation.x = Math.PI / 2; r.position.y = 0; g.add(r);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), mat('#ffffff')); p.position.y = 0.15; g.add(p);
  }
  return g;
}

export function createSnowman({ scale = 1, hat = 'top', scarf = '#d8323a' } = {}) {
  const root = new THREE.Group(), snow = '#fbfdff';
  const base = ball(0.25, 0.25, snow), mid = ball(0.19, 0.59 - 0.02, snow), head = new THREE.Group();
  head.position.y = HEAD_Y - 0.03; head.add(ball(HEAD_R, 0, snow));
  face(head); root.add(base, mid, head);
  const sc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 12, 36), mat(scarf, { roughness: 0.9 }));
  sc.rotation.x = Math.PI / 2; sc.position.y = 0.665; sc.scale.set(1.05, 1, 1.0); root.add(sc);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.025), mat(scarf, { roughness: 0.9 }));
  tail.position.set(0.08, 0.54, 0.17); tail.rotation.set(-0.12, 0, 0.1); root.add(tail);
  for (const y of [0.5, 0.58, 0.42]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 8), mat('#222')); b.position.set(0, y - 0.02, Math.sqrt(0.19 ** 2 - (y - 0.57) ** 2)); root.add(b); }
  let hatObj = null;
  if (hat !== 'none') { hatObj = hatMesh(hat); hatObj.position.y = HEAD_R - 0.045; head.add(hatObj); }

  const arms = {}, hands = {}, elbows = {}, twig = mat('#6b4423', { roughness: 0.9 });
  const limb = (len, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, len, 10), twig); m.geometry.translate(0, -len / 2, 0); return m; };
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0); sh.add(limb(ARM, 0.014));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.012), new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), twig));
    const hand = new THREE.Group(); hand.position.y = -ARM;
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat('#c8323a')); palm.scale.set(1, 1.1, 0.85);
    const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat('#c8323a')); th.position.set(0.03, 0.01, 0.012);
    hand.add(palm, th); el.add(hand); sh.add(el); root.add(sh); sh.rotation.z = s * 0.9; arms[k] = sh; elbows[k] = el; hands[k] = hand;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, mid, base, arms, hands, hat: hatObj };
  root.userData.pose = ({ arms: A = {}, headTilt = 0 } = {}) => {
    head.rotation.z = headTilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.4, -0.6); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM)), u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const ep = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(ep).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
