// Prop builders shared by all scenes (each returns a Group at origin, y up, facing +z unless noted).
import { THREE, mat, add, blob, box, cyl, textTex, createPerson, rng } from './common.js';

export const GOLD = () => mat('#f5c21b', { metalness: 0.6, roughness: 0.3 });

export function crown(s = 1) {
  const g = new THREE.Group(), gold = GOLD();
  add(g, new THREE.CylinderGeometry(0.11, 0.1, 0.09, 24), gold, [0, 0.045, 0]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(g, new THREE.ConeGeometry(0.03, 0.09, 8), gold, [Math.sin(a) * 0.1, 0.13, Math.cos(a) * 0.1]);
    blob(g, mat(['#d0242e', '#2a6ad8', '#27a85a'][i % 3], { roughness: 0.2 }), [Math.sin(a) * 0.105, 0.05, Math.cos(a) * 0.105], [0.018, 0.018, 0.018]); }
  g.scale.setScalar(s); return g;
}

export function water(scene, color = '#2b7fc0', size = 300, y = 0.0) {
  return add(scene, new THREE.PlaneGeometry(size, size), mat(color, { roughness: 0.25, metalness: 0.1 }), [0, y, 0], [-Math.PI / 2, 0, 0]);
}

export function ship(s = 1) {
  const g = new THREE.Group(), hull = mat('#6b3f22'), sail = mat('#f4efe2');
  const sh = new THREE.Shape(); sh.moveTo(-1.2, 0); sh.lineTo(1.4, 0); sh.lineTo(1.0, -0.5); sh.lineTo(-0.9, -0.5); sh.lineTo(-1.2, 0);
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); hg.translate(0, 0.5, -0.3); add(g, hg, hull);
  cyl(g, mat('#4a2c16'), [0, 1.6, 0], 0.03, 2.2);
  add(g, new THREE.PlaneGeometry(0.9, 1.3), sail, [0.3, 1.8, 0.02]).material.side = THREE.DoubleSide;
  add(g, new THREE.PlaneGeometry(0.6, 0.9), sail, [-0.5, 1.5, 0.02]).material.side = THREE.DoubleSide;
  g.scale.setScalar(s); return g;
}

export function admiral() {
  const p = createPerson({ coat: '#16264f', hair: '#d8d8d8', pants: '#16264f', scale: 1.25 }), h = p.userData.head, gold = GOLD();
  const hat = new THREE.Group(); hat.position.y = 0.17; h.add(hat);
  add(hat, new THREE.CylinderGeometry(0.2, 0.2, 0.05, 28), mat('#111'), [0, 0, 0], [0, 0, 0], [1.4, 1, 0.6]);
  blob(hat, mat('#111'), [0, 0.05, 0], [0.26, 0.09, 0.14]); blob(hat, gold, [0, 0.03, 0.14], [0.05, 0.05, 0.02]);
  blob(h, mat('#e8e8e8'), [0, -0.12, 0.12], [0.1, 0.07, 0.06]);
  for (const s of [-1, 1]) { blob(p, gold, [s * 0.2, 0.82, 0], [0.09, 0.03, 0.06]); }
  for (let i = 0; i < 3; i++) blob(p, gold, [0.08, 0.7 - i * 0.07, 0.13], [0.02, 0.02, 0.01]);
  return p;
}

export function malt() {
  const g = new THREE.Group(), glass = mat('#fff7e0');
  const cup = add(g, new THREE.CylinderGeometry(0.1, 0.065, 0.24, 28), mat('#e6c8a0', { roughness: 0.3 }), [0, 0.12, 0]);
  add(g, new THREE.CylinderGeometry(0.103, 0.103, 0.03, 28), mat('#e3a63a'), [0, 0.22, 0]);
  blob(g, mat('#fff3d8'), [0, 0.26, 0], [0.1, 0.07, 0.1]); blob(g, mat('#d0242e', { roughness: 0.2 }), [0, 0.33, 0], [0.03, 0.03, 0.03]);
  cyl(g, mat('#e03a3a'), [0.03, 0.34, 0], 0.01, 0.28, [0, 0, -0.25]);
  for (let i = 0; i < 4; i++) blob(g, mat('#8a5a2a'), [0.13 + i * 0.05, 0.02, 0.05 * (i % 2)], [0.03, 0.03, 0.03]); // malt balls
  return g;
}

export function pin() {
  const pts = [[0, 0], [0.05, 0], [0.06, 0.05], [0.045, 0.14], [0.03, 0.22], [0.04, 0.28], [0.05, 0.33], [0.04, 0.38], [0.0, 0.4]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group(); add(g, new THREE.LatheGeometry(pts, 20), mat('#fbfbf6', { roughness: 0.3 }));
  add(g, new THREE.CylinderGeometry(0.0385, 0.0385, 0.012, 20), mat('#d0242e'), [0, 0.265, 0]); g.children[1].scale.set(1.05, 1, 1.05);
  add(g, new THREE.CylinderGeometry(0.0425, 0.0425, 0.012, 20), mat('#d0242e'), [0, 0.285, 0]);
  g.scale.setScalar(1.3); return g;
}
export function pins(rows = 4) {
  const g = new THREE.Group();
  for (let r = 0; r < rows; r++) for (let i = 0; i <= r; i++) { const p = pin(); p.position.set((i - r / 2) * 0.19, 0, -r * 0.17); g.add(p); }
  return g;
}
export function ball(color = '#2a46c8') {
  const g = new THREE.Group(); blob(g, mat(color, { roughness: 0.15, metalness: 0.2 }), [0, 0.14, 0], [0.14, 0.14, 0.14]);
  for (const [x, y, z] of [[-0.04, 0.22, 0.1], [0.04, 0.22, 0.1], [0, 0.17, 0.13]]) blob(g, mat('#0a0a20'), [x, y, z], [0.017, 0.017, 0.017]);
  return g;
}
export function lane(len = 6, w = 1.1) {
  const g = new THREE.Group(), tex = textureStripes();
  add(g, new THREE.BoxGeometry(w, 0.06, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), [0, 0.03, -len / 2]);
  for (const s of [-1, 1]) { add(g, new THREE.BoxGeometry(0.2, 0.05, len), mat('#2a2a30'), [s * (w / 2 + 0.1), 0.025, -len / 2]); }
  return g;
}
function textureStripes() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); const r = rng(3);
  for (let i = 0; i < 12; i++) { const l = 190 + r() * 25; x.fillStyle = `rgb(${l + 30},${l - 20},${l - 90})`; x.fillRect(i * 256 / 12, 0, 256 / 12, 256); x.fillStyle = 'rgba(80,40,10,.5)'; x.fillRect(i * 256 / 12, 0, 2, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function tulip(s = 1, color = '#e8264a') {
  const g = new THREE.Group(), c = mat(color, { roughness: 0.4 });
  cyl(g, mat('#2f9a3a'), [0, 0.3, 0], 0.014, 0.6);
  for (const [x, z, r] of [[0.05, 0.05, 0.25], [-0.05, 0.05, -0.25]]) { blob(g, mat('#3aaa44'), [x * 1.4, 0.15, 0], [0.04, 0.2, 0.012], [0, 0, -r]); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; blob(g, c, [Math.sin(a) * 0.035, 0.68, Math.cos(a) * 0.035], [0.05, 0.1, 0.05], [Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12]); }
  blob(g, mat('#ff7a90'), [0, 0.68, 0], [0.04, 0.08, 0.04]);
  g.scale.setScalar(s); return g;
}

/** Y-shaped antibody, arms up along +y, centred at origin. */
export function antibody(s = 1, color = '#3a8fe0') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.35 });
  cyl(g, m, [0, -0.17, 0], 0.045, 0.34);
  for (const k of [-1, 1]) { cyl(g, m, [k * 0.13, 0.1, 0], 0.045, 0.34, [0, 0, -k * 0.5]); blob(g, mat('#ffd23a'), [k * 0.2, 0.25, 0], [0.06, 0.05, 0.05]); }
  blob(g, m, [0, 0, 0], [0.06, 0.06, 0.06]);
  g.scale.setScalar(s); return g;
}

export function syringe() {
  const g = new THREE.Group();
  cyl(g, mat('#e9f4f8', { transparent: true, opacity: 0.85, roughness: 0.15 }), [0, 0, 0], 0.035, 0.28);
  cyl(g, mat('#3ad08a'), [0, -0.02, 0], 0.03, 0.16);
  cyl(g, mat('#c8d0d8', { metalness: 0.6 }), [0, 0.22, 0], 0.01, 0.16);
  box(g, mat('#e9f4f8'), [0, 0.13, 0], [0.12, 0.012, 0.04]);
  cyl(g, mat('#2a2a30'), [0, -0.19, 0], 0.003, 0.1, [0, 0, 0], 0.003);
  g.rotation.z = 0; return g;
}
export function calendar(txt = '26') {
  const g = new THREE.Group();
  box(g, mat('#f6f2e8'), [0, 0, 0], [0.9, 0.9, 0.04]); box(g, mat('#d0242e'), [0, 0.37, 0.025], [0.9, 0.16, 0.02]);
  add(g, new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ map: textTex(txt, { bg: '#f6f2e8', fg: '#16264f', font: 'bold 300px Arial', w: 512, h: 360 }) }), [0, -0.08, 0.025]);
  for (const x of [-0.25, 0.25]) cyl(g, mat('#444'), [x, 0.46, 0.02], 0.025, 0.1);
  return g;
}

export function lungs(s = 1, tint = '#f08aa0') {
  const g = new THREE.Group(), m = mat(tint, { roughness: 0.45 });
  for (const k of [-1, 1]) {
    blob(g, m, [k * 0.22, 0, 0], [0.2, 0.32, 0.14], [0, 0, k * 0.12]);
    blob(g, mat('#f8a8b8'), [k * 0.2, -0.04, 0.04], [0.14, 0.22, 0.1], [0, 0, k * 0.12]);
    cyl(g, mat('#e8d9d0'), [k * 0.1, 0.17, 0], 0.022, 0.3, [0, 0, k * 0.6]);
  }
  cyl(g, mat('#e8d9d0'), [0, 0.42, 0], 0.035, 0.3);
  g.scale.setScalar(s); return g;
}

export function skull(s = 1) {
  const g = new THREE.Group(), w = mat('#f1efe6');
  blob(g, w, [0, 0.05, 0], [0.1, 0.09, 0.09]); blob(g, w, [0, -0.05, 0.02], [0.06, 0.04, 0.06]);
  for (const k of [-1, 1]) blob(g, mat('#111'), [k * 0.04, 0.05, 0.08], [0.028, 0.034, 0.02]);
  g.scale.setScalar(s); return g;
}

export function mop(s = 1) {
  const g = new THREE.Group();
  cyl(g, mat('#b88a52'), [0, 0.55, 0], 0.016, 1.1);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cyl(g, mat('#f2f2ee'), [Math.sin(a) * 0.05, 0.05, Math.cos(a) * 0.05], 0.012, 0.22, [Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35]); }
  blob(g, mat('#f2f2ee'), [0, 0.1, 0], [0.07, 0.05, 0.07]);
  g.scale.setScalar(s); return g;
}

/** Armoured CAR-T cell: round cell with helmet, visor, shield, sword. */
export function carT(s = 1) {
  const g = new THREE.Group(), cell = mat('#6fd0e8', { roughness: 0.35 }), steel = mat('#b9c3d0', { metalness: 0.7, roughness: 0.3 });
  blob(g, cell, [0, 0.4, 0], [0.38, 0.38, 0.36]);
  add(g, new THREE.SphereGeometry(0.4, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), steel, [0, 0.43, 0]);
  add(g, new THREE.ConeGeometry(0.04, 0.2, 10), mat('#d0242e'), [0, 0.88, 0]);
  for (const k of [-1, 1]) {
    blob(g, mat('#fff', { roughness: 0.3 }), [k * 0.13, 0.38, 0.32], [0.08, 0.1, 0.03]); blob(g, mat('#1a2a4a'), [k * 0.13, 0.37, 0.345], [0.05, 0.07, 0.02]); blob(g, mat('#fff'), [k * 0.12, 0.4, 0.365], [0.02, 0.02, 0.01]);
  }
  const sh = add(g, new THREE.CylinderGeometry(0.2, 0.2, 0.04, 6), steel, [-0.42, 0.35, 0.2], [Math.PI / 2, 0, 0.3]); add(g, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 6), mat('#d0242e'), [-0.42, 0.35, 0.22], [Math.PI / 2, 0, 0.3]);
  cyl(g, steel, [0.55, 0.62, 0.2], 0.025, 0.7, [0, 0, -0.5]); box(g, mat('#e2b13c'), [0.42, 0.4, 0.2], [0.18, 0.03, 0.05], [0, 0, -0.5]);
  for (const k of [-1, 1]) blob(g, mat('#2a3f8a'), [k * 0.15, 0.03, 0.05], [0.09, 0.05, 0.12]);
  g.scale.setScalar(s); return g;
}
export function muck(s = 1, txt = '16') {
  const g = new THREE.Group(), m = mat('#6b4a22', { roughness: 0.9 });
  blob(g, m, [0, 0.3, 0], [0.45, 0.32, 0.4]);
  for (const [x, y, z, r] of [[-0.3, 0.55, 0, 0.14], [0.25, 0.58, 0.05, 0.12], [0.05, 0.62, -0.1, 0.12]]) blob(g, mat('#4f3818', { roughness: 0.9 }), [x, y, z], [r, r, r]);
  for (const k of [-1, 1]) { blob(g, mat('#fff'), [k * 0.15, 0.36, 0.33], [0.07, 0.09, 0.03]); blob(g, mat('#111'), [k * 0.15, 0.35, 0.355], [0.035, 0.05, 0.02]); }
  add(g, new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshBasicMaterial({ map: textTex(txt, { bg: '#c9d02a', fg: '#222', font: 'bold 190px Arial', w: 256, h: 150 }) }), [0, 0.16, 0.395]);
  for (let i = 0; i < 6; i++) blob(g, m, [-0.5 + i * 0.2, 0.03, 0.3 * Math.sin(i * 2)], [0.12, 0.04, 0.1]);
  g.scale.setScalar(s); return g;
}

export function ticker(txt = 'GENB') {
  const g = new THREE.Group();
  box(g, mat('#14171c'), [0, 0.9, 0], [2.0, 0.8, 0.12]);
  add(g, new THREE.PlaneGeometry(1.9, 0.7), new THREE.MeshBasicMaterial({ map: textTex(txt, { bg: '#0a1410', fg: '#35e06a', font: 'bold 260px Arial', w: 768, h: 270 }) }), [0, 0.9, 0.065]);
  for (const x of [-0.8, 0.8]) cyl(g, mat('#3a3f48'), [x, 0.25, 0], 0.04, 0.5);
  const arrow = new THREE.Shape(); [[0, 0.2], [0.18, -0.05], [0.07, -0.05], [0.07, -0.2], [-0.07, -0.2], [-0.07, -0.05], [-0.18, -0.05]].forEach(([x, y], i) => arrow[i ? 'lineTo' : 'moveTo'](x, y));
  add(g, new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: '#35e06a' }), [1.35, 0.9, 0.065]);
  return g;
}

export function lamp(s = 1) {
  const g = new THREE.Group(), gold = GOLD();
  blob(g, gold, [0, 0.1, 0], [0.18, 0.1, 0.12]); add(g, new THREE.CylinderGeometry(0.05, 0.1, 0.05, 20), gold, [0, 0.03, 0]);
  add(g, new THREE.CylinderGeometry(0.05, 0.04, 0.06, 20), gold, [0, 0.2, 0]);
  add(g, new THREE.TorusGeometry(0.07, 0.015, 8, 20, Math.PI), gold, [-0.2, 0.12, 0], [0, 0, Math.PI * 0.8]);
  add(g, new THREE.ConeGeometry(0.03, 0.2, 10), gold, [0.26, 0.2, 0], [0, 0, -1.3]);
  g.scale.setScalar(s); return g;
}
export function genie(s = 1) {
  const g = new THREE.Group(), blue = mat('#3a7be0', { roughness: 0.4 });
  for (let i = 0; i < 7; i++) { const t = i / 6; blob(g, blue, [Math.sin(t * 5) * 0.08, 0.1 + t * 0.55, 0], [0.12 + 0.18 * t * 0.9 + 0.02, 0.14, 0.12 + 0.15 * t], [0, 0, 0]); }
  blob(g, blue, [0, 0.9, 0], [0.26, 0.26, 0.22]);
  const head = new THREE.Group(); head.position.set(0, 1.28, 0); g.add(head);
  blob(head, blue, [0, 0, 0], [0.2, 0.2, 0.19]);
  blob(head, mat('#f4efe2'), [0, 0.13, 0], [0.22, 0.12, 0.2]); blob(head, mat('#d0242e'), [0, 0.2, 0.1], [0.04, 0.04, 0.03]);
  blob(head, mat('#1a1a2a'), [0, -0.19, 0.1], [0.05, 0.06, 0.04]); // goatee
  for (const k of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(1, 24), mat('#fff', { roughness: 0.3 })); e.scale.set(0.065, 0.08, 1); e.position.set(k * 0.085, 0.0, 0.178); e.lookAt(k * 0.085, 0, 1); head.add(e); const p = new THREE.Mesh(new THREE.CircleGeometry(1, 24), mat('#101830')); p.scale.set(0.04, 0.06, 1); p.position.set(k * 0.085, -0.005, 0.18); p.lookAt(k * 0.085, 0, 1); head.add(p); const h = new THREE.Mesh(new THREE.CircleGeometry(1, 12), mat('#fff')); h.scale.set(0.015, 0.015, 1); h.position.set(k * 0.075, 0.02, 0.182); h.lookAt(k * 0.075, 0, 1); head.add(h); }
  blob(g, GOLD(), [0, 0.88, 0.22], [0.1, 0.03, 0.03]);
  for (const k of [-1, 1]) { cyl(g, blue, [k * 0.33, 0.7, 0.1], 0.065, 0.42, [0.3, 0, k * 1.0]); blob(g, blue, [k * 0.5, 0.56, 0.2], [0.08, 0.08, 0.08]); }
  g.scale.setScalar(s); return g;
}

export function mug(s = 1) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.3, 0], [0.32, 0.05], [0.32, 0.55], [0.3, 0.57], [0.27, 0.57], [0.27, 0.07], [0, 0.07]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 36), mat('#2a7ad0', { roughness: 0.25 }));
  add(g, new THREE.TorusGeometry(0.17, 0.045, 12, 28, Math.PI * 1.2), mat('#2a7ad0', { roughness: 0.25 }), [0.34, 0.3, 0], [0, 0, -Math.PI * 0.6]);
  g.scale.setScalar(s); return g;
}
export function coin(m) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.014, 24), m); c.castShadow = true; return c; }
export function coinPile(n, spread, rseed = 5) {
  const g = new THREE.Group(), r = rng(rseed), gold = GOLD();
  for (let i = 0; i < n; i++) { const c = coin(gold); const a = r() * 6.28, d = r() ** 0.7 * spread; c.position.set(Math.cos(a) * d, 0.01 + (1 - d / spread) * 0.12 + r() * 0.02, Math.sin(a) * d); c.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8); g.add(c); }
  return g;
}

export function sun(scene, pos, r = 3) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), new THREE.MeshBasicMaterial({ color: '#ffe36a', fog: false })));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 32, 20), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.35, fog: false })); g.add(halo);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; const ray = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.7, 3), new THREE.MeshBasicMaterial({ color: '#ffd24a', fog: false })); ray.position.set(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6, 0); ray.rotation.z = a - Math.PI / 2; g.add(ray); }
  g.position.set(...pos); scene.add(g); return g;
}
export function sunflower(s = 1) {
  const g = new THREE.Group(); cyl(g, mat('#3a9a3a'), [0, 0.4, 0], 0.025, 0.8);
  const head = new THREE.Group(); head.position.set(0, 0.82, 0.03); head.rotation.x = -0.15; g.add(head);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; add(head, new THREE.ConeGeometry(0.035, 0.14, 6), mat('#ffcb1f'), [Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0], [0, 0, a - Math.PI / 2]); }
  add(head, new THREE.CylinderGeometry(0.1, 0.1, 0.04, 20), mat('#5a3a1a'), [0, 0, 0.01], [Math.PI / 2, 0, 0]);
  g.scale.setScalar(s); return g;
}
export function house(s = 1) {
  const g = new THREE.Group(), wall = mat('#d9b48a');
  box(g, wall, [0, 0.9, 0], [1.6, 1.8, 1.0]);
  for (const y of [0.4, 0.95, 1.5]) { for (const x of [-0.4, 0.4]) box(g, mat('#bfe4f5', { roughness: 0.2 }), [x, y, 0.505], [0.3, 0.3, 0.02]); }
  box(g, mat('#7a3f2a'), [0, 0.35, 0.51], [0.3, 0.6, 0.02]);
  add(g, new THREE.ConeGeometry(1.0, 0.5, 4), mat('#8a3f35'), [0, 2.05, 0], [0, Math.PI / 4, 0], [1, 1, 0.65]);
  g.scale.setScalar(s); return g;
}
export function sunglasses() {
  const g = new THREE.Group(), m = mat('#101018', { roughness: 0.2 });
  for (const k of [-1, 1]) add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.015, 24), m, [k * 0.1, 0, 0], [Math.PI / 2, 0, 0]);
  box(g, m, [0, 0.02, 0], [0.1, 0.012, 0.012]); return g;
}
/** Thought-bubble cloud with trailing dots. */
export function thoughtBubble(s = 1) {
  const g = new THREE.Group(), m = mat('#ffffff', { roughness: 0.6 });
  for (const [x, y, r] of [[0, 0, 0.5], [-0.45, -0.05, 0.38], [0.45, -0.05, 0.38], [-0.2, 0.3, 0.38], [0.25, 0.3, 0.4], [0, -0.25, 0.4]]) blob(g, m, [x, y, 0], [r, r * 0.9, 0.18]);
  blob(g, m, [-0.7, -0.75, 0], [0.12, 0.12, 0.08]); blob(g, m, [-0.55, -0.55, 0], [0.18, 0.18, 0.1]);
  g.scale.setScalar(s); return g;
}
/** Colourful protein ribbon: helix + sheet arrows via tubes. */
export function proteinRibbon(s = 1, hue = 0) {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(new THREE.Vector3(Math.cos(t * 6 * Math.PI) * 0.12 + (t - 0.5) * 0.9, Math.sin(t * 6 * Math.PI) * 0.12 + Math.sin(t * 3) * 0.15, 0)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.035, 10), mat(`hsl(${hue},80%,55%)`, { roughness: 0.35 }));
  const tail = []; for (let i = 0; i <= 20; i++) { const t = i / 20; tail.push(new THREE.Vector3(0.45 + t * 0.35, -0.1 + Math.sin(t * 5) * 0.12, 0)); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 40, 0.03, 8), mat(`hsl(${hue + 120},75%,55%)`));
  add(g, new THREE.ConeGeometry(0.07, 0.14, 8), mat(`hsl(${hue + 120},75%,55%)`), [0.84, -0.1, 0], [0, 0, -Math.PI / 2]);
  g.scale.setScalar(s); return g;
}
export function cryoScope(s = 1) {
  const g = new THREE.Group(), steel = mat('#cfd9e6', { metalness: 0.5, roughness: 0.3 }), ice = mat('#a8e4ff', { roughness: 0.15, transparent: true, opacity: 0.85 });
  cyl(g, mat('#2a3a55'), [0, 0.1, 0], 0.4, 0.2);
  cyl(g, steel, [0, 0.8, 0], 0.22, 1.2, [0, 0, 0], 0.26);
  cyl(g, mat('#3a6ad0'), [0, 1.45, 0], 0.27, 0.12);
  cyl(g, steel, [0, 1.75, 0], 0.16, 0.5, [0, 0, 0], 0.22);
  blob(g, steel, [0, 2.05, 0], [0.16, 0.1, 0.16]);
  blob(g, mat('#ff4a4a', { emissive: '#ff0000', emissiveIntensity: 0.4 }), [0.22, 0.8, 0.2], [0.03, 0.03, 0.03]);
  for (let i = 0; i < 9; i++) add(g, new THREE.ConeGeometry(0.03, 0.2 + (i % 3) * 0.08, 6), ice, [Math.cos(i * 0.7) * 0.22, 1.35 - (i % 3) * 0.04, Math.sin(i * 0.7) * 0.22], [Math.PI, 0, 0]);
  // liquid nitrogen dewar
  cyl(g, steel, [0.6, 0.35, 0.1], 0.2, 0.7); blob(g, mat('#e8f6ff', { roughness: 0.9 }), [0.6, 0.78, 0.1], [0.2, 0.08, 0.2]);
  g.scale.setScalar(s); return g;
}
export function snowflake(scene, r, n, area, seed = 2) {
  const rg = rng(seed); for (let i = 0; i < n; i++) blob(scene, new THREE.MeshBasicMaterial({ color: '#ffffff' }), [(rg() - 0.5) * area[0], rg() * area[1], (rg() - 0.5) * area[2]], [r, r, r]);
}
