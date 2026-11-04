// Shared scene helpers + props for Dana-Farber scenes (farmer anchor, farm theme).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createFarmer } from './farmer.js';
export { THREE, rng, canvasTexture, guard };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Canvas text sprite-plane. */
export function textPlane(text, w, h, { bg = '#ffffff', fg = '#222', font = 'bold 110px sans-serif' } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}

/** Boot an anime stage with meadow ground. o: {ground, horizon, sky}. */
export function boot(o = {}) {
  const P = new URLSearchParams(location.search); const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: o.el ?? 35, sunAzimuth: o.az ?? 150, exposure: 1,
    sky: { cover: o.cover ?? 1.5, seed: o.seed ?? 5, towerTop: 0.5, puffCover: 1.5, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 }, shadowSize: o.shadow ?? 4,
  });
  if (o.ground !== null) add(stage.scene, new THREE.PlaneGeometry(400, 400), o.ground ?? '#6fae45', [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num };
}

/** Place a farmer, run pose, return it. */
export function farmerAt(scene, { x = 0, z = 0, ry = 0, s = 1.6, pose = {} } = {}) {
  const f = createFarmer({ scale: s }); f.position.set(x, 0, z); f.rotation.y = ry; scene.add(f); f.userData.pose(pose); f.updateMatrixWorld(true); return f;
}
/** Reach a hand to a WORLD point. */
export function reachTo(f, key, p) { f.updateMatrixWorld(true); const t = f.worldToLocal(new THREE.Vector3(...p)); f.userData.reach(key, [t.x, t.y, t.z]); }

/** Finish: toonify farmer(s), clouds, camera, render. cam: {pos, look}. */
export function done(S, farmers, cam, clouds = true) {
  const set = new Set(); for (const f of [].concat(farmers)) f.traverse((o) => set.add(o));
  S.stage.toonify(S.scene, (m) => set.has(m));
  if (clouds) S.stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  const n = S.num; S.stage.camera.position.set(n('cx', cam.pos[0]), n('cy', cam.pos[1]), n('cz', cam.pos[2]));
  S.stage.camera.lookAt(n('tx', cam.look[0]), n('ty', cam.look[1]), n('tz', cam.look[2]));
  S.stage.finish();
}

// ---- props ----
export function barn(w = 2, h = 1.4, d = 1.6, red = '#b8382e') {
  const g = new THREE.Group();
  box(g, red, [0, h / 2, 0], [w, h, d]);
  const roof = new THREE.Shape(); roof.moveTo(-w / 2 - 0.08, 0); roof.lineTo(w / 2 + 0.08, 0); roof.lineTo(w / 2 + 0.08, 0.1); roof.lineTo(0, 0.1 + w * 0.3); roof.lineTo(-w / 2 - 0.08, 0.1);
  // gable roof as prism along z
  const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.1, 0); sh.lineTo(d / 2 + 0.1, 0); sh.lineTo(0, 0.55 * d); 
  const prism = new THREE.ExtrudeGeometry(sh, { depth: w + 0.16, bevelEnabled: false });
  const pr = add(g, prism, '#5a3a2a', [-w / 2 - 0.08, h, 0], [0, Math.PI / 2, 0]);
  pr.position.set(-w / 2 - 0.08, h, 0);
  box(g, '#f4ead8', [0, 0.45, d / 2 + 0.01], [0.7, 0.9, 0.04]);
  box(g, '#b8382e', [-0.17, 0.45, d / 2 + 0.03], [0.32, 0.86, 0.03]); box(g, '#b8382e', [0.17, 0.45, d / 2 + 0.03], [0.32, 0.86, 0.03]);
  const x1 = box(g, '#f4ead8', [-0.17, 0.45, d / 2 + 0.05], [0.04, 0.9, 0.02], [0, 0, 0.6]); box(g, '#f4ead8', [0.17, 0.45, d / 2 + 0.05], [0.04, 0.9, 0.02], [0, 0, -0.6]);
  return g;
}
export function fence(n = 6, gap = 0.5, h = 0.5) {
  const g = new THREE.Group(), wood = '#d9b98a';
  for (let i = 0; i < n; i++) cyl(g, wood, [i * gap, h / 2, 0], 0.04, h);
  for (const y of [h * 0.35, h * 0.75]) box(g, wood, [(n - 1) * gap / 2, y, 0.04], [(n - 1) * gap + 0.1, 0.06, 0.03]);
  return g;
}
export function flower(color = '#7a4fd0', h = 1, s = 1) { // IRIS
  const g = new THREE.Group();
  cyl(g, '#3f9a3a', [0, h / 2, 0], 0.03 * s, h);
  for (const [x, r] of [[0.14, 0.5], [-0.14, -0.5]]) { add(g, new THREE.ConeGeometry(0.06, 0.55, 12), '#3f9a3a', [x, 0.28, 0], [0, 0, -r * 0.4], [1, 1, 0.3]); }
  const head = new THREE.Group(); head.position.y = h; g.add(head);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const p = new THREE.Group(); p.rotation.y = a; head.add(p);
    blob(p, color, [0, 0.0, 0.22 * s], [0.14 * s, 0.1 * s, 0.26 * s], [0.6, 0, 0]); blob(p, '#f6d24a', [0, -0.03, 0.2 * s], [0.04 * s, 0.03 * s, 0.14 * s], [0.6, 0, 0]); }
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + Math.PI / 3; const p = new THREE.Group(); p.rotation.y = a; head.add(p);
    blob(p, '#9b78e8', [0, 0.14 * s, 0.07 * s], [0.1 * s, 0.2 * s, 0.05 * s], [-0.15, 0, 0]); }
  blob(head, '#f6d24a', [0, 0.05, 0], [0.05 * s, 0.05 * s, 0.05 * s]);
  return g;
}
export function flag(color = '#e63a3a', h = 1.2) {
  const g = new THREE.Group();
  cyl(g, '#e8dcc0', [0, h / 2, 0], 0.025, h);
  box(g, color, [0.28, h - 0.18, 0], [0.55, 0.36, 0.02]);
  blob(g, '#f2c230', [0, h + 0.02, 0], [0.04, 0.04, 0.04]);
  return g;
}
export function rock(r = 0.5, color = '#8b8b92', seed = 3) {
  const g = new THREE.Group(), R = rng(seed);
  blob(g, color, [0, r * 0.55, 0], [r, r * 0.65, r * 0.85], [0, 0.4, 0.05]);
  blob(g, '#9a9aa2', [r * 0.45, r * 0.3, r * 0.3], [r * 0.5, r * 0.4, r * 0.45]);
  blob(g, '#7a7a82', [-r * 0.5, r * 0.25, -r * 0.2], [r * 0.45, r * 0.35, r * 0.4]);
  return g;
}
export function crown(s = 1) {
  const g = new THREE.Group(); const gold = mat('#f2c230', { metalness: 0.6, roughness: 0.3 });
  cyl(g, gold, [0, 0.07 * s, 0], 0.17 * s, 0.14 * s);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; add(g, new THREE.ConeGeometry(0.05 * s, 0.14 * s, 4), gold, [Math.cos(a) * 0.15 * s, 0.2 * s, Math.sin(a) * 0.15 * s]); blob(g, '#e63a3a', [Math.cos(a) * 0.15 * s, 0.29 * s, Math.sin(a) * 0.15 * s], [0.03 * s, 0.03 * s, 0.03 * s]); }
  return g;
}
export function bean(color = '#a8323a', s = 1) { // kidney bean
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 24; i++) { const t = -0.9 + i * 1.8 / 24 * Math.PI / 1.0; }
  blob(g, color, [0, 0, 0], [0.5 * s, 0.32 * s, 0.3 * s]);
  blob(g, color, [-0.3 * s, -0.08 * s, 0], [0.28 * s, 0.26 * s, 0.28 * s]); blob(g, color, [0.3 * s, -0.08 * s, 0], [0.28 * s, 0.26 * s, 0.28 * s]);
  blob(g, '#6a1a1f', [0, 0.2 * s, 0.12 * s], [0.12 * s, 0.05 * s, 0.1 * s]);
  return g;
}
export function eyes(parent, x, y, z, s = 1) { // anime eyes on a flat-ish face
  for (const sx of [-1, 1]) { blob(parent, '#fff', [x * sx, y, z], [0.07 * s, 0.09 * s, 0.02 * s]); blob(parent, '#241410', [x * sx, y - 0.005 * s, z + 0.012 * s], [0.045 * s, 0.065 * s, 0.015 * s]); blob(parent, '#fff', [x * sx - 0.015 * s, y + 0.02 * s, z + 0.025 * s], [0.015 * s, 0.015 * s, 0.01 * s]); }
}

/** Simple figure (kid/dancer/deacon): ~1 tall. opts {body, legs, hair, skin, skirt, robe}. */
export function person({ body = '#4aa0e0', legs = '#334', hair = '#3a2414', skin = '#ffe0c0', skirt = null, robe = null, s = 1 } = {}) {
  const g = new THREE.Group(), face = new THREE.Group(); face.position.set(0, 0.78, 0); g.add(face);
  blob(face, skin, [0, 0, 0], [0.14, 0.14, 0.13]); blob(face, hair, [0, 0.03, -0.03], [0.15, 0.14, 0.125]);
  eyes(face, 0.05, 0, 0.115, 0.7); const m = add(face, new THREE.TorusGeometry(0.02, 0.004, 8, 16, Math.PI), '#7a2a2a', [0, -0.06, 0.12], [0, 0, Math.PI]);
  if (robe) { add(g, new THREE.CylinderGeometry(0.14, 0.26, 0.7, 28), robe, [0, 0.36, 0]); box(g, '#fff', [0, 0.66, 0.11], [0.06, 0.1, 0.03]); }
  else { blob(g, body, [0, 0.52, 0], [0.13, 0.2, 0.1]); if (skirt) add(g, new THREE.ConeGeometry(0.3, 0.2, 28, 1, true), skirt, [0, 0.4, 0], [Math.PI, 0, 0]);
    for (const x of [-0.05, 0.05]) { cyl(g, legs, [x, 0.17, 0], 0.035, 0.34); blob(g, '#5a3418', [x, 0.02, 0.03], [0.045, 0.03, 0.07]); } }
  for (const sx of [-1, 1]) { const a = cyl(g, robe ?? body, [sx * 0.19, 0.52, 0], 0.03, 0.3, [0, 0, sx * 0.3]); blob(g, skin, [sx * 0.23, 0.36, 0], [0.04, 0.04, 0.04]); a.name = 'arm' + sx; }
  g.scale.setScalar(s); return g;
}
export function gorilla(s = 1) {
  const g = new THREE.Group(), fur = '#7a7a88', face = '#6a5a52';
  blob(g, fur, [0, 0.75, 0], [0.42, 0.5, 0.34]); blob(g, '#9a9aa6', [0, 0.7, 0.2], [0.3, 0.35, 0.18]);
  const hd = new THREE.Group(); hd.position.set(0, 1.35, 0.06); g.add(hd);
  blob(hd, fur, [0, 0, 0], [0.26, 0.24, 0.24]); blob(hd, fur, [0, 0.2, -0.02], [0.14, 0.12, 0.16]); blob(hd, face, [0, -0.04, 0.17], [0.19, 0.15, 0.1]);
  for (const sx of [-1, 1]) { blob(hd, '#fff', [sx * 0.08, 0.04, 0.24], [0.045, 0.055, 0.02]); blob(hd, '#140c0a', [sx * 0.08, 0.04, 0.255], [0.03, 0.045, 0.012]); blob(hd, '#fff', [sx * 0.08 - 0.01, 0.06, 0.267], [0.01, 0.01, 0.008]); blob(hd, '#2a2022', [sx * 0.03, -0.04, 0.265], [0.015, 0.012, 0.01]); }
  add(hd, new THREE.TorusGeometry(0.05, 0.008, 8, 16, Math.PI), '#2a1a1a', [0, -0.12, 0.25], [0, 0, Math.PI]);
  for (const sx of [-1, 1]) { const a = new THREE.Group(); a.position.set(sx * 0.42, 1.0, 0); g.add(a); a.rotation.z = sx * 0.25; cyl(a, fur, [0, -0.35, 0], 0.13, 0.8); blob(a, fur, [0, -0.8, 0.02], [0.15, 0.13, 0.14]); blob(g, fur, [sx * 0.2, 0.25, 0], [0.16, 0.25, 0.16]); blob(g, '#222', [sx * 0.2, 0.04, 0.06], [0.16, 0.05, 0.2]); }
  g.scale.setScalar(s); return g;
}
export function hay(s = 1) { const g = new THREE.Group(); box(g, '#e6c050', [0, 0.25 * s, 0], [0.8 * s, 0.5 * s, 0.5 * s]); for (const y of [0.1, 0.25, 0.4]) box(g, '#c9a238', [0, y * s, 0.255 * s], [0.82 * s, 0.03 * s, 0.01]); return g; }
export function star5(r = 0.5, color = '#ffe070', depth = 0.1) {
  const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 }), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 }));
}
