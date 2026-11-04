// Shared helpers for the Amgen scene pages (props + stage runner). Anchor = genie.js.
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createGenie } from './genie.js';
export { THREE, rng };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });
export const glow = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o });
export const gold = () => mat('#f2b82a', { metalness: 0.6, roughness: 0.3 });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** Sign board: box with big centred canvas text lines. */
export function panel(w, h, lines, { bg = '#fff', fg = '#222', border = '#444', d = 0.1, colors = [] } = {}) {
  const g = new THREE.Group(); add(g, new THREE.BoxGeometry(w, h, d), mat(border));
  const px = 1024, py = Math.round(1024 * h / w);
  const t = tex(px, py, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, px, py); c.textAlign = 'center'; c.textBaseline = 'middle';
    const slot = py / lines.length;
    lines.forEach((s, i) => {
      let size = slot * 0.8; c.font = `900 ${size}px "Arial Black", Helvetica, sans-serif`;
      while (c.measureText(s).width > px * 0.88) { size -= 4; c.font = `900 ${size}px "Arial Black", Helvetica, sans-serif`; }
      c.fillStyle = colors[i] ?? fg; c.fillText(s, px / 2, slot * (i + 0.53));
    });
  });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.9), new THREE.MeshBasicMaterial({ map: t }));
  f.position.z = d / 2 + 0.003; g.add(f); return g;
}

/** Plain box with a window-grid facade texture. */
export function building(w, h, d, color, { cols = 4, rows = 4, win = '#9fd4f0' } = {}) {
  const t = tex(256, 256, (c, s) => {
    c.fillStyle = color; c.fillRect(0, 0, s, s); c.fillStyle = win;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) c.fillRect(s * (i + 0.2) / cols, s * (j + 0.2) / rows, s * 0.6 / cols, s * 0.55 / rows);
  });
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  o.castShadow = o.receiveShadow = true; o.position.y = h / 2; const g = new THREE.Group(); g.add(o); return g;
}

export function oak(s = 1, seed = 1) {
  const r = rng(seed), g = new THREE.Group(), bark = mat('#6b4a2c');
  add(g, new THREE.CylinderGeometry(0.16, 0.26, 1.1, 14), bark, [0, 0.55, 0]);
  for (const k of [-1, 1]) add(g, new THREE.CylinderGeometry(0.06, 0.1, 0.8, 10), bark, [k * 0.28, 1.2, 0], [0, 0, -k * 0.7]);
  const greens = ['#3f7a2f', '#4b8a36', '#357028', '#5a9a3c'];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, rad = 0.55 + r() * 0.3;
    blob(g, mat(greens[i % 4]), [Math.cos(a) * 0.75, 1.65 + r() * 0.4, Math.sin(a) * 0.5], [rad, rad * 0.8, rad]);
  }
  blob(g, mat('#4b8a36'), [0, 2.1, 0], [0.85, 0.65, 0.8]);
  g.scale.setScalar(s); return g;
}

export function crown(s = 1) {
  const g = new THREE.Group(), au = gold(); au.side = THREE.DoubleSide;
  add(g, new THREE.CylinderGeometry(0.5, 0.4, 0.32, 28, 1, true), au, [0, 0.16, 0]);
  add(g, new THREE.TorusGeometry(0.45, 0.04, 10, 36), au, [0, 0.33, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.4, 0.04, 10, 36), au, [0, 0.0, 0], [Math.PI / 2, 0, 0]);
  const gems = ['#ff3b5c', '#3bd0ff', '#5bff8a'];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, x = Math.sin(a) * 0.46, z = Math.cos(a) * 0.46;
    add(g, new THREE.ConeGeometry(0.11, 0.42, 4), au, [x, 0.52, z]);
    blob(g, mat(gems[i % 3], { roughness: 0.2 }), [x * 1.0, 0.76, z * 1.0], [0.065, 0.065, 0.065]);
    blob(g, mat(gems[(i + 1) % 3], { roughness: 0.2 }), [Math.sin(a) * 0.45, 0.16, Math.cos(a) * 0.45 * 1.0 + (z > 0 ? 0.04 : 0)], [0.05, 0.05, 0.05]);
  }
  g.scale.setScalar(s); return g;
}

/** Aladdin lamp, spout toward +x. userData.tip = flame point (unscaled). */
export function lamp({ scale = 1, lit = true } = {}) {
  const g = new THREE.Group(), au = gold();
  const prof = [[0.001, 0], [0.2, 0], [0.24, 0.03], [0.2, 0.07], [0.34, 0.16], [0.4, 0.27], [0.34, 0.4], [0.2, 0.48], [0.14, 0.52]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(prof, 36), au);
  add(g, new THREE.SphereGeometry(0.15, 20, 14), au, [0, 0.55, 0], [0, 0, 0], [1, 0.6, 1]);
  blob(g, au, [0, 0.64, 0], [0.045, 0.045, 0.045]);
  const sp = new THREE.CatmullRomCurve3([V(0.3, 0.2, 0), V(0.55, 0.2, 0), V(0.78, 0.32, 0), V(0.92, 0.5, 0)]);
  add(g, new THREE.TubeGeometry(sp, 20, 0.065, 12), au);
  blob(g, au, [0.92, 0.5, 0], [0.085, 0.085, 0.085]);
  add(g, new THREE.TorusGeometry(0.2, 0.04, 10, 24, Math.PI * 1.4), au, [-0.5, 0.3, 0], [0, 0, 0.3 * Math.PI], [1, 1.2, 1]);
  blob(g, mat('#3bd0ff', { roughness: 0.2 }), [0, 0.27, 0.4], [0.07, 0.07, 0.04]);
  g.userData.tip = V(0.92, 0.58, 0);
  if (lit) g.add(flame(0.92, 0.58, 1));
  g.scale.setScalar(scale); return g;
}
export function flame(x, y, s = 1) {
  const f = new THREE.Group(); f.position.set(x, y, 0);
  add(f, new THREE.ConeGeometry(0.11 * s, 0.4 * s, 16), glow('#ff8a1e'), [0, 0.2 * s, 0]);
  add(f, new THREE.ConeGeometry(0.065 * s, 0.26 * s, 16), glow('#ffe36a'), [0, 0.13 * s, 0.01]);
  return f;
}

/** Chain of soft spheres (smoke). pts = [[x,y,z,r],...] */
export function smoke(parent, pts, color = '#f4f1ff', opacity = 0.85) {
  for (const [x, y, z, r] of pts) {
    const m = blob(parent, new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity }), [x, y, z], [r, r, r]);
    m.castShadow = false;
  }
}

/** Closed book standing upright, front = +z. */
export function book(w, h, t, cover, title, { sub = null } = {}) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(w, h, t), mat(cover, { roughness: 0.6 }));
  add(g, new THREE.BoxGeometry(w * 0.94, h * 0.94, t * 0.7), mat('#f6efd8'), [0.03 * w, 0, 0]);
  add(g, new THREE.BoxGeometry(w * 0.99, h * 0.99, t * 0.2), mat(cover, { roughness: 0.6 }), [0, 0, t * 0.42]);
  const tt = tex(512, Math.round(512 * h / w), (c, pw, ph) => {
    c.fillStyle = cover; c.fillRect(0, 0, pw, ph);
    c.strokeStyle = '#f2b82a'; c.lineWidth = 14; c.strokeRect(24, 24, pw - 48, ph - 48);
    c.fillStyle = '#f7d65a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${pw * 0.3}px "Arial Black", Helvetica, sans-serif`; c.fillText(title, pw / 2, ph * 0.22);
    // DNA helix
    for (let i = 0; i < 24; i++) {
      const y = ph * 0.38 + i * ph * 0.025, a = Math.sin(i * 0.6) * pw * 0.2;
      c.fillStyle = '#6fe0ff'; c.beginPath(); c.arc(pw / 2 + a, y, 11, 0, 7); c.fill();
      c.fillStyle = '#ff7a9c'; c.beginPath(); c.arc(pw / 2 - a, y, 11, 0, 7); c.fill();
      if (i % 2 === 0) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(pw / 2 + a, y); c.lineTo(pw / 2 - a, y); c.stroke(); }
    }
  });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96), new THREE.MeshBasicMaterial({ map: tt }));
  f.position.z = t * 0.53 + 0.003; g.add(f); return g;
}

export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/**
 * run({ ground, frame:{x,y,H}, genie:{x,y,z,ry,scale,pose,mouth}, build(ctx), el, az, cover })
 * Camera is placed so that the frame is H world units tall at z = 0.
 */
export function run({ ground = '#6fae45', frame, genie: g = {}, build, el = 35, az = 150, cover = 2, seed = 5, clouds = CLOUDS, ambient = 2.3, sun = 2.6 }) {
  guard(() => {
    const stage = createAnimeStage({
      fov: 30, sunElevation: el, sunAzimuth: az, exposure: 1,
      sky: { cover, seed, towerTop: 0.5, puffCover: 2 }, rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: sun, ambient: { color: '#e8e2ff', intensity: ambient }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const genie = createGenie({ scale: g.scale ?? 1 });
    genie.position.set(g.x ?? 0, g.y ?? 0, g.z ?? 0); genie.rotation.y = g.ry ?? 0;
    genie.userData.pose(g.pose ?? { headTilt: 0.06, arms: { l: [0, 0.5, 0.2], r: [0, -0.5, 0.2] } });
    genie.userData.setMouth(g.mouth ?? 0);
    scene.add(genie);
    const reachTo = (hand, w) => {
      genie.updateMatrixWorld(true); const l = genie.worldToLocal(V(...w)); genie.userData.reach(hand, [l.x, l.y, l.z]);
    };
    build?.({ stage, scene, genie, reachTo });
    const gm = new Set(); genie.traverse((o) => gm.add(o));
    stage.toonify(scene, (m) => gm.has(m));
    if (clouds) stage.addClouds(clouds);
    const d = frame.H / 2 / Math.tan(Math.PI / 12);
    stage.camera.position.set(frame.x + (frame.ax ?? 0), frame.y + (frame.rise ?? 0.3), d);
    stage.camera.lookAt(frame.x, frame.y, 0);
    stage.finish();
  });
}

export const HEAD = `<!doctype html>
<html><head><meta charset="utf-8"><title>Amgen</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
`;

/** Exclude an object from the ink pass (clean glow, no outline). */
export const noInk = (o) => { o.traverse((c) => c.layers.set(1)); return o; };
/** Soft radial glow disc facing +z. */
export function halo(r, rgb = '255,235,160', a = 0.9) {
  const t = tex(256, 256, (c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, s, s); });
  return noInk(new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })));
}
