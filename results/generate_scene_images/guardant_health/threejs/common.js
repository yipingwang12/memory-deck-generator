// Shared helpers for Guardant scenes.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createGuardsman } from './guardsman.js';
export { THREE, rng, canvasTexture, createGuardsman };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, rt, rb, h, pos, rot) => add(parent, new THREE.CylinderGeometry(rt, rb, h, 32), m, pos, rot);

export function textPlane(text, w, h, { bg = '#101820', fg = '#7dffb0', font = 'bold', px = 0.6, lines = null } = {}) {
  const k = w / h, L = lines || [text];
  const tex = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = Math.min(s * px / (L.length * 0.9), (s * px) / (L.length * 1.05 * k));
    ctx.font = `${font} ${fs}px Arial, Helvetica, sans-serif`;
    const widest = Math.max(...L.map((t) => ctx.measureText(t).width));
    if (widest > s * 0.92) { fs *= s * 0.92 / widest; ctx.font = `${font} ${fs}px Arial, Helvetica, sans-serif`; }
    ctx.translate(s / 2, s / 2); ctx.scale(1, k);
    L.forEach((t, i) => ctx.fillText(t, 0, (i - (L.length - 1) / 2) * fs * 1.05));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

export function heraldicShield(emblem = true) {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(-0.3, 0.35); s.lineTo(0.3, 0.35); s.lineTo(0.3, 0.0); s.quadraticCurveTo(0.28, -0.3, 0, -0.45); s.quadraticCurveTo(-0.28, -0.3, -0.3, 0.0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.02, bevelSegments: 3 });
  add(g, geo, mat('#c8202a', { roughness: 0.4 }));
  const inner = new THREE.Shape(); inner.moveTo(-0.22, 0.27); inner.lineTo(0.22, 0.27); inner.lineTo(0.22, 0.0); inner.quadraticCurveTo(0.2, -0.22, 0, -0.34); inner.quadraticCurveTo(-0.2, -0.22, -0.22, 0.0); inner.closePath();
  add(g, new THREE.ExtrudeGeometry(inner, { depth: 0.03, bevelEnabled: false }), mat('#2a5aa8', { roughness: 0.4 }), [0, 0, 0.065]);
  if (emblem) {
    const gold = mat('#ffd24a', { metalness: 0.5, roughness: 0.3 });
    box(g, gold, [0, 0.0, 0.1], [0.07, 0.4, 0.02]); box(g, gold, [0, 0.08, 0.1], [0.32, 0.07, 0.02]);
  }
  return g;
}

export function makeStage(P, over = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...over,
  });
  return stage;
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

export function meadow(scene, color = '#6fae45') {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const r = rng(4);
  for (let i = 0; i < 50; i++) add(scene, new THREE.SphereGeometry(0.03, 8, 6), mat(['#ffd84a', '#ffffff', '#ff8fa8'][i % 3]), [(r() - 0.5) * 10, 0.03, -1 - r() * 6]);
}

/** Add guardsman, toonify, set camera. cam = {cx,cy,cz,tx,ty,tz}. */
export function finishScene(stage, guard, P, cam, cloudList = CLOUDS) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const pm = new Set(); guard.traverse((o) => pm.add(o));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (cloudList) stage.addClouds(cloudList);
  stage.camera.position.set(num('cx', cam.cx), num('cy', cam.cy), num('cz', cam.cz));
  stage.camera.lookAt(num('tx', cam.tx), num('ty', cam.ty), num('tz', cam.tz ?? 0));
  stage.finish();
}
export const HEAD = `<!doctype html>
<html><head><meta charset="utf-8"><title>scene</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>`;

/** Move guardsman hand to a WORLD point (call after setting position/rotation/scale). */
export function holdAt(guard, key, world) {
  guard.updateMatrixWorld(true);
  const l = guard.worldToLocal(new THREE.Vector3(...world));
  guard.userData.reach(key, [l.x, l.y, l.z]);
}
export function helix(len = 1, r = 0.12, turns = 3, colA = '#ffd24a', colB = '#38c6ff') {
  const g = new THREE.Group(), N = 14 * turns, A = mat(colA, { roughness: 0.35 }), B = mat(colB, { roughness: 0.35 });
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = t * turns * Math.PI * 2, y = (t - 0.5) * len;
    blob(g, A, [Math.cos(a) * r, y, Math.sin(a) * r], [0.035, 0.035, 0.035]);
    blob(g, B, [-Math.cos(a) * r, y, -Math.sin(a) * r], [0.035, 0.035, 0.035]);
    if (i % 2 === 0) cyl(g, mat(i % 4 ? '#ff6a8a' : '#7cf08a'), 0.012, 0.012, 2 * r, [0, y, 0], [0, 0, Math.PI / 2]).rotation.set(0, -a, Math.PI / 2);
  }
  return g;
}
export function cancerCell(s = 1, col = '#7a2aa8') {
  const g = new THREE.Group(), m = mat(col, { roughness: 0.45 });
  blob(g, m, [0, 0, 0], [0.13 * s, 0.13 * s, 0.13 * s]);
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * (i + 0.5) / 14), i * 2.4);
    const c = add(g, new THREE.ConeGeometry(0.03 * s, 0.07 * s, 8), m, p.clone().multiplyScalar(0.15 * s));
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p);
  }
  blob(g, mat('#ffffff', { roughness: 0.3 }), [-0.04 * s, 0.03 * s, 0.115 * s], [0.03 * s, 0.035 * s, 0.015 * s]);
  blob(g, mat('#ffffff', { roughness: 0.3 }), [0.04 * s, 0.03 * s, 0.115 * s], [0.03 * s, 0.035 * s, 0.015 * s]);
  blob(g, mat('#200010'), [-0.04 * s, 0.03 * s, 0.125 * s], [0.015 * s, 0.02 * s, 0.01 * s]);
  blob(g, mat('#200010'), [0.04 * s, 0.03 * s, 0.125 * s], [0.015 * s, 0.02 * s, 0.01 * s]);
  return g;
}
export function bloodCell(s = 1) {
  const g = new THREE.Group(); blob(g, mat('#d4202e', { roughness: 0.4 }), [0, 0, 0], [0.1 * s, 0.1 * s, 0.035 * s]);
  add(g, new THREE.TorusGeometry(0.06 * s, 0.025 * s, 10, 24), mat('#e63a44', { roughness: 0.4 }), [0, 0, 0.012 * s]); return g;
}
export function magnifier() {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(0.09, 0.014, 12, 36), mat('#e2b13c', { metalness: 0.6, roughness: 0.3 }));
  add(g, new THREE.CircleGeometry(0.088, 32), mat('#bfe8ff', { transparent: true, opacity: 0.35, roughness: 0.1 }), [0, 0, 0.002]);
  cyl(g, mat('#6a3f1d'), 0.016, 0.016, 0.16, [0, -0.17, 0]); return g;
}
export function grassSky(P, over = {}) { return makeStage(P, over); }
