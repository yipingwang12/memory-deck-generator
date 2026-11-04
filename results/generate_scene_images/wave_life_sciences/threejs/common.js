// Shared scene helpers for the Wave deck (props stay inline in each qNN page).
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createSurfer, createBoard } from './surfer.js';
export { THREE, guard, createSurfer, createBoard };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl = [1, 1, 1], rot = [0, 0, 0]) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const num = (P, k, d) => Number(P.get(k) ?? d);

/** Canvas label texture (rect), draw(ctx,w,h). */
export function labelTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Flat panel carrying centred text. */
export function textPanel(text, { w = 1, h = 0.3, bg = '#14202e', fg = '#ffd23c', font = 'bold', border = null } = {}) {
  const px = 512, ph = Math.round(px * h / w);
  const tex = labelTex(px, ph, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 10; ctx.strokeRect(8, 8, W - 16, H - 16); }
    let size = H * 0.7; ctx.font = `${font} ${size}px Arial Black, Helvetica, sans-serif`;
    while (ctx.measureText(text).width > W * 0.88) { size *= 0.94; ctx.font = `${font} ${size}px Arial Black, Helvetica, sans-serif`; }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2 + size * 0.04);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

export function makeStage(P, extra = {}) {
  const stage = createAnimeStage({
    fov: num(P, 'fov', 40), sunElevation: num(P, 'el', 35), sunAzimuth: num(P, 'az', 150), exposure: num(P, 'exp', 1),
    sky: { cover: num(P, 'cover', 2), seed: num(P, 'seed', 5), towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 }, ...extra,
  });
  return stage;
}

/** Sand + sea beyond z=-seaZ. */
export function beach(scene, { seaZ = 6, sea = '#25b5c8', sand = '#f2d298' } = {}) {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(sand, { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(400, 300), mat(sea, { roughness: 0.25 }), [0, 0.01, -seaZ - 150], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(400, 0.7), mat('#ffffff', { roughness: 0.9 }), [0, 0.02, -seaZ + 0.3], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(400, 1.4), mat('#e2bd80', { roughness: 1 }), [0, 0.005, -seaZ + 1.4], [-Math.PI / 2, 0, 0]);
}

/** A curling wave (crescent extruded along x). */
export function wave(parent, { x = 0, z = -3, size = 1.5, len = 4, color = '#19b8b0' } = {}) {
  const s = new THREE.Shape();
  s.absarc(0, 1, 1, Math.PI * 1.25, -Math.PI / 6, true);
  s.absarc(0.05, 0.98, 0.76, -Math.PI / 6, Math.PI * 1.25, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 40 });
  geo.translate(0, 0, -len / 2); geo.rotateY(-Math.PI / 2);
  const g = new THREE.Group();
  add(g, geo, mat(color, { roughness: 0.2, emissive: color, emissiveIntensity: 0.18 }));
  for (let i = 0; i < 9; i++) blob(g, mat('#fff', { roughness: 0.9 }), [0.8 - 0.02 * (i % 3), 0.52 + 0.02 * (i % 2), -len / 2 + (i + 0.5) * len / 9], [0.12, 0.1, 0.22]);
  g.scale.setScalar(size); g.position.set(x, 0, z); parent.add(g); return g;
}

/** Surfer placed in scene, toonified with extra predicate hook; returns surfer. */
export function addSurfer(stage, P, { x = -0.5, z = 0, ry = 0.25, scale = 1.35, board = true, boardX } = {}) {
  const s = createSurfer({ scale: num(P, 'ss', scale), board, ...(boardX != null ? { boardX } : {}) });
  s.position.set(num(P, 'sx', x), 0, num(P, 'sz', z)); s.rotation.y = num(P, 'sry', ry);
  stage.scene.add(s); return s;
}

export function finish(stage, P, surfer, cam, look, extra = [], clouds = true) {
  const pm = new Set(); surfer.traverse((o) => pm.add(o)); extra.forEach((e) => e.traverse((o) => pm.add(o))); surfer.userData.board && surfer.userData.parts.board.traverse((o) => pm.add(o));
  stage.toonify(stage.scene, (m) => pm.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(num(P, 'cx', cam[0]), num(P, 'cy', cam[1]), num(P, 'cz', cam[2]));
  stage.camera.lookAt(num(P, 'tx', look[0]), num(P, 'ty', look[1]), num(P, 'tz', look[2] ?? 0));
  stage.finish();
}

/** Pill capsule lying along x. */
export function pill(c1, c2, r = 0.07, len = 0.16) {
  const g = new THREE.Group();
  for (const [s, c] of [[-1, c1], [1, c2]]) {
    const h = new THREE.Group(); h.position.x = s * len / 4; g.add(h);
    add(h, new THREE.CylinderGeometry(r, r, len / 2, 20), mat(c, { roughness: 0.3 }), [0, 0, 0], [0, 0, Math.PI / 2]);
    blob(h, mat(c, { roughness: 0.3 }), [s * len / 4, 0, 0], [r, r, r]);
  }
  return g;
}
/** Labelled glass vial (height ~0.5). */
export function vial(text, { liquid = '#52d6c0', w = 0.62 } = {}) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.42, 24), mat('#cfeff5', { transparent: true, opacity: 0.55, roughness: 0.1 }), [0, 0.21, 0]);
  add(g, new THREE.CylinderGeometry(0.135, 0.135, 0.3, 24), mat(liquid, { emissive: liquid, emissiveIntensity: 0.2 }), [0, 0.17, 0]);
  add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.07, 20), mat('#eef2f4', { metalness: 0.5, roughness: 0.3 }), [0, 0.455, 0]);
  add(g, new THREE.CylinderGeometry(0.115, 0.115, 0.07, 20), mat('#d02a3a'), [0, 0.5, 0]);
  const lab = textPanel(text, { w, h: 0.17, bg: '#ffffff', fg: '#b01020', border: '#b01020' });
  lab.position.set(0, 0.2, 0.152); lab.scale.setScalar(0.62 / w * 0.55); g.add(lab);
  return g;
}
/** Text label on a board face (reads along the board length). */
export function labelBoard(board, text, { bg = '#ffffff', fg = '#c01818', len = 1.0 } = {}) {
  const p = textPanel(text, { w: len, h: 0.27, bg, fg, border: fg }); p.rotation.z = Math.PI / 2; p.position.set(0, 0.0, 0.055); board.add(p); return p;
}
