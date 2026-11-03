// Shared helpers for the Alto scene pages: materials, labels, notes, stage defaults, finish().
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSax } from './saxophone.js';
export { THREE, guard, canvasTexture, rng, createSax };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Flat text sign (unlit, ignores toonify). */
export function label(text, w, h, { fg = '#ffffff', bg = '#1f2a44', border = null, font = 'bold', px = 0.62 } = {}) {
  const cw = 1024, ch = Math.round(1024 * h / w);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, cw, ch); }
  if (border) { x.strokeStyle = border; x.lineWidth = 18; x.strokeRect(9, 9, cw - 18, ch - 18); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = ch * px; x.font = `${font} ${size}px "Helvetica Neue", Arial, sans-serif`;
  while (x.measureText(text).width > cw * 0.9) { size *= 0.94; x.font = `${font} ${size}px "Helvetica Neue", Arial, sans-serif`; }
  x.fillText(text, cw / 2, ch / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg }));
}

/** Music note: head + stem + flag. Faces +z. */
export function note(color = '#ffd23f', s = 1) {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.4 });
  blob(g, m, [0, 0, 0], [0.07, 0.05, 0.03], [0, 0, 0.4]);
  add(g, new THREE.BoxGeometry(0.014, 0.24, 0.02), m, [0.06, 0.12, 0]);
  add(g, new THREE.BoxGeometry(0.1, 0.03, 0.02), m, [0.1, 0.235, 0], [0, 0, -0.5]);
  g.scale.setScalar(s); return g;
}

/** Wavy ribbon in the xy plane, `w` wide; amp, cycles, thickness. */
export function wave(color, w, amp, cycles, th = 0.02, phase = 0) {
  const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push(new THREE.Vector3((u - 0.5) * w, Math.sin(u * cycles * Math.PI * 2 + phase) * amp, 0)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, th, 8), new THREE.MeshBasicMaterial({ color }));
  return m;
}

/** Stage with URL-tunable defaults; evening = low warm sun. */
export function makeStage(over = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', over.el ?? 30), sunAzimuth: num('az', over.az ?? 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(over.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunColor: over.sunColor ?? '#fff1d6', sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, shadowSize: over.shadowSize ?? 4,
  });
  return { stage, num, P };
}

export const ground = (scene, color = '#6fae45') => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);

/** Toonify with the sax(es) as characters, add clouds, aim camera, finish. */
export function finish(stage, saxes, { cam, look, clouds = [[150, 900, 90, 1.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]], chars = [] }) {
  const set = new Set(); for (const o of [...saxes, ...chars]) o.traverse((m) => set.add(m));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds(clouds);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look);
  stage.finish();
}

/** Arms on the keys, ready to play. */
export function playPose(sax, lean = 0) {
  sax.userData.pose({ lean, legs: { l: [0.08, 0], r: [-0.08, 0] } });
  sax.userData.reach('l', [0.15, 0.78, 0.09]); sax.userData.reach('r', [-0.15, 0.62, 0.09]);
}

/** Notes drifting up/out from `from` along `dir` (spiral). */
export function noteTrail(parent, from, { n = 7, step = [0.28, 0.2, 0.05], scale = 1.5, colors = ['#ffd23f', '#ff7a59', '#fff2b0'] } = {}) {
  for (let i = 0; i < n; i++) {
    const nt = note(colors[i % colors.length], scale * (0.8 + 0.1 * i));
    nt.position.set(from[0] + step[0] * (i + 1) + Math.sin(i * 1.7) * 0.1, from[1] + step[1] * (i + 1), from[2] + step[2] * (i + 1));
    nt.rotation.z = Math.sin(i) * 0.3; parent.add(nt);
  }
}

export function oak(parent, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  cyl(g, mat('#5a3a22'), [0, 0.5, 0], 0.12, 1.0, [0, 0, 0], 0.07);
  for (const [px, py, pz, r] of [[0, 1.4, 0, 0.8], [-0.6, 1.15, 0.1, 0.55], [0.6, 1.2, -0.1, 0.6], [0.1, 1.75, 0.1, 0.5]]) blob(g, mat('#3f7a3a'), [px, py, pz], [r, r * 0.75, r]);
  return g;
}
