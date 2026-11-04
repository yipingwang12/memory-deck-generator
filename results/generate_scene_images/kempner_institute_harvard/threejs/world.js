// Shared scene harness + prop helpers for the Kempner scenes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCamper } from './camper.js';
export { THREE, rng, canvasTexture, createCamper };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, w, h, d, color, pos, rot, r = 0.02, e) => add(p, new RoundedBoxGeometry(w, h, d, 4, r), mat(color, e), pos, rot);
export const cyl = (p, rt, rb, h, color, pos, rot, e) => add(p, new THREE.CylinderGeometry(rt, rb, h, 28), mat(color, e), pos, rot);

/** Flat plane with canvas text/drawing; draw(ctx, w, h). */
export function panel(p, w, h, draw, pos, rot = [0, 0, 0]) {
  const t = canvasTexture(512, (ctx, s) => { ctx.save(); ctx.scale(s / 512, s / 512); draw(ctx, 512, 512); ctx.restore(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
  m.position.set(...pos); m.rotation.set(...rot); p.add(m); return m;
}
export const bigText = (ctx, txt, color, bg, size = 260) => {
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512); }
  ctx.fillStyle = color; ctx.font = `bold ${size}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 256, 270);
};

/** Cartoon person: returns Group (feet y=0, ~1 tall*s). opts: skin, shirt, pants, hair, hat. */
export function person({ s = 1, skin = '#f6cba0', shirt = '#4a6fd0', pants = '#35394a', hair = '#3a2a1a', glasses = false, apron = null } = {}) {
  const g = new THREE.Group();
  cyl(g, 0.07, 0.08, 0.42, pants, [-0.08, 0.21, 0]); cyl(g, 0.07, 0.08, 0.42, pants, [0.08, 0.21, 0]);
  blob(g, mat(shirt), [0, 0.6, 0], [0.2, 0.26, 0.14]);
  if (apron) blob(g, mat(apron), [0, 0.56, 0.05], [0.16, 0.2, 0.1]);
  for (const x of [-1, 1]) { cyl(g, 0.036, 0.036, 0.3, shirt, [x * 0.23, 0.6, 0], [0, 0, x * 0.25]); blob(g, mat(skin), [x * 0.27, 0.45, 0], [0.04, 0.04, 0.04]); }
  blob(g, mat(skin), [0, 0.96, 0], [0.16, 0.17, 0.15]);
  blob(g, mat(hair), [0, 1.03, -0.02], [0.17, 0.14, 0.15]);
  for (const x of [-1, 1]) {
    blob(g, mat('#fff'), [x * 0.06, 0.96, 0.135], [0.04, 0.05, 0.02]); blob(g, mat('#2a1a10'), [x * 0.06, 0.955, 0.15], [0.024, 0.032, 0.015]);
    blob(g, mat('#fff'), [x * 0.055, 0.97, 0.162], [0.008, 0.008, 0.005]);
  }
  add(g, new THREE.TorusGeometry(0.03, 0.006, 6, 16, Math.PI), mat('#7a2a2a'), [0, 0.9, 0.15], [0, 0, Math.PI]);
  if (glasses) for (const x of [-1, 1]) add(g, new THREE.TorusGeometry(0.05, 0.007, 6, 20), mat('#222'), [x * 0.06, 0.96, 0.16]);
  g.scale.setScalar(s); return g;
}

/** Camera/scene harness. build(ctx) adds props; ctx.toon(obj) marks characters for toon shading. */
export function run({ ground = '#6fae45', cam = [0.3, 1.0, 4.4], look = [0.1, 0.6, 0], camper = {}, sky = {}, build }) {
  guard(() => {
    const P = new URLSearchParams(location.search);
    const stage = createAnimeStage({
      fov: 40, sunElevation: 35, sunAzimuth: 150, exposure: 1,
      sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const van = createCamper({ scale: camper.scale ?? 1.3 });
    van.position.set(...(camper.pos ?? [0, 0, 0])); van.rotation.y = camper.ry ?? 0.55; scene.add(van);
    const toons = [van];
    build({ scene, van, stage, toon: (o) => toons.push(o), P });
    van.updateMatrixWorld(true);
    const set = new Set(); toons.forEach((t) => t.traverse((o) => set.add(o)));
    stage.toonify(scene, (m) => set.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    const n = (k, d) => Number(P.get(k) ?? d);
    stage.camera.position.set(n('cx', cam[0]), n('cy', cam[1]), n('cz', cam[2]));
    stage.camera.lookAt(n('tx', look[0]), n('ty', look[1]), n('tz', look[2]));
    stage.finish();
  });
}
/** Boilerplate html head for a scene page. */
