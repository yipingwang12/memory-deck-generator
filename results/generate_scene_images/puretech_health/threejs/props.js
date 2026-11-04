// Shared props + stage for the PureTech scenes. Units: puritan ~1 tall.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { addFace } from './puritan.js';

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
const gold = () => mat('#e8b53a', { metalness: 0.6, roughness: 0.3 });
export const P = new URLSearchParams(location.search);
export const num = (k, d) => Number(P.get(k) ?? d);

export function makeStage({ ground = '#6fae45', sky = {}, el = 35, az = 150, bg } = {}) {
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}
export function finishScene(stage, chars, cam, look) {
  const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
  stage.toonify(stage.scene, (m) => pm.has(m));
  stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
}
/** Point the puritan's hand at a world point. */
export function reachWorld(pur, side, v) {
  pur.updateMatrixWorld(true); const t = pur.worldToLocal(new THREE.Vector3(...v)); pur.userData.reach(side, [t.x, t.y, t.z]);
}

export function cert(w = 0.34, h = 0.24) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(w, h, 0.006), mat('#fbf4dc'));
  add(g, new THREE.BoxGeometry(w * 0.92, h * 0.88, 0.002), mat('#2f7d4f'), [0, 0, 0.003]);
  add(g, new THREE.BoxGeometry(w * 0.84, h * 0.78, 0.002), mat('#fbf4dc'), [0, 0, 0.0045]);
  for (let i = 0; i < 3; i++) add(g, new THREE.BoxGeometry(w * (0.6 - i * 0.1), h * 0.06, 0.002), mat('#4a4a55'), [-w * 0.05 * i, h * (0.22 - i * 0.12), 0.0065]);
  add(g, new THREE.CylinderGeometry(h * 0.14, h * 0.14, 0.004, 20), gold(), [w * 0.25, -h * 0.25, 0.007], [Math.PI / 2, 0, 0]);
  return g;
}
export function coin(r = 0.07) { return add(new THREE.Group(), new THREE.CylinderGeometry(r, r, r * 0.22, 24), gold()); }
export function coinPile(n = 14, seed = 2) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < n; i++) { const c = coin(0.08); c.parent.remove(c); c.position.set((r() - 0.5) * 0.3, 0.02 + (i % 5) * 0.018, (r() - 0.5) * 0.3); c.rotation.set((r() - 0.5) * 0.3, r() * 3, (r() - 0.5) * 0.3); g.add(c); }
  return g;
}

export function bigBen() {
  const g = new THREE.Group(), stone = mat('#d8b566'), dark = mat('#4b6a7a');
  add(g, new THREE.BoxGeometry(1.0, 3.2, 1.0), stone, [0, 1.6, 0]);
  for (const x of [-0.42, 0, 0.42]) for (const z of [-0.51, 0.51]) add(g, new THREE.BoxGeometry(0.1, 3.1, 0.04), mat('#c79f4f'), [x, 1.6, z]);
  add(g, new THREE.BoxGeometry(1.2, 0.2, 1.2), mat('#c79f4f'), [0, 3.25, 0]);
  add(g, new THREE.BoxGeometry(1.15, 0.95, 1.15), stone, [0, 3.8, 0]);
  const face = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(s / 2, s / 2, s * 0.48, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 8; ctx.stroke(); ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.beginPath(); ctx.arc(s / 2 + Math.cos(a) * s * 0.38, s / 2 + Math.sin(a) * s * 0.38, i % 3 ? 7 : 12, 0, 7); ctx.fill(); }
    ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(s / 2, s * 0.2); ctx.stroke();
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(s * 0.7, s * 0.6); ctx.stroke();
  });
  for (const [ry, x, z] of [[0, 0, 0.58], [Math.PI, 0, -0.58], [Math.PI / 2, 0.58, 0], [-Math.PI / 2, -0.58, 0]])
    add(g, new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: face }), [x, 3.8, z], [0, ry, 0]);
  add(g, new THREE.BoxGeometry(1.25, 0.12, 1.25), gold(), [0, 4.32, 0]);
  add(g, new THREE.ConeGeometry(0.75, 1.3, 4), dark, [0, 5.0, 0], [0, Math.PI / 4, 0]);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), gold(), [0, 5.9, 0]);
  return g;
}

/** Flat wagon wheel on the ground: hub at origin, rim radius R, n spokes. Returns {g, spokeAngles}. */
export function wheel(R = 1.8, n = 8) {
  const g = new THREE.Group(), wood = mat('#a8703a');
  add(g, new THREE.TorusGeometry(R, 0.09, 12, 64), wood, [0, 0.09, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(R + 0.09, 0.025, 8, 64), mat('#3d4650', { metalness: 0.6 }), [0, 0.09, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CylinderGeometry(0.3, 0.3, 0.32, 28), mat('#8a5a2c'), [0, 0.16, 0]);
  add(g, new THREE.CylinderGeometry(0.33, 0.33, 0.05, 28), mat('#3d4650', { metalness: 0.6 }), [0, 0.12, 0]);
  const ang = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2; ang.push(a);
    const s = add(g, new THREE.BoxGeometry(R, 0.1, 0.12), wood, [Math.cos(a) * R / 2, 0.09, Math.sin(a) * R / 2], [0, -a, 0]);
  }
  return { g, ang };
}
export function cottage(color, s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.34, 0.26, 0.3), mat(color), [0, 0.13, 0]);
  add(g, new THREE.ConeGeometry(0.29, 0.2, 4), mat('#8b3a2e'), [0, 0.36, 0], [0, Math.PI / 4, 0]);
  add(g, new THREE.BoxGeometry(0.07, 0.12, 0.01), mat('#5a3a1e'), [0, 0.06, 0.155]);
  g.scale.setScalar(s); return g;
}

export function purse(s = 1) {
  const g = new THREE.Group();
  blob(g, mat('#8a4b22'), [0, 0.07, 0], [0.09, 0.08, 0.08]);
  add(g, new THREE.TorusGeometry(0.05, 0.014, 8, 20), gold(), [0, 0.135, 0], [Math.PI / 2, 0, 0]);
  blob(g, gold(), [0, 0.155, 0], [0.025, 0.025, 0.025]);
  g.scale.setScalar(s); return g;
}
/** Baby: ~0.42 tall sitting; bonnet, big eyes, holds nothing. */
export function baby() {
  const g = new THREE.Group(), skin = mat('#ffe0c0');
  blob(g, mat('#fff2d8'), [0, 0.12, 0], [0.12, 0.12, 0.11]);
  const head = new THREE.Group(); head.position.y = 0.31; g.add(head);
  blob(head, skin, [0, 0, 0], [0.13, 0.13, 0.13]); addFace(head, 0.13, { size: 0.3 });
  const bonnet = blob(head, mat('#fbf7ec'), [0, 0.035, -0.02], [0.14, 0.12, 0.13]);
  add(head, new THREE.TorusGeometry(0.1, 0.012, 8, 20, Math.PI), mat('#f2a7b8'), [0, 0.06, 0.1], [0, 0, 0]);
  blob(head, mat('#f2a7b8'), [0, 0.135, -0.01], [0.03, 0.03, 0.03]);
  for (const s of [-1, 1]) { blob(g, skin, [s * 0.12, 0.13, 0.08], [0.035, 0.035, 0.035]); blob(g, skin, [s * 0.07, 0.01, 0.1], [0.04, 0.03, 0.05]); }
  return g;
}

function stalkCurve(h, bend, r) {
  return new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bend * 0.3, h * 0.4, 0), new THREE.Vector3(bend, h * 0.8, 0), new THREE.Vector3(bend * 1.3, h, 0)]);
}
/** Stalk of CELERY ~h tall: ribbed pale-green stalks fanning into frilly leaves. */
export function celery(h = 1) {
  const g = new THREE.Group(), lim = [['#9fd35a', 0], ['#8cc84b', 0.5], ['#a8d868', -0.5], ['#93cf50', 1.0], ['#9fd35a', -1.0]];
  lim.forEach(([c, a], i) => {
    const st = new THREE.Group(); st.rotation.y = a * 0.9; g.add(st);
    const bend = (i - 2) * 0.09 * h;
    add(st, new THREE.TubeGeometry(stalkCurve(h, bend), 20, 0.05 * h * (1 - Math.abs(i - 2) * 0.1), 10), mat(c));
    const top = new THREE.Vector3(bend * 1.3, h, 0);
    for (let k = 0; k < 4; k++) blob(st, mat(k % 2 ? '#3f9a3a' : '#58b040'), [top.x + (k - 1.5) * 0.05 * h, top.y + 0.05 * h + (k % 2) * 0.05 * h, (k % 2 - 0.5) * 0.08 * h], [0.09 * h, 0.07 * h, 0.07 * h]);
  });
  add(g, new THREE.CylinderGeometry(0.11 * h, 0.14 * h, 0.1 * h, 16), mat('#e9f2c4'), [0, 0.02 * h, 0]);
  return g;
}

export function crown(s = 1) {
  const g = new THREE.Group(), G = gold();
  add(g, new THREE.CylinderGeometry(0.1, 0.09, 0.07, 24, 1, true), mat('#e8b53a', { metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }));
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(g, new THREE.ConeGeometry(0.02, 0.08, 8), G, [Math.cos(a) * 0.095, 0.075, Math.sin(a) * 0.095]); blob(g, mat(i % 2 ? '#d02a3a' : '#2a6ad0'), [Math.cos(a) * 0.1, 0.0, Math.sin(a) * 0.1], [0.014, 0.014, 0.014]); }
  add(g, new THREE.TorusGeometry(0.1, 0.012, 8, 24), G, [0, -0.034, 0], [Math.PI / 2, 0, 0]);
  g.scale.setScalar(s); return g;
}

export function lungs(s = 1) {
  const g = new THREE.Group(), pink = mat('#e68a96', { roughness: 0.55 });
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 14), mat('#f2c0c0'), [0, 0.58, 0]);
  for (const sx of [-1, 1]) {
    const l = new THREE.Group(); l.position.x = sx * 0.26; l.rotation.z = -sx * 0.1; g.add(l);
    blob(l, pink, [0, 0, 0], [0.26, 0.45, 0.2]);
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), mat('#f2c0c0'), [sx * 0.13, 0.4, 0], [0, 0, sx * -0.9]);
    // stiff white FIBRES: wavy strands across the lobe
    const r = rng(sx + 5);
    for (let i = 0; i < 14; i++) {
      const y0 = (r() - 0.5) * 0.7, pts = [];
      for (let k = 0; k <= 6; k++) { const a = (k / 6 - 0.5) * 2.2, y = y0 + Math.sin(k * 1.7 + i) * 0.05; const ex = Math.sin(a) * 0.27, ez = Math.cos(a) * 0.21; const sc = Math.sqrt(Math.max(0.01, 1 - (y / 0.45) ** 2)); pts.push(new THREE.Vector3(ex * sc * 1.04, y, ez * sc * 1.04)); }
      add(l, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 6), mat('#f4f0e4'));
    }
  }
  g.scale.setScalar(s); return g;
}

/** Hull with brass PORTHOLES along the side. Length ~L along x, bow at +x. */
export function ship(L = 3, { hull = '#c8402e', portholes = 4 } = {}) {
  const g = new THREE.Group(), H = L * 0.3, W = L * 0.32;
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, H); sh.lineTo(L / 2 + 0.1 * L, H); sh.quadraticCurveTo(L / 2, 0.1 * H, L * 0.22, 0); sh.lineTo(-L * 0.42, 0); sh.lineTo(-L / 2, H);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); geo.translate(0, 0, -W / 2);
  add(g, geo, mat(hull));
  add(g, new THREE.BoxGeometry(L * 1.08, 0.06, W + 0.06), mat('#f0e6cc'), [0.03 * L, H, 0]);
  add(g, new THREE.BoxGeometry(L * 0.9, 0.04, W * 0.96), mat('#b98550'), [0, H + 0.04, 0]);
  add(g, new THREE.BoxGeometry(L * 0.34, H * 0.55, W * 0.7), mat('#f4ecd8'), [-L * 0.12, H + H * 0.3, 0]);
  add(g, new THREE.CylinderGeometry(L * 0.04, L * 0.05, H * 0.8, 16), mat('#2c2c38'), [-L * 0.12, H + H * 0.95, 0]);
  add(g, new THREE.CylinderGeometry(0.015 * L, 0.02 * L, L * 0.75, 8), mat('#6a4a2a'), [L * 0.22, H + L * 0.37, 0]);
  const sail = add(g, new THREE.PlaneGeometry(L * 0.38, L * 0.45), mat('#fbf4dc', { side: THREE.DoubleSide }), [L * 0.22 + L * 0.19, H + L * 0.42, 0]);
  const pr = H * 0.17;
  for (let i = 0; i < portholes; i++) for (const sz of [1, -1]) {
    const x = -L * 0.35 + i * (L * 0.62 / Math.max(1, portholes - 1)), z = sz * (W / 2 + 0.035);
    add(g, new THREE.CircleGeometry(pr, 28), mat('#8fd4ff', { emissive: '#2a6a9a', emissiveIntensity: 0.4 }), [x, H * 0.52, z], [0, sz > 0 ? 0 : Math.PI, 0]);
    add(g, new THREE.TorusGeometry(pr * 1.05, pr * 0.2, 10, 28), gold(), [x, H * 0.52, z * 1.001], [0, 0, 0]);
  }
  return g;
}

export function teaChest(s = 1) {
  const g = new THREE.Group(), wood = mat('#b9854a'), band = mat('#3d4650', { metalness: 0.5 });
  add(g, new THREE.BoxGeometry(0.7, 0.6, 0.55), wood, [0, 0.3, 0]);
  for (const y of [0.04, 0.56]) add(g, new THREE.BoxGeometry(0.72, 0.05, 0.57), band, [0, y, 0]);
  for (const x of [-0.33, 0.33]) add(g, new THREE.BoxGeometry(0.05, 0.62, 0.57), band, [x, 0.3, 0]);
  add(g, new THREE.BoxGeometry(0.72, 0.05, 0.57), mat('#a0713a'), [0, 0.63, 0]);
  const leaf = canvasTexture(256, (ctx, sz) => {
    ctx.fillStyle = '#e63b2e'; ctx.fillRect(0, 0, sz, sz); ctx.fillStyle = '#fff2c0'; ctx.fillRect(14, 14, sz - 28, sz - 28);
    ctx.fillStyle = '#2f8a3a'; for (const dx of [-36, 36]) { ctx.save(); ctx.translate(sz / 2 + dx, sz / 2 + 10); ctx.rotate(dx > 0 ? 0.5 : -0.5); ctx.beginPath(); ctx.ellipse(0, 0, 26, 70, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.ellipse(sz / 2, sz / 2 - 6, 28, 78, 0, 0, 7); ctx.fill();
  });
  add(g, new THREE.PlaneGeometry(0.44, 0.44), new THREE.MeshBasicMaterial({ map: leaf }), [0, 0.32, 0.28]);
  g.scale.setScalar(s); return g;
}
export function teacup(s = 1) {
  const g = new THREE.Group(), porc = mat('#fbf7ee', { roughness: 0.3 });
  const pts = [[0, 0], [0.05, 0], [0.07, 0.02], [0.095, 0.1], [0.1, 0.11]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 28), mat('#fbf7ee', { roughness: 0.3, side: THREE.DoubleSide }));
  add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.005, 24), mat('#a0541e'), [0, 0.095, 0]);
  add(g, new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.3), porc, [0.1, 0.07, 0], [0, 0, -1.9]);
  add(g, new THREE.CylinderGeometry(0.13, 0.13, 0.01, 28), porc, [0, -0.004, 0]);
  g.scale.setScalar(s); return g;
}

export function milestone(s = 1) {
  const g = new THREE.Group(), st = mat('#b9b5ad');
  add(g, new THREE.BoxGeometry(0.5, 0.5, 0.3), st, [0, 0.25, 0]);
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.5, 20, 1, false, 0, Math.PI), st, [0, 0.5, 0], [Math.PI / 2, Math.PI / 2, 0], [1, 1, 1]);
  const m = add(g, new THREE.CylinderGeometry(0.25, 0.25, 0.3, 24, 1, false, -Math.PI / 2, Math.PI), st, [0, 0.5, 0], [Math.PI / 2, 0, 0]); g.children[1].visible = false;
  const mt = canvasTexture(256, (ctx, z) => { ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, z, z); ctx.fillStyle = '#2a2a32'; ctx.textAlign = 'center'; ctx.font = 'bold 70px sans-serif'; ctx.fillText('MILE', z / 2, 90); ctx.font = 'bold 130px sans-serif'; ctx.fillText('1', z / 2, 215); });
  add(g, new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: mt }), [0, 0.33, 0.156]);
  add(g, new THREE.BoxGeometry(0.5, 0.06, 0.34), mat('#8a867f'), [0, 0.03, 0]);
  g.scale.setScalar(s); return g;
}
/** Royal robe hung on a stand: red velvet cloak + ermine collar. */
export function royalRobe(s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.03, 0.04, 1.3, 10), mat('#6a4a2a'), [0, 0.65, 0]);
  add(g, new THREE.BoxGeometry(0.06, 0.06, 0.04), mat('#6a4a2a'), [0, 0.02, 0]);
  add(g, new THREE.CylinderGeometry(0.2, 0.05, 0.05, 14), mat('#6a4a2a'), [0, 0.02, 0]);
  add(g, new THREE.CylinderGeometry(0.2, 0.46, 0.95, 32, 1, true), mat('#b3202e', { roughness: 0.9, side: THREE.DoubleSide }), [0, 0.82, 0]);
  add(g, new THREE.CylinderGeometry(0.5, 0.47, 0.1, 32, 1, true), mat('#f6f2ea', { roughness: 0.9, side: THREE.DoubleSide }), [0, 0.35, 0]);
  add(g, new THREE.TorusGeometry(0.22, 0.07, 12, 32), mat('#f6f2ea', { roughness: 0.9 }), [0, 1.3, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; blob(g, mat('#222'), [Math.cos(a) * 0.23, 1.375, Math.sin(a) * 0.23], [0.016, 0.01, 0.03], [0, -a, 0]); }
  g.scale.setScalar(s); return g;
}

/** ZORRO: masked swordsman in black, laurel wreath, red-lined cape; right arm extended forward (+z). ~1.0 tall. */
export function zorro() {
  const g = new THREE.Group(), blk = mat('#1b1b22'), skin = mat('#f4cfa8'), R = 0.12;
  add(g, new THREE.CylinderGeometry(0.075, 0.14, 0.55, 24), blk, [0, 0.33, 0]);
  add(g, new THREE.CylinderGeometry(0.15, 0.2, 0.2, 24), blk, [0, 0.13, 0]);
  add(g, new THREE.BoxGeometry(0.2, 0.03, 0.03), mat('#c8262e'), [0, 0.5, 0.098]);
  for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.03, 0.025, 0.18, 10), blk, [s * 0.06, 0.09, 0.02]);
  const gm = mat('#f2c230');
  const z = new THREE.Group(); z.position.set(0, 0.34, 0.125); z.rotation.x = -0.18; g.add(z);   // chest Z
  add(z, new THREE.BoxGeometry(0.09, 0.016, 0.01), gm, [0, 0.05, 0]); add(z, new THREE.BoxGeometry(0.09, 0.016, 0.01), gm, [0, -0.05, 0]); add(z, new THREE.BoxGeometry(0.12, 0.016, 0.01), gm, [0, 0, 0], [0, 0, 0.9]);
  const head = new THREE.Group(); head.position.y = 0.72; g.add(head);
  add(head, new THREE.SphereGeometry(R, 32, 24), skin);
  add(head, new THREE.SphereGeometry(R * 1.04, 24, 18), mat('#1b1b22'), [0, 0.02, -0.03], [0, 0, 0], [1, 1, 0.95]);
  addFace(head, R);
  for (const sx of [-1, 1]) {   // mask patches behind the eyes + bridge
    const ex = sx * 0.38 * R, ez = Math.sqrt(R * R - ex * ex - 0.0048 ** 2) + 0.002;
    const e = new THREE.Group(); e.position.set(ex, -0.0048, ez); e.rotation.y = sx * Math.asin(ex / R); head.add(e);
    const d = add(e, new THREE.CircleGeometry(1, 28), mat('#14141a'), [0, 0, -0.0008], [0, 0, 0], [0.05, 0.058, 1]);
  }
  add(head, new THREE.BoxGeometry(0.05, 0.034, 0.01), mat('#14141a'), [0, -0.005, 0.1175]);
  add(head, new THREE.BoxGeometry(0.1, 0.012, 0.012), mat('#14141a'), [0, -0.058, 0.108]).rotation.z = 0.0;   // moustache
  // laurel wreath (DAPHNE)
  const lg = new THREE.Group(); lg.position.y = 0.085; head.add(lg);
  add(lg, new THREE.TorusGeometry(0.118, 0.012, 8, 32), mat('#4a7a2a'), [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; const l = blob(lg, mat(i % 2 ? '#58a63a' : '#3f8a30'), [Math.cos(a) * 0.12, 0.008 * (i % 2), Math.sin(a) * 0.12], [0.03, 0.012, 0.014], [0, -a, 0.3]); }
  // cape
  add(g, new THREE.CylinderGeometry(0.1, 0.27, 0.62, 28, 1, true, Math.PI / 2, Math.PI), mat('#18181f', { side: THREE.DoubleSide }), [0, 0.32, -0.02]);
  add(g, new THREE.CylinderGeometry(0.095, 0.255, 0.6, 28, 1, true, Math.PI / 2, Math.PI), mat('#a8202c', { side: THREE.DoubleSide }), [0, 0.32, -0.015]);
  // arms
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.095, 0.55, 0.01); g.add(a);
    add(a, new THREE.CylinderGeometry(0.022, 0.02, 0.26, 10), blk, [0, -0.13, 0]);
    blob(a, skin, [0, -0.27, 0], [0.032, 0.032, 0.032]);
    if (s > 0) { a.rotation.x = -1.35; a.rotation.z = -0.25; g.userData.hand = a; }
    else a.rotation.z = -0.15;
  }
  g.userData.handLocal = new THREE.Vector3(0.095 + 0.0, 0.55 - 0.27 * Math.cos(1.35) , 0.01 + 0.27 * Math.sin(1.35));
  return g;
}
