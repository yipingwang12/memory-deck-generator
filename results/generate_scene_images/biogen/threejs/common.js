// Shared helpers for Biogen scenes: materials, primitives, stage, water, text boards, a simple anime person.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createBuoy } from './buoy.js';
export { THREE, guard, canvasTexture, rng, createBuoy };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const glow = (c, i = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, size, pos, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, rt, rb, h, pos, rot, seg = 28) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), m, pos, rot);

/** Flat plane carrying canvas text. */
export function textPlane(text, w, h, { bg = '#101820', fg = '#7dff9a', font = 'bold', px = 256 } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let f = s * 0.7; ctx.font = `${font} ${f}px Arial, sans-serif`;
    while (ctx.measureText(text).width > s * 0.92) { f *= 0.94; ctx.font = `${font} ${f}px Arial, sans-serif`; }
    ctx.fillText(text, s / 2, s / 2 + f * 0.04);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

/** Anime-ish stage with standard Biogen lighting. opts override sky/sun. */
export function makeStage(extra = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: num('el', 38), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...extra,
  });
  return { stage, scene: stage.scene, P, num };
}

export const ground = (scene, color = '#6fae45', y = 0) => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, y, 0], [-Math.PI / 2, 0, 0]);

/** River/sea surface with light ripple rings; returns plane. */
export function water(scene, { color = '#2f9ad8', y = 0, size = 400 } = {}) {
  const w = add(scene, new THREE.PlaneGeometry(size, size), mat(color, { roughness: 0.25 }), [0, y, 0], [-Math.PI / 2, 0, 0]);
  const r = rng(3);
  for (let i = 0; i < 70; i++) {
    const c = add(scene, new THREE.TorusGeometry(0.15 + r() * 0.25, 0.012, 6, 32), mat('#c8ecff', { roughness: 0.3 }), [(r() - 0.5) * 18, y + 0.005, -3 + (r() - 0.6) * 14], [Math.PI / 2, 0, 0], [1, 1, 0.5]);
    c.castShadow = false;
  }
  return w;
}

/** Ripple rings around an object. */
export function ripples(scene, x, z, y = 0.01, base = 0.4) {
  for (let i = 0; i < 3; i++) add(scene, new THREE.TorusGeometry(base + i * 0.16, 0.014, 6, 48), mat('#e6f6ff'), [x, y, z], [Math.PI / 2, 0, 0]).castShadow = false;
}

const eye = (p, x, y, z) => {
  const d = (rx, ry, c, dz, dx = 0, dy = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat(c, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x + dx, y + dy, z + dz); p.add(m); };
  d(0.045, 0.058, '#ffffff', 0); d(0.034, 0.05, '#3a2416', 0.001); d(0.015, 0.027, '#100806', 0.002); d(0.011, 0.011, '#ffffff', 0.003, -0.012, 0.018);
};

/** Simple anime person facing +z, ~1.6 tall. Returns Group with userData.arms {l,r} (shoulder groups, rotate x/z) and head. */
export function person({ skin = '#ffdcbc', suit = '#2f4a8a', pants = '#2a2a3a', hair = '#3a2a22', hairStyle = 'short', shirt = '#f2f2f2', shoe = '#1c1c20', scale = 1 } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { cyl(g, mat(pants), 0.065, 0.055, 0.7, [s * 0.09, 0.45, 0]); blob(g, mat(shoe), [s * 0.09, 0.07, 0.04], [0.07, 0.05, 0.11]); }
  const torso = add(g, new THREE.CylinderGeometry(0.19, 0.16, 0.6, 24), mat(suit), [0, 1.0, 0], [0, 0, 0], [1, 1, 0.7]);
  box(g, mat(shirt), [0.1, 0.34, 0.02], [0, 1.03, 0.115]);
  const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
  blob(head, mat(skin), [0, 0, 0], [0.17, 0.19, 0.17]);
  for (const s of [-1, 1]) eye(head, s * 0.07, 0.01, 0.155);
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16, Math.PI), mat('#8a3a3a')); m.rotation.z = Math.PI; m.position.set(0, -0.085, 0.158); head.add(m);
  if (hairStyle === 'slick') { blob(head, mat(hair), [0, 0.06, -0.015], [0.18, 0.15, 0.18]); }
  else if (hairStyle !== 'none') { blob(head, mat(hair), [0, 0.07, -0.025], [0.18, 0.15, 0.17]); blob(head, mat(hair), [0, 0.13, 0.08], [0.15, 0.05, 0.08]); }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.23, 1.25, 0); g.add(sh);
    const up = cyl(sh, mat(suit), 0.045, 0.04, 0.3, [0, -0.15, 0]);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    cyl(el, mat(suit), 0.04, 0.035, 0.28, [0, -0.14, 0]);
    blob(el, mat(skin), [0, -0.3, 0], [0.045, 0.05, 0.04]);
    sh.rotation.z = s * 0.15; arms[k] = { sh, el };
  }
  g.userData = { arms, head, torso };
  g.scale.setScalar(scale);
  return g;
}

/** Toonify with character predicate then finish, using clouds. */
export function wrapUp(stage, scene, chars, { cx = 0, cy = 0.9, cz = 3, tx = 0, ty = 0.6, tz = 0, clouds = true } = {}) {
  const set = new Set();
  for (const c of chars) c.traverse((o) => set.add(o));
  stage.toonify(scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(cx, cy, cz); stage.camera.lookAt(tx, ty, tz);
  stage.finish();
}

/** Reach a buoy hand to a world point; returns the hand's resulting world position (put props there). */
export function grab(buoy, key, target, prop = null) {
  buoy.updateMatrixWorld(true);
  const l = buoy.worldToLocal(new THREE.Vector3(...target));
  buoy.userData.reach(key, [l.x, l.y, l.z]); buoy.updateMatrixWorld(true);
  const p = buoy.userData.parts.hands[key].getWorldPosition(new THREE.Vector3());
  if (prop) prop.position.copy(p);
  return p;
}

/** Person arm reach: rotate shoulder so hand points at world-ish direction (simple: set shoulder x/z, elbow x). */
export const armPose = (person, key, [x, z, ex]) => { const a = person.userData.arms[key]; a.sh.rotation.set(x, 0, z); a.el.rotation.set(ex, 0, 0); };

/** Neoclassical domed hall (MIT Great Dome style), faces +z, ~4 wide. */
export function dome({ scale = 1 } = {}) {
  const g = new THREE.Group(), stone = mat('#d9d2c0'), dark = mat('#9a9486'), copper = mat('#b9c7bf', { roughness: 0.5 });
  box(g, stone, [4.4, 1.2, 1.6], [0, 0.6, 0]);
  box(g, dark, [4.5, 0.08, 1.7], [0, 0.04, 0]);
  for (let i = 0; i < 6; i++) cyl(g, stone, 0.1, 0.1, 1.05, [-1.0 + i * 0.4, 0.6, 1.0], [0, 0, 0], 16);
  box(g, stone, [2.3, 0.12, 0.8], [0, 1.2, 0.8 + 0.05]);
  add(g, new THREE.CylinderGeometry(1, 1, 0.2, 4, 1), stone, [0, 1.3, 0.85], [0, Math.PI / 4, 0], [1.2, 0.5, 0.2]).scale.set(1.15, 0.5, 0.28);
  cyl(g, stone, 1.15, 1.2, 0.5, [0, 1.45, -0.1], [0, 0, 0], 48);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cyl(g, dark, 0.03, 0.03, 0.44, [1.17 * Math.sin(a), 1.45, -0.1 + 1.17 * Math.cos(a)], [0, 0, 0], 8); }
  add(g, new THREE.SphereGeometry(1.1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), copper, [0, 1.68, -0.1], [0, 0, 0], [1, 0.62, 1]);
  cyl(g, stone, 0.15, 0.18, 0.2, [0, 2.36, -0.1], [0, 0, 0], 16);
  g.scale.setScalar(scale); return g;
}
