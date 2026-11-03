// Shared scene helpers + props for Verve scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createBallerina } from './ballerina.js';
export { THREE, guard, canvasTexture, rng, createBallerina };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const bevBox = (p, m, w, h, d, pos, rot = [0, 0, 0], r = 0.02) => {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3 }); g.translate(0, 0, -(d - 2 * r) / 2);
  return add(p, g, m, pos, rot);
};
export function label(text, w, h, bg, fg, size = 120) {
  const t = canvasTexture(512, (ctx, s) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2); });
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
}

export function lollipop(scale = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 14), mat('#f4f0e8'), [0, 0.8, 0]);
  const tex = canvasTexture(512, (ctx, s) => {
    const cols = ['#ff3d6e', '#fff', '#ffd23d', '#fff'];
    for (let i = 0; i < 24; i++) { ctx.fillStyle = cols[i % 4 === 1 || i % 4 === 3 ? 1 : (i % 8 === 0 ? 0 : 2)]; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.arc(s / 2, s / 2, s, i * Math.PI / 12, (i + 1) * Math.PI / 12); ctx.fill(); }
    ctx.lineWidth = 36; for (let r = 40; r < 260; r += 70) { ctx.strokeStyle = r % 140 ? '#ff3d6e' : '#7a3dff'; ctx.beginPath(); ctx.arc(s / 2, s / 2, r, 0, 7); ctx.stroke(); }
  });
  const disc = add(g, new THREE.CylinderGeometry(0.62, 0.62, 0.16, 48), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2 }), [0, 1.9, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.62, 0.08, 12, 48), mat('#ffffff', { roughness: 0.2 }), [0, 1.9, 0]);
  g.scale.setScalar(scale); return g;
}

export function nail(len = 0.5) {
  const g = new THREE.Group(), m = mat('#9aa3ad', { metalness: 0.8, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(0.02, 0.02, len, 12), m, [0, len / 2, 0]);
  add(g, new THREE.ConeGeometry(0.02, 0.06, 12), m, [0, -0.03, 0], [Math.PI, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), m, [0, len + 0.015, 0]);
  return g;
}

export function die(size = 0.3, face = null) {
  const g = new THREE.Group();
  bevBox(g, mat('#fafafa', { roughness: 0.3 }), size, size, size, [0, size / 2, 0], [0, 0, 0], size * 0.12);
  const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, 1], [-1, 1], [1, -1]], 5: [[-1, -1], [1, 1], [-1, 1], [1, -1], [0, 0]], 6: [[-1, -1], [1, 1], [-1, 1], [1, -1], [-1, 0], [1, 0]] };
  const pm = mat('#d01030', { roughness: 0.3 }), o = size / 2 + 0.003, sp = size * 0.26;
  const faces = [[0, 0, 1, 5], [0, 0, -1, 6], [1, 0, 0, 3], [-1, 0, 0, 4], [0, 1, 0, 6], [0, -1, 0, 1]];
  for (const [nx, ny, nz, n] of faces) for (const [a, b] of pips[n]) {
    const d = add(g, new THREE.CircleGeometry(size * 0.085, 16), pm);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(nx, ny, nz));
    const loc = new THREE.Vector3(a * sp, b * sp, o).applyQuaternion(q); d.position.copy(loc).add(new THREE.Vector3(0, size / 2, 0)); d.quaternion.copy(q);
  }
  return g;
}

export function coin(r = 0.12) {
  const g = new THREE.Group(), gold = mat('#ffc928', { metalness: 0.7, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.18, 28), gold, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.78, r * 0.05, 6, 28), mat('#ffe27a', { metalness: 0.6, roughness: 0.3 }), [0, 0, r * 0.1]);
  add(g, new THREE.TorusGeometry(r * 0.78, r * 0.05, 6, 28), mat('#ffe27a', { metalness: 0.6, roughness: 0.3 }), [0, 0, -r * 0.1]);
  return g;
}

export function mouse() {
  const g = new THREE.Group(), fur = mat('#b9b4ae'), pink = mat('#f2a3b0');
  blob(g, fur, [0, 0.15, 0], [0.2, 0.15, 0.14]);
  blob(g, fur, [0.2, 0.14, 0], [0.1, 0.09, 0.08]);
  blob(g, pink, [0.3, 0.14, 0], [0.025, 0.025, 0.025]);
  for (const s of [-1, 1]) {
    blob(g, fur, [0.15, 0.24, s * 0.06], [0.06, 0.07, 0.015]); blob(g, pink, [0.15, 0.24, s * 0.068], [0.04, 0.05, 0.01]);
    blob(g, mat('#111', { roughness: 0.2 }), [0.26, 0.17, s * 0.045], [0.014, 0.018, 0.014]);
    blob(g, fur, [0.05, 0.03, s * 0.09], [0.06, 0.03, 0.04]);
  }
  add(g, new THREE.TorusGeometry(0.16, 0.012, 6, 20, Math.PI * 1.3), pink, [-0.2, 0.05, 0], [0, 0, 1.2]);
  return g;
}

export function gene(len = 2, turns = 3, r = 0.18) {
  const g = new THREE.Group(), c1 = mat('#3dd6e8'), c2 = mat('#ff5c9a'), rung = mat('#ffd23d');
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = (t - 0.5) * len, a = t * turns * Math.PI * 2;
    blob(g, c1, [Math.cos(a) * r, y, Math.sin(a) * r], [0.045, 0.045, 0.045]);
    blob(g, c2, [-Math.cos(a) * r, y, -Math.sin(a) * r], [0.045, 0.045, 0.045]);
    if (i % 2 === 0) { const rr = add(g, new THREE.CylinderGeometry(0.014, 0.014, r * 2, 8), rung, [0, y, 0], [0, 0, Math.PI / 2]); rr.rotation.set(0, -a, Math.PI / 2, 'YXZ'); }
  }
  return g;
}

export function ground(scene, color = '#e9a6c9') {
  add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

/** Standard stage; returns {stage, scene, P, num, finish(cam,look,characters)}. */
export function makeStage(opts = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 2), seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...(opts.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const done = (cam, look, chars = [], post = null) => {
    const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
    stage.toonify(stage.scene, (m) => pm.has(m)); if (post) post();
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
  };
  return { stage, scene: stage.scene, P, num, done };
}
export { guard as run };

export function syringe(scale = 1) {
  const g = new THREE.Group(), glass = mat('#dff6ff', { roughness: 0.15 });
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.4, 20), glass, [0, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.042, 0.042, 0.22, 20), mat('#35c46a'), [0, -0.06, 0]);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8), mat('#cfd6dc', { metalness: 0.8 }), [0, 0.32, 0]);
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), mat('#ffffff'), [0, 0.2, 0]);
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), mat('#ffffff'), [0, -0.215, 0]);
  add(g, new THREE.CylinderGeometry(0.004, 0.004, 0.25, 8), mat('#cfd6dc', { metalness: 0.8 }), [0, -0.34, 0]);
  g.scale.setScalar(scale); return g;
}
export function hammer(scale = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12), mat('#a8683a'), [0, 0.1, 0]);
  bevBox(g, mat('#5d6670', { metalness: 0.7, roughness: 0.35 }), 0.32, 0.14, 0.14, [0, 0.4, 0], [0, 0, 0], 0.02);
  g.scale.setScalar(scale); return g;
}
export function coinStack(n, r = 0.12) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const c = coin(r); c.rotation.x = Math.PI / 2; c.position.set((i % 2) * 0.01, r * 0.09 + i * r * 0.2, 0); g.add(c); }
  return g;
}

/** Flat text panel (w x h world units) as one mesh with a single material. */
export function textPanel(text, w, h, bg, fg, pos, rot = [0, 0, 0]) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.fillStyle = fg;
  let fs = c.height * 0.7; x.font = `bold ${fs}px sans-serif`; while (x.measureText(text).width > c.width * 0.9) { fs *= 0.95; x.font = `bold ${fs}px sans-serif`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + fs * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
  m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; return m;
}
