// Shared scene helpers for the kernal_biologics scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createKernel } from './kernel.js';
export { THREE, guard, canvasTexture, rng, createKernel };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const textTex = (txt, { bg = null, fg = '#222', w = 512, h = 256, font = 'bold 150px sans-serif' } = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const sign = (p, txt, pos, size, opts = {}, rot = [0, 0, 0]) => {
  const m = new THREE.MeshStandardMaterial({ map: textTex(txt, opts), roughness: 0.8, transparent: !opts.bg });
  return add(p, new THREE.PlaneGeometry(...size), m, pos, rot);
};

/** A T-cell soldier: round cell, helmet, face, little limbs, optional shield/spear. */
export function tcell({ color = '#6fb7ff', plume = '#e2453c', shield = true, spear = true, scale = 1 } = {}) {
  const g = new THREE.Group(), skin = mat(color, { roughness: 0.5 });
  blob(g, skin, [0, 0.32, 0], [0.3, 0.29, 0.28]);
  const helm = blob(g, mat('#c9d0d8', { metalness: 0.6, roughness: 0.35 }), [0, 0.42, 0], [0.325, 0.27, 0.305]); helm.geometry = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  cyl(g, mat('#aeb6bf', { metalness: 0.6 }), [0, 0.45, 0.0], 0.0, 0.01); 
  blob(g, mat(plume), [0, 0.72, 0], [0.05, 0.1, 0.18]);
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [s * 0.1, 0.3, 0.255], [0.065, 0.08, 0.03]);
    blob(g, mat('#14202e'), [s * 0.1, 0.295, 0.275], [0.042, 0.058, 0.02]);
    blob(g, mat('#fff'), [s * 0.09, 0.32, 0.292], [0.016, 0.016, 0.01]);
    blob(g, mat(color, { roughness: 0.5 }), [s * 0.2, 0.08, 0.03], [0.07, 0.1, 0.07]);
    blob(g, mat('#e9b14a'), [s * 0.3, 0.27, 0.0], [0.05, 0.05, 0.05]);
    blob(g, mat('#ff8fa0', { transparent: true, opacity: 0.6 }), [s * 0.17, 0.2, 0.25], [0.04, 0.02, 0.02]);
  }
  const mo = add(g, new THREE.TorusGeometry(0.035, 0.007, 8, 16, Math.PI), mat('#6a2230'), [0, 0.2, 0.275], [0, 0, Math.PI]);
  if (shield) { const sh = cyl(g, mat('#d9a42e', { metalness: 0.4 }), [-0.36, 0.22, 0.12], 0.17, 0.04, [Math.PI / 2, 0, 0]); cyl(g, mat('#e2453c'), [-0.36, 0.22, 0.145], 0.09, 0.02, [Math.PI / 2, 0, 0]); }
  if (spear) { cyl(g, mat('#8a5a2b'), [0.36, 0.45, 0.05], 0.015, 0.95); add(g, new THREE.ConeGeometry(0.04, 0.14, 12), mat('#dfe5ea', { metalness: 0.6 }), [0.36, 0.97, 0.05]); }
  g.scale.setScalar(scale); return g;
}

export function coin(p, pos, r = 0.1, rot = [Math.PI / 2, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); p.add(g);
  cyl(g, mat('#f2b91d', { metalness: 0.55, roughness: 0.3 }), [0, 0, 0], r, r * 0.22);
  cyl(g, mat('#ffd75a', { metalness: 0.4, roughness: 0.3 }), [0, 0, 0], r * 0.7, r * 0.26);
  return g;
}

export function letter(p, pos, rot = [0, 0, 0], s = 1, label = '') {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); g.scale.setScalar(s); p.add(g);
  box(g, mat('#fff8e8'), [0, 0, 0], [0.5, 0.34, 0.03]);
  add(g, new THREE.ConeGeometry(0.3, 0.2, 3), mat('#f0e2c2'), [0, 0.085, 0.02], [0, 0, Math.PI], [1, 1, 0.1]).rotation.z = Math.PI;
  blob(g, mat('#d83a3a'), [0, 0.0, 0.03], [0.05, 0.05, 0.015]);
  return g;
}

/** Stage with warm Shinkai sky. Returns {stage, scene, kernel(opts), finish}. */
export function makeStage(opts = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: opts.el ?? 35, sunAzimuth: opts.az ?? 150, exposure: 1,
    sky: { cover: 2, seed: opts.seed ?? 5, towerTop: 0.5, puffCover: 2, ...(opts.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const chars = new Set();
  const api = {
    stage, scene: stage.scene, num,
    ground(color = '#6fae45') { return add(stage.scene, new THREE.PlaneGeometry(600, 600), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]); },
    kernel(o = {}) { const k = createKernel(o); stage.scene.add(k); return k; },
    toon(...objs) { objs.forEach((o) => o.traverse((m) => chars.add(m))); },
    finish(cam = {}) {
      stage.toonify(stage.scene, (m) => chars.has(m));
      stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
      const c = { x: 0, y: 1, z: 3.4, tx: 0, ty: 0.7, ...cam };
      stage.camera.position.set(num('cx', c.x), num('cy', c.y), num('cz', c.z));
      stage.camera.lookAt(num('tx', c.tx), num('ty', c.ty), 0);
      stage.finish();
    },
  };
  return api;
}

/** Golden harp, ~2.4 tall, strings facing +z. */
export function harp() {
  const g = new THREE.Group(), gold = mat('#f0b82a', { metalness: 0.5, roughness: 0.3 }), wood = mat('#8a4a22');
  box(g, wood, [0, 0.12, 0], [1.3, 0.24, 0.3]);
  // soundbox pillar (right) and curved neck (top)
  box(g, gold, [0.55, 1.2, 0], [0.16, 2.2, 0.2]);
  const neck = add(g, new THREE.TorusGeometry(0.62, 0.09, 12, 40, Math.PI * 0.62), gold, [-0.05, 1.7, 0], [0, 0, 0.35]);
  neck.position.set(-0.1, 1.55, 0);
  box(g, gold, [-0.62, 0.7, 0], [0.12, 1.1, 0.16], [0, 0, 0]);
  for (let i = 0; i < 8; i++) { const x = -0.5 + i * 0.13, top = 1.95 - i * 0.12; cyl(g, mat('#fff6d8'), [x, (top + 0.28) / 2, 0.0], 0.012, top - 0.28); }
  return g;
}
export function note(p, pos, color = '#ffffff', s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); p.add(g);
  blob(g, mat(color, { emissive: color, emissiveIntensity: 0.3 }), [0, 0, 0], [0.09, 0.07, 0.05], [0, 0, 0.4]);
  cyl(g, mat(color), [0.08, 0.17, 0], 0.012, 0.34); box(g, mat(color), [0.13, 0.33, 0], [0.12, 0.05, 0.02], [0, 0, -0.4]);
  return g;
}
