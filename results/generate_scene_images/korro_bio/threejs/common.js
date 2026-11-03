// Shared helpers for the Korro scenes: materials, primitives, labels, and the standard anime stage.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';

export { THREE, rng, canvasTexture };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, size, pos, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, r1, r2, h, pos, rot, seg = 24) => add(p, new THREE.CylinderGeometry(r1, r2, h, seg), m, pos, rot);

/** Flat text plane (canvas text). */
export function label(text, { w = 1, h = 0.4, bg = '#fff8e8', fg = '#222', border = '#222', font = 'bold', size = 0.62 } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 18; ctx.strokeRect(9, 9, s - 18, s - 18); }
    ctx.fillStyle = fg; ctx.font = `${font} ${Math.floor(s * size)}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + s * 0.03, s * 0.9);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  m.castShadow = false; return m;
}

/** Standard stage; query params tune camera. Returns stage with ground added. */
export function makeStage({ ground = '#6fae45', groundSize = 400, sky = {}, ...o } = {}) {
  const stage = createAnimeStage({
    fov: 40, sunElevation: 35, sunAzimuth: 150, exposure: 1,
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...o,
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}

export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/** toonify the crow only, add clouds, aim camera, finish. */
export function finishScene(stage, crow, cam, look, extraToon = []) {
  const set = new Set(); crow.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds(CLOUDS);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look);
  stage.finish();
}

export function brickTex(base = [176, 84, 62], repeat = 1) {
  return canvasTexture(256, (ctx, s) => {
    const r = rng(3); ctx.fillStyle = '#d9c7a8'; ctx.fillRect(0, 0, s, s);
    const bh = s / 8, bw = s / 4;
    for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
      const k = (r() - 0.5) * 40; ctx.fillStyle = `rgb(${base[0] + k},${base[1] + k * 0.5},${base[2] + k * 0.4})`;
      ctx.fillRect(x * bw + (y % 2) * bw / 2 + 3, y * bh + 3, bw - 6, bh - 6);
    }
  }, { repeat });
}

/** Name tag stuck on a crow's chest. */
export function chestTag(crow, text) {
  const t = label(text, { w: 0.34, h: 0.15, size: 0.34, bg: '#fff2a8' }); t.position.set(0, 0.5, 0.268); crow.add(t); return t;
}

export function tree(parent, x, z, s = 1, col = '#4c8c3a') {
  cyl(parent, mat('#6b4a2a'), 0.12 * s, 0.16 * s, 1.2 * s, [x, 0.6 * s, z]);
  blob(parent, mat(col), [x, 1.6 * s, z], [0.8 * s, 0.9 * s, 0.8 * s]);
  blob(parent, mat(col), [x + 0.3 * s, 1.3 * s, z + 0.1], [0.55 * s, 0.6 * s, 0.55 * s]);
}

export const glass = (c = '#bfe8ff', o = 0.35) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, roughness: 0.1, metalness: 0.1, depthWrite: false });

export function tubeAlong(parent, pts, r, m) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return add(parent, new THREE.TubeGeometry(curve, 80, r, 14, false), m);
}
