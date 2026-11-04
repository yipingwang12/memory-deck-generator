// The BMS anchor: one procedural SQUID, reused (and re-posed) in every scene.
// Faces +z, stands on its 8 short arms (y = 0), ~1.1 units tall. createSquid({ scale = 1, body = '#ee5a4c', blush = true }) -> Group.
// userData.parts = { mantle, head, hands:{l,r} (club tips; l = +x side) }
// userData.reach('l'|'r', [x,y,z]) stretches that long tentacle so its club tip reaches a squid-local point; returns the tip Vector3.
// userData.rest('l'|'r') returns the tentacle to its hanging pose.  userData.pose({ lean, tilt }) leans the mantle/head.
import * as THREE from 'three';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const ell = (sx, sy, sz, color, pos, parent, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(color, { roughness: 0.35, ...extra }));
  m.scale.set(sx, sy, sz); m.position.set(...pos); parent.add(m); return m;
};

/** Tapered tube along a Catmull-Rom path: radius r0 at the start to r1 at the end. */
function taperGeometry(points, r0, r1, seg = 30, rad = 12) {
  const curve = new THREE.CatmullRomCurve3(points), fr = curve.computeFrenetFrames(seg, false);
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, p = curve.getPoint(t), r = r0 + (r1 - r0) * Math.pow(t, 0.8);
    for (let j = 0; j < rad; j++) {
      const a = (j / rad) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
      pos.push(p.x + c * fr.normals[i].x + s * fr.binormals[i].x, p.y + c * fr.normals[i].y + s * fr.binormals[i].y, p.z + c * fr.normals[i].z + s * fr.binormals[i].z);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) {
    const a = i * rad + j, b = i * rad + (j + 1) % rad, c = a + rad, d = b + rad;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, end: curve.getPoint(1) };
}

function eye(head, sx) {
  const x = sx * 0.105, y = 0.535, z = 0.19;
  ell(0.082, 0.105, 0.05, '#ffffff', [x, y, z], head);
  ell(0.058, 0.077, 0.05, '#3a2314', [x, y - 0.004, z + 0.012], head);
  ell(0.056, 0.036, 0.05, '#c98a3e', [x, y - 0.03, z + 0.014], head);
  ell(0.034, 0.055, 0.055, '#0e0706', [x, y - 0.004, z + 0.016], head);
  ell(0.015, 0.016, 0.012, '#ffffff', [x - 0.02, y + 0.03, z + 0.074], head);
  ell(0.007, 0.007, 0.006, '#ffffff', [x + 0.017, y - 0.032, z + 0.074], head);
  const lid = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.007, 8, 24, Math.PI * 0.85), mat('#5a1a14'));
  lid.scale.y = 1.2; lid.position.set(x, y + 0.012, z + 0.03); lid.rotation.z = Math.PI * 0.075; head.add(lid);
}

function mantleGeo() {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const t = i / 28; pts.push(new THREE.Vector2(i === 28 ? 0 : 0.215 * Math.pow(1 - t, 0.55) * (1 + 0.5 * t), t * 0.56)); }
  return new THREE.LatheGeometry(pts, 36);
}

export function createSquid({ scale = 1, body = '#ee5a4c', blush = true } = {}) {
  const root = new THREE.Group(), skin = mat(body), dark = '#c93d33', pale = '#ffb09a';
  const head = new THREE.Group(); root.add(head);
  const hs = ell(0.235, 0.225, 0.235, body, [0, 0.5, 0], head, { roughness: 0.5 });
  ell(0.2, 0.12, 0.2, pale, [0, 0.4, 0.04], head, { roughness: 0.6 });
  eye(head, -1); eye(head, 1);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20, Math.PI), mat('#5a1a14'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.425, 0.228); head.add(mouth);
  if (blush) for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), mat('#ff6f86', { transparent: true, opacity: 0.6 }));
    const p = new THREE.Vector3(s * 0.62, -0.18, 0.76).normalize().multiplyScalar(0.236); b.position.set(p.x, 0.5 + p.y, p.z + 0.003);
    b.lookAt(p.x * 3, 0.5 + p.y * 3, p.z * 3); head.add(b);
  }

  const mantle = new THREE.Group(); mantle.position.set(0, 0.62, -0.02); mantle.rotation.x = -0.16; root.add(mantle);
  const mm = new THREE.Mesh(mantleGeo(), skin); mantle.add(mm);
  for (const s of [-1, 1]) {
    const fin = ell(0.15, 0.11, 0.014, dark, [s * 0.12, 0.45, 0], mantle); fin.rotation.z = -s * 0.7;
  }
  [[0.1, 0.18, 0.15], [-0.11, 0.3, 0.1], [0.06, 0.38, 0.1], [-0.05, 0.12, 0.2], [0.13, 0.28, 0.07]].forEach(([x, y, z]) => {
    const p = new THREE.Vector3(x, 0, z).normalize().multiplyScalar(0.19 * (1 - y) ); ell(0.022, 0.022, 0.008, dark, [p.x, y, p.z], mantle).lookAt(p.x * 3, y, p.z * 3);
  });

  const arms = new THREE.Group(); root.add(arms);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2, c = Math.cos(a), s = Math.sin(a), R = 0.38 + (k % 2) * 0.08;
    const pts = [[0.1, 0.36], [0.2, 0.2], [R * 0.85, 0.045], [R, 0.05], [R + 0.07, 0.14]].map(([r, y]) => new THREE.Vector3(s * r, y, c * r));
    arms.add(new THREE.Mesh(taperGeometry(pts, 0.052, 0.012, 24, 10).geo, skin));
  }

  const hands = {}, tent = {};
  const club = (k) => { const m = ell(0.05, 0.075, 0.025, pale, [0, 0, 0], root); hands[k] = m; return m; };
  const build = (k, target) => {
    const sx = k === 'l' ? 1 : -1, S = new THREE.Vector3(sx * 0.17, 0.4, 0.1), T = new THREE.Vector3(...target);
    const m1 = S.clone().lerp(T, 0.35).add(new THREE.Vector3(sx * 0.1, -0.05, 0.05)), m2 = S.clone().lerp(T, 0.7).add(new THREE.Vector3(sx * 0.04, 0.0, 0.05));
    const { geo, end } = taperGeometry([S, m1, m2, T], 0.038, 0.022, 30, 12);
    tent[k].geometry.dispose(); tent[k].geometry = geo;
    const dir = T.clone().sub(m2).normalize(); hands[k].position.copy(T); hands[k].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return end;
  };
  for (const k of ['l', 'r']) { tent[k] = new THREE.Mesh(new THREE.BufferGeometry(), skin); root.add(tent[k]); club(k); build(k, [(k === 'l' ? 1 : -1) * 0.33, 0.1, 0.33]); }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { mantle, head, hands };
  root.userData.reach = (k, t) => build(k, t);
  root.userData.rest = (k) => build(k, [(k === 'l' ? 1 : -1) * 0.33, 0.1, 0.33]);
  root.userData.pose = ({ lean = 0, tilt = 0 } = {}) => { head.rotation.set(lean, 0, tilt); mantle.rotation.x = -0.16 + lean; };
  return root;
}
