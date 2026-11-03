// Shared scene helpers for the Life Biosciences deck: stage, harbour water, dock, figures, props.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createLifeboat } from './lifeboat.js';

export { THREE, createLifeboat, canvasTexture, rng };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);

/** Anime stage with a sky; returns { stage, scene, finish(camera pos, look-at, clouds?) }. */
export function makeStage(o = {}) {
  const stage = createAnimeStage({
    fov: num('fov', o.fov ?? 40), sunElevation: num('el', o.el ?? 38), sunAzimuth: num('az', o.az ?? 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', o.seed ?? 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  return stage;
}

export function finish(stage, cam, look, characters = []) {
  const pm = new Set(); characters.forEach((c) => c.traverse((x) => pm.add(x)));
  stage.toonify(stage.scene, (m) => pm.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}

/** Harbour water plane + foam rings around given [x,z,r] spots. */
export function water(scene, color = '#2f93d6', foam = []) {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color, { roughness: 0.35 }), [0, -0.02, 0], [-Math.PI / 2, 0, 0]);
  for (const [x, z, r] of foam) {
    const f = add(scene, new THREE.RingGeometry(r, r + 0.07, 48), mat('#ffffff', { transparent: true, opacity: 0.8 }), [x, -0.005, z], [-Math.PI / 2, 0, 0]);
    f.castShadow = false;
  }
}

/** Wooden dock slab: top at y = h, spanning x0..x1, z0..z1 with posts. */
export function dock(scene, x0, x1, z0, z1, h = 0.3) {
  const g = new THREE.Group(); scene.add(g);
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const tex = canvasTexture(256, (c, s) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#b98650' : '#c8955c'; c.fillRect(0, i * s / 8, s, s / 8); c.fillStyle = '#5a3a1c'; c.fillRect(0, i * s / 8, s, 3); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(Math.max(1, w / 1.5), Math.max(1, d / 1.5));
  box(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), [cx, h / 2 + 0.2, cz], [w, h, d]);
  for (const x of [x0 + 0.1, x1 - 0.1]) for (const z of [z0 + 0.1, z1 - 0.1]) cyl(g, mat('#6b4423'), [x, -0.1, z], 0.1, 1.2);
  return g;
}

/** Wooden rowing oar from the hand at p0 down into the water at p1. */
export function oar(parent, p0, p1) {
  const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), d = b.clone().sub(a), len = d.length();
  const g = new THREE.Group(); g.position.copy(a); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
  cyl(g, mat('#c89560'), [0, -len / 2, 0], 0.018, len);
  box(g, mat('#e8c58a'), [0, -len + 0.1, 0], [0.12, 0.3, 0.02]);
  parent.add(g); return g;
}

/** Chibi human: head, hair, body, legs; seated when `sit`. Faces +z. Returns Group with .arms {l,r}. */
export function person({ shirt = '#3b82c4', hair = '#3a2a22', skin = '#ffd9b8', scale = 1, sit = false, eyePatch = false } = {}) {
  const g = new THREE.Group(), s = mat(skin);
  blob(g, s, [0, 0.95, 0], [0.19, 0.2, 0.18]);
  blob(g, mat(hair), [0, 1.04, -0.03], [0.205, 0.17, 0.2]);
  for (const sx of [-1, 1]) {
    blob(g, mat('#fff'), [sx * 0.07, 0.95, 0.165], [0.04, 0.052, 0.012]);
    blob(g, mat('#2a1a10'), [sx * 0.07, 0.945, 0.172], [0.026, 0.04, 0.01]);
    blob(g, mat('#fff'), [sx * 0.07 - 0.008, 0.96, 0.178], [0.01, 0.01, 0.006]);
  }
  if (eyePatch) { blob(g, mat('#f6f6f6'), [0.07, 0.95, 0.176], [0.065, 0.07, 0.014]); }
  cyl(g, mat(shirt), [0, 0.6, 0], 0.17, 0.5, [0, 0, 0], 0.13);
  const arms = {};
  for (const [k, sx] of [['l', 1], ['r', -1]]) {
    const a = new THREE.Group(); a.position.set(sx * 0.17, 0.78, 0); g.add(a); arms[k] = a;
    cyl(a, mat(shirt), [0, -0.16, 0], 0.036, 0.32); blob(a, s, [0, -0.34, 0], [0.04, 0.04, 0.04]);
    a.rotation.z = sx * 0.12;
    if (sit) { cyl(g, mat('#34425e'), [sx * 0.07, 0.34, 0.14], 0.05, 0.32, [Math.PI / 2, 0, 0]); cyl(g, mat('#34425e'), [sx * 0.07, 0.2, 0.3], 0.05, 0.3); }
    else cyl(g, mat('#34425e'), [sx * 0.07, 0.18, 0], 0.05, 0.38);
    blob(g, mat('#c8483c'), [sx * 0.07, sit ? 0.04 : 0.02, sit ? 0.34 : 0.04], [0.06, 0.04, 0.09]);
  }
  g.scale.setScalar(scale); g.userData.arms = arms; return g;
}

/** Eyeball with iris and catchlights (spherical caps hugging the sclera), facing +z. */
export function eyeball({ iris = '#3b8fd9', r = 0.5, face = true } = {}) {
  const g = new THREE.Group();
  blob(g, mat('#fbfbfb', { roughness: 0.3 }), [0, 0, 0], [r, r, r]);
  const cap = (k, theta, c, dir = [0, 0, 1]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * (1 + 0.004 * k), 32, 10, 0, Math.PI * 2, 0, theta), mat(c, { roughness: 0.3 }));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()); g.add(m);
  };
  cap(1, 0.62, iris); cap(2, 0.3, '#08121f'); cap(3, 0.11, '#fff', [-0.2, 0.22, 1]); cap(3, 0.06, '#fff', [0.17, -0.2, 1]);
  if (face) { const m = new THREE.Mesh(new THREE.TorusGeometry(r * 0.12, r * 0.02, 8, 16, Math.PI), mat('#7a2a2a')); m.rotation.z = Math.PI; m.position.set(0, -r * 0.7, r * 0.7); g.add(m); }
  return g;
}

/** Tortilla-chip nacho plate with melted cheese, jalapenos. */
export function nachos(scale = 1) {
  const g = new THREE.Group(), r = rng(3);
  cyl(g, mat('#f4f1ea'), [0, 0.03, 0], 0.5, 0.06, [0, 0, 0], 0.42);
  for (let i = 0; i < 16; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 0.34, y = 0.08 + (i % 3) * 0.05;
    const tri = add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.02, 3), mat('#e8b440'), [Math.cos(a) * d, y, Math.sin(a) * d], [0.3 * (r() - 0.5), r() * 6.28, 0.3 * (r() - 0.5) + (i % 2) * 0.3]);
    const cheese = add(g, new THREE.SphereGeometry(0.05, 10, 8), mat('#ffb21a', { roughness: 0.3 }), [Math.cos(a) * d, y + 0.02, Math.sin(a) * d], [0, 0, 0], [1.4, 0.4, 1.2]);
  }
  for (let i = 0; i < 4; i++) cyl(g, mat('#4c9a2a'), [Math.cos(i * 1.7) * 0.2, 0.3, Math.sin(i * 1.7) * 0.2], 0.04, 0.02);
  g.scale.setScalar(scale); return g;
}

/** Plain canvas-text plane facing +z. */
export function label(text, w, h, { bg = '#ffffff', fg = '#222', font = 'bold 120px Arial' } = {}) {
  const tex = canvasTexture(512, (c, s) => { c.fillStyle = bg; c.fillRect(0, 0, s, s); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, s / 2, s / 2 + 8); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}

/** Round cartoon cell: translucent body, nucleus, optional face. */
export function cell({ color = '#ff8fb0', r = 0.5, face = true } = {}) {
  const g = new THREE.Group();
  blob(g, mat(color, { roughness: 0.3 }), [0, 0, 0], [r, r, r]);
  blob(g, mat('#7a3aa8', { roughness: 0.4 }), [-r * 0.2, r * 0.25, r * 0.55], [r * 0.2, r * 0.2, r * 0.2]);
  if (face) for (const sx of [-1, 1]) {
    blob(g, mat('#fff'), [sx * r * 0.28, -r * 0.05, r * 0.88], [r * 0.14, r * 0.17, r * 0.05]);
    blob(g, mat('#1a1020'), [sx * r * 0.28, -r * 0.06, r * 0.92], [r * 0.08, r * 0.11, r * 0.04]);
  }
  return g;
}

/** Sagging rope between two world points. */
export function rope(parent, a, b, sag = 0.15, color = '#d9b878', r = 0.02) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), mid = A.clone().lerp(B, 0.5); mid.y -= sag;
  return add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([A, mid, B]), 20, r, 8), mat(color));
}

/** Syringe pointing along local -y: needle tip at y = -(0.05 + len). Origin at the plunger-side end of the barrel. */
export function syringe(len = 0.35, r = 0.045) {
  const g = new THREE.Group();
  cyl(g, mat('#e8f6ff', { transparent: true, opacity: 0.85, roughness: 0.2 }), [0, -len / 2, 0], r, len);
  cyl(g, mat('#3b8fd9'), [0, -len * 0.35, 0], r * 0.85, len * 0.6);
  cyl(g, mat('#444'), [0, 0.08, 0], 0.008, 0.16); cyl(g, mat('#555'), [0, 0.16, 0], r * 1.2, 0.02);
  cyl(g, mat('#c9ced4', { metalness: 0.6, roughness: 0.3 }), [0, -len - 0.1, 0], 0.008, 0.2);
  return g;
}

/** Wooden crate with canvas-drawn side art. */
export function crate(w, h, d, draw) {
  const g = new THREE.Group(), wood = mat('#b98650');
  box(g, wood, [0, h / 2, 0], [w, h, d]);
  for (const y of [0.1, h - 0.1]) box(g, mat('#7a5230'), [0, y, 0], [w + 0.03, 0.05, d + 0.03]);
  const tex = canvasTexture(512, draw), face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.7), new THREE.MeshStandardMaterial({ map: tex }));
  face.position.set(0, h / 2, d / 2 + 0.017); g.add(face);
  return g;
}
