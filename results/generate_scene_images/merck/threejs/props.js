// Shared Merck scene helpers: stage + meadow/pond, tents, people, canvas-text boards.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createPond } from './pond.js';
export { THREE, guard, rng, createPond };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, rt, rb, h, rot, seg = 24) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), m, pos, rot);

/** Canvas text texture, w x h px; draw(ctx,w,h). */
export function textTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Flat board `wd x ht` showing text. */
export function textBoard(text, wd, ht, { bg = '#1b2a3a', fg = '#ffd23f', font = 'bold', frame = '#5b3a1e', px = 256 } = {}) {
  const g = new THREE.Group();
  const w = px * wd / ht * 1, h = px;
  const tex = textTex(Math.round(w), h, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = fg; let fs = H * 0.62; ctx.font = `${font} ${fs}px Arial Black, Helvetica, sans-serif`; const mw = ctx.measureText(text).width; if (mw > W * 0.9) { fs *= W * 0.9 / mw; ctx.font = `${font} ${fs}px Arial Black, Helvetica, sans-serif`; } ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + H * 0.03);
  });
  box(g, mat(frame), [0, 0, 0], [wd + 0.1, ht + 0.1, 0.06]);
  add(g, new THREE.PlaneGeometry(wd, ht), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [0, 0, 0.033]);
  return g;
}

/** Simple standing person facing +z. opts: shirt, pants, skin, hair, hat('pith'|'cap'|null), height */
export function person({ shirt = '#e0703a', pants = '#3a4a6a', skin = '#ffd9b8', hair = '#3a2416', hat = null, scale = 1, backpack = false, glasses = false } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { cyl(g, mat(pants), [s * 0.07, 0.28, 0], 0.05, 0.05, 0.56); blob(g, mat('#2a2220'), [s * 0.07, 0.03, 0.04], [0.06, 0.04, 0.09]); }
  cyl(g, mat(shirt), [0, 0.76, 0], 0.15, 0.17, 0.46);
  g.userData.armL = []; 
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.2, 0.95, 0); a.rotation.z = s * 0.25;
    cyl(a, mat(shirt), [0, -0.18, 0], 0.04, 0.04, 0.36); blob(a, mat(skin), [0, -0.38, 0], [0.045, 0.045, 0.045]); g.add(a);
    g.userData[s > 0 ? 'armL' : 'armR'] = a;
  }
  const head = new THREE.Group(); head.position.y = 1.2; g.add(head);
  blob(head, mat(skin), [0, 0, 0], [0.13, 0.14, 0.13]);
  blob(head, mat(hair), [0, 0.05, -0.02], [0.14, 0.12, 0.13]);
  for (const s of [-1, 1]) {
    blob(head, mat('#ffffff'), [s * 0.05, 0, 0.115], [0.03, 0.036, 0.015]);
    blob(head, mat('#1a1210'), [s * 0.05, 0, 0.125], [0.018, 0.026, 0.01]);
    if (glasses) add(head, new THREE.TorusGeometry(0.04, 0.006, 8, 20), mat('#222'), [s * 0.05, 0, 0.128]);
  }
  if (glasses) box(head, mat('#222'), [0, 0, 0.13], [0.04, 0.006, 0.006]);
  add(head, new THREE.TorusGeometry(0.03, 0.005, 6, 12, Math.PI), mat('#8a3a3a'), [0, -0.06, 0.125], [0, 0, Math.PI]);
  if (hat === 'pith') {
    blob(head, mat('#e8d9a0'), [0, 0.1, 0], [0.16, 0.1, 0.16]); cyl(head, mat('#d9c78a'), [0, 0.07, 0], 0.23, 0.23, 0.015, [0, 0, 0], 28);
  }
  if (hat === 'cap') { blob(head, mat('#2a4a8a'), [0, 0.08, 0], [0.145, 0.08, 0.145]); box(head, mat('#2a4a8a'), [0, 0.06, 0.15], [0.14, 0.012, 0.1]); }
  if (backpack) { box(g, mat('#c0462a'), [0, 0.82, -0.17], [0.26, 0.36, 0.14]); cyl(g, mat('#e8d9a0'), [0, 0.65, -0.17], 0.09, 0.09, 0.28, [0, 0, Math.PI / 2]); }
  g.scale.setScalar(scale); g.userData.head = head; return g;
}

/** Pyramid tent, base width w, facing +z with a dark door. */
export function tent({ w = 1.6, h = 1.3, color = '#e8c35a', stripe = '#c0462a' } = {}) {
  const g = new THREE.Group();
  const body = add(g, new THREE.ConeGeometry(w * 0.72, h, 4, 1), mat(color), [0, h / 2, 0], [0, Math.PI / 4, 0]);
  for (const s of [-1, 1]) add(g, new THREE.ConeGeometry(w * 0.72 * 0.55, h * 0.55, 4, 1), mat(stripe), [0, h * 0.78, 0], [0, Math.PI / 4, 0]);
  add(g, new THREE.ConeGeometry(w * 0.72 * 0.4, h * 0.4, 4, 1), mat(stripe), [0, h * 0.85, 0.0], [0, Math.PI / 4, 0]).scale.set(1.01, 1.01, 1.01);
  const door = new THREE.Shape(); door.moveTo(-w * 0.16, 0); door.lineTo(w * 0.16, 0); door.lineTo(0, h * 0.62); door.closePath();
  add(g, new THREE.ShapeGeometry(door), mat('#2a1a14'), [0, 0.01, w * 0.36 + 0.005], [0, 0, 0]);
  cyl(g, mat('#6a4a2a'), [0, h + 0.18, 0], 0.012, 0.012, 0.4);
  const flag = new THREE.Shape(); flag.moveTo(0, 0); flag.lineTo(0.28, -0.07); flag.lineTo(0, -0.14); flag.closePath();
  add(g, new THREE.ShapeGeometry(flag, 1), new THREE.MeshStandardMaterial({ color: '#e0403a', side: THREE.DoubleSide }), [0, h + 0.34, 0]);
  return g;
}

/** Stage with meadow + murky pond. opts: pond:{x,z,r}. Returns { stage, scene }. */
export function makeStage(P, { pond = true, el = 38, az = 150 } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  add(scene, new THREE.PlaneGeometry(400, 400), mat('#6fae45'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  if (pond) {
    add(scene, new THREE.CircleGeometry(7, 48), mat('#7d8f4a', { roughness: 0.3 }), [0, 0.004, -12], [-Math.PI / 2, 0, 0]);
    add(scene, new THREE.CircleGeometry(5.2, 48), mat('#6b7f45', { roughness: 0.3 }), [0, 0.006, -12], [-Math.PI / 2, 0, 0]);
  }
  return { stage, scene, num };
}

export function finish({ stage, scene }, chars, cam, look) {
  const pm = new Set(); for (const c of chars) c.traverse((o) => pm.add(o));
  stage.toonify(scene, (m) => pm.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look);
  stage.finish();
}
