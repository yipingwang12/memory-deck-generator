// The Hemispheric anchor: half a GLOBE (map dome on a brass rim) with a face, mitten arms and shoe legs.
// Faces +z, feet on y = 0, ~0.62 tall (dome radius 0.4 sits on 0.2 legs). createGlobe({ scale = 1, blush = true }) -> Group.
// userData.parts = { dome, face, arms:{l,r}, legs:{l,r}, hands:{l,r} }   (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, tilt })  radians; arm z>0 swings l out; tilt = roll of dome (z).
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a globe-local point.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

const R = 0.4, LEG = 0.2, ARM = 0.15, SHOULDER = [R * 0.96, LEG + 0.15, 0];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

function mapTexture() {
  return canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#2f7fe0'; ctx.fillRect(0, 0, s, s);
    const r = rng(11);
    for (let k = 0; k < 9; k++) {
      const cx = r() * s, cy = s * (0.25 + r() * 0.5);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = i % 5 === 0 ? '#e8d9a0' : '#58b95a';
        ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * 150, cy + (r() - 0.5) * 90, 22 + r() * 40, 16 + r() * 26, r() * 3, 0, 7); ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, i * s / 8); ctx.lineTo(s, i * s / 8); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(i * s / 16, 0); ctx.lineTo(i * s / 16, s); ctx.stroke(); }
  });
}

function disc(parent, rx, ry, color, z, x = 0, y = 0, extra = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
}

/** Group sitting on the dome surface at (azimuth, elevation) degrees, local +z = outward normal. */
function surfacePatch(az, el, dome) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  const n = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  const g = new THREE.Group(); g.position.copy(n).multiplyScalar(R * 1.002); g.lookAt(g.position.clone().add(n));
  dome.add(g); return g;
}

function faceFeatures(dome, blush) {
  const step = 0.0018;
  for (const sx of [-1, 1]) {
    const p = surfacePatch(sx * 15, 30, dome);
    disc(p, 0.062, 0.078, '#ffffff', 0);
    disc(p, 0.048, 0.07, '#3a2416', step, 0, -0.004);
    disc(p, 0.042, 0.032, '#b4753a', 2 * step, 0, -0.03);
    disc(p, 0.024, 0.04, '#120a08', 3 * step, 0, -0.004);
    disc(p, 0.016, 0.016, '#ffffff', 4 * step, -0.017, 0.026);
    disc(p, 0.007, 0.007, '#ffffff', 4 * step, -0.017, -0.032);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.066, 0.083, 1); lid.position.z = 5 * step; p.add(lid);
    if (blush) disc(surfacePatch(sx * 27, 14, dome), 0.034, 0.02, '#ff6f85', 0, 0, 0, { transparent: true, opacity: 0.6 });
  }
  const m = surfacePatch(0, 12, dome);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.z = 0.002; m.add(mouth);
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), mat(color));
  th.position.set(0.032, 0.006, 0.012); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createGlobe({ scale = 1, blush = true } = {}) {
  const root = new THREE.Group(), dome = new THREE.Group();
  dome.position.y = LEG; root.add(dome);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: mapTexture(), roughness: 0.45 }));
  const brass = mat('#e2b13c', { metalness: 0.6, roughness: 0.3 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022, 12, 56), brass); rim.rotation.x = Math.PI / 2;
  const cut = new THREE.Mesh(new THREE.CircleGeometry(R, 56), mat('#f3ead6')); cut.rotation.x = Math.PI / 2; cut.position.y = -0.002;
  dome.add(shell, rim, cut); faceFeatures(dome, blush);
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.016, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.016, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); root.add(sh);
    sh.rotation.z = s * 0.5; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.14, LEG, 0); hip.add(limb(LEG - 0.03, 0.026, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.08);
    shoe.position.set(0, -LEG + 0.03, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { dome, arms, legs, hands };
  root.userData.pose = ({ tilt = 0, arms: A = {}, legs: L = {} } = {}) => {
    dome.rotation.z = tilt;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const d = new THREE.Vector3(...target).sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
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
