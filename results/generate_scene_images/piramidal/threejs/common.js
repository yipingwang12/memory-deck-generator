// Shared helpers for the Piramidal scenes: stage boot, primitives, chibi doctor/head, hospital props.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createPiranha } from './piranha.js';
export { THREE, canvasTexture, rng, createPiranha };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
/** cylinder between two points */
export function rod(p, a, b, r, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = add(p, new THREE.CylinderGeometry(r, r, d.length(), 14), m);
  o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}
export function tube(p, pts, r, m, seg = 120) {
  return add(p, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), seg, r, 10), m);
}

export function boot({ stage: so = {}, sky = {}, clouds = null }, build) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
      sky: { cover: num('cover', 2), seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.5, ...so,
    });
    const chars = new Set();
    const mark = (o) => { o.traverse((m) => chars.add(m)); return o; };
    build({ stage, scene: stage.scene, num, mark });
    if (clouds) stage.addClouds(clouds);
    stage.toonify(stage.scene, (m) => chars.has(m));
    stage.finish();
  });
}

export const look = (stage, num, cam, tgt) => {
  stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
  stage.camera.lookAt(num('tx', tgt[0]), num('ty', tgt[1]), num('tz', tgt[2]));
};
export function ground(scene, color = '#7cc24e', r = 300) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(r, 64), mat(color, { roughness: 1 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); return g;
}
export const room = (scene, { wall = '#cfe9e4', floor = '#e9e2d2', w = 12, d = 8, h = 4.5 } = {}) => {
  const g = new THREE.Group();
  box(g, mat(floor, { roughness: 0.5 }), [0, -0.05, 0], [w, 0.1, d]);
  box(g, mat(wall), [0, h / 2, -d / 2], [w, h, 0.1]);
  box(g, mat('#bfdcd6'), [0, 0.12, -d / 2 + 0.07], [w, 0.24, 0.06]);
  scene.add(g); return g;
};
export const textTex = (txt, { w = 512, h = 256, bg = null, fg = '#fff', size = 150, font = 'bold' } = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.font = `${font} ${size}px Helvetica, Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const flag = (p, color, pos, tilt = 0) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = tilt; p.add(g);
  cyl(g, mat('#e9e3d6'), [0, 0.4, 0], 0.018, 0.8);
  blob(g, mat('#f0c040', { metalness: 0.4 }), [0, 0.81, 0], [0.03, 0.03, 0.03]);
  box(g, mat(color, { roughness: 0.6 }), [0.19, 0.67, 0], [0.38, 0.24, 0.015]);
  return g;
};

/** EEG-style canvas texture: dark screen with glowing traces; spike = seizure burst in the last trace. */
export function eegTexture({ w = 768, spike = true, rows = 3 } = {}) {
  return canvasTexture(w, (ctx) => {
    ctx.fillStyle = '#06141c'; ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(80,200,170,0.18)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(i * w / 16, 0); ctx.lineTo(i * w / 16, w); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * w / 16); ctx.lineTo(w, i * w / 16); ctx.stroke(); }
    const cols = ['#5dffb0', '#58d6ff', '#ff5a6e'];
    for (let r = 0; r < rows; r++) {
      const y0 = w * (0.2 + 0.3 * r), r2 = rng(r + 3); ctx.strokeStyle = cols[r % 3]; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const burst = spike && r === rows - 1 && x > w * 0.45 && x < w * 0.8 ? 1 : 0;
        const a = burst ? 85 + 25 * r2() : 18 + 9 * r2();
        const y = y0 + Math.sin(x * (burst ? 0.34 : 0.07 + r * 0.02)) * a;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/** Chibi head r~0.19 facing +z: skin, hair, big eyes (or closed arcs). */
export function chibiHead({ skin = '#ffe0c0', hair = '#3a2a22', closed = false, r = 0.19 } = {}) {
  const g = new THREE.Group(), s = mat(skin), dark = mat('#1d1210', { roughness: 0.3 });
  blob(g, s, [0, 0, 0], [r, r * 1.02, r]);
  blob(g, mat(hair), [0, r * 0.28, -r * 0.1], [r * 1.07, r * 0.95, r * 1.0]);
  blob(g, mat(hair), [0, r * 0.62, r * 0.55], [r * 0.85, r * 0.3, r * 0.5], [0.35, 0, 0]);
  for (const sx of [-1, 1]) {
    const x = sx * r * 0.42, y = -r * 0.05, z = r * 0.88;
    if (closed) add(g, new THREE.TorusGeometry(r * 0.14, r * 0.03, 8, 16, Math.PI), dark, [x, y, z], [0, 0, Math.PI]);
    else {
      blob(g, mat('#fff', { roughness: 0.3 }), [x, y, z], [r * 0.2, r * 0.25, r * 0.08]);
      blob(g, mat('#4a3020'), [x, y - r * 0.01, z + r * 0.05], [r * 0.15, r * 0.2, r * 0.05]);
      blob(g, dark, [x, y, z + r * 0.09], [r * 0.08, r * 0.12, r * 0.04]);
      blob(g, mat('#fff', { roughness: 0.2 }), [x - r * 0.05, y + r * 0.08, z + r * 0.12], [r * 0.045, r * 0.05, r * 0.03]);
    }
    blob(g, mat('#ff9aa2'), [sx * r * 0.66, -r * 0.4, r * 0.74], [r * 0.12, r * 0.07, r * 0.05]);
  }
  add(g, new THREE.TorusGeometry(r * 0.12, r * 0.025, 8, 14, Math.PI), mat('#8a3a3a'), [0, -r * 0.42, r * 0.93], [0, 0, Math.PI]);
  return g;
}

/** Chibi doctor, ~0.95 tall, faces +z. userData.arms.{l,r} shoulder groups (rotate .x/.z). */
export function createDoctor({ scale = 1, hair = '#3a2a22', glasses = false } = {}) {
  const g = new THREE.Group(), white = mat('#fbfbff'), dark = mat('#2b3342');
  cyl(g, dark, [-0.08, 0.18, 0], 0.045, 0.3); cyl(g, dark, [0.08, 0.18, 0], 0.045, 0.3);
  blob(g, mat('#3b3b46'), [-0.08, 0.03, 0.04], [0.06, 0.035, 0.09]); blob(g, mat('#3b3b46'), [0.08, 0.03, 0.04], [0.06, 0.035, 0.09]);
  add(g, new THREE.CylinderGeometry(0.15, 0.22, 0.46, 28), white, [0, 0.48, 0]);
  add(g, new THREE.TorusGeometry(0.1, 0.012, 8, 24, Math.PI), mat('#303640'), [0, 0.64, 0.09], [0, 0, Math.PI]);
  blob(g, mat('#5a6270', { metalness: 0.5 }), [0, 0.5, 0.17], [0.03, 0.03, 0.015]);
  const head = chibiHead({ hair }); head.position.y = 0.84; g.add(head);
  if (glasses) for (const sx of [-1, 1]) add(head, new THREE.TorusGeometry(0.06, 0.007, 8, 24), mat('#222'), [sx * 0.08, -0.01, 0.185]);
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.64, 0); g.add(sh); arms[k] = sh;
    cyl(sh, mat('#fbfbff'), [0, -0.12, 0], 0.045, 0.26); blob(sh, mat('#ffe0c0'), [0, -0.27, 0], [0.045, 0.05, 0.045]);
  }
  g.userData.arms = arms; g.scale.setScalar(scale); return g;
}

/** Hospital bed along x: frame, mattress, pillow at -x end. ~2.0 long. */
export function createBed() {
  const g = new THREE.Group(), steel = mat('#c9d4dc', { metalness: 0.4, roughness: 0.4 });
  box(g, steel, [0, 0.32, 0], [2.0, 0.08, 0.95]);
  box(g, mat('#ffffff'), [0, 0.42, 0], [1.9, 0.14, 0.88]);
  box(g, mat('#9fd3e6'), [0.3, 0.52, 0], [1.2, 0.1, 0.92]);
  blob(g, mat('#ffffff'), [-0.72, 0.56, 0], [0.26, 0.09, 0.3]);
  box(g, steel, [-1.0, 0.65, 0], [0.06, 0.55, 0.95]);
  box(g, steel, [1.0, 0.55, 0], [0.06, 0.35, 0.95]);
  for (const [x, z] of [[-0.9, 0.4], [-0.9, -0.4], [0.9, 0.4], [0.9, -0.4]]) { cyl(g, mat('#556'), [x, 0.15, z], 0.04, 0.3); blob(g, mat('#222'), [x, 0.04, z], [0.06, 0.04, 0.06]); }
  return g;
}

/** Bedside monitor: stand + screen showing eegTexture; screen faces +z. */
export function createMonitor({ w = 1.1, h = 0.8, spike = true } = {}) {
  const g = new THREE.Group();
  cyl(g, mat('#4a5560'), [0, 0.6, -0.05], 0.035, 1.2); cyl(g, mat('#4a5560'), [0, 0.03, -0.05], 0.3, 0.06);
  box(g, mat('#2d3640'), [0, 1.35, 0], [w + 0.1, h + 0.1, 0.1]);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: eegTexture({ spike }) }));
  scr.position.set(0, 1.35, 0.055); g.add(scr); return g;
}
export function createBrain({ color = '#ff9bb3', scale = 1 } = {}) {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.5 }), r = rng(4);
  for (const s of [-1, 1]) {
    blob(g, m, [s * 0.1, 0, 0], [0.19, 0.17, 0.25]); const m2 = mat('#e6678c', { roughness: 0.5 });
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, b = r() * 3.14 - 1.57; blob(g, i % 2 ? m2 : m, [s * 0.1 + Math.cos(a) * Math.cos(b) * 0.17, Math.sin(b) * 0.14, Math.sin(a) * Math.cos(b) * 0.21], [0.06, 0.06, 0.06]); }
  }
  blob(g, m, [0, -0.13, -0.17], [0.08, 0.07, 0.09]);
  g.scale.setScalar(scale); return g;
}
