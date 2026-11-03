// Shared scene helpers for the Hemispheric deck: stage setup, primitives, Descartes, clock, coin pile, sign.
// makeScene(opts) -> { THREE, stage, scene, num, character(obj), finish(camPos, lookAt) }
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, rng, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (parent, m, r1, r2, h, pos, rot) => add(parent, new THREE.CylinderGeometry(r1, r2, h, 24), m, pos, rot);

export function makeScene({ ground = '#6fae45', sky = {}, el = 35, az = 150, ink = {} } = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60, ...ink },
    flare: 0.6, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene, chars = new Set();
  if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const character = (o) => { o.traverse((c) => chars.add(c)); return o; };
  const finish = (cam, look) => {
    stage.toonify(scene, (m) => chars.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
  };
  return { THREE, stage, scene, num, character, finish };
}

/** Flat text plane; `aspect` = width/height. */
export function sign(text, w, h, bg = '#fff8e6', fg = '#1d2a4a', font = 0.55) {
  const aspect = w / h;
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    ctx.translate(s / 2, s / 2); ctx.scale(1 / aspect, 1);
    ctx.fillStyle = fg; ctx.font = `bold ${s * font}px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}

/** 17th-century Descartes: plumed hat, long hair, moustache and goatee, lace collar. ~0.9 tall, faces +z.
 *  userData: { head, arms:{l,r} } (arm groups hang from the shoulder; rotate .x/.z to pose). */
export function createDescartes({ scale = 1 } = {}) {
  const g = new THREE.Group(), coat = mat('#7a2331'), skin = mat('#f6d2ae'), hair = mat('#4a2e1c'), white = mat('#fffaf0');
  const lathe = [[0, 0], [0.17, 0], [0.15, 0.2], [0.1, 0.42], [0.0, 0.43]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(lathe, 28), coat, [0, 0.2, 0]);
  for (const s of [-1, 1]) {
    cyl(g, mat('#2a1a14'), 0.045, 0.05, 0.22, [s * 0.07, 0.11, 0]);
    blob(g, mat('#2a1a14'), [s * 0.07, 0.02, 0.03], [0.055, 0.04, 0.085]);
  }
  add(g, new THREE.TorusGeometry(0.1, 0.035, 10, 28), white, [0, 0.62, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
  const head = new THREE.Group(); head.position.y = 0.76; g.add(head);
  blob(head, skin, [0, 0, 0], [0.105, 0.115, 0.1]);
  blob(head, hair, [0, -0.04, -0.045], [0.14, 0.17, 0.08]);
  for (const s of [-1, 1]) {
    blob(head, hair, [s * 0.1, -0.1, 0.0], [0.045, 0.14, 0.055]);
    blob(head, mat('#fff'), [s * 0.04, 0.012, 0.088], [0.026, 0.03, 0.012]);
    blob(head, mat('#2b1b10'), [s * 0.04, 0.008, 0.098], [0.015, 0.02, 0.01]);
    blob(head, mat('#fff'), [s * 0.036, 0.016, 0.106], [0.006, 0.006, 0.004]);
    blob(head, hair, [s * 0.025, -0.035, 0.1], [0.04, 0.012, 0.012], [0, 0, s * 0.25]);
  }
  blob(head, skin, [0, -0.012, 0.105], [0.016, 0.02, 0.016]);
  add(head, new THREE.ConeGeometry(0.03, 0.09, 12), hair, [0, -0.1, 0.085], [Math.PI, 0, 0]);
  const brim = cyl(head, mat('#3a2a50'), 0.22, 0.22, 0.02, [0, 0.085, 0]); brim.scale.set(1, 1, 1);
  cyl(head, mat('#3a2a50'), 0.1, 0.12, 0.12, [0, 0.15, 0]);
  add(head, new THREE.TorusGeometry(0.11, 0.012, 8, 28), mat('#e2b13c', { metalness: 0.5 }), [0, 0.11, 0], [Math.PI / 2, 0, 0]);
  const feather = blob(head, white, [0.12, 0.2, -0.02], [0.02, 0.13, 0.05], [0, 0, -0.9]);
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.14, 0.6, 0); g.add(sh);
    const l = cyl(sh, coat, 0.04, 0.034, 0.26, [0, -0.13, 0]);
    blob(sh, white, [0, -0.27, 0], [0.04, 0.03, 0.04]); blob(sh, skin, [0, -0.3, 0], [0.032, 0.036, 0.032]);
    sh.rotation.z = s * 0.25; arms[k] = sh;
  }
  g.scale.setScalar(scale); g.userData = { head, arms, feather };
  return g;
}

/** Round clock: white face with hands, red rim. Faces +z. */
export function createClock(r = 0.1, hour = 3, minute = 0) {
  const g = new THREE.Group();
  cyl(g, mat('#d6402f'), r, r, 0.04, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CircleGeometry(r * 0.86, 32), mat('#fffdf2'), [0, 0, 0.0205]);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; add(g, new THREE.BoxGeometry(r * 0.04, r * 0.12, 0.004), mat('#222'), [Math.sin(a) * r * 0.72, Math.cos(a) * r * 0.72, 0.023], [0, 0, -a]); }
  const hand = (len, ang, w) => { const h = add(g, new THREE.BoxGeometry(w, len, 0.006), mat('#222'), [Math.sin(ang) * len / 2, Math.cos(ang) * len / 2, 0.027], [0, 0, -ang]); return h; };
  hand(r * 0.5, (hour % 12) * Math.PI / 6 + minute / 60 * Math.PI / 6, r * 0.07); hand(r * 0.72, minute / 60 * Math.PI * 2, r * 0.045);
  return g;
}

/** Heap of gold coins (instanced), radius `r`, `n` coins. */
export function createCoinPile(r = 0.6, n = 700, seed = 3) {
  const R = rng(seed), geo = new THREE.CylinderGeometry(0.07, 0.07, 0.016, 20), m = mat('#f4b81f', { metalness: 0.7, roughness: 0.3 });
  const inst = new THREE.InstancedMesh(geo, m, n), d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, rad = Math.sqrt(R()) * r, h = Math.max(0, 1 - rad / r) * r * 0.55;
    d.position.set(Math.cos(a) * rad, h + R() * 0.03, Math.sin(a) * rad);
    d.rotation.set((R() - 0.5) * 1.5, R() * 6, (R() - 0.5) * 1.5); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
  }
  inst.castShadow = inst.receiveShadow = true; return inst;
}

/** Point a globe/character arm at a WORLD point via its userData.reach. */
export function reachWorld(who, key, p) {
  who.updateMatrixWorld(true);
  const l = who.worldToLocal(new THREE.Vector3(...p)); who.userData.reach(key, [l.x, l.y, l.z]);
}
