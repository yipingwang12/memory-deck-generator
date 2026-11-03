// Shared helpers for the Tempus scenes (stage defaults, mesh helpers, canvas text, hero placement).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createHourglass } from './hourglass.js';
export { THREE, guard, canvasTexture, rng, createHourglass };

export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, w, h, d, c, pos, rot, e) => add(p, new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? mat(c, e) : c, pos, rot);
export const cyl = (p, rt, rb, h, c, pos, rot, e) => add(p, new THREE.CylinderGeometry(rt, rb, h, 28), typeof c === 'string' ? mat(c, e) : c, pos, rot);
export const ball = (p, r, c, pos, scl, e) => add(p, new THREE.SphereGeometry(r, 28, 18), typeof c === 'string' ? mat(c, e) : c, pos, [0, 0, 0], scl);

/** Canvas text texture; returns a material usable on a plane. */
export function textMat(text, { w = 512, h = 256, fg = '#fff', bg = null, font = 'bold 150px Arial, Helvetica, sans-serif' } = {}) {
  const t = canvasTexture(w, (ctx, s) => {
    ctx.canvas.height = h; ctx.clearRect(0, 0, w, h);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 6);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, transparent: !bg });
}
/** Flat plane showing text. */
export function label(parent, text, w, h, pos, rot, opts = {}) {
  const px = 512, ph = Math.round(px * h / w);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textMat(text, { w: px, h: ph, ...opts }));
  m.position.set(...pos); m.rotation.set(...(rot ?? [0, 0, 0])); parent.add(m); return m;
}

export function makeStage(o = {}) {
  return createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 1.5), seed: num('seed', 5), towerTop: 0.5, puffCover: 1.5, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.6, fog: { near: 120, far: 1500 }, ...(o.stage ?? {}),
  });
}

export function ground(scene, color, y = 0) {
  return add(scene, new THREE.PlaneGeometry(400, 400), mat(color, { roughness: 0.95 }), [0, y, 0], [-Math.PI / 2, 0, 0]);
}

export function hero(scene, { scale = 1.6, pos = [0, 0, 0], ry = 0, pose = {} } = {}) {
  const h = createHourglass({ scale }); h.position.set(...pos); h.rotation.y = ry; scene.add(h);
  h.userData.pose(pose); h.updateMatrixWorld(true); return h;
}

export function finish(stage, chars, { cam = [0, 1.2, 4], look = [0, 0.9, 0], clouds = true } = {}) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  toonKeepGlass(stage, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.finish();
}

/** toonify drops transparency; restore it on glass-like meshes. */
export function toonKeepGlass(stage, pred) {
  const glass = [];
  stage.scene.traverse((o) => { if (o.isMesh && o.material.transparent && o.material.opacity < 1 && !o.material.isMeshBasicMaterial) glass.push([o, o.material.opacity]); });
  stage.toonify(stage.scene, pred);
  for (const [o, op] of glass) { o.material.transparent = true; o.material.opacity = op; o.material.depthWrite = false; }
}
