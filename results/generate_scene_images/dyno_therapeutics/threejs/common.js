// Shared scene helpers for Dyno scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createDinosaur } from './dinosaur.js';
export { THREE, guard, canvasTexture, rng, createDinosaur };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r0, r1, h, rot) => add(p, new THREE.CylinderGeometry(r1, r0, h, 28), m, pos, rot);
export const label = (text, w = 256, h = 128, bg = '#ffffff', fg = '#222', font = 'bold 90px sans-serif') => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); let px = +font.match(/(\d+)px/)[1]; const fam = font.replace(/\d+px/, '%PX%');
  x.font = fam.replace('%PX%', px + 'px'); while (x.measureText(text).width > w * 0.88 && px > 10) { px -= 4; x.font = fam.replace('%PX%', px + 'px'); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 4); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const sign = (parent, text, pos, w, h, bg, fg, rot = [0, 0, 0]) => {
  const m = add(parent, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: label(text, 512, Math.round(512 * h / w), bg, fg, 'bold 150px sans-serif') }), pos, rot); return m;
};
// opts: ground color, dino opts, cam {c:[x,y,z], t:[x,y,z], fov}, skyDeep
export function scene(build, { ground = '#6fae45', fov = 40, el = 35, az = 150, cover = 2, cam = [0, 0.9, 3.4], look = [0, 0.55, 0], dino = {}, dpos = [0, 0, 0], dry = 0, scl = 1, pose, groundSize = 400 } = {}) {
  guard(() => {
    const stage = createAnimeStage({
      fov, sunElevation: el, sunAzimuth: az, exposure: 1, sky: { cover, seed: 5, towerTop: 0.5, puffCover: 2 },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const sc = stage.scene;
    if (ground) add(sc, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const d = createDinosaur({ scale: scl, ...dino }); d.position.set(...dpos); d.rotation.y = dry; sc.add(d);
    if (pose) pose(d);
    const ctx = { stage, sc, d, THREE, chars: [d] };
    build(ctx);
    d.updateMatrixWorld(true);
    const dm = new Set(); ctx.chars.forEach((c) => c.traverse((o) => dm.add(o)));
    stage.toonify(sc, (m) => dm.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look);
    stage.finish();
  });
}
export const HEAD = `<!doctype html><html><head><meta charset="utf-8"><title>Dyno</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body><script type="module">`;
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// reach dinosaur hand to a WORLD point
export const reachW = (d, k, p) => { d.updateMatrixWorld(true); d.userData.reach(k, d.worldToLocal(V3(...p)).toArray()); };
// thin cylinder between two world points
export function strut(parent, m, a, b, r = 0.02) {
  const A = V3(...a), B = V3(...b), L = A.distanceTo(B);
  const o = add(parent, new THREE.CylinderGeometry(r, r, L, 12), m, A.clone().add(B).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(V3(0, 1, 0), B.clone().sub(A).normalize()); return o;
}
