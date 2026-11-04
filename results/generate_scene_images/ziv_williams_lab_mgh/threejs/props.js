// Shared props + stage for the Ziv lab scenes.
import * as THREE from 'three';
import { guard, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSieve } from './sieve.js';
export { guard, canvasTexture, createSieve, THREE };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);

export function textTex(lines, { w = 512, ax = 1, bg = '#fff', fg = '#111', font = 'bold 90px Georgia, serif', bar = null } = {}) {
  return canvasTexture(w, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); 
    ctx.translate(s / 2, 0); ctx.scale(1 / ax, 1); ctx.translate(-s / 2, 0);
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (bar) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bar; ctx.fillRect(0, 0, s, s * 0.14); ctx.restore(); ctx.fillStyle = fg; }
    lines.forEach((t, i) => ctx.fillText(t, s / 2, s * (0.5 + (i - (lines.length - 1) / 2) * 0.3), s * 0.92 * ax));
  });
}

export function makeStage(P, extra = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 40), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2 }, rim: { color: '#fff3dc', strength: 1.3, width: 0.55 },
    sunIntensity: 2.4, ambient: { color: '#eee8ff', intensity: 2.4 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.4, fog: { near: 120, far: 1500 }, ...extra,
  });
  return { stage, num };
}

// Operating-room box: floor, back wall, side walls, ceiling lamp. Front open for the camera.
export function buildOR(scene, { wall = '#bfe3dc', floor = '#e9eef0' } = {}) {
  add(scene, new THREE.PlaneGeometry(40, 40), mat(floor, { roughness: 0.4 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(14, 6), mat(wall), [0, 3, -3.2]);
  add(scene, new THREE.PlaneGeometry(10, 6), mat('#a9d3cb'), [-7, 3, 1.5], [0, Math.PI / 2, 0]);
  add(scene, new THREE.PlaneGeometry(10, 6), mat('#a9d3cb'), [7, 3, 1.5], [0, -Math.PI / 2, 0]);
  add(scene, new THREE.BoxGeometry(14, 0.1, 0.06), mat('#ffffff'), [0, 0.12, -3.17]);
  // surgical lamp
  const lamp = new THREE.Group(); lamp.position.set(1.8, 3.2, -1.2); scene.add(lamp);
  add(lamp, new THREE.CylinderGeometry(0.05, 0.05, 1.2, 10), mat('#c9ced4', { metalness: 0.5 }), [0, 0.6, 0]);
  add(lamp, new THREE.CylinderGeometry(0.55, 0.62, 0.14, 36), mat('#eef1f4'), [0, 0, 0]);
  const bulbs = mat('#fff6c9', { emissive: '#ffe9a0', emissiveIntensity: 1.2 });
  for (let i = 0; i < 7; i++) { const a = i * Math.PI / 3.5; blob(lamp, bulbs, [i ? 0.36 * Math.cos(a) : 0, -0.08, i ? 0.36 * Math.sin(a) : 0], [0.09, 0.04, 0.09]); }
  return lamp;
}

export function brain(scale = 1, color = '#f0a0b4') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.5 }), dk = mat('#d27890', { roughness: 0.5 });
  for (const s of [-1, 1]) {
    blob(g, m, [s * 0.1, 0, 0], [0.19, 0.16, 0.26]);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, b = (i % 3) * 0.7;
      blob(g, i % 2 ? m : dk, [s * 0.1 + Math.cos(a) * 0.12, Math.sin(b + a) * 0.07 + 0.04, Math.sin(a) * 0.17], [0.07, 0.055, 0.075]); }
  }
  blob(g, mat('#d9a7b4'), [0, -0.15, -0.14], [0.1, 0.07, 0.1]);
  g.scale.setScalar(scale); return g;
}

export function scalpel(len = 0.5) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.018, 0.022, len * 0.6, 14), mat('#e7ebef', { metalness: 0.6, roughness: 0.3 }), [0, len * 0.3, 0]);
  const bl = add(g, new THREE.ConeGeometry(0.03, len * 0.45, 4), mat('#f6f9fc', { metalness: 0.9, roughness: 0.15 }), [0, -len * 0.2, 0], [0, 0.7, Math.PI], [1, 1, 0.25]);
  return g;
}

// Glowing neuron: soma + dendrite spokes + axon tail.
export function neuron(color = '#ffd24a', s = 1) {
  const g = new THREE.Group(), m = mat(color, { emissive: color, emissiveIntensity: 0.9, roughness: 0.4 });
  blob(g, m, [0, 0, 0], [0.07, 0.07, 0.07]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2;
    add(g, new THREE.CylinderGeometry(0.008, 0.016, 0.22, 8), m, [Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0], [0, 0, a - Math.PI / 2]);
    blob(g, m, [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0], [0.018, 0.018, 0.018]); }
  g.scale.setScalar(s); return g;
}

export function setupSieve(scene, stage, { pos, ry = 0, scale = 1.3, pose, reach }) {
  const p = createSieve({ scale }); p.position.set(...pos); p.rotation.y = ry; scene.add(p);
  p.userData.pose(pose || {}); p.updateMatrixWorld(true);
  for (const [k, w] of Object.entries(reach || {})) { const t = p.worldToLocal(new THREE.Vector3(...w)); p.userData.reach(k, [t.x / 1, t.y, t.z]); }
  return p;
}
export function finishScene(scene, stage, sieve, clouds = true) {
  const pm = new Set(); sieve.traverse((o) => pm.add(o));
  stage.toonify(scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [190, 1000, 120, 1.6]]);
  stage.finish();
}

// Neuropixels-style probe: black head + long pale shank with gold recording sites. Tip at y=0, extends +y.
export function probe(len = 0.9) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.05, len, 0.014), mat('#f2efe6', { roughness: 0.3 }), [0, len / 2, 0]);
  add(g, new THREE.ConeGeometry(0.025, 0.08, 4), mat('#f2efe6'), [0, -0.0, 0], [0, Math.PI / 4, Math.PI], [1, 1, 0.3]);
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.014, 0.022, 0.018), mat('#ffc83a', { emissive: '#ffb000', emissiveIntensity: 0.5, metalness: 0.7 }), [s * 0.012, 0.1 + i * 0.035, 0]);
  add(g, new THREE.BoxGeometry(0.22, 0.2, 0.05), mat('#23262d'), [0, len + 0.1, 0]);
  add(g, new THREE.BoxGeometry(0.14, 0.04, 0.056), mat('#3fb6a8'), [0, len + 0.12, 0]);
  return g;
}
