// Shared scene helpers for the Scholar Rock deck: mesh helpers, text signs, stage + ground, character toonify.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';

export { THREE, guard, rng };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Plane showing short canvas text. */
export function sign(text, w, h, { bg = '#fff8e6', fg = '#1b1b2a', font = 'bold', border = '#1b1b2a' } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  if (border) { x.strokeStyle = border; x.lineWidth = 22; x.strokeRect(11, 11, c.width - 22, c.height - 22); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = c.height * 0.7; x.font = `${font} ${fs}px "Helvetica Neue", Arial, sans-serif`;
  while (x.measureText(text).width > c.width * 0.86) { fs *= 0.93; x.font = `${font} ${fs}px "Helvetica Neue", Arial, sans-serif`; }
  x.fillText(text, c.width / 2, c.height / 2 + fs * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  m.receiveShadow = true; return m;
}

/** Anime stage + ground + URL param helper. */
export function makeScene({ ground = '#6fae45', sky = {}, sun = {}, fov = 40 } = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', sun.el ?? 35), sunAzimuth: num('az', sun.az ?? 150), exposure: num('exp', 1),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num };
}

/** Toonify `chars` (Groups), add clouds, aim camera, finish. */
export function wrapUp(stage, num, chars, cam, look, clouds = true) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0));
  stage.finish();
}
