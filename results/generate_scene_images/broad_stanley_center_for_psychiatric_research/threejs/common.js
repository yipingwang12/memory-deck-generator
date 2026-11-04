// Shared scene helpers + props for the Broad Stanley deck. All props: feet on y=0, face +z.
import * as THREE from 'three';
import { guard, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTrophy } from './trophy.js';
export { THREE };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; p.add(o); return o;
};
const V = (x, y) => new THREE.Vector2(x, y);
const GOLD = () => mat('#f2b82a', { metalness: 0.3, roughness: 0.35 });
const sphere = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
const textTex = (txt, bg, fg, w = 512, h = 160, font = 'bold 96px sans-serif') => canvasTexture(w, (ctx) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, w); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, w / 2, w / 2);
});
export function sign(txt, w, h, bg = '#1d4f91', fg = '#fff', font) {
  const g = new THREE.Group(), t = textTex(txt, bg, fg, 512, 512, font || 'bold 100px sans-serif');
  t.repeat.set(1, h / w * 0 + 1);
  add(g, new THREE.BoxGeometry(w, h, 0.05), mat('#e8e2d0'));
  const face = add(g, new THREE.PlaneGeometry(w * 0.94, h * 0.86), new THREE.MeshBasicMaterial({ map: t }), [0, 0, 0.03]);
  face.geometry.attributes.uv.array.set([0, 0.62, 1, 0.62, 0, 0.38, 1, 0.38]);
  return g;
}

/** Common scene: stage + grass + trophy (+pose) + camera. build(ctx) adds props. */
export function makeScene({ build, ground = '#6fae45', trophyAt = [-0.55, 0, 0.2], ts = 1.15, pose, cam = {}, seed = 5, sky = {} }) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({ fov: 40, sunElevation: 35, sunAzimuth: 150, exposure: 1, sky: { cover: 2, seed, towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 } });
    const scene = stage.scene;
    add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.85 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const T = createTrophy({ scale: num('ts', ts) }); T.position.set(...trophyAt); scene.add(T);
    if (pose) pose(T);
    const chars = [T];
    const ctx = { scene, T, ts: num('ts', ts), chars, stage };
    build(ctx);
    const cs = new Set(); chars.forEach((c) => c.traverse((o) => cs.add(o)));
    scene.updateMatrixWorld(true);
    stage.toonify(scene, (m) => cs.has(m));
    stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    const c = { x: 0, y: 1.0, z: 3.3, tx: 0, ty: 0.85, ...cam };
    stage.camera.position.set(num('cx', c.x), num('cy', c.y), num('cz', c.z));
    stage.camera.lookAt(num('tx', c.tx), num('ty', c.ty), 0);
    stage.finish();
  });
}
export const wave = (T) => T.userData.pose({ arms: { l: [0, 0.5, 0.2], r: [0, 0.5, 0.2] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });

// ---------- props ----------
export function coin(r = 0.07) { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(r, r, r * 0.22, 24), GOLD()); add(g, new THREE.TorusGeometry(r * 0.72, r * 0.05, 6, 24), mat('#c98a12', { metalness: 0.3 }), [0, r * 0.12, 0], [Math.PI / 2, 0, 0]); return g; }
export function coinHeap(n, spread = 0.3, h = 0.25, r = 0.07, seed = 3) {
  const g = new THREE.Group(); let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const c = coin(r), a = rnd() * 6.28, d = rnd() * spread; c.position.set(Math.cos(a) * d, h * (1 - d / spread) + rnd() * 0.04, Math.sin(a) * d); c.rotation.set((rnd() - 0.5) * 1.4, rnd() * 3, (rnd() - 0.5) * 1.4); g.add(c); }
  return g;
}
export function moneyBag() {
  const g = new THREE.Group(), m = mat('#b89358', { roughness: 0.9 });
  add(g, new THREE.LatheGeometry([V(0, 0), V(0.22, 0.02), V(0.34, 0.2), V(0.3, 0.38), V(0.14, 0.52), V(0.1, 0.6), V(0.2, 0.74), V(0.1, 0.7), V(0, 0.7)], 28), m);
  add(g, new THREE.TorusGeometry(0.12, 0.025, 8, 24), mat('#7a2a2a'), [0, 0.55, 0], [Math.PI / 2, 0, 0]);
  const t = textTex('$', 'rgba(0,0,0,0)', '#3e5a2b', 256, 256, 'bold 190px sans-serif'); t.premultiplyAlpha = false;
  add(g, new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: t, transparent: true }), [0, 0.27, 0.325]);
  return g;
}
export function crown() {
  const g = new THREE.Group(), m = GOLD();
  add(g, new THREE.CylinderGeometry(0.27, 0.24, 0.12, 24, 1, true), m).material.side = THREE.DoubleSide;
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(g, new THREE.ConeGeometry(0.06, 0.2, 8), m, [Math.cos(a) * 0.255, 0.14, Math.sin(a) * 0.255]); sphere(g, mat(['#d6283a', '#2a72d6'][i % 2]), [Math.cos(a) * 0.255, 0.26, Math.sin(a) * 0.255], [0.035, 0.035, 0.035]); }
  return g;
}
export function globe() {
  const g = new THREE.Group();
  const t = canvasTexture(512, (ctx, s) => { ctx.fillStyle = '#2d78c8'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#58b34a'; [[120, 160, 70], [330, 150, 90], [250, 320, 70], [440, 300, 50], [60, 330, 40]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0.5, 0, 7); ctx.fill(); }); });
  add(g, new THREE.SphereGeometry(0.55, 40, 28), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }), [0, 0.9, 0], [0, 0.5, 0.2]);
  add(g, new THREE.TorusGeometry(0.6, 0.025, 8, 48, Math.PI * 1.3), mat('#c98a12', { metalness: 0.4 }), [0, 0.9, 0], [0, 0, 0.3]);
  add(g, new THREE.CylinderGeometry(0.2, 0.26, 0.1, 24), mat('#7a4a22'), [0, 0.05, 0]); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), mat('#c98a12'), [0, 0.25, 0]);
  return g;
}
export function dna(h = 1.7) {
  const g = new THREE.Group(), n = 22;
  for (let i = 0; i < n; i++) {
    const y = 0.1 + i / (n - 1) * h, a = i * 0.55, r = 0.28;
    const p1 = [Math.cos(a) * r, y, Math.sin(a) * r], p2 = [-Math.cos(a) * r, y, -Math.sin(a) * r];
    sphere(g, mat('#e8457a'), p1, [0.07, 0.07, 0.07]); sphere(g, mat('#3aa0e8'), p2, [0.07, 0.07, 0.07]);
    const rung = add(g, new THREE.CylinderGeometry(0.025, 0.025, r * 2, 8), mat(['#ffd23a', '#7fd13b'][i % 2]), [0, y, 0], [0, 0, Math.PI / 2]); rung.rotation.order = 'YXZ'; rung.rotation.y = -a;
  }
  return g;
}
export function sword() {
  const g = new THREE.Group(), steel = mat('#cfd6de', { metalness: 0.7, roughness: 0.25 });
  add(g, new THREE.SphereGeometry(1, 20, 14), mat('#8b8f96', { roughness: 0.95 }), [0, 0.18, 0], [0, 0, 0], [0.7, 0.28, 0.55]);
  add(g, new THREE.BoxGeometry(0.2, 1.3, 0.04), steel, [0, 0.95, 0]); add(g, new THREE.ConeGeometry(0.14, 0.3, 4), steel, [0, 1.75, 0], [0, Math.PI / 4, 0], [1, 1, 0.3]);
  add(g, new THREE.BoxGeometry(0.036, 1.3, 0.05), mat('#9aa4b0', { metalness: 0.7 }), [0, 0.95, 0.02]);
  add(g, new THREE.BoxGeometry(0.75, 0.09, 0.1), GOLD(), [0, 0.38, 0]); add(g, new THREE.CylinderGeometry(0.04, 0.045, 0.3, 12), mat('#7a2a2a'), [0, 0.2, 0]);
  sphere(g, GOLD(), [0, 0.03, 0], [0.07, 0.07, 0.07]);
  g.children[0].position.y = -0.02; return g;
}
export function ski(color = '#e03a3a') {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.13, 1.7, 0.035), mat(color, { roughness: 0.35 }), [0, 0.85, 0]);
  add(g, new THREE.BoxGeometry(0.13, 0.3, 0.035), mat(color, { roughness: 0.35 }), [0, 1.78, 0.06], [0.45, 0, 0]);
  add(g, new THREE.BoxGeometry(0.15, 0.2, 0.06), mat('#222'), [0, 0.8, 0.04]); add(g, new THREE.BoxGeometry(0.15, 0.03, 0.4), mat('#fff'), [0, 0.5, 0.0]);
  return g;
}
export function scallop() {
  const g = new THREE.Group(), cols = ['#ff9a8a', '#ffb39c'];
  for (let i = -6; i <= 6; i++) {
    const a = i * 0.24, m = mat(cols[Math.abs(i) % 2], { roughness: 0.5 });
    sphere(g, m, [Math.sin(a) * 0.42, 0.2 + Math.cos(a) * 0.42, 0], [0.095, 0.46, 0.1], [0, 0, -a]);
  }
  sphere(g, mat('#e8826f'), [0, 0.17, 0], [0.38, 0.07, 0.1]);
  for (const s of [-1, 1]) sphere(g, mat('#e8826f'), [s * 0.2, 0.15, 0], [0.16, 0.08, 0.09], [0, 0, s * -0.3]);
  return g;
}
export function noteMesh() { const g = new THREE.Group(); sphere(g, mat('#2a2a3a'), [0, 0, 0], [0.07, 0.05, 0.05], [0, 0, 0.4]); add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), mat('#2a2a3a'), [0.06, 0.13, 0]); add(g, new THREE.BoxGeometry(0.1, 0.04, 0.012), mat('#2a2a3a'), [0.1, 0.25, 0], [0, 0, -0.5]); return g; }
export function singer({ tongue = false, book = true } = {}) {
  const g = new THREE.Group(), robe = mat('#6a3fa8'), skin = mat('#f3c9a5');
  add(g, new THREE.LatheGeometry([V(0, 0), V(0.36, 0), V(0.3, 0.35), V(0.2, 0.75), V(0.17, 0.9), V(0, 0.9)], 32), robe);
  add(g, new THREE.TorusGeometry(0.18, 0.04, 8, 24), mat('#ffd23a'), [0, 0.88, 0], [Math.PI / 2, 0, 0]);
  const head = new THREE.Group(); head.position.y = 1.12; g.add(head);
  sphere(head, skin, [0, 0, 0], [0.22, 0.24, 0.21]); sphere(head, mat('#3a2a1e'), [0, 0.08, -0.04], [0.235, 0.2, 0.2]);
  sphere(head, mat('#3a0f14'), [0, -0.09, 0.17], [0.07, 0.065, 0.04]);
  if (tongue) { sphere(head, mat('#ff6f8e', { roughness: 0.35 }), [0, -0.16, 0.3], [0.065, 0.025, 0.2], [0.35, 0, 0]); add(head, new THREE.BoxGeometry(0.01, 0.005, 0.3), mat('#d24468'), [0, -0.135, 0.3], [0.35, 0, 0]); }
  for (const s of [-1, 1]) { sphere(head, mat('#fff'), [s * 0.085, 0.03, 0.18], [0.045, 0.06, 0.03]); sphere(head, mat('#3a7fd8'), [s * 0.085, 0.025, 0.205], [0.03, 0.045, 0.02]); sphere(head, mat('#fff', { emissive: '#fff' }), [s * 0.078, 0.045, 0.222], [0.012, 0.012, 0.01]); sphere(head, mat('#ff8f9f'), [s * 0.15, -0.05, 0.15], [0.04, 0.025, 0.02]); }
  for (const s of [-1, 1]) { add(g, new THREE.CylinderGeometry(0.05, 0.06, 0.4, 12), robe, [s * 0.2, 0.62, 0.16], [0.9, 0, s * 0.3]); sphere(g, skin, [s * 0.14, 0.52, 0.34], [0.05, 0.05, 0.05]); }
  if (book) { add(g, new THREE.BoxGeometry(0.24, 0.3, 0.03), mat('#c8483c'), [-0.07, 0.62, 0.38], [-0.4, 0.3, 0]); add(g, new THREE.BoxGeometry(0.24, 0.3, 0.03), mat('#c8483c'), [0.07, 0.62, 0.38], [-0.4, -0.3, 0]); add(g, new THREE.BoxGeometry(0.2, 0.26, 0.01), mat('#fff6e0'), [-0.07, 0.62, 0.397], [-0.4, 0.3, 0]); add(g, new THREE.BoxGeometry(0.2, 0.26, 0.01), mat('#fff6e0'), [0.07, 0.62, 0.397], [-0.4, -0.3, 0]); }
  return g;
}
export function hanger(robeColor = '#6a3fa8') {
  const g = new THREE.Group(), wire = mat('#c8ccd2', { metalness: 0.8, roughness: 0.25 });
  const pts = [[0.0, 1.55], [0.0, 1.5], [0.05, 1.45], [0.0, 1.35], [0, 1.3]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 8), wire);
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.55, 1.0, 0), new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0.55, 1.0, 0)], false, 'catmullrom', 0), 24, 0.02, 8), wire);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8), wire, [0, 1.0, 0], [0, 0, Math.PI / 2]);
  add(g, new THREE.ConeGeometry(0.5, 0.95, 28, 1, true), mat(robeColor, { side: THREE.DoubleSide }), [0, 0.55, 0]);
  add(g, new THREE.TorusGeometry(0.08, 0.02, 8, 16), mat('#ffd23a'), [0, 1.0, 0.07], [Math.PI / 2, 0, 0]);
  return g;
}
export function sheng() {
  const g = new THREE.Group(), bam = mat('#d9b05a', { roughness: 0.5 });
  add(g, new THREE.LatheGeometry([V(0, 0.15), V(0.3, 0.18), V(0.38, 0.35), V(0.32, 0.55), V(0.16, 0.62), V(0, 0.64)], 32), mat('#b5602a', { metalness: 0.3, roughness: 0.4 }));
  add(g, new THREE.CylinderGeometry(0.05, 0.06, 0.55, 12), mat('#b5602a', { metalness: 0.3 }), [0.5, 0.3, 0], [0, 0, 1.1]);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * 3.0, h = 0.6 + Math.abs(Math.sin(i * 1.7)) * 0.25 + (1 - Math.abs(a) / 1.6) * 0.2, x = Math.sin(a) * 0.22, z = Math.cos(a) * 0.22 - 0.05;
    const tp = add(g, new THREE.CylinderGeometry(0.035, 0.035, h, 12), bam, [x, 0.5 + h / 2, z]);
    add(g, new THREE.TorusGeometry(0.037, 0.008, 6, 14), mat('#7a4a22'), [x, 0.5 + h * 0.5, z], [Math.PI / 2, 0, 0]);
    add(g, new THREE.CircleGeometry(0.03, 12), mat('#2a140c'), [x, 0.5 + h + 0.001, z], [-Math.PI / 2, 0, 0]);
  }
  g.scale.setScalar(1.0); return g;
}
export function lab() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(2.6, 1.3, 1.1), mat('#e9e4d8'), [0, 0.65, 0]); add(g, new THREE.BoxGeometry(2.8, 0.12, 1.3), mat('#8a8f98'), [0, 1.36, 0]);
  for (const x of [-0.9, 0.9]) add(g, new THREE.BoxGeometry(0.6, 0.5, 0.04), mat('#7fc4e8', { emissive: '#3a6f9a', emissiveIntensity: 0.3 }), [x, 0.65, 0.56]);
  add(g, new THREE.BoxGeometry(0.4, 0.7, 0.04), mat('#5a3a22'), [0, 0.35, 0.56]);
  const s = sign('GENENTECH', 2.4, 0.6, '#1d4f91', '#fff', 'bold 82px sans-serif'); s.position.set(0, 1.0 + 0.5, 0.6); s.scale.set(1, 1, 1); g.add(s);
  return g;
}
export function macaroni(n = 9) {
  const g = new THREE.Group(), m = mat('#f2cf6e', { roughness: 0.55 });
  add(g, new THREE.LatheGeometry([V(0, 0), V(0.35, 0.02), V(0.52, 0.3), V(0.55, 0.38), V(0.48, 0.38), V(0.45, 0.3), V(0, 0.08)], 36), mat('#f4f1ea', { side: THREE.DoubleSide }));
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const e = new THREE.Group(), r = 0.24;
    add(e, new THREE.TorusGeometry(r, 0.09, 12, 20, 2.0), m); const th = 2.0;
    for (const a of [0, th]) add(e, new THREE.CircleGeometry(0.045, 12), mat('#8a5a1a'), [Math.cos(a) * r, Math.sin(a) * r, 0], [Math.PI / 2 * 0, 0, 0]);
    const q = i < 5 ? i : i - 5, ang = rnd() * 6.28, d = i < 5 ? 0.15 : 0.25;
    e.position.set(Math.cos(ang) * d * (i < 5 ? 0.8 : 1) - 0.05, 0.5 + (i < 5 ? 0.22 : 0.05) + rnd() * 0.08, Math.sin(ang) * d * 0.8); e.rotation.set(rnd() * 3, rnd() * 6, rnd() * 6); g.add(e);
  }
  return g;
}
export function needle() {
  const g = new THREE.Group(), steel = mat('#dfe5ec', { metalness: 0.85, roughness: 0.2 });
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 1.7, 12), steel, [0, 0.95, 0]); add(g, new THREE.ConeGeometry(0.03, 0.25, 12), steel, [0, 0.0, 0], [Math.PI, 0, 0]);
  add(g, new THREE.TorusGeometry(0.05, 0.015, 8, 20), steel, [0, 1.74, 0], [0, 0, 0], [0.6, 1.6, 1]);
  add(g, new THREE.BoxGeometry(0.06, 0.2, 0.03), steel, [0, 1.74, 0]).visible = false;
  const th = [[0, 1.74, 0], [0.15, 1.5, 0.15], [0.45, 1.25, 0.25], [0.7, 0.9, 0.2], [0.85, 0.5, 0.1], [0.9, 0.25, 0.1]].map((p) => new THREE.Vector3(...p));
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(th), 30, 0.018, 8), mat('#e8344a', { roughness: 0.9 }));
  return g;
}
export function cloth() { const g = new THREE.Group(); add(g, new THREE.BoxGeometry(1.8, 0.03, 1.0), mat('#3f6fb5', { roughness: 0.95 }), [0, 0.015, 0]); for (let i = 0; i < 9; i++) add(g, new THREE.BoxGeometry(0.07, 0.012, 0.02), mat('#ffe27a'), [-0.7 + i * 0.17, 0.035, 0.05 * Math.sin(i * 1.3)]); return g; }
export function knife() {
  const g = new THREE.Group(), steel = mat('#dfe5ec', { metalness: 0.8, roughness: 0.2 });
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.14, 0); sh.quadraticCurveTo(0.17, 0.6, 0.0, 0.85); sh.lineTo(0, 0);
  add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), steel, [-0.07, 0.3, -0.015]);
  add(g, new THREE.BoxGeometry(0.2, 0.05, 0.08), mat('#8a6a2a', { metalness: 0.5 }), [0, 0.29, 0]); add(g, new THREE.BoxGeometry(0.1, 0.34, 0.07), mat('#4a2a18'), [0, 0.1, 0]);
  for (const y of [0.04, 0.16]) sphere(g, GOLD(), [0, y, 0.04], [0.02, 0.02, 0.01]);
  return g;
}
export function sack() {
  const g = new THREE.Group();
  add(g, new THREE.LatheGeometry([V(0, 0), V(0.3, 0.02), V(0.5, 0.3), V(0.45, 0.62), V(0.22, 0.85), V(0.16, 0.95), V(0.3, 1.1), V(0.15, 1.05), V(0, 1.05)], 32), mat('#c9a56b', { roughness: 0.95, side: THREE.DoubleSide }));
  add(g, new THREE.TorusGeometry(0.17, 0.03, 8, 20), mat('#7a2a2a'), [0, 0.92, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.BoxGeometry(0.34, 0.07, 0.04), mat('#1a0f08'), [0, 0.38, 0.47], [0, 0, 0.2]);
  return g;
}
export function jelly(c = '#e8263e') {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.55, 0.5, 0.06, 32), mat('#f4f1ea'), [0, 0.03, 0]);
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.15, transparent: true, opacity: 0.88, emissive: c, emissiveIntensity: 0.15 });
  add(g, new THREE.CylinderGeometry(0.34, 0.42, 0.32, 32), m, [0, 0.22, 0]); sphere(g, m, [0, 0.38, 0], [0.34, 0.2, 0.34]);
  sphere(g, mat('#fff', { emissive: '#fff', emissiveIntensity: 0.6 }), [-0.14, 0.52, 0.18], [0.07, 0.04, 0.04], [0, 0.4, 0]);
  sphere(g, mat('#b0102a'), [0, 0.6, 0], [0.07, 0.07, 0.07]); return g;
}
export function dome() {
  const g = new THREE.Group(), stone = mat('#d9d6cc', { roughness: 0.8 });
  add(g, new THREE.BoxGeometry(3.4, 1.2, 1.6), stone, [0, 0.6, 0]);
  for (let i = 0; i < 8; i++) add(g, new THREE.CylinderGeometry(0.09, 0.1, 1.1, 14), mat('#f0ede4'), [-1.0 + i * 0.285, 0.62, 0.88]);
  add(g, new THREE.BoxGeometry(2.4, 0.1, 0.2), stone, [0, 1.25, 0.88]); add(g, new THREE.CylinderGeometry(1, 1, 0.1, 3, 1), stone, [0, 1.35, 0.9], [Math.PI / 2, 0, 0], [1.1, 0.01, 0.3]);
  add(g, new THREE.CylinderGeometry(0.85, 0.9, 0.5, 40), stone, [0, 1.45, 0]);
  add(g, new THREE.SphereGeometry(0.85, 40, 20, 0, 6.283, 0, Math.PI / 2), mat('#bfc9c4', { roughness: 0.6 }), [0, 1.7, 0]);
  add(g, new THREE.CylinderGeometry(0.1, 0.12, 0.2, 16), stone, [0, 2.57, 0]); sphere(g, stone, [0, 2.7, 0], [0.09, 0.09, 0.09]);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add(g, new THREE.BoxGeometry(0.1, 0.18, 0.02), mat('#7fc4e8'), [Math.cos(a) * 0.9, 1.45, Math.sin(a) * 0.9], [0, -a + Math.PI / 2, 0]); }
  return g;
}
export const place = (scene, o, pos, ry = 0, s = 1) => { o.position.set(...pos); o.rotation.y = ry; o.scale.setScalar(s); scene.add(o); return o; };
