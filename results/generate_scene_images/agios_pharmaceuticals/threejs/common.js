// Shared helpers for Agios scenes: mat/add/blob, stage factory, ground, canvas text.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, guard, canvasTexture, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

export function textTexture(text, { color = '#fff', bg = null, font = 'bold 150px sans-serif', w = 512, h = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = color; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function textPlane(parent, text, w, h, pos, opts = {}, rot = [0, 0, 0]) {
  const t = textTexture(text, { w: 512, h: Math.round(512 * h / w), ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !opts.bg }));
  m.position.set(...pos); m.rotation.set(...rot); parent.add(m); return m;
}

// Red blood cell (biconcave-ish torus-disc) and friends
export function rbc(r = 0.1, color = '#d8283a') {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const x = t * r; const y = (0.42 * r) * Math.sqrt(Math.max(0, 1 - t * t)) * (0.35 + 0.65 * Math.pow(t, 1.2) * 1.4); pts.push(new THREE.Vector2(x, y)); }
  const top = new THREE.LatheGeometry(pts, 28), m = mat(color, { roughness: 0.4 });
  add(g, top, m); add(g, top, m, [0, 0, 0], [Math.PI, 0, 0]);
  return g;
}

export function makeScene({ ground = '#6fae45', cover = 2, seed = 5, fov = 40, el = 35, az = 150, sky = {}, cloudSet = true } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: num('cover', cover), seed: num('seed', seed), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const chars = new Set();
  const mark = (o) => { o.traverse((m) => chars.add(m)); return o; };
  const finish = (cam, look) => {
    stage.toonify(scene, (m) => chars.has(m));
    if (cloudSet) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
    stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2] ?? 0));
    stage.finish();
  };
  return { stage, scene, num, mark, finish, P };
}
