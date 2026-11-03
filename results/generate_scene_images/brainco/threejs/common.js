// Shared scene helpers for the Brainco pages: materials, primitives, stage setup, recurring props.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCoconut } from './coconut.js';
export { THREE, guard, canvasTexture, rng, createCoconut };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const glow = (c, i = 1.5) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);
export const plane = (p, m, pos, w, h, rot = [-Math.PI / 2, 0, 0]) => add(p, new THREE.PlaneGeometry(w, h), m, pos, rot);

/** Canvas text texture on a plane of w x h; for cues that ARE text. */
export function textPlane(text, w, h, { bg = '#ffffff', fg = '#222', font = 'bold 120px sans-serif' } = {}) {
  const tex = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  m.castShadow = m.receiveShadow = true; return m;
}

export function makeStage(opts = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(opts.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3, ...(opts.ambient ?? {}) }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  return { stage, num, scene: stage.scene };
}

export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/** Coconut placed at (x,y,z) facing yaw; returns it. */
export function placeCoconut(scene, { scale = 1.5, x = 0, y = 0, z = 0, ry = 0 } = {}) {
  const c = createCoconut({ scale }); c.position.set(x, y, z); c.rotation.y = ry; scene.add(c); return c;
}

/** Reach a coconut arm to a WORLD point. */
export function reachWorld(c, key, [x, y, z]) {
  c.updateMatrixWorld(true); const t = c.worldToLocal(new THREE.Vector3(x, y, z));
  c.userData.reach(key, [t.x, t.y, t.z]);
}

export function finish(stage, scene, num, actors, { cam = [0, 0.9, 3.6], look = [0, 0.7, 0], clouds = true } = {}) {
  const set = new Set(); actors.forEach((a) => a.traverse((o) => set.add(o)));
  stage.toonify(scene, (m) => set.has(m));
  if (clouds) stage.addClouds(CLOUDS);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}

export function palmTree(h = 3, lean = 0.2) {
  const g = new THREE.Group(), trunk = mat('#9a6a3e'), leaf = mat('#3f9b3f');
  for (let i = 0; i < 8; i++) cyl(g, trunk, [Math.sin(lean) * (i / 8) * h * 0.5, (i + 0.5) * h / 8, 0], 0.13 - i * 0.006, h / 8 + 0.02, [0, 0, -lean * 0.5]);
  const top = new THREE.Group(); top.position.set(Math.sin(lean) * h * 0.5 * 0.95, h, 0); g.add(top);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, fr = new THREE.Group(); fr.rotation.y = a; top.add(fr);
    add(fr, new THREE.ConeGeometry(0.16, 1.9, 8), leaf, [0.85, -0.15, 0], [0, 0, -Math.PI / 2 - 0.5], [1, 1, 0.25]);
  }
  for (const [x, z] of [[0.1, 0.1], [-0.1, 0.08], [0, -0.12]]) blob(top, mat('#7a4f2a'), [x, -0.15, z], [0.1, 0.1, 0.1]);
  return g;
}

/** Hong Kong style skyline: glass towers with lit windows, one stepped spire. */
export function skyline(scene, { z = -40, span = 90, seed = 2, night = false } = {}) {
  const r = rng(seed), cols = night ? ['#16324f', '#1d2f5a', '#2a2a5c'] : ['#a9c3d8', '#8fb0cb', '#c5d6e4', '#7fa0bf'];
  for (let i = 0; i < 26; i++) {
    const w = 2 + r() * 3, h = 8 + r() * 24, x = -span / 2 + (i / 25) * span + (r() - 0.5) * 2;
    const tex = canvasTexture(256, (ctx, s) => {
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(0, 0, s, s);
      for (let a = 0; a < 12; a++) for (let b = 0; b < 8; b++) { ctx.fillStyle = night ? (r() > 0.4 ? '#ffd98a' : '#223') : '#e8f4ff'; ctx.fillRect(b * 32 + 6, a * 21 + 4, 18, 11); }
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
    m.position.set(x, h / 2, z - r() * 10); m.castShadow = true; scene.add(m);
    if (i % 6 === 2) cyl(scene, mat('#d8dde4'), [x, h + 3, m.position.z], 0.12, 6);
  }
}

/** Chinese junk boat with red-orange batten sails. */
export function junk(scale = 1) {
  const g = new THREE.Group(), hull = mat('#6a3a1e'), sail = mat('#c8381c');
  blob(g, hull, [0, 0.45, 0], [1.4, 0.4, 0.5]);
  box(g, hull, [0, 0.55, 0], [2.2, 0.22, 0.8]);
  for (const [x, h] of [[-0.5, 2.2], [0.5, 1.8]]) {
    cyl(g, mat('#4a2a14'), [x, 0.6 + h / 2, 0], 0.04, h);
    box(g, sail, [x + 0.35, 0.8 + h / 2, 0], [0.8, h * 0.8, 0.03]);
    for (let i = 1; i < 5; i++) box(g, mat('#7a2210'), [x + 0.35, 0.8 + i * h * 0.16, 0.03], [0.82, 0.03, 0.02]);
  }
  g.scale.setScalar(scale); return g;
}
