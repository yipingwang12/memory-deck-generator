// Shared scene scaffolding for Flourish pages: material/mesh helpers + anime stage + toonified flour anchor.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createFlour } from './flour.js';
export { THREE, guard, canvasTexture, rng, createFlour };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Canvas-text texture, e.g. a label. */
export function textTexture(text, { w = 512, h = 256, bg = '#fff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Build the stage + flat ground. opts: ground colour, sky overrides. Returns { stage, scene, P, num }. */
export function setup({ ground = '#7fb85a', sky = {}, stage: so = {}, groundSize = 400 } = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...so,
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, P, num };
}

/** Add the anchor, toonify every non-character mesh's complement, add clouds, aim the camera, finish. */
export function wrap(stage, anchors, { cam = [0, 1, 3], look = [0, 0.7, 0], clouds = true } = {}) {
  const pm = new Set(); for (const a of anchors) a.traverse((o) => pm.add(o));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look);
  stage.finish();
}
