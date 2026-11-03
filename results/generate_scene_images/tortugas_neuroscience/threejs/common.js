// Shared scene helpers for the Tortugas deck (stage, mesh helpers, finish).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, canvasTexture, rng };
export { createTurtle, createShell } from './turtle.js';

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Text on a canvas texture material (cue text only). */
export function textMat(text, { bg = '#ffffff', fg = '#222', font = 'bold 150px sans-serif', w = 512, h = 256 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
}

/** Build the stage; `o` overrides: ground colour, sky, cam. Returns { stage, scene, num }. */
export function makeScene(build, o = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', o.fov ?? 40), sunElevation: num('el', 38), sunAzimuth: num('az', 150), exposure: num('exp', 1),
      sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(o.sky ?? {}) },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    if (o.ground !== null) add(scene, new THREE.PlaneGeometry(400, 400), mat(o.ground ?? '#7fba4e'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const chars = build({ stage, scene, num, P }) ?? [];
    const set = new Set(); for (const c of chars) c.traverse((m) => set.add(m));
    stage.toonify(scene, (m) => set.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    const cam = o.cam ?? {};
    stage.camera.position.set(num('cx', cam.pos?.[0] ?? 0), num('cy', cam.pos?.[1] ?? 1), num('cz', cam.pos?.[2] ?? 3));
    stage.camera.lookAt(num('tx', cam.look?.[0] ?? 0), num('ty', cam.look?.[1] ?? 0.6), num('tz', cam.look?.[2] ?? 0));
    stage.finish();
  });
}

/** Cylinder between points a and b. */
export function link(parent, m, a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 14), m);
  o.position.copy(A.clone().add(B).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}
export const egg = (parent, pos, s = 1, color = '#fff4de') => blob(parent, mat(color, { roughness: 0.4 }), pos, [0.1 * s, 0.135 * s, 0.1 * s]);
export const capsule = (parent, m, pos, r, len, rot) => add(parent, new THREE.CapsuleGeometry(r, len, 8, 16), m, pos, rot);
