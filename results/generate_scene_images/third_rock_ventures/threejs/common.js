// Shared helpers for the Third Rock scene pages.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createPebble } from './pebble.js';
export { THREE, guard, canvasTexture, rng, createPebble };

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);

export function stage(o = {}) {
  return createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: 1.5, seed: 5, towerTop: 0.5, puffCover: 1.5 }, rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, ...o,
  });
}

export function woodTex(seed = 7, base = 150, repeat = 1, planks = 12) {
  return canvasTexture(512, (ctx, s) => {
    const r = rng(seed);
    for (let i = 0; i < planks; i++) {
      const l = base + r() * 25; ctx.fillStyle = `rgb(${l + 40},${l - 10},${l - 80})`; ctx.fillRect(i * s / planks, 0, s / planks, s);
      ctx.fillStyle = 'rgba(60,30,10,0.9)'; ctx.fillRect(i * s / planks, 0, 3, s);
      for (let k = 0; k < 12; k++) { ctx.fillStyle = 'rgba(90,50,20,0.18)'; ctx.fillRect(i * s / planks + r() * s / planks, 0, 1.5, s); }
    }
  }, { repeat });
}

/** Flat canvas-drawn panel (draw(ctx,w,h)). */
export function panel(w, h, draw, px = 512) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
}

/** Put the pebble's `key` hand at a world point (IK); returns the hand's resulting world position. */
export function holdAt(p, key, world) {
  p.updateMatrixWorld(true);
  const t = p.worldToLocal(world.clone()); p.userData.reach(key, [t.x, t.y, t.z]);
  p.updateMatrixWorld(true);
  return p.userData.parts.hands[key].getWorldPosition(new THREE.Vector3());
}

export function sit(p, spread = 0.2, knee = -1.25) { p.userData.pose({ legs: { l: [knee, spread], r: [knee, -spread] } }); }

export function hardHat(p, color = '#ffc21a') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.4 });
  add(g, new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, [0, 0, 0], [0, 0, 0], [0.3, 0.2, 0.28]);
  add(g, new THREE.CylinderGeometry(0.31, 0.31, 0.02, 28), m, [0, 0, 0.03], [0, 0, 0], [1, 1, 1.05]);
  add(g, new THREE.BoxGeometry(0.04, 0.2, 0.3), m, [0, 0.01, 0]);
  g.position.set(0, 0.74, 0.02); g.rotation.x = 0.12; p.userData.parts.head.add(g);
}

export function finish(st, chars, camPos, look, clouds) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => { if (!o.userData.noToon) set.add(o); }));
  st.toonify(st.scene, (m) => set.has(m));
  if (clouds) st.addClouds(clouds);
  st.camera.position.set(...camPos); st.camera.lookAt(...look); st.finish();
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];
