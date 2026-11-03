// Shared scene plumbing for the GeneDx pages: stage, mesh helpers, finishing.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createJeans } from './jeans.js';
export { THREE, guard, canvasTexture, rng, createJeans };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);

export function textTexture(text, w, h, bg, fg) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = `bold ${Math.floor(h * 0.62)}px Arial Black, Arial, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + h * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** Stage with query-tunable camera; returns { stage, scene, num, P }. */
export function makeStage(o = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3, shadowSize: o.shadowSize ?? 4,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  return { stage, scene: stage.scene, num, P };
}

export function meadow(scene, color = '#6fae45') {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

export function flowers(scene, seed, n, xr, zr, cols = ['#ffd84a', '#ffffff', '#ff8fa8']) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) blob(scene, mat(cols[i % cols.length]), [xr[0] + r() * (xr[1] - xr[0]), 0.03, zr[0] + r() * (zr[1] - zr[0])], [0.035, 0.035, 0.035]);
}

/** Toonify characters (jeans/people), add clouds, aim camera, finish. */
export function finishScene(stage, num, chars, cam, look, clouds = true) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0));
  stage.finish();
}

export function placeJeans(scene, num, { scale = 1.3, x = 0, y = 0, z = 0, ry = 0, pose, reach }) {
  const j = createJeans({ scale }); j.position.set(x, y, z); j.rotation.y = ry; scene.add(j);
  if (pose) j.userData.pose(pose);
  j.updateMatrixWorld(true);
  for (const [k, w] of Object.entries(reach ?? {})) { const t = j.worldToLocal(new THREE.Vector3(...w)); j.userData.reach(k, [t.x, t.y, t.z]); }
  return j;
}
