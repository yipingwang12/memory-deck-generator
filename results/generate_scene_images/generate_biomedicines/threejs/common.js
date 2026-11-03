// Shared scene helpers for the Generate Biomedicines deck.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createGenerator } from './generator.js';
export { THREE, guard, canvasTexture, rng, createGenerator };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const textTex = (txt, { w = 512, h = 256, bg = '#111', fg = '#fff', font = 'bold 170px Arial' } = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** Chibi person: head with anime eyes, coat body, arms/legs. Returns Group with userData.arms {l,r}, head. */
export function createPerson({ coat = '#2a4a8a', skin = '#ffd9b8', hair = '#3a2a1a', pants = '#2a2f3a', scale = 1, eyeColor = '#4a6a3a' } = {}) {
  const g = new THREE.Group();
  blob(g, mat(coat), [0, 0.55, 0], [0.2, 0.28, 0.15]);
  const head = new THREE.Group(); head.position.y = 0.97; g.add(head);
  blob(head, mat(skin, { roughness: 0.5 }), [0, 0, 0], [0.19, 0.19, 0.18]);
  blob(head, mat(hair), [0, 0.06, -0.03], [0.2, 0.17, 0.19]);
  for (const s of [-1, 1]) {
    const e = (c, rx, ry, x, y, z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat(c, { roughness: 0.3 })); m.scale.set(rx, ry, 1); m.position.set(x, y, z); head.add(m); };
    e('#ffffff', 0.05, 0.062, s * 0.075, -0.01, 0.172); e(eyeColor, 0.038, 0.054, s * 0.075, -0.012, 0.174); e('#0a0a0a', 0.02, 0.03, s * 0.075, -0.01, 0.176); e('#ffffff', 0.012, 0.012, s * 0.068, 0.012, 0.178);
    e('#ff9a9a', 0.028, 0.015, s * 0.12, -0.08, 0.15);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 16, Math.PI), mat('#8a3a3a')); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.09, 0.178); head.add(mouth);
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const a = new THREE.Group(); a.position.set(s * 0.22, 0.75, 0); g.add(a);
    cyl(a, mat(coat), [0, -0.14, 0], 0.045, 0.3); blob(a, mat(skin), [0, -0.3, 0], [0.05, 0.05, 0.05]); a.rotation.z = s * 0.2; arms[k] = a;
    cyl(g, mat(pants), [s * 0.09, 0.15, 0], 0.055, 0.3); blob(g, mat('#2b2018'), [s * 0.09, 0.03, 0.04], [0.07, 0.04, 0.1]);
  }
  g.userData = { head, arms }; g.scale.setScalar(scale); return g;
}

/** Standard anime stage + meadow/ground; returns { stage, scene, finish(chars, cam) }. */
export function setupScene(P, { ground = '#6fae45', sky = {}, el = 38, az = 150, sun = 2.6, groundSize = 400 } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: sun, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const scene = stage.scene;
  if (ground) add(scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const chars = new Set();
  return {
    stage, scene, num,
    /** toonify given character groups, set camera, finish. */
    done(groups, cam = {}) {
      for (const g of groups) g.traverse((o) => chars.add(o));
      stage.toonify(scene, (m) => chars.has(m));
      stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
      stage.camera.position.set(num('cx', cam.pos?.[0] ?? 0), num('cy', cam.pos?.[1] ?? 0.9), num('cz', cam.pos?.[2] ?? 3));
      stage.camera.lookAt(num('tx', cam.at?.[0] ?? 0), num('ty', cam.at?.[1] ?? 0.7), num('tz', cam.at?.[2] ?? 0));
      stage.finish();
    },
  };
}
export const HEAD = `<meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>`;
