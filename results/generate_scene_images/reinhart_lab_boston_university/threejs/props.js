// Shared scene helpers for the Reinhart deck: stage, primitives, text planes, elders, scientist, brain, waves.
import * as THREE from 'three';
import { createAnimeStage } from './kit_anime.js';
import { createRaincoat } from './raincoat.js';

export { THREE, createRaincoat };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const glow = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);

export function textPlane(text, w, h, { bg = '#ffffff', fg = '#1b2a4a', font = 'bold', frame = null, px = 160 } = {}) {
  const c = document.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px);
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  if (frame) { x.strokeStyle = frame; x.lineWidth = c.height * 0.07; x.strokeRect(0, 0, c.width, c.height); }
  let size = c.height * 0.62; x.font = `${font} ${size}px "Helvetica Neue", Arial, sans-serif`;
  while (x.measureText(text).width > c.width * 0.9) { size *= 0.93; x.font = `${font} ${size}px "Helvetica Neue", Arial, sans-serif`; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg }));
}

export function makeStage(opts = {}) {
  const P = new URLSearchParams(location.search); const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: opts.el ?? 35, sunAzimuth: opts.az ?? 150, exposure: 1,
    sky: { cover: 2, seed: opts.seed ?? 5, towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const ground = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(opts.ground ?? '#6fae45'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  return { stage, scene: stage.scene, num, ground };
}

export function finishScene(stage, scene, chars, cam, look) {
  const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
  scene.traverse((o) => { if (o.isMesh && o.material.emissive && o.material.emissiveIntensity > 0 && o.material.emissive.getHex() > 0) pm.add(o); });
  stage.toonify(scene, (m) => pm.has(m));
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}

// Elderly person: grey hair, glasses, cardigan, optional cane. Faces +z, ~1.1 tall.
export function createElder({ cardigan = '#7a4b9e', hair = '#e8e8ee', cane = true, scale = 1 } = {}) {
  const g = new THREE.Group(), skin = '#f0c8a0';
  const body = add(g, new THREE.CylinderGeometry(0.15, 0.2, 0.5, 24), mat(cardigan), [0, 0.45, 0]);
  blob(g, mat(cardigan), [0, 0.7, 0], [0.17, 0.1, 0.13]);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 10), mat('#555a6a'), [s * 0.07, 0.11, 0]);
    blob(g, mat('#3a3a40'), [s * 0.07, 0.03, 0.03], [0.05, 0.035, 0.08]);
  }
  blob(g, mat(skin), [0, 0.88, 0], [0.15, 0.16, 0.15]);
  blob(g, mat(hair), [0, 0.95, -0.025], [0.16, 0.12, 0.15]);
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [s * 0.055, 0.89, 0.13], [0.03, 0.036, 0.01]);
    blob(g, mat('#2a2a2a'), [s * 0.055, 0.888, 0.14], [0.017, 0.022, 0.01]);
    const r = add(g, new THREE.TorusGeometry(0.045, 0.006, 8, 24), mat('#222'), [s * 0.055, 0.89, 0.14]); r.castShadow = false;
    blob(g, mat('#ff9aa0'), [s * 0.1, 0.85, 0.11], [0.03, 0.016, 0.01]);
    // arms
    add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), mat(cardigan), [s * 0.2, 0.55, 0.04], [0.25 * (s > 0 ? 1 : 0.4), 0, s * 0.15]);
    blob(g, mat(skin), [s * 0.22, 0.38, 0.1], [0.035, 0.035, 0.035]);
  }
  add(g, new THREE.TorusGeometry(0.02, 0.004, 8, 12, Math.PI), mat('#8a3a3a'), [0, 0.835, 0.145], [0, 0, Math.PI]);
  if (cane) {
    add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), mat('#8a5a2a'), [0.24, 0.31, 0.1]);
    add(g, new THREE.TorusGeometry(0.03, 0.012, 8, 14, Math.PI), mat('#8a5a2a'), [0.27, 0.62, 0.1]);
  }
  g.scale.setScalar(scale); return g;
}

// Scientist in a white lab coat + goggles. Faces +z, ~1.2 tall. Returns group with .rightHand (local pos).
export function createScientist({ scale = 1 } = {}) {
  const g = new THREE.Group(), skin = '#f2cba6', white = mat('#f6f8ff');
  add(g, new THREE.CylinderGeometry(0.16, 0.22, 0.6, 24), white, [0, 0.5, 0]);
  add(g, new THREE.BoxGeometry(0.07, 0.4, 0.02), mat('#4d86d6'), [0, 0.52, 0.2]);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.045, 0.045, 0.28, 10), mat('#3b4a6a'), [s * 0.08, 0.14, 0]);
    blob(g, mat('#2a2a30'), [s * 0.08, 0.03, 0.04], [0.06, 0.04, 0.09]);
  }
  blob(g, mat(skin), [0, 0.95, 0], [0.16, 0.17, 0.16]);
  blob(g, mat('#3a2a20'), [0, 1.03, -0.03], [0.17, 0.12, 0.16]);
  const gog = add(g, new THREE.TorusGeometry(0.05, 0.012, 8, 20), mat('#2a9d6a'), [0, 0.96, 0.15]);
  for (const s of [-1, 1]) {
    blob(g, mat('#9ee8ff', { transparent: true, opacity: 0.6, roughness: 0.1 }), [s * 0.058, 0.96, 0.155], [0.05, 0.05, 0.015]);
    blob(g, mat('#fff'), [s * 0.058, 0.96, 0.145], [0.03, 0.036, 0.01]);
    blob(g, mat('#1a1a2a'), [s * 0.058, 0.96, 0.152], [0.017, 0.022, 0.008]);
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.3, 10), white, [s * 0.22, 0.58, 0.02], [0, 0, s * 0.35]);
  }
  add(g, new THREE.TorusGeometry(0.02, 0.004, 8, 12, Math.PI), mat('#8a3a3a'), [0, 0.9, 0.155], [0, 0, Math.PI]);
  g.scale.setScalar(scale); return g;
}

// Brain in left profile (front = +x). Lobes coloured so frontal (blue) and temporal (orange) read clearly.
export function createBrain({ scale = 1, tint = true } = {}) {
  const g = new THREE.Group();
  const wr = (geo, amp) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + amp * Math.sin(x * 38) * Math.sin(y * 34 + 1) * Math.sin(z * 36 + 2);
    p.setXYZ(i, x * k, y * k, z * k); } geo.computeVertexNormals(); return geo; };
  const lobe = (c, pos, scl, amp = 0.05) => { const m = add(g, wr(new THREE.IcosahedronGeometry(1, 5), amp), mat(c, { roughness: 0.55 }), pos, [0, 0, 0], scl); return m; };
  lobe('#f2a0b0', [0, 0.02, 0], [0.55, 0.4, 0.4]);
  lobe(tint ? '#4f8fe8' : '#f2a0b0', [0.32, 0.08, 0], [0.3, 0.3, 0.37]);        // frontal
  lobe(tint ? '#f08a3c' : '#f2a0b0', [0.02, -0.22, 0], [0.38, 0.14, 0.34]);     // temporal
  lobe('#b58ad6', [-0.38, -0.27, 0], [0.18, 0.12, 0.22], 0.03);                  // cerebellum
  add(g, new THREE.CylinderGeometry(0.06, 0.05, 0.2, 14), mat('#e0a0a8'), [-0.12, -0.38, 0], [0, 0, 0.3]);
  g.scale.setScalar(scale); return g;
}

// Glowing tube along a function y=f(x) from x0..x1 at plane z.
export function waveTube(fn, x0, x1, { z = 0, r = 0.018, color = '#ffa03a', n = 400, y0 = 0 } = {}) {
  const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push(new THREE.Vector3(x, y0 + fn(x), z)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 8), glow(color, 1.4));
}

// Cable between two points, sagging.
export function cable(a, b, { color = '#2b2f3a', r = 0.012, sag = 0.12 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), M = A.clone().lerp(B, 0.5); M.y -= sag;
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 24, r, 6), mat(color));
}

// Electrode discs on the hood (hood-local = raincoat-local, head centre y=0.86). Returns world-space-free local positions.
export function hoodElectrodes(rc, color = '#2fd0ff') {
  const head = rc.userData.parts.head, out = [];
  [[0, 0.2, -0.02], [-0.14, 0.14, 0.0], [0.14, 0.14, 0.0], [-0.17, 0.02, -0.05], [0.17, 0.02, -0.05]].forEach(([x, y, z]) => {
    const n = new THREE.Vector3(x, y, z - 0.02).normalize(), e = add(head, new THREE.CylinderGeometry(0.03, 0.03, 0.014, 18), glow(color, 1.0), [x * 1.03, y * 1.03 + 0, z * 1.03]);
    e.position.copy(new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.207)); e.position.z -= 0.02;
    e.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); out.push(e);
  });
  return out;
}

// Concentric current rings around a point.
export function rings(parent, pos, { n = 4, r0 = 0.3, dr = 0.12, color = '#46e0ff', rot = [Math.PI / 2, 0, 0] } = {}) {
  for (let i = 0; i < n; i++) { const m = add(parent, new THREE.TorusGeometry(r0 + dr * i, 0.008, 8, 64), glow(color, 1.6 - i * 0.25), pos, rot); m.castShadow = false; }
}
