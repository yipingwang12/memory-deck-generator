// Shared helpers for the TUCCA scene pages: stage setup, primitives, and reusable props
// (person, nest, coins, flag, flask, labelled canvas planes).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
export { THREE, guard, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, m, rt, rb, h, pos, rot) => add(p, new THREE.CylinderGeometry(rt, rb, h, 28), m, pos, rot);
export const box = (p, m, w, h, d, pos, rot, r = 0.015) => add(p, new RoundedBoxGeometry(w, h, d, 3, r), m, pos, rot);

/** Canvas plane with drawn content: draw(ctx, w, h). */
export function canvasPlane(w, h, px, draw, extra = {}) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, ...extra }));
}
export function labelPlane(text, w, h, bg, fg, font = 'bold') {
  return canvasPlane(w, h, 512, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let s = H * 0.7; ctx.font = `${font} ${s}px Arial Black, Arial, sans-serif`;
    while (ctx.measureText(text).width > W * 0.88) { s -= 4; ctx.font = `${font} ${s}px Arial Black, Arial, sans-serif`; }
    ctx.fillText(text, W / 2, H / 2 + s * 0.04);
  });
}

/** Stage with the shared look; returns { stage, scene, num }. */
export function setup(o = {}) {
  const P = new URLSearchParams(location.search);
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', o.el ?? 35), sunAzimuth: num('az', o.az ?? 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...o.sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: o.sun ?? 2.6, ambient: { color: '#e8e2ff', intensity: o.amb ?? 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  return { stage, scene: stage.scene, num };
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];
/** Toonify the characters, add clouds, place the camera, finish. */
export function frame(S, chars, cam, look, clouds = CLOUDS) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  S.stage.toonify(S.scene, (m) => set.has(m));
  if (clouds) S.stage.addClouds(clouds);
  S.stage.camera.position.set(S.num('cx', cam[0]), S.num('cy', cam[1]), S.num('cz', cam[2]));
  S.stage.camera.lookAt(S.num('tx', look[0]), S.num('ty', look[1]), S.num('tz', look[2] ?? 0));
  S.stage.finish();
}
export function meadow(scene, color = '#6fae45') {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

/** Anime eye (white, iris, pupil, catchlights) at local (x, y, z) of a group. */
export function animeEye(g, x, y, z, s = 1, iris = '#4a3020') {
  const d = (rx, ry, c, dz, dx = 0, dy = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.4 }));
    m.scale.set(rx * s, ry * s, 1); m.position.set(x + dx * s, y + dy * s, z + dz); g.add(m); };
  d(0.036, 0.046, '#ffffff', 0); d(0.028, 0.04, iris, 0.0015, 0, -0.002); d(0.014, 0.026, '#120a08', 0.003);
  d(0.009, 0.009, '#ffffff', 0.0045, -0.01, 0.014); d(0.004, 0.004, '#ffffff', 0.0045, 0.008, -0.016);
}

/** Cartoon person ~1.9 tall. Optional peaked captain's cap. userData.arm(k,[x,z],elbow) k = 'l'|'r' (l = +x). */
export function createPerson({ coat = '#1c2c58', skin = '#ffd9b8', hair = '#3a2418', cap = false, scale = 1, trousers = '#1a2240' } = {}) {
  const root = new THREE.Group(), gold = mat('#e8b92e', { metalness: 0.6, roughness: 0.35 });
  blob(root, mat('#2a1c16'), [0.11, 0.05, 0.06], [0.1, 0.06, 0.16]); blob(root, mat('#2a1c16'), [-0.11, 0.05, 0.06], [0.1, 0.06, 0.16]);
  for (const s of [-1, 1]) cyl(root, mat(trousers), 0.075, 0.07, 0.8, [s * 0.11, 0.45, 0]);
  blob(root, mat(coat), [0, 1.1, 0], [0.27, 0.42, 0.18]);
  box(root, mat('#f6f6f6'), 0.16, 0.12, 0.02, [0, 1.42, 0.15], [0.3, 0, 0]);
  for (const y of [1.28, 1.14, 1.0]) blob(root, gold, [0, y, 0.175], [0.02, 0.02, 0.012]);
  box(root, gold, 0.34, 0.03, 0.04, [0, 0.82, 0.12]);
  const head = new THREE.Group(); head.position.y = 1.68; root.add(head);
  blob(head, mat(skin), [0, 0, 0], [0.21, 0.22, 0.2]);
  blob(head, mat(hair), [0, 0.06, -0.035], [0.225, 0.2, 0.215]);
  for (const s of [-1, 1]) { animeEye(head, s * 0.085, -0.005, 0.185, 1.5); blob(head, mat('#ff8f9a', { transparent: true, opacity: 0.5 }), [s * 0.13, -0.07, 0.155], [0.03, 0.016, 0.01]); blob(head, mat(skin), [s * 0.215, -0.01, 0], [0.03, 0.05, 0.03]); }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 8, 20, Math.PI), mat('#8a3030')); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.1, 0.19); head.add(mouth);
  blob(head, mat('#e2b090'), [0, -0.04, 0.2], [0.012, 0.016, 0.012]);
  if (cap) {
    const white = mat('#f8f8f4');
    cyl(head, white, 0.215, 0.235, 0.14, [0, 0.2, 0]);
    cyl(head, mat('#1c2c58'), 0.24, 0.24, 0.045, [0, 0.14, 0]);
    add(head, new THREE.CylinderGeometry(0.235, 0.235, 0.025, 28, 1, false, -0.9, 1.8 + 0), mat('#1a1a1e'), [0, 0.12, 0.1], [0, 0, 0], [1, 1, 1.35]);
    blob(head, gold, [0, 0.2, 0.225], [0.05, 0.05, 0.012]);
    for (const s of [-1, 1]) blob(head, gold, [s * 0.1, 0.145, 0.205], [0.02, 0.02, 0.01]);
  }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.3, 1.38, 0); root.add(sh);
    blob(sh, gold, [0, 0.02, 0], [0.07, 0.03, 0.07]);
    cyl(sh, mat(coat), 0.065, 0.055, 0.34, [0, -0.17, 0]);
    const el = new THREE.Group(); el.position.y = -0.34; sh.add(el);
    cyl(el, mat(coat), 0.055, 0.05, 0.3, [0, -0.15, 0]); cyl(el, mat('#f6f6f6'), 0.056, 0.056, 0.03, [0, -0.29, 0]);
    blob(el, mat(skin), [0, -0.35, 0], [0.055, 0.065, 0.05]);
    sh.rotation.z = s * 0.15; arms[k] = [sh, el];
  }
  root.userData.arm = (k, [x = 0, z = 0] = [], elbow = 0) => { arms[k][0].rotation.set(x, 0, z); arms[k][1].rotation.set(elbow, 0, 0); };
  root.userData.hand = (k) => arms[k][1]; root.userData.head = head;
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale); return root;
}

/** Twig nest, rim radius r; floor top near y = 0.1*r/0.45. */
export function createNest(r = 0.45, seed = 3) {
  const g = new THREE.Group(), rnd = rng(seed), cols = ['#8a5a2b', '#a8793e', '#6e4721', '#c29a5a'];
  const k = r / 0.45;
  blob(g, mat('#7a5528'), [0, 0.09 * k, 0], [r * 0.95, 0.1 * k, r * 0.95]);
  for (let i = 0; i < 150; i++) {
    const a = rnd() * 6.283, lv = rnd(), rad = r * (0.78 + 0.3 * Math.sin(lv * 2.4 + 0.3) + (rnd() - 0.5) * 0.08), len = r * (0.45 + rnd() * 0.4);
    const t = add(g, new THREE.CylinderGeometry(0.011 * k, 0.014 * k, len, 6), mat(cols[i % 4]),
      [Math.cos(a) * rad, (0.03 + lv * 0.2) * k, Math.sin(a) * rad], [0, 0, 0]);
    t.rotation.set((rnd() - 0.5) * 0.5, Math.PI / 2 - a + (rnd() - 0.5) * 0.6, Math.PI / 2 + (rnd() - 0.5) * 0.3, 'YXZ');
  }
  cyl(g, mat('#9b7a43'), r * 0.72, r * 0.72, 0.02 * k, [0, 0.14 * k, 0]);
  return g;
}

export function createCoin(r = 0.1) {
  const g = new THREE.Group(), gold = mat('#f2b822', { metalness: 0.7, roughness: 0.3 });
  cyl(g, gold, r, r, r * 0.22, [0, 0, 0]); cyl(g, mat('#ffd75a', { metalness: 0.6, roughness: 0.35 }), r * 0.78, r * 0.78, r * 0.26, [0, 0, 0]);
  return g;
}
/** Heap of coins: n coins, base radius R. */
export function coinPile(parent, pos, n, R, r = 0.1, seed = 9) {
  const rnd = rng(seed), g = new THREE.Group(); g.position.set(...pos);
  for (let i = 0; i < n; i++) {
    const t = i / n, a = rnd() * 6.283, rad = R * (1 - t) * Math.sqrt(rnd()), c = createCoin(r);
    c.position.set(Math.cos(a) * rad, r * 0.15 + (1 - rad / R) * R * 0.55 * (0.5 + 0.5 * (1 - t)) + t * R * 0.2, Math.sin(a) * rad);
    c.rotation.set((rnd() - 0.5) * 0.9, rnd() * 6.28, (rnd() - 0.5) * 0.9); g.add(c);
  }
  parent.add(g); return g;
}

/** Waving stars-and-stripes on a pole; returns group (pole base at y = 0, flag pointing +x). */
export function createFlag(w = 1.2, h = 0.72, poleH = 2.2) {
  const g = new THREE.Group();
  cyl(g, mat('#d8d8dc', { metalness: 0.5, roughness: 0.4 }), 0.025, 0.03, poleH, [0, poleH / 2, 0]);
  blob(g, mat('#f2b822', { metalness: 0.6 }), [0, poleH + 0.02, 0], [0.05, 0.05, 0.05]);
  const p = canvasPlane(w, h, 512, (ctx, W, H) => {
    for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? '#fafafa' : '#c8283c'; ctx.fillRect(0, i * H / 13, W, H / 13 + 1); }
    ctx.fillStyle = '#26307a'; ctx.fillRect(0, 0, W * 0.42, H * 7 / 13);
    ctx.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { ctx.beginPath(); ctx.arc(W * 0.42 * (c + 0.5 + (r % 2) * 0.5) / 6.6, H * 7 / 13 * (r + 0.5) / 5, W * 0.012, 0, 6.3); ctx.fill(); }
  }, { side: THREE.DoubleSide });
  const pos = p.geometry.attributes.position; p.geometry.dispose();
  p.geometry = new THREE.PlaneGeometry(w, h, 30, 6);
  const q = p.geometry.attributes.position;
  for (let i = 0; i < q.count; i++) { const x = q.getX(i) + w / 2; q.setZ(i, Math.sin(x * 6) * 0.05 * x / w + Math.sin(x * 3) * 0.02); }
  p.geometry.computeVertexNormals();
  p.position.set(w / 2 + 0.03, poleH - h / 2 - 0.05, 0); p.castShadow = true; g.add(p); return g;
}

/** Erlenmeyer flask of opaque liquid (toonify drops transparency), height h; base on y = 0. */
export function createFlask(h = 1.2, liquid = '#ff8fa8', fill = 0.85) {
  const g = new THREE.Group(), R = h * 0.34, bodyH = 0.62 * h, V = (x, y) => new THREE.Vector2(x, y);
  const pts = [V(0.001, 0), V(R * 0.9, 0), V(R, 0.04 * h), V(R * 0.93, 0.08 * h)];
  const top = bodyH * fill;
  for (let i = 1; i <= 10; i++) { const y = 0.08 * h + (top - 0.08 * h) * i / 10, f = y / bodyH; pts.push(V(R * 0.93 * (1 - f) + R * 0.19 * f, y)); }
  pts.push(V(0.001, top));
  add(g, new THREE.LatheGeometry(pts, 40), mat(liquid, { roughness: 0.25 }));
  const rim = mat('#e2f4ff', { roughness: 0.2 });
  add(g, new THREE.TorusGeometry(R * 0.97, 0.014 * h, 8, 48), rim, [0, 0.045 * h, 0], [Math.PI / 2, 0, 0]);
  const nr = R * 0.19 + (R * 0.93 - R * 0.19) * (1 - top / bodyH) * 0 + R * 0.01;
  cyl(g, rim, R * 0.2, R * 0.3, 0.3 * h, [0, bodyH + 0.12 * h, 0]);
  add(g, new THREE.TorusGeometry(R * 0.22, 0.012 * h, 8, 24), rim, [0, 0.93 * h, 0], [Math.PI / 2, 0, 0]);
  cyl(g, mat('#e43f5a'), R * 0.19, R * 0.19, 0.07 * h, [0, 0.97 * h, 0]);
  g.userData.R = R; g.userData.top = top; return g;
}
