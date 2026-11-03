// Shared props for the Illumina / 10x / Element scenes: stage, lamp post, lamp pole, gnome rival, coins, dice, text boards.
import * as THREE from 'three';
import { rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const num = (P, k, d) => Number(P.get(k) ?? d);

export function makeStage(P, o = {}) {
  return createAnimeStage({
    fov: num(P, 'fov', o.fov ?? 40), sunElevation: o.el ?? 38, sunAzimuth: o.az ?? 150, exposure: 1,
    sky: { cover: o.cover ?? 1.5, seed: o.seed ?? 5, towerTop: 0.5, puffCover: 2 },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
}
export const clouds = (stage) => stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
export const ground = (scene, color) => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);

export function textBoard(text, w, h, { bg = '#fff6dc', fg = '#222', font = 'bold 140px sans-serif', border = '#6a4220' } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d'); x.fillStyle = border; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = bg; x.fillRect(14, 14, c.width - 28, c.height - 28);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group(); add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), [0, 0, 0.016]); return g;
}

export function lampPost(h = 2.0) {
  const g = new THREE.Group(), iron = mat('#2f3a3d', { metalness: 0.5, roughness: 0.45 });
  add(g, new THREE.CylinderGeometry(0.1, 0.13, 0.18, 16), iron, [0, 0.09, 0]);
  add(g, new THREE.CylinderGeometry(0.04, 0.06, h, 14), iron, [0, h / 2, 0]);
  add(g, new THREE.TorusGeometry(0.07, 0.015, 8, 20), iron, [0, 0.5, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.15, 0.1, 0.06, 4), iron, [0, h, 0], [0, Math.PI / 4, 0]);
  const L = new THREE.Group(); L.position.y = h + 0.03; g.add(L);
  add(L, new THREE.CylinderGeometry(0.16, 0.11, 0.3, 4, 1), glow('#ffd46a'), [0, 0.15, 0], [0, Math.PI / 4, 0]);
  add(L, new THREE.CylinderGeometry(0.075, 0.075, 0.2, 12), glow('#fff6c4'), [0, 0.15, 0]);
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; add(L, new THREE.BoxGeometry(0.02, 0.32, 0.02), iron, [Math.cos(a) * 0.135, 0.15, Math.sin(a) * 0.135]); }
  add(L, new THREE.ConeGeometry(0.22, 0.14, 4), iron, [0, 0.37, 0], [0, Math.PI / 4, 0]);
  add(L, new THREE.SphereGeometry(0.035, 10, 8), iron, [0, 0.47, 0]);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.22, depthWrite: false }));
  halo.position.y = 0.15; L.add(halo);
  g.userData.lantern = L; return g;
}

// Lamp-lighting pole whose grip sits at `hand` and tip at `tip` (world coords).
export function polePlaced(scene, hand, tip, grip = 0.5) {
  const hv = new THREE.Vector3(...hand), tv = new THREE.Vector3(...tip), dir = tv.clone().sub(hv), d = dir.length(); dir.normalize();
  const len = d + grip, g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.018, 0.018, len, 10), mat('#8a5a2e'), [0, len / 2, 0]);
  add(g, new THREE.TorusGeometry(0.04, 0.009, 8, 16, Math.PI * 1.5), mat('#b0b6bd', { metalness: 0.7 }), [0, len, 0]);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), glow('#ffb02e')); f.scale.y = 1.7; f.position.y = len + 0.07; g.add(f);
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), glow('#fff5b0')); f2.scale.y = 1.6; f2.position.y = len + 0.06; g.add(f2);
  g.position.copy(hv).addScaledVector(dir, -grip); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  scene.add(g); return g;
}

export function handWorld(ll, k) { ll.updateMatrixWorld(true); return ll.userData.parts.hands[k].getWorldPosition(new THREE.Vector3()).toArray(); }

// Element gnome rival: round blue body, tall red cap, white beard. opts.cap, opts.coat
export function gnome({ cap = '#d8352f', coat = '#2f6fb0', x = false } = {}) {
  const g = new THREE.Group(), skin = '#ffd2b0';
  const body = blob(g, mat(coat), [0, 0.27, 0], [0.24, 0.27, 0.22]);
  for (const s of [-1, 1]) { blob(g, mat('#3a2418'), [s * 0.1, 0.03, 0.04], [0.075, 0.05, 0.11]); add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12), mat('#4a4f6a'), [s * 0.1, 0.1, 0]); }
  blob(g, mat(skin), [0, 0.62, 0], [0.19, 0.18, 0.18]);
  const hcap = add(g, new THREE.ConeGeometry(0.2, 0.55, 28), mat(cap), [0.03, 0.97, -0.01], [0, 0, -0.15]);
  add(g, new THREE.TorusGeometry(0.19, 0.03, 10, 30), mat(cap), [0, 0.7, 0], [Math.PI / 2 - 0.05, 0, 0]);
  blob(g, mat('#f6f2ea'), [0, 0.5, 0.1], [0.17, 0.17, 0.1]);
  add(g, new THREE.ConeGeometry(0.15, 0.3, 24), mat('#f6f2ea'), [0, 0.35, 0.12], [Math.PI, 0, 0]);
  blob(g, mat('#ffb0a0'), [0, 0.6, 0.18], [0.04, 0.035, 0.035]);
  for (const s of [-1, 1]) {
    const ex = s * 0.07, ey = 0.66;
    const ez = (r) => Math.sqrt(0.185 * 0.185 - ex * ex - (ey - 0.62) ** 2) + r;
    for (const [rx, ry, c, dz, dy] of [[0.04, 0.05, '#fff', 0, 0], [0.032, 0.045, '#1b6b3a', 0.002, 0], [0.018, 0.03, '#06140c', 0.004, 0], [0.011, 0.011, '#fff', 0.006, 0.02]]) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }));
      m.scale.set(rx, ry, 1); m.position.set(ex - (dy ? s * 0.006 : 0), ey + dy, ez(dz)); g.add(m);
    }
    const bl = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#ff8a8a', transparent: true, opacity: 0.5 })); bl.scale.set(0.03, 0.016, 1); bl.position.set(s * 0.12, 0.6, 0.14); bl.lookAt(s * 0.4, 0.6, 0.6); g.add(bl);
    const arm = add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), mat(coat), [s * 0.23, 0.3, 0.05], [0, 0, s * 0.5]);
    blob(g, mat(skin), [s * 0.31, 0.2, 0.06], [0.045, 0.045, 0.045]);
  }
  if (x) { const xm = mat('#ffcf33'); for (const r of [Math.PI / 4, -Math.PI / 4]) add(g, new THREE.BoxGeometry(0.22, 0.045, 0.02), xm, [0, 0.27, 0.225], [0, 0, r]); }
  return g;
}

export const toon = (stage, scene, roots) => { const s = new Set(); roots.forEach((r) => r.traverse((o) => s.add(o))); stage.toonify(scene, (m) => s.has(m)); };

export function coin(r = 0.12) {
  const g = new THREE.Group(), gold = mat('#f2b92a', { metalness: 0.6, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.16, 28), gold);
  add(g, new THREE.TorusGeometry(r * 0.92, r * 0.05, 6, 28), mat('#ffd966', { metalness: 0.6, roughness: 0.3 }), [0, r * 0.08, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CylinderGeometry(r * 0.55, r * 0.55, r * 0.02, 20), mat('#d99a14', { metalness: 0.6, roughness: 0.35 }), [0, r * 0.085, 0]);
  return g;
}

export function dice(s = 0.3) {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s, 1, 1, 1), mat('#fbf7ef', { roughness: 0.35 }));
  // bevel by an inset rounded look
  body.castShadow = true; g.add(body);
  const pip = mat('#1a1a1a', { roughness: 0.3 }), red = mat('#d8312f', { roughness: 0.3 });
  const layouts = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const faces = [[1, [0, 0, 1], [0, 0, 0]], [6, [0, 0, -1], [0, Math.PI, 0]], [2, [1, 0, 0], [0, Math.PI / 2, 0]], [5, [-1, 0, 0], [0, -Math.PI / 2, 0]], [3, [0, 1, 0], [-Math.PI / 2, 0, 0]], [4, [0, -1, 0], [Math.PI / 2, 0, 0]]];
  for (const [n, nrm, rot] of faces) {
    const f = new THREE.Group(); f.position.set(nrm[0] * s / 2, nrm[1] * s / 2, nrm[2] * s / 2); f.rotation.set(...rot); g.add(f);
    for (const [px, py] of layouts[n]) { const d = new THREE.Mesh(new THREE.CircleGeometry(s * (n === 1 ? 0.14 : 0.085), 20), n === 1 ? red : pip); d.position.set(px * s * 0.25, py * s * 0.25, 0.002); f.add(d); }
  }
  return g;
}
export { THREE, rng };
