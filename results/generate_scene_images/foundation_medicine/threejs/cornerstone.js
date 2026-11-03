// The Foundation Medicine anchor: a living CORNERSTONE block, reused in every scene.
// createCornerstone({ scale = 1, color = '#eadfc2' }) -> Group, faces +z, feet on y = 0, ~1.05 units tall.
// userData.parts = { body, head: Group (unused), arms:{l,r}, elbows:{l,r}, legs:{l,r} }  (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, tilt })  radians.
//   arm x<0 swings forward; arm z>0 swings outward (l).  tilt = roll of body about z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture, noiseFill } from './kit.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function stoneMap(color) {
  const base = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return canvasTexture(256, (ctx, s) => {
    noiseFill(ctx, s, (u, v) => {
      const n = Math.sin(u * 40) * Math.cos(v * 33) * 7 + ((Math.floor(u * 256) * 7 + Math.floor(v * 256) * 13) % 11) - 5;
      return base.map((c) => Math.max(0, Math.min(255, c + n)));
    });
  });
}

function face(group, z) {
  const step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = sx * 0.15, y = 0.72;
    disc(0.082, 0.1, '#ffffff', z, group, x, y);
    disc(0.062, 0.088, '#2a4c8a', z + step, group, x, y - 0.004);
    disc(0.05, 0.04, '#5f9be0', z + 2 * step, group, x, y - 0.04);
    disc(0.03, 0.05, '#0b0f24', z + 3 * step, group, x, y - 0.004);
    disc(0.022, 0.022, '#ffffff', z + 4 * step, group, x - 0.025, y + 0.035);
    disc(0.01, 0.01, '#ffffff', z + 4 * step, group, x - 0.02, y - 0.04);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#2a1c14'));
    lid.scale.set(0.087, 0.108, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.05, 0.027, '#ff7f8f', z, group, sx * 0.25, 0.6); b.material.transparent = true; b.material.opacity = 0.55;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.585, z + step); group.add(mouth);
}

const limb = (len, r, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
};

export function createCornerstone({ scale = 1, color = '#eadfc2' } = {}) {
  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt);
  const skin = '#ffe0c0', ARM = 0.17;
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.78, 0.6, 5, 0.05), mat(color, { map: stoneMap(color), roughness: 0.9 }));
  body.position.y = 0.6; tilt.add(body);
  // chiselled corner edge lines
  const edge = mat('#a89a78');
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.74, 0.02), edge); e.position.set(sx * 0.345, 0.6, 0.296); tilt.add(e); }
  face(tilt, 0.302);
  const arms = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.4, 0.8, 0); sh.add(limb(ARM, 0.027, skin));
    const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.027, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), mat(skin)); hand.position.y = -ARM; el.add(hand);
    sh.add(el); tilt.add(sh); sh.rotation.z = s * 0.25; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.18, 0.22, 0); hip.add(limb(0.2, 0.04, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#8a4b2a')); shoe.scale.set(0.07, 0.05, 0.11);
    shoe.position.set(0, -0.2, 0.03); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, arms, elbows, legs };
  root.userData.pose = ({ tilt: t = 0, arms: A = {}, legs: L = {} } = {}) => {
    tilt.rotation.z = t;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  return root;
}
