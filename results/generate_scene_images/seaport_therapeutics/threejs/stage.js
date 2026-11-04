// Shared scene helpers for Seaport pages.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createPorthole } from './porthole.js';
export { THREE, guard, canvasTexture, rng, createPorthole };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 24), m, pos, rot);
export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);

/** Canvas text sprite-plane (large short text only). */
export function textPlane(text, w, h, { bg = '#fff', fg = '#111', font = 'bold 150px sans-serif', sy = 1 } = {}) {
  const tex = canvasTexture(512, (ctx, s) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(s / 2, s / 2); ctx.scale(1, sy); ctx.fillText(text, 0, 8); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
}

/** Sea + plank dock. Returns the stage. dock: x-extent of plank deck at y=0 (z from dz0..dz1). */
export function makeStage({ el = 38, az = 150, sea = '#1f8fb5', dock = true, sky = {} } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const s = stage.scene;
  add(s, new THREE.PlaneGeometry(500, 500), mat(sea, { roughness: 0.3 }), [0, -0.5, 0], [-Math.PI / 2, 0, 0]);
  const r = rng(3);
  for (let i = 0; i < 60; i++) add(s, new THREE.BoxGeometry(0.8 + r() * 1.5, 0.01, 0.06), mat('#d9f4ff'), [(r() - 0.5) * 24, -0.48, -2 - r() * 16]);
  if (dock) {
    const wood = canvasTexture(256, (ctx, n) => { for (let i = 0; i < 8; i++) { const l = 130 + (i % 3) * 14; ctx.fillStyle = `rgb(${l + 40},${l - 15},${l - 75})`; ctx.fillRect(0, i * n / 8, n, n / 8 - 3); ctx.fillStyle = '#4a2a12'; ctx.fillRect(0, i * n / 8 + n / 8 - 3, n, 3); } }, { repeat: 1 });
    add(s, new THREE.BoxGeometry(14, 0.5, 2.6), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.8 }), [0, -0.25, 0.4]);
    for (const x of [-5, -2, 1, 4]) cyl(s, '#5a3a1e', [x, -0.4, 1.8], 0.12, 0.9);
  }
  return stage;
}

/** Wooden ship hull facing +x, deck top at y=0.0 relative; porthole hole painted. Returns Group (origin at deck centre). */
export function makeShip({ len = 3.4, hull = '#8a4a22', trim = '#e8c26a' } = {}) {
  const g = new THREE.Group();
  const prow = new THREE.Shape(); prow.moveTo(-len / 2, 0); prow.lineTo(len / 2 + 0.6, 0); prow.quadraticCurveTo(len / 2 + 0.3, -0.45, len / 2 - 0.4, -0.6); prow.lineTo(-len / 2 + 0.2, -0.6); prow.quadraticCurveTo(-len / 2 - 0.1, -0.3, -len / 2, 0);
  const geo = new THREE.ExtrudeGeometry(prow, { depth: 1.4, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); geo.translate(0, 0, -0.7);
  add(g, geo, mat(hull));
  add(g, new THREE.BoxGeometry(len + 0.9, 0.06, 1.5), mat(trim), [0.3, 0.0, 0]);
  add(g, new THREE.BoxGeometry(len + 0.8, 0.28, 0.06), mat(hull), [0.3, 0.17, 0.7]);
  add(g, new THREE.BoxGeometry(len + 0.8, 0.28, 0.06), mat(hull), [0.3, 0.17, -0.7]);
  cyl(g, '#6b4423', [-0.4, 1.3, 0], 0.05, 2.6);
  return g;
}

/** Finish with framing from query (cx..). */
export function frame(stage, { cam = [0, 1.2, 4.4], look = [0, 0.8, 0] } = {}) {
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.finish();
}
/** toonify everything; all share the anime shading (characters = porthole parts). */
export function toon(stage, ...roots) { const set = new Set(); roots.forEach((r) => r.traverse((o) => set.add(o))); stage.toonify(stage.scene, (m) => set.has(m)); }

/** Chibi person, faces +z, feet y=0, ~1.8 tall. arms.{l,r} rotate about shoulder (z: swing out, x<0: forward). */
export function makePerson({ skin = '#ffd9b8', coat = '#2a2a33', pants = '#2a2a33', hair = '#2a1a10', scale = 1, eyes = 'open', dress = false } = {}) {
  const g = new THREE.Group(), arms = {};
  for (const s of [-1, 1]) {
    cyl(g, pants, [s * 0.1, 0.35, 0], 0.075, 0.7);
    blob(g, '#1b1410', [s * 0.1, 0.04, 0.05], [0.1, 0.06, 0.15]);
  }
  if (dress) cyl(g, coat, [0, 0.55, 0], 0.17, 0.9, [0, 0, 0], 0.42); else cyl(g, coat, [0, 1.02, 0], 0.26, 0.68, [0, 0, 0], 0.2);
  blob(g, skin, [0, 1.62, 0], [0.27, 0.28, 0.26]);
  blob(g, hair, [0, 1.7, -0.04], [0.285, 0.26, 0.27]);
  const z = 0.235;
  const d = (rx, ry, c, x, y, zz) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x, y, zz); m.lookAt(x * 1.4, y, 3); g.add(m); return m; };
  for (const s of [-1, 1]) {
    const x = s * 0.095, y = 1.6;
    if (eyes === 'closed') { const m = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14, Math.PI), mat('#2a1a10')); m.rotation.z = Math.PI; m.position.set(x, y, z + 0.01); g.add(m); }
    else { d(0.062, eyes === 'wide' ? 0.095 : 0.08, '#fff', x, y, z); d(0.04, eyes === 'wide' ? 0.04 : 0.065, '#3a2616', x, y - 0.005, z + 0.004); d(0.018, eyes === 'wide' ? 0.018 : 0.03, '#000', x, y - 0.005, z + 0.008); d(0.014, 0.014, '#fff', x - 0.012, y + 0.022, z + 0.012); }
    const c = d(0.035, 0.018, '#ff8f9f', s * 0.15, 1.54, z - 0.02); c.material.transparent = true; c.material.opacity = 0.55;
    const arm = new THREE.Group(); arm.position.set(s * 0.3, 1.28, 0); g.add(arm);
    cyl(arm, coat, [0, -0.25, 0], 0.07, 0.5); blob(arm, skin, [0, -0.54, 0], [0.075, 0.075, 0.075]);
    arm.rotation.z = s * 0.25; arms[s < 0 ? 'r' : 'l'] = arm;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), mat('#7a2a2a')); mouth.rotation.z = Math.PI; mouth.position.set(0, 1.545, z + 0.015); g.add(mouth);
  g.userData = { arms, mouth, head: [0, 1.62, 0] };
  g.scale.setScalar(scale); return g;
}

/** Two-tone capsule pill lying along x. */
export function makeCapsule({ len = 1, r = 0.3, a = '#ff6b5a', b = '#fff7ea' } = {}) {
  const g = new THREE.Group(), h = len - 2 * r;
  cyl(g, a, [h / 4, 0, 0], r, h / 2, [0, 0, Math.PI / 2]); cyl(g, b, [-h / 4, 0, 0], r, h / 2, [0, 0, Math.PI / 2]);
  blob(g, a, [h / 2, 0, 0], [r, r, r]); blob(g, b, [-h / 2, 0, 0], [r, r, r]);
  return g;
}

/** Zorro: masked, caped, laurel-crowned person. */
export function makeZorro(scale = 1) {
  const z = makePerson({ coat: '#15151a', pants: '#15151a', hair: '#15151a', scale });
  blob(z, '#0a0a0e', [0, 1.6, 0], [0.288, 0.09, 0.272]);
  for (const s of [-1, 1]) {
    const w = add(z, new THREE.CircleGeometry(1, 24), mat('#fff', { roughness: 0.4 }), [s * 0.095, 1.6, 0.285], [0, 0, 0], [0.055, 0.05, 1]);
    add(z, new THREE.CircleGeometry(1, 24), mat('#1a1410'), [s * 0.095, 1.597, 0.287], [0, 0, 0], [0.032, 0.042, 1]);
    add(z, new THREE.CircleGeometry(1, 12), mat('#fff'), [s * 0.095 - 0.01, 1.612, 0.289], [0, 0, 0], [0.012, 0.012, 1]);
  }
  box(z, '#15151a', [0, 0.95, -0.3], [0.7, 1.25, 0.04], [0.12, 0, 0]);
  box(z, '#c4252d', [0, 0.97, -0.285], [0.62, 1.15, 0.02], [0.12, 0, 0]);
  for (const s of [-1, 1]) blob(z, '#15151a', [s * 0.05, 1.565, 0.265], [0.05, 0.012, 0.012], [0, 0, s * -0.2]);
  const wr = new THREE.Group(); wr.position.set(0, 1.8, 0); z.add(wr);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; blob(wr, '#3f9a3a', [Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27], [0.075, 0.03, 0.04], [0, -a, 0.3]); }
  add(wr, new THREE.TorusGeometry(0.27, 0.018, 6, 28), mat('#2f7a2c'), [0, 0, 0], [Math.PI / 2, 0, 0]);
  return z;
}

/** Round stone medallion carrying a carved, glowing glyph (faces +z). */
export function makeGlyph(r = 0.3) {
  const tex = canvasTexture(256, (c, n) => {
    c.fillStyle = '#9a9184'; c.fillRect(0, 0, n, n);
    for (const [col, off, w] of [['#2a2622', 0, 16], ['#7ff0ff', 0, 7]]) {
      c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      c.moveTo(128, 40); c.lineTo(128, 216); c.moveTo(128, 70); c.lineTo(190, 120); c.lineTo(128, 150); c.moveTo(70, 190); c.lineTo(128, 130); c.lineTo(186, 190); c.stroke();
      c.beginPath(); c.arc(128, 128, 98, 0, 7); c.stroke();
    }
  });
  const g = new THREE.Group();
  cyl(g, '#6d665c', [0, 0, 0], r * 1.08, 0.06, [Math.PI / 2, 0, 0]);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); face.position.z = 0.035; g.add(face);
  return g;
}
