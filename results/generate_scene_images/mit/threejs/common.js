// Shared scene scaffolding for the MIT deck: stage, ground, mitten placement, toonify, camera.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createMitten } from './mitten.js';
export { THREE, canvasTexture, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (parent, m, r1, r2, h, pos, rot, scl) => add(parent, new THREE.CylinderGeometry(r1, r2, h, 28), m, pos, rot, scl);
export const box = (parent, m, w, h, d, pos, rot) => add(parent, new THREE.BoxGeometry(w, h, d), m, pos, rot);

/** Create a mitten at (x,z) facing yaw ry, scale s, posed; returns it. */
export function placeMitten(scene, { x = 0, z = 0, ry = 0, s = 1.4, pose = {}, reach = null } = {}) {
  const m = createMitten({ scale: s }); m.position.set(x, 0, z); m.rotation.y = ry; scene.add(m);
  m.userData.pose({ headTilt: 0.05, ...pose });
  if (reach) for (const [k, t] of Object.entries(reach)) { m.updateMatrixWorld(true); const l = m.worldToLocal(new THREE.Vector3(...t)); m.userData.reach(k, [l.x, l.y, l.z]); }
  return m;
}

/**
 * Build a scene. build({stage, scene, num, ...}) returns { chars: [Group], cam:{pos,look} }.
 * opts: ground color (null = none), sky overrides, fov, sun.
 */
export function run(build, { ground = '#6fae45', sky = {}, fov = 40, el = 35, az = 150, ambient = 2.3 } = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: 1,
      sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: ambient }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const { chars, cam } = build({ stage, scene, num, P });
    const cs = new Set(); chars.forEach((c) => c.traverse((o) => cs.add(o)));
    stage.toonify(scene, (m) => cs.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cam.pos[0]), num('cy', cam.pos[1]), num('cz', cam.pos[2]));
    stage.camera.lookAt(num('tx', cam.look[0]), num('ty', cam.look[1]), num('tz', cam.look[2] ?? 0));
    stage.finish();
  });
}

export const PAGE = (title, body) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
${body}
</script></body></html>
`;
