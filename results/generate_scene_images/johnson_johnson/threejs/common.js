// Shared helpers for J&J scenes (stage defaults, mesh helpers).
import * as THREE from 'three';
import { rng, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createJacks } from './jacks.js';
export { THREE, rng, canvasTexture, createJacks };
export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 32), m, pos, rot);
export function textTex(text, { w = 512, h = 256, bg = '#fff', fg = '#222', font = 'bold 120px sans-serif' } = {}) {
  return canvasTexture(w, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2);
  });
}
export function makeStage({ ground = '#7fb857', sky = {}, seed = 5 } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 38), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', seed), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}
export function placeJack(stage, { x = -0.6, z = 0.4, s = 1.5, ry = 0.4, pose = {} } = {}) {
  const j = createJacks({ scale: s }); j.position.x = x; j.position.z = z; j.rotation.y = ry; stage.scene.add(j);
  j.userData.pose(pose); j.userData.base = j.position.y; return j;
}
export function textPlane(text, w, h, { bg = '#ffffff', fg = '#222222', px = 150, font = 'bold', transparent = false } = {}) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 * h / w);
  const x = cv.getContext('2d'); if (!transparent) { x.fillStyle = bg; x.fillRect(0, 0, cv.width, cv.height); }
  x.fillStyle = fg; x.font = `${font} ${px}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, cv.width / 2, cv.height / 2 + px * 0.05);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, transparent }));
  m.castShadow = false; m.receiveShadow = true; return m;
}
export function finishScene(stage, jack, { cam = [0, 1.1, 4.6], look = [0, 0.85, 0], clouds = true } = {}) {
  const pm = new Set(); [].concat(jack).forEach((j) => j.traverse((o) => pm.add(o)));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}
