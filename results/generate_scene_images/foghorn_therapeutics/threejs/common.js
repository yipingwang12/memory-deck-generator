// Shared scene helpers for the Foghorn deck (props, stage, sound waves).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createFoghorn } from './foghorn.js';
export { THREE, guard, canvasTexture, rng, createFoghorn };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);

/** Anime stage with per-scene sky/sun overrides. */
export function makeStage({ sky = {}, el = 35, az = 150, ambient, fog, sunIntensity = 2.6, sunColor, exposure = 1 } = {}) {
  return createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', exposure),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity, ...(sunColor ? { sunColor } : {}), ambient: ambient ?? { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.5, fog: fog ?? { near: 120, far: 1500 },
  });
}

export function ground(scene, color = '#6fae45', size = 400) {
  return add(scene, new THREE.PlaneGeometry(size, size), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

/** Place the Foghorn and finish the toon pass; returns the foghorn. */
export function placeFoghorn(scene, { x = 0, z = 0, ry = 0, scale = 1.4, pose = {} } = {}) {
  const f = createFoghorn({ scale });
  f.position.set(x, 0, z); f.rotation.y = ry; scene.add(f);
  f.userData.pose({ lean: -0.08, arms: { l: [0, 0.5], r: [0, 0.5] }, legs: { l: [0.1, 0], r: [-0.1, 0] }, ...pose });
  return f;
}

/** Concentric sound-wave arcs fanning out of the bell: n rings of growing size along the bell direction. */
export function soundWaves(scene, foghorn, { n = 5, gap = 0.5, color = '#ffffff', start = 0.4, opacity = 0.85 } = {}) {
  const o = foghorn.userData.bell(), d = foghorn.userData.bellDir();
  const g = new THREE.Group(); g.position.copy(o);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  for (let i = 0; i < n; i++) {
    const s = 0.28 + i * 0.22, ring = new THREE.Mesh(
      new THREE.TorusGeometry(s, 0.04 + i * 0.006, 8, 48, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * (1 - i / (n + 1)) }));
    ring.position.z = start + i * gap * 0.45; ring.rotation.z = -Math.PI * 0.75;
    g.add(ring);
  }
  scene.add(g); return g;
}

/** Large canvas-text plane (canvas aspect follows the plane). */
export function textPlane(parent, text, { w = 1, h = 0.5, bg = '#101820', fg = '#7dff9a', pos = [0, 0, 0], rot = [0, 0, 0], px = 260 } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const ctx = c.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg; ctx.font = `bold ${px}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + px * 0.05);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
}

/** Face the Foghorn toward world point (x,z) with the horn aimed at height y. */
export function aimAt(f, [tx, ty, tz], pitchBias = 0, off = 0.45) {
  f.userData.pose({});
  f.rotation.y = Math.atan2(tx - f.position.x, tz - f.position.z) - off;
  const d = Math.hypot(tx - f.position.x, tz - f.position.z);
  f.userData.pose({ aim: [Math.atan2(ty - (f.position.y + 1.2), d) + pitchBias + 0.05, off] });
}

export function finishScene(stage, foghorn, { cam = [0, 1, 3.5], look = [0, 0.7, 0], clouds = true } = {}) {
  const pm = new Set(); foghorn.traverse((o) => pm.add(o));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}
