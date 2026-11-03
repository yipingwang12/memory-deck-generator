// Shared helpers for Sarepta scene pages: stage setup, primitives, text planes, helix, elevator.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSerape } from './serape.js';

export { THREE, guard, rng, createSerape };
export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const box = (p, m, size, pos, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, r1, r2, h, pos, rot) => add(p, new THREE.CylinderGeometry(r1, r2, h, 24), m, pos, rot);

/** Anime stage with defaults; opts override. Returns stage. */
export function makeStage(o = {}) {
  return createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...o,
  });
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/** Add the serape, toonify the scene (serape = character), place camera, finish. */
export function finishScene(stage, serape, cam, look, clouds = true) {
  const set = new Set(); serape.traverse((o) => set.add(o));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds(CLOUDS);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}

export function ground(scene, color = '#6fae45', y = 0) {
  return add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, y, 0], [-Math.PI / 2, 0, 0]);
}

/** Text on a plane: canvas text, w x h world units. */
export function textPlane(text, w, h, { bg = '#101418', fg = '#3df08a', font = 'bold', px = 0.62 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = fg; x.font = `${font} ${Math.round(c.height * px)}px Arial, Helvetica, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + c.height * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
}

/** Double helix along +y, length len, radius r. Returns Group. */
export function helix(len = 1, r = 0.12, c1 = '#2fa7ff', c2 = '#ff4f9a', turns = 2.5, tube = 0.025) {
  const g = new THREE.Group(), n = 60, pts = [[], []];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * turns * Math.PI * 2, y = (t - 0.5) * len;
    pts[0].push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    pts[1].push(new THREE.Vector3(-r * Math.cos(a), y, -r * Math.sin(a)));
  }
  [c1, c2].forEach((c, k) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts[k]), 120, tube, 10), mat(c, { roughness: 0.4 })));
  for (let i = 2; i < n; i += 3) {
    const a = pts[0][i], b = pts[1][i], len2 = a.distanceTo(b);
    const rung = add(g, new THREE.CylinderGeometry(tube * 0.5, tube * 0.5, len2, 8), mat('#fff3b0'));
    rung.position.copy(a).add(b).multiplyScalar(0.5); rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  }
  return g;
}

/** Elevator: shaft frame + car with open front facing +z, indicator panel with up arrow. Car floor at y=0, inner width 1.5. */
export function elevator({ doorsOpen = true } = {}) {
  const g = new THREE.Group(), steel = mat('#aab4bf', { metalness: 0.5, roughness: 0.35 }), wall = mat('#e9d8b4'), dark = mat('#39414b');
  box(g, steel, [0.12, 3.2, 0.12], [-1.0, 1.6, -0.5]); box(g, steel, [0.12, 3.2, 0.12], [1.0, 1.6, -0.5]);
  box(g, steel, [2.3, 0.14, 0.14], [0, 3.2, -0.5]);
  box(g, mat('#6d7681'), [1.9, 0.1, 1.1], [0, -0.05, -0.1]);                                 // floor
  box(g, wall, [1.9, 2.6, 0.1], [0, 1.3, -0.62]); box(g, wall, [0.1, 2.6, 1.1], [-0.95, 1.3, -0.1]); box(g, wall, [0.1, 2.6, 1.1], [0.95, 1.3, -0.1]);
  box(g, wall, [1.9, 0.1, 1.1], [0, 2.65, -0.1]);
  box(g, steel, [0.9, 0.08, 0.08], [0, 3.3, -0.5]);
  for (const x of [-0.4, 0.4]) cyl(g, dark, 0.015, 0.015, 1.0, [x, 3.7, -0.5]);               // cables
  box(g, dark, [1.9, 0.14, 0.14], [0, 2.78, 0.5]);                                             // lintel
  for (const s of [-1, 1]) box(g, steel, [0.3, 2.6, 0.06], [s * (doorsOpen ? 0.8 : 0.15), 1.3, 0.5]);   // doors
  const pan = box(g, dark, [0.7, 0.34, 0.06], [0, 3.0, 0.52]);
  const arrow = new THREE.Shape(); arrow.moveTo(0, 0.12); arrow.lineTo(0.1, -0.06); arrow.lineTo(0.03, -0.06); arrow.lineTo(0.03, -0.12);
  arrow.lineTo(-0.03, -0.12); arrow.lineTo(-0.03, -0.06); arrow.lineTo(-0.1, -0.06); arrow.closePath();
  const am = new THREE.Mesh(new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: '#ffd23a' })); am.position.set(0, 3.0, 0.555); g.add(am);
  return g;
}

export { rng as rand };
