// Shared scene helpers for braingate_mgh pages: stage, ground, primitives, anchor placement, text sprites.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTurnstile } from './turnstile.js';
export { THREE, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const num = (P, k, d) => Number(P.get(k) ?? d);

/** Canvas text plane: textPlane('MGH', {w, h, bg, fg}) -> Mesh facing +z. */
export function textPlane(text, { w = 1, h = 0.5, bg = '#ffffff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + 8);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

/** Stage + ground. opts: ground colour, sky colours, fov. */
export function makeStage({ ground = '#e9c88f', zenith = '#6fb0ea', horizon = '#ffe3b8', cloudShade = '#f3d3a0', fov = 40 } = {}) {
  const stage = createAnimeStage({
    fov, sunElevation: 38, sunAzimuth: 160,
    sky: { zenith, horizon, cover: 0.6, puffCover: 0.6, towerTop: 0.3, cloudLit: '#fff6e6', cloudShade },
    sunIntensity: 2.6, ambient: { color: '#fff0e0', intensity: 2.3 },
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
  });
  const g = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  stage.addClouds([[150, 900, 90, 1.2], [180, 1200, 200, 2.0], [215, 950, 70, 0.9], [250, 900, 80, 1.1]]);
  return stage;
}

/** Place the anchor; returns the Group. Registers it for toon shading via the returned `characterSet`. */
export function placeAnchor(stage, { x = -1.2, z = 0, scale = 1.4, ry = 0.5, pose = {}, spin = 0 } = {}) {
  const a = createTurnstile({ scale }); a.position.set(x, 0, z); a.rotation.y = ry;
  a.userData.pose(pose); a.userData.spin(spin); stage.scene.add(a); return a;
}

/** Toon-shade the anchor, set the camera, finish. */
export function wrap(stage, anchor, P, cam = {}) {
  const set = new Set(); anchor.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.camera.position.set(num(P, 'cx', cam.cx ?? 0), num(P, 'cy', cam.cy ?? 1.1), num(P, 'cz', cam.cz ?? 5));
  stage.camera.lookAt(num(P, 'tx', cam.tx ?? 0), num(P, 'ty', cam.ty ?? 0.8), 0);
  stage.finish();
}

export const HEAD = `<!doctype html>
<html><head><meta charset="utf-8"><title>q</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>`;
