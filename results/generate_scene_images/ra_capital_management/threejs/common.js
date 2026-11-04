// Shared scene helpers for RA Capital scenes.
import * as THREE from 'three';
import { createAnimeStage } from './kit_anime.js';

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);

export function makeStage(over = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...over,
  });
  return { stage, scene: stage.scene, num };
}

export function finishScene(stage, scene, chars, cam, look) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look);
  stage.finish();
}

export const meadow = (scene, color = '#6fae45') =>
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);

/** Gold ball with a few darker bands so its roll reads. */
export function goldBall(parent, r, pos) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const m = mat('#ffc928', { metalness: 0.7, roughness: 0.25 });
  add(g, new THREE.SphereGeometry(r, 40, 28), m);
  add(g, new THREE.TorusGeometry(r * 1.003, r * 0.03, 8, 48), mat('#c98a10', { metalness: 0.6 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 1.003, r * 0.03, 8, 48), mat('#c98a10', { metalness: 0.6 }), [0, 0, 0], [0, 0.6, 0]);
  return g;
}
