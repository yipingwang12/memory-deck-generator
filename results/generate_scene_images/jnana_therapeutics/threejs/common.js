// Shared helpers for the Jnana scenes: materials, mesh adders, text planes, stage + banana setup.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createBanana } from './banana.js';
export { THREE };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Flat plane with canvas text, for labels that ARE the cue. */
export function textPlane(text, w, h, { bg = null, fg = '#ffffff', font = 'bold', pad = 0.8 } = {}) {
  const px = 512, tex = canvasTexture(px, (ctx, s) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = s * 0.5; ctx.font = `${font} ${fs}px Arial Black, Arial, sans-serif`;
    const mw = ctx.measureText(text).width; fs *= Math.min(1, (s * pad) / mw);
    ctx.font = `${font} ${fs}px Arial Black, Arial, sans-serif`; ctx.fillText(text, s / 2, s / 2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: !bg, roughness: 0.6 }));
  // canvas is square: crop uv so text keeps aspect
  const a = h / w; const uv = m.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 0.5 + (uv.getY(i) - 0.5) * a);
  return m;
}

export function makeStage(P, o = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', o.fov ?? 40), sunElevation: o.el ?? 35, sunAzimuth: o.az ?? 150, exposure: 1,
    sky: o.sky ?? { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  return stage;
}
export const ground = (scene, c = '#6fae45') => add(scene, new THREE.PlaneGeometry(400, 400), mat(c), [0, 0, 0], [-Math.PI / 2, 0, 0]);

/** Place the banana, run pose fn, toonify everything and set the camera. */
export function finishScene(stage, P, banana, cam) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const set = new Set(); banana.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds(cam.clouds ?? [[150, 900, 90, 1.2], [180, 1300, 200, 2.0], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam.pos[0]), num('cy', cam.pos[1]), num('cz', cam.pos[2]));
  stage.camera.lookAt(num('tx', cam.look[0]), num('ty', cam.look[1]), cam.look[2] ?? 0);
  stage.finish();
}
export { createBanana };
