// Shared helpers for the Sonde scenes: material/mesh shorthands, stage preset, canvas text, ground.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, guard, canvasTexture, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, rt, rb, h, rot) => add(parent, new THREE.CylinderGeometry(rt, rb, h, 24), m, pos, rot);

/** Flat plane carrying large canvas text. */
export function textPlane(text, w, h, { bg = '#fff6e0', fg = '#2a1a10', font = 'bold', border = null } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 28; ctx.strokeRect(14, 14, s - 28, s - 28); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let px = 330; do { ctx.font = `${font} ${px}px Georgia, serif`; px -= 10; } while (ctx.measureText(text).width > s * 0.84 && px > 40);
    ctx.fillText(text, s / 2, s / 2 + 18);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  m.castShadow = true; return m;
}

/** Anime stage with the shared look; returns { stage, scene, num }. */
export function makeStage(over = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
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

export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/** Large ground disc. */
export const ground = (scene, color) => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);

/** Finish a scene: toonify characters, add clouds, aim camera, render. */
export function wrapUp(stage, num, characters, cam, look, clouds = CLOUDS) {
  const set = new Set(); characters.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds(clouds);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}
