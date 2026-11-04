// Shared scene helpers for the Biological Computing Co scenes.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCalculator } from './calculator.js';
export { THREE, canvasTexture, createCalculator };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot) => add(p, new THREE.CylinderGeometry(r, r, h, 28), m, pos, rot);

export function textTex(text, { w = 512, h = 256, bg = '#ffffff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 8); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Stage + ground. opts: ground colour, sky colours. */
export function setup(P, { ground = '#8cc063', zenith, horizon } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 38), sunAzimuth: num('az', 150), exposure: 1,
    sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(zenith ? { zenith, horizon } : {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#fff0e0', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const cam = (cx, cy, cz, tx, ty) => { stage.camera.position.set(num('cx', cx), num('cy', cy), num('cz', cz)); stage.camera.lookAt(num('tx', tx), num('ty', ty), 0); };
  return { stage, scene: stage.scene, num, cam };
}

export function finish(stage, chars) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.finish();
}

/** Flag on a pole, base at origin. */
export function flag(color, h = 0.5, text) {
  const g = new THREE.Group();
  cyl(g, mat('#e8e0d0'), [0, h / 2, 0], 0.012, h);
  const m = text ? new THREE.MeshStandardMaterial({ map: textTex(text, { bg: color, fg: '#fff', font: 'bold 120px sans-serif' }), roughness: 0.8 }) : mat(color);
  add(g, new THREE.BoxGeometry(0.3, 0.19, 0.01), m, [0.16, h - 0.11, 0]);
  blob(g, mat('#ffd84a'), [0, h + 0.01, 0], [0.02, 0.02, 0.02]);
  return g;
}

/** Brain-like bumpy sphere. */
export function brain(r = 0.4, color = '#f2a2b5') {
  const geo = new THREE.SphereGeometry(r, 96, 64), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    const g = Math.abs(Math.sin(n.x * 11 + Math.sin(n.y * 7) * 1.5) * Math.sin(n.y * 9 + n.z * 5) * Math.cos(n.z * 10 + n.x * 3));
    v.copy(n).multiplyScalar(r * (1 - 0.07 * (1 - Math.min(1, g * 3))));
    if (Math.abs(n.x) < 0.04) v.multiplyScalar(0.96);
    p.setXYZ(i, v.x, v.y * 0.88, v.z * 1.08);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.5 })); m.castShadow = true; return m;
}

/** Penguin facing +x (beak). */
export function penguin(flip = 1) {
  const g = new THREE.Group();
  blob(g, mat('#26303c'), [0, 0.2, 0], [0.15, 0.22, 0.13]);
  blob(g, mat('#f6f2ea'), [0.05 * flip, 0.17, 0], [0.11, 0.17, 0.11]);
  blob(g, mat('#26303c'), [0, 0.43, 0], [0.11, 0.1, 0.1]);
  add(g, new THREE.ConeGeometry(0.035, 0.1, 12), mat('#ff9a2e'), [0.12 * flip, 0.42, 0], [0, 0, -flip * Math.PI / 2]);
  for (const z of [-1, 1]) { blob(g, mat('#fff'), [0.06 * flip, 0.46, z * 0.07], [0.028, 0.034, 0.012]); blob(g, mat('#111'), [0.068 * flip, 0.46, z * 0.078], [0.016, 0.02, 0.01]);
    blob(g, mat('#26303c'), [0, 0.22, z * 0.14], [0.05, 0.14, 0.03], [0, 0, 0.3 * flip]); blob(g, mat('#ff9a2e'), [0.02, 0.02, z * 0.06], [0.06, 0.02, 0.04]); }
  return g;
}

export function heart(color = '#ff4f7a', s = 0.1) {
  const sh = new THREE.Shape(); sh.moveTo(0, -1); sh.bezierCurveTo(-1.6, 0, -0.9, 1.1, 0, 0.4); sh.bezierCurveTo(0.9, 1.1, 1.6, 0, 0, -1);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 });
  g.scale(s, s, s); g.translate(0, 0, -0.25 * s);
  const m = new THREE.Mesh(g, mat(color, { roughness: 0.4 })); m.castShadow = true; return m;
}
