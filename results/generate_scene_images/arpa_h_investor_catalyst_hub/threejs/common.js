// Shared helpers for the ARPA-H harp scenes: stage, primitives, people, coins, text plates.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createHarp } from './harp.js';
export { THREE, guard, rng, createHarp };

export const num = (k, d) => Number(new URLSearchParams(location.search).get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, r, h, pos, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const box = (p, m, w, h, d, pos, rot) => add(p, new THREE.BoxGeometry(w, h, d), m, pos, rot);

/** Text plate (cue text only): returns a Mesh plane with canvas text. */
export function textPlate(text, w, h, { bg = '#fff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + 8);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}

/** Big anime eyes on a surface facing +z at group-local (x, y, z). r = eye half-width. */
export function animeEyes(parent, { x = 0, y = 0, z = 0, gap = 0.1, r = 0.06, iris = '#5b7cff' } = {}) {
  const d = (rx, ry, c, dz, px, py) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.4 }));
    m.scale.set(rx, ry, 1); m.position.set(x + px, y + py, z + dz); parent.add(m);
  };
  for (const s of [-1, 1]) {
    const px = s * gap;
    d(r, r * 1.25, '#fff', 0, px, 0); d(r * 0.8, r * 1.08, '#2c1a3a', 0.002, px, -r * 0.05);
    d(r * 0.7, r * 0.5, iris, 0.004, px, -r * 0.4); d(r * 0.4, r * 0.62, '#0d0714', 0.006, px, -r * 0.05);
    d(r * 0.3, r * 0.3, '#fff', 0.008, px - r * 0.3, r * 0.4); d(r * 0.13, r * 0.13, '#fff', 0.008, px + r * 0.25, -r * 0.5);
  }
}
export function smile(parent, x, y, z, r = 0.04, c = '#7a2a2a') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.22, 8, 20, Math.PI), mat(c));
  m.rotation.z = Math.PI; m.position.set(x, y, z); parent.add(m); return m;
}

/** Small cartoon person (facing +z, ~1.1 tall): { g, armL, armR, head }. */
export function person({ suit = '#3a4a8a', skin = '#ffe0c0', hat = null, hair = '#3a2a1a', tie = '#d33' } = {}) {
  const g = new THREE.Group(), sk = mat(skin), su = mat(suit);
  for (const s of [-1, 1]) { cyl(g, mat('#2a2a3a'), 0.07, 0.4, [s * 0.1, 0.2, 0]); blob(g, mat('#1a1a1a'), [s * 0.1, 0.03, 0.04], [0.08, 0.05, 0.12]); }
  blob(g, su, [0, 0.62, 0], [0.24, 0.3, 0.17]);
  box(g, mat(tie), 0.06, 0.2, 0.02, [0, 0.64, 0.165]);
  const head = new THREE.Group(); head.position.y = 1.0; g.add(head);
  blob(head, sk, [0, 0, 0], [0.22, 0.22, 0.2]);
  blob(head, mat(hair), [0, 0.06, -0.04], [0.23, 0.2, 0.2]);
  animeEyes(head, { y: -0.01, z: 0.19, gap: 0.085, r: 0.055 }); smile(head, 0, -0.1, 0.19, 0.04);
  if (hat === 'top') { cyl(head, mat('#1c1c24'), 0.2, 0.03, [0, 0.19, 0]); cyl(head, mat('#1c1c24'), 0.14, 0.26, [0, 0.33, 0]); cyl(head, mat('#d33'), 0.145, 0.05, [0, 0.25, 0]); }
  if (hat === 'hard') { blob(head, mat('#ffcc22'), [0, 0.12, 0], [0.24, 0.16, 0.22]); box(head, mat('#ffcc22'), 0.4, 0.03, 0.14, [0, 0.07, 0.17]); }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.78, 0); g.add(sh);
    cyl(sh, su, 0.055, 0.5, [0, -0.25, 0]); blob(sh, sk, [0, -0.52, 0], [0.07, 0.07, 0.07]); sh.rotation.z = s * 0.3; arms[k] = sh;
  }
  return { g, armL: arms.l, armR: arms.r, head };
}

export function coin(r = 0.12) {
  const g = new THREE.Group(), gold = mat('#ffcf33', { metalness: 0.5, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.25, 28), gold, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.72, r * 0.08, 8, 28), mat('#e8a516', { metalness: 0.5 }), [0, 0, r * 0.13]);
  return g;
}

/** Scene scaffold. Returns { stage, scene, chars, harp, done(cam) }. */
export function setup({ ground = '#6fae45', sky = {}, harpScale = 1.25, harpPos = [0, 0, 0], harpRy = 0, el = 38, az = 150, fov = 40 } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: 1,
    sky: { cover: 1.5, seed: 5, towerTop: 0.5, puffCover: 1.5, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene, chars = new Set();
  add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const harp = createHarp({ scale: harpScale }); harp.position.set(...harpPos); harp.rotation.y = harpRy; scene.add(harp);
  const mark = (o) => o.traverse((m) => chars.add(m));
  mark(harp);
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  return {
    stage, scene, chars, harp, mark,
    done(cx, cy, cz, tx, ty, tz = 0) {
      stage.toonify(scene, (m) => chars.has(m));
      stage.camera.position.set(num('cx', cx), num('cy', cy), num('cz', cz));
      stage.camera.lookAt(num('tx', tx), num('ty', ty), tz); stage.finish();
    },
  };
}
