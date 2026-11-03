// Shared helpers for the Arctop scene pages.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTop } from './top.js';
export { THREE, guard, canvasTexture, rng, createTop };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });

/** Text on a canvas -> texture. */
export function textTex(text, { w = 512, h = 256, fg = '#ffffff', bg = null, font = 'bold 150px Arial' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Standard stage + meadow ground. Returns { stage, scene }. */
export function makeStage({ ground = '#6fae45', sky = {}, el = 35, az = 150, ambient = 2.3, ...rest } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: num('cover', 1.5), seed: num('seed', 5), towerTop: 0.5, puffCover: 1.5, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: ambient }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...rest,
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(600, 600), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene };
}

/** Add the top, pose it, return it. */
export function placeTop(scene, { x = 0, y = 0, z = 0, s = 1.4, ry = 0, tilt = 0.08, arms = { l: [0, 0.9], r: [0, 0.9] } } = {}) {
  const t = createTop({ scale: s }); t.position.set(x, y, z); t.rotation.y = ry; t.userData.pose({ arms, tilt }); t.userData.spin(0.6);
  scene.add(t); return t;
}

/** Toonify + clouds + camera + finish. */
export function wrap(stage, scene, top, { cam = [0, 0.9, 3.2], look = [0, 0.6, 0], clouds = true } = {}) {
  const set = new Set(); (Array.isArray(top) ? top : [top]).forEach((t) => t.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}
