// Shared scene helpers for the Axoft deck (props, characters, stage setup).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createAxe } from './axe.js';
export { THREE, guard, canvasTexture, rng, createAxe };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const basic = (c, e = {}) => new THREE.MeshBasicMaterial({ color: c, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);

/** flat label plane with canvas text */
export function label(text, { w = 1, h = 0.4, bg = '#ffffff', fg = '#222', font = 'bold', px = 256, round = true } = {}) {
  const tex = canvasTexture(px, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = fg; ctx.font = `${font} ${Math.floor(s * 0.5 * Math.min(1, 2.2 * h / w * 1.6 + 0.3))}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2 + 4);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

/** anime eyes on a surface at z; returns group */
export function eyes(parent, { x = 0, y = 0, z = 0, gap = 0.1, size = 0.05, iris = '#3b2a1a', closed = false } = {}) {
  for (const s of [-1, 1]) {
    const px = x + s * gap;
    if (closed) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(size, size * 0.14, 8, 20, Math.PI), basic('#2a1a14'));
      arc.rotation.z = Math.PI; arc.position.set(px, y, z); parent.add(arc); continue;
    }
    const d = (rx, ry, c, dz, dx = 0, dy = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), basic(c)); m.scale.set(rx, ry, 1); m.position.set(px + dx, y + dy, z + dz); parent.add(m); };
    d(size, size * 1.25, '#ffffff', 0); d(size * 0.82, size * 1.15, iris, 0.001); d(size * 0.45, size * 0.7, '#0a0806', 0.002);
    d(size * 0.28, size * 0.28, '#ffffff', 0.003, -size * 0.25, size * 0.35);
  }
}

export function human({ skin = '#ffd9b8', hair = '#3a2a22', shirt = '#4f8fd8', pants = '#35405a', closed = false, scale = 1 } = {}) {
  const g = new THREE.Group();
  const torso = blob(g, mat(shirt), [0, 0.62, 0], [0.19, 0.25, 0.14]);
  add(g, new THREE.CylinderGeometry(0.075, 0.08, 0.1, 16), skin, [0, 0.86, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.06, 0); g.add(head);
  blob(head, mat(skin), [0, 0, 0], [0.19, 0.2, 0.18]);
  blob(head, mat(hair), [0, 0.06, -0.03], [0.205, 0.19, 0.19]);
  blob(head, mat(hair), [0, 0.13, 0.1], [0.19, 0.07, 0.09]);
  eyes(head, { y: -0.01, z: 0.172, gap: 0.075, size: 0.04, iris: '#2f6f4f', closed });
  blob(head, mat('#ff8f9c'), [0, -0.1, 0.17], [0.035, 0.012, 0.01]);
  for (const s of [-1, 1]) {
    blob(head, mat('#ffa0a0'), [s * 0.12, -0.065, 0.14], [0.03, 0.018, 0.01]);
    blob(g, mat(skin), [s * 0.22, 0.45, 0.02], [0.045, 0.045, 0.045]);
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12), shirt, [s * 0.2, 0.58, 0.0], [0, 0, s * 0.12]);
    add(g, new THREE.CylinderGeometry(0.055, 0.05, 0.42, 12), pants, [s * 0.08, 0.2, 0]);
    blob(g, mat('#f4f4f4'), [s * 0.08, 0.015, 0.04], [0.065, 0.04, 0.1]);
  }
  g.scale.setScalar(scale); g.userData.head = head; return g;
}

export function sheep({ wool = '#fbf7ee', face = '#3a3333', scale = 1 } = {}) {
  const g = new THREE.Group(), w = mat(wool, { roughness: 0.95 });
  blob(g, w, [0, 0.5, 0], [0.45, 0.33, 0.33]);
  const r = rng(3);
  for (let i = 0; i < 16; i++) blob(g, w, [(r() - 0.5) * 0.7, 0.5 + (r() - 0.3) * 0.38, (r() - 0.5) * 0.4], [0.17, 0.17, 0.17]);
  const head = new THREE.Group(); head.position.set(0.52, 0.66, 0); g.add(head);
  blob(head, mat(face), [0, 0, 0], [0.17, 0.19, 0.15]); blob(head, w, [-0.02, 0.17, 0], [0.15, 0.09, 0.14]);
  for (const s of [-1, 1]) {
    blob(head, mat(face), [-0.02, 0.05, s * 0.18], [0.08, 0.035, 0.05], [0.4 * s, 0, 0]);
    add(g, new THREE.CylinderGeometry(0.035, 0.03, 0.34, 10), face, [0.3, 0.17, s * 0.15]);
    add(g, new THREE.CylinderGeometry(0.035, 0.03, 0.34, 10), face, [-0.3, 0.17, s * 0.15]);
    // side-facing eyes (head looks +x)
    const e = new THREE.Group(); e.position.set(0.12, 0.05, s * 0.125); e.rotation.y = s > 0 ? 0 : Math.PI; head.add(e);
    eyes(e, { gap: 0.045, size: 0.04, iris: '#2a1a10', x: 0, y: 0, z: 0 }); e.rotation.y = (s > 0 ? 0 : Math.PI) + 0; e.position.set(0.1, 0.04, s * 0.1);
    e.rotation.y = s > 0 ? 0.9 : Math.PI - 0.9;
  }
  g.scale.setScalar(scale); g.userData.head = head; return g;
}

export function flower({ petal = '#ff8fb8', center = '#ffd54a', r = 0.3, stem = 0.9, n = 7 } = {}) {
  const g = new THREE.Group();
  cyl(g, mat('#3f9a4a'), [0, stem / 2, 0], 0.03, stem);
  const bloom = new THREE.Group(); bloom.position.y = stem; g.add(bloom);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    blob(bloom, mat(petal, { roughness: 0.55 }), [Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0], [r * 0.5, r * 0.34, r * 0.12], [0, 0, a]);
  }
  blob(bloom, mat(center), [0, 0, 0.03], [r * 0.36, r * 0.36, r * 0.2]);
  g.userData.bloom = bloom; return g;
}

export function coin(parent, pos, r = 0.12) {
  const c = cyl(parent, mat('#ffcc33', { metalness: 0.6, roughness: 0.3 }), pos, r, r * 0.22);
  return c;
}
export function coinStack(parent, [x, y, z], n, r = 0.12) {
  for (let i = 0; i < n; i++) coin(parent, [x + (i % 2) * 0.01, y + r * 0.11 + i * r * 0.23, z], r);
}

export function tree(parent, [x, z], h = 3, col = '#2f8a3d') {
  cyl(parent, mat('#6b4423'), [x, h * 0.3, z], 0.16, h * 0.6, [0, 0, 0], 0.11);
  for (let i = 0; i < 3; i++) blob(parent, mat(col), [x + (i - 1) * 0.35, h * 0.72 + (i % 2) * 0.3, z], [0.9, 0.8, 0.9]);
}

/** Build stage + ground. opts: ground colour, sky overrides. */
export function setup(opts = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 38), sunElevation: opts.el ?? 35, sunAzimuth: opts.az ?? 150, exposure: opts.exp ?? 1,
    sky: { cover: 2, seed: opts.seed ?? 5, towerTop: 0.5, puffCover: 2, ...(opts.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: opts.sunI ?? 2.6, sunColor: opts.sunColor ?? '#fff1d6', ambient: { color: '#e8e2ff', intensity: opts.amb ?? 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, shadowSize: opts.shadow ?? 4,
  });
  const ground = add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(opts.ground ?? '#6fae45'), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const chars = new Set();
  /** mark a group's meshes as characters (2-band toon + rim) */
  const mark = (obj) => obj.traverse((o) => chars.add(o));
  return { P, num, stage, scene: stage.scene, ground, mark, chars };
}

export function finish(S, cam, look, clouds = true) {
  S.stage.toonify(S.scene, (m) => S.chars.has(m));
  if (clouds) S.stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  S.stage.camera.position.set(S.num('cx', cam[0]), S.num('cy', cam[1]), S.num('cz', cam[2]));
  S.stage.camera.lookAt(S.num('tx', look[0]), S.num('ty', look[1]), S.num('tz', look[2] ?? 0));
  S.stage.finish();
}

export function placeAxe(S, { pos = [0, 0, 0], ry = 0, scale = 1.3, pose = {}, reach = {} } = {}) {
  const a = createAxe({ scale }); a.position.set(...pos); a.rotation.y = ry; S.scene.add(a);
  a.userData.pose(pose); a.updateMatrixWorld(true);
  for (const [k, w] of Object.entries(reach)) { const t = a.worldToLocal(new THREE.Vector3(...w)); a.userData.reach(k, [t.x, t.y, t.z]); }
  S.mark(a); return a;
}

export const HTML_HEAD = (t) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${t}</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
`;
