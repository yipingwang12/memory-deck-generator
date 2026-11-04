// Shared scene scaffolding for the Quanterix scenes: stage, helpers, quarter placement, camera.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createQuarter } from './quarter.js';

export { THREE, guard, canvasTexture, rng, createQuarter };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 32), m, pos, rot);

/** Canvas-text plane: label(parent, 'QTRX', pos, [w,h], {bg, fg, rot}); text auto-fits the w:h band. */
export function label(parent, text, pos, size, { bg = '#101820', fg = '#7dffb0', rot = [0, 0, 0] } = {}) {
  const [w, h] = size, ratio = h / w;
  const t = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    let f = s * ratio * 0.72; ctx.font = `bold ${f}px sans-serif`;
    const m = ctx.measureText(text).width; if (m > s * 0.9) { f *= s * 0.9 / m; ctx.font = `bold ${f}px sans-serif`; }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + f * 0.04);
  });
  t.repeat.set(1, ratio); t.offset.set(0, (1 - ratio) / 2);
  return add(parent, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }), pos, rot);
}

/** Reach quarter hand `key` to a WORLD point. */
export function reachTo(q, key, p) {
  q.updateMatrixWorld(true);
  const v = q.worldToLocal(new THREE.Vector3(...p)); q.userData.reach(key, [v.x, v.y, v.z]);
}

/** Build stage + ground. Returns { stage, scene, P, num }. opts: ground color, sky overrides. */
export function setup({ ground = '#e9c98f', sky = {}, fov = 40, el = 38, az = 160 } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: el, sunAzimuth: az,
    sky: { cover: 1.2, seed: 5, towerTop: 0.4, puffCover: 1, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#f0eaff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const g = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, P, num };
}

/** Place the quarter, run `posefn(q)` (pose/reach), toonify the quarter, frame camera, finish. */
export function finishScene(ctx, q, { cam = [0, 1.0, 4.2], look = [0, 0.75, 0], clouds = true } = {}) {
  const { stage, num } = ctx, set = new Set(); q.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [180, 1100, 160, 1.8], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), look[2]);
  stage.finish();
}
export const HEAD = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style><script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script></head><body>';
