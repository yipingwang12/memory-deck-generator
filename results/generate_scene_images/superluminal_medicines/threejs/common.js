// Shared stage boot for Superluminal scenes (not a kit file). boot(build, opts): build(ctx) composes the scene.
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSuperhero } from './superhero.js';
import { mat, add } from './props.js';

export function boot(build, { ground = '#7fb85a', cover = 2, seed = 5, el = 38, az = 150, fov = 38, clouds = true } = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search);
    const stage = createAnimeStage({
      fov, sunElevation: el, sunAzimuth: az, exposure: 1,
      sky: { cover, seed, towerTop: 0.5, puffCover: 2 },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.5, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene, chars = [];
    const g = add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    stage.camera.position.set(0, 1.15, 5.4); stage.camera.lookAt(0, 0.85, 0);
    const ctx = {
      THREE, stage, scene, P, groundMesh: g,
      char: (o) => { chars.push(o); scene.add(o); return o; },
      hero: ({ x = 0, y = 0, z = 0, ry = 0, scale = 1.5, pose = {}, cape = 0.25 } = {}) => {
        const h = createSuperhero({ scale, cape }); h.position.set(x, y, z); h.rotation.y = ry; h.userData.pose(pose); chars.push(h); scene.add(h); return h;
      },
      reach: (h, k, w) => { h.updateMatrixWorld(true); const t = h.worldToLocal(new THREE.Vector3(...w)); h.userData.reach(k, [t.x, t.y, t.z]); },
      cam: (pos, look, f) => { stage.camera.position.set(...pos); stage.camera.lookAt(...look); if (f) { stage.camera.fov = f; stage.camera.updateProjectionMatrix(); } },
    };
    build(ctx);
    const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
    stage.toonify(scene, (m) => pm.has(m));
    if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.finish();
  });
}
