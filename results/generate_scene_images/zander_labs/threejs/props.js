// Shared props + stage setup for the Zander scenes (props are plain bevel-free primitives; anchor is toonified separately).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createZander } from './zander.js';
export { THREE, guard, canvasTexture, rng, createZander };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, c, pos, scl, rot, e) => add(parent, new THREE.SphereGeometry(1, 32, 20), typeof c === 'string' ? mat(c, e) : c, pos, rot, scl);
export const box = (parent, c, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), typeof c === 'string' ? mat(c) : c, pos, rot);
export const cyl = (parent, c, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), typeof c === 'string' ? mat(c) : c, pos, rot);

/** Cylinder from point a to point b. */
export function limbBetween(parent, a, b, r, color) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const m = cyl(parent, color, [0, 0, 0], r, d.length());
  m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
}

/** Flat text plane (w x h) with centred bold text. */
export function textPlane(text, w, h, { bg = '#ffffff', fg = '#1b2a5a', font = 'Arial Black, Arial, sans-serif', frame = null } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.scale(h / w, 1); const W = s * w / h;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, s);
    if (frame) { ctx.strokeStyle = frame; ctx.lineWidth = 18; ctx.strokeRect(14, 14, W - 28, s - 28); }
    ctx.fillStyle = fg; ctx.font = `bold ${s * 0.6}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = s * 0.6; while (ctx.measureText(text).width > W * 0.86 && fs > 20) { fs *= 0.92; ctx.font = `bold ${fs}px ${font}`; }
    ctx.fillText(text, W / 2, s / 2 + s * 0.03);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
}

/** Place a flat spot on an ellipsoid surface. */
export function spot(parent, color, c, rad, dir, size) {
  const d = new THREE.Vector3(...dir).normalize();
  const m = blob(parent, color, [c[0] + rad[0] * d.x * 1.0, c[1] + rad[1] * d.y, c[2] + rad[2] * d.z], [size, size, size * 0.35]);
  m.lookAt(m.position.clone().add(d)); m.castShadow = false; return m;
}

export function setup(P, o = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: num('exp', 1),
    sky: { cover: num('cover', 1.5), seed: num('seed', 5), towerTop: 0.5, puffCover: 1.5, ...(o.sky ?? {}) },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.6, fog: { near: 120, far: 1500 },
  });
  return { stage, scene: stage.scene, num };
}
export const ground = (scene, color) => add(scene, new THREE.PlaneGeometry(400, 400), mat(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
export function finish(stage, characters, clouds = true) {
  const set = new Set(); characters.forEach((c) => c.traverse((o) => set.add(o)));
  stage.toonify(stage.scene, (m) => set.has(m));
  if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9]]);
  stage.finish();
}
export function camera(stage, num, d) {
  stage.camera.position.set(num('cx', d.c[0]), num('cy', d.c[1]), num('cz', d.c[2]));
  stage.camera.lookAt(num('tx', d.t[0]), num('ty', d.t[1]), num('tz', d.t[2] ?? 0));
}

export function buildBus() {
  const g = new THREE.Group(), yellow = mat('#f2b61f'), glass = mat('#2a4b8a', { roughness: 0.2 });
  box(g, yellow, [0, 0.62, 0], [2.6, 0.9, 0.95]);
  box(g, '#d8431f', [0, 0.38, 0], [2.62, 0.1, 0.97]);
  box(g, '#ffffff', [0, 1.1, 0], [2.5, 0.06, 0.9]);
  for (let i = 0; i < 5; i++) box(g, glass, [-0.95 + i * 0.5, 0.82, 0.48], [0.38, 0.3, 0.02]);
  box(g, glass, [1.3, 0.78, 0.2], [0.02, 0.4, 0.5]);
  for (const x of [-0.8, 0.85]) for (const z of [0.45, -0.45]) { const w = cyl(g, '#222', [x, 0.2, z], 0.2, 0.14, [Math.PI / 2, 0, 0]); cyl(g, '#bbb', [x, 0.2, z * 1.14], 0.1, 0.02, [Math.PI / 2, 0, 0]); }
  blob(g, '#fff6c0', [1.3, 0.45, 0.3], [0.03, 0.06, 0.06], [0, 0, 0], { emissive: '#ffe070' });
  blob(g, '#fff6c0', [1.3, 0.45, -0.3], [0.03, 0.06, 0.06], [0, 0, 0], { emissive: '#ffe070' });
  return g;
}

export function buildCot() {
  const g = new THREE.Group(), wood = mat('#8a5a2c');
  for (const [x, z] of [[-0.5, 0.22], [0.5, 0.22], [-0.5, -0.22], [0.5, -0.22]]) cyl(g, wood, [x, 0.12, z], 0.025, 0.24);
  box(g, wood, [0, 0.25, 0.25], [1.16, 0.04, 0.04]); box(g, wood, [0, 0.25, -0.25], [1.16, 0.04, 0.04]);
  box(g, '#5aa0d8', [0, 0.3, 0], [1.1, 0.08, 0.5]);
  box(g, '#ffffff', [-0.4, 0.38, 0], [0.26, 0.1, 0.38]);
  return g;
}

export function delftTexture() {
  return canvasTexture(512, (ctx, s) => {
    const c = s / 2, B = '#1f4fb5';
    ctx.fillStyle = '#f7f9ff'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = B; ctx.fillStyle = B; ctx.lineCap = 'round';
    for (const [r, w] of [[240, 14], [212, 5], [150, 5]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; ctx.beginPath(); ctx.arc(c + 181 * Math.cos(a), c + 181 * Math.sin(a), 11, 0, 7); ctx.fill(); }
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(c - 80, c + 130); ctx.lineTo(c - 50, c - 20); ctx.lineTo(c + 50, c - 20); ctx.lineTo(c + 80, c + 130); ctx.closePath(); ctx.stroke();   // windmill tower
    ctx.fillStyle = '#f7f9ff'; ctx.fill(); ctx.fillStyle = B;
    ctx.save(); ctx.translate(c, c - 40); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -120); ctx.stroke(); ctx.strokeRect(-18, -118, 36, 80); } ctx.restore();
    ctx.beginPath(); ctx.arc(c, c - 40, 14, 0, 7); ctx.fill();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(c - 150, c + 135); ctx.lineTo(c + 150, c + 135); ctx.stroke();
  });
}

export function buildDelftPlate() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.5, 0.0], [0.62, 0.06], [0.72, 0.16], [0.74, 0.2], [0.72, 0.2], [0.6, 0.1], [0.45, 0.04], [0, 0.04]].map(([x, y]) => new THREE.Vector2(x, y));
  const dish = add(g, new THREE.LatheGeometry(pts, 48), mat('#f4f7ff', { roughness: 0.25 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
  const face = add(g, new THREE.CircleGeometry(0.66, 48), new THREE.MeshStandardMaterial({ map: delftTexture(), roughness: 0.25 }), [0, 0, 0.128]);
  face.castShadow = false;
  add(g, new THREE.TorusGeometry(0.735, 0.012, 8, 64), mat('#1f4fb5'), [0, 0, 0.2]);
  return g;
}

export function buildEEGCap() {
  const g = new THREE.Group();
  const cap = add(g, new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, 1.0), mat('#f4f4f6', { roughness: 0.5 }), [0, 0.0, 0], [0, 0, 0], [0.226, 0.206, 0.215]);
  cap.castShadow = false;
  for (const [a, b] of [[0, 0], [0.5, 0], [0.5, 2.1], [0.5, 4.2], [0.9, 1], [0.9, 3.1], [0.9, 5.2], [0.9, 0.0]]) {
    const th = a, ph = b, x = 0.236 * Math.sin(th) * Math.sin(ph), y = 0.215 * Math.cos(th), z = 0.225 * Math.sin(th) * Math.cos(ph);
    blob(g, '#ffc42a', [x, y - 0.002, z], [0.02, 0.02, 0.02], [0, 0, 0], { metalness: 0.5, roughness: 0.3 });
  }
  return g;
}

export function buildBrain(r = 0.5) {
  const geo = new THREE.IcosahedronGeometry(1, 5), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const f = 1 + 0.05 * Math.sin(v.x * 11) * Math.sin(v.y * 11 + 1) * Math.sin(v.z * 11) - 0.08 * Math.exp(-(v.x * v.x) * 300) * (v.y > -0.2 ? 1 : 0);
    v.multiplyScalar(f); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat('#f48fa6', { roughness: 0.5 })); m.scale.set(r * 1.15, r * 0.85, r); m.castShadow = true; return m;
}

export function wave(parent, pts, color, rad = 0.012) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return add(parent, new THREE.TubeGeometry(curve, 120, rad, 8), mat(color, { emissive: color, emissiveIntensity: 0.7, roughness: 0.4 }));
}
export const sineWave = (x0, x1, y, z, amp, freq, n = 40, ph = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x0 + (x1 - x0) * t, y + amp * Math.sin(t * freq * 6.283 + ph), z]; });

export function buildMicroscope() {
  const g = new THREE.Group(), body = mat('#2f3f58', { metalness: 0.4, roughness: 0.4 }), steel = mat('#d7dde4', { metalness: 0.7, roughness: 0.25 });
  box(g, body, [0, 0.03, 0], [0.34, 0.06, 0.26]);
  cyl(g, body, [-0.1, 0.25, 0], 0.035, 0.4);
  const arc = add(g, new THREE.TorusGeometry(0.13, 0.03, 12, 24, Math.PI), body, [0.0, 0.42, 0], [0, 0, 0]);
  cyl(g, steel, [0.12, 0.38, 0], 0.045, 0.28, [0, 0, 0.0]);
  cyl(g, steel, [0.12, 0.2, 0], 0.025, 0.1);
  cyl(g, '#111', [0.12, 0.52, 0], 0.03, 0.12, [0, 0, 0], 0.025);
  box(g, steel, [0.12, 0.1, 0], [0.2, 0.015, 0.16]);
  blob(g, '#9fe3ff', [0.12, 0.11, 0], [0.025, 0.012, 0.025], [0, 0, 0], { emissive: '#9fe3ff' });
  return g;
}

export function buildJaguar() {
  const g = new THREE.Group(), fur = '#e8a53a', dark = '#2b1a10', pale = '#f7e3b8';
  const B = [0, 0.42, -0.05], R = [0.34, 0.4, 0.3];
  blob(g, fur, B, R);
  blob(g, pale, [0, 0.4, 0.22], [0.22, 0.3, 0.14]);
  for (const s of [-1, 1]) { blob(g, fur, [s * 0.26, 0.17, 0.02], [0.17, 0.17, 0.3]); blob(g, fur, [s * 0.14, 0.14, 0.34], [0.09, 0.14, 0.09]); blob(g, pale, [s * 0.14, 0.02, 0.4], [0.1, 0.05, 0.12]); }
  const head = new THREE.Group(); head.position.set(0, 0.95, 0.05); g.add(head);
  blob(head, fur, [0, 0, 0], [0.3, 0.26, 0.26]);
  blob(head, pale, [0, -0.08, 0.2], [0.17, 0.12, 0.12]);
  blob(head, '#c04a5a', [0, -0.02, 0.3], [0.05, 0.035, 0.03]);
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 16, Math.PI), mat(dark)); mo.rotation.z = Math.PI; mo.position.set(0, -0.1, 0.3); head.add(mo);
  for (const s of [-1, 1]) {
    blob(head, fur, [s * 0.21, 0.2, -0.02], [0.09, 0.09, 0.05]); blob(head, '#f1b8b8', [s * 0.21, 0.2, 0.01], [0.055, 0.055, 0.03]);
    blob(head, '#ffffff', [s * 0.11, 0.06, 0.21], [0.065, 0.07, 0.04]);
    blob(head, '#7fd04a', [s * 0.11, 0.06, 0.245], [0.048, 0.055, 0.02]);
    blob(head, '#101010', [s * 0.11, 0.06, 0.262], [0.026, 0.045, 0.015]);
    blob(head, '#ffffff', [s * 0.1, 0.085, 0.272], [0.012, 0.012, 0.01]);
    for (const k of [-1, 0, 1]) { blob(head, pale, [s * 0.1, -0.1 + k * 0.02, 0.3], [0.0, 0, 0]); }
  }
  const rnd = rng(3);
  for (let i = 0; i < 46; i++) {
    const th = rnd() * 6.283, ph = 0.2 + rnd() * 2.0; const d = [Math.sin(ph) * Math.sin(th), Math.cos(ph) * 0.9, Math.sin(ph) * Math.cos(th) * 0.9];
    if (d[2] > 0.5 && Math.abs(d[0]) < 0.45) continue;
    spot(g, dark, B, R, d, 0.07 + rnd() * 0.03);
  }
  for (let i = 0; i < 12; i++) { const a = rnd() * 6.283, y = (rnd() - 0.5) * 0.3; spot(head, dark, [0, 0, 0], [0.3, 0.26, 0.26], [Math.sin(a), 0.6 + y, Math.cos(a) * 0.6 - 0.2], 0.04); }
  const tail = add(g, new THREE.TorusGeometry(0.25, 0.05, 10, 24, Math.PI * 1.25), mat(fur), [0.3, 0.3, -0.2], [0, 0, 0]); tail.rotation.set(Math.PI / 2 * 0.0, 0.8, -0.4);
  g.userData.head = head; return g;
}

export function buildCrown(label = true) {
  const g = new THREE.Group(), gold = mat('#ffcf2e', { metalness: 0.75, roughness: 0.25 });
  const band = cyl(g, gold, [0, 0.06, 0], 0.16, 0.12);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const t = add(g, new THREE.ConeGeometry(0.045, 0.14, 4), gold, [Math.sin(a) * 0.145, 0.19, Math.cos(a) * 0.145]); blob(g, i % 2 ? '#e8345a' : '#33b7ff', [Math.sin(a) * 0.145, 0.27, Math.cos(a) * 0.145], [0.025, 0.025, 0.025]); }
  if (label) { const t = textPlane('CEO', 0.2, 0.09, { bg: '#7a1030', fg: '#ffe27a' }); t.position.set(0, 0.07, 0.162); g.add(t); }
  return g;
}

export function buildRobot() {
  const g = new THREE.Group(), metal = mat('#c9d4e4', { metalness: 0.4, roughness: 0.35 }), blue = mat('#2d7be0');
  box(g, blue, [0, 0.3, 0], [0.5, 0.3, 0.4]); box(g, '#2b2f3a', [0, 0.1, 0], [0.62, 0.14, 0.46]);
  for (const x of [-0.26, 0.26]) for (const z of [-0.2, 0.2]) cyl(g, '#2b2f3a', [x, 0.1, z], 0.1, 0.06, [Math.PI / 2, 0, 0]);
  box(g, metal, [0, 0.62, 0.02], [0.36, 0.28, 0.3]);
  for (const s of [-1, 1]) { blob(g, '#ffffff', [s * 0.08, 0.64, 0.17], [0.06, 0.06, 0.025]); blob(g, '#1b2a4a', [s * 0.08, 0.64, 0.185], [0.035, 0.035, 0.02]); blob(g, '#fff', [s * 0.07, 0.66, 0.2], [0.012, 0.012, 0.01]); }
  box(g, '#e8345a', [0, 0.55, 0.17], [0.14, 0.02, 0.02]);
  cyl(g, metal, [0.1, 0.84, 0], 0.012, 0.16); blob(g, '#ffcf2e', [0.1, 0.94, 0], [0.04, 0.04, 0.04], [0, 0, 0], { emissive: '#ffb000' });
  box(g, '#ffcf2e', [0, 0.3, 0.21], [0.2, 0.12, 0.01]);
  return g;
}

export function buildCoin(r = 0.3, th = 0.05) {
  const g = new THREE.Group(), gold = mat('#ffcf2e', { metalness: 0.8, roughness: 0.28 });
  cyl(g, gold, [0, 0, 0], r, th, [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(r * 0.94, th * 0.35, 8, 40), mat('#e0a21a', { metalness: 0.8, roughness: 0.3 }), [0, 0, th / 2]);
  const f = textPlane('€', r * 1.5, r * 1.5, { bg: '#f5bf1f', fg: '#a26a00', font: 'Georgia, serif' }); f.material.transparent = false;
  f.geometry = new THREE.CircleGeometry(r * 0.78, 40); f.material.map.center.set(0.5, 0.5); f.material.map.repeat.set(1.3, 1.3); f.material.map.offset.set(-0.15, -0.15);
  f.position.z = th / 2 + 0.001; g.add(f); return g;
}

export function buildMouse() {
  const g = new THREE.Group(), fur = '#9c9ba3', pink = '#f3a9b8';
  blob(g, fur, [0, 0.17, 0], [0.2, 0.17, 0.3]);
  blob(g, '#e8e6ea', [0, 0.14, 0.04], [0.15, 0.12, 0.22]);
  const h = new THREE.Group(); h.position.set(0, 0.24, 0.3); g.add(h);
  blob(h, fur, [0, 0, 0], [0.14, 0.13, 0.16]); blob(h, fur, [0, -0.03, 0.14], [0.07, 0.07, 0.1]); blob(h, pink, [0, -0.01, 0.235], [0.03, 0.03, 0.03]);
  for (const s of [-1, 1]) {
    blob(h, fur, [s * 0.12, 0.13, -0.04], [0.1, 0.1, 0.025]); blob(h, pink, [s * 0.12, 0.13, -0.02], [0.07, 0.07, 0.015]);
    blob(h, '#ffffff', [s * 0.06, 0.04, 0.12], [0.04, 0.045, 0.03]); blob(h, '#101018', [s * 0.06, 0.04, 0.145], [0.026, 0.034, 0.018]); blob(h, '#fff', [s * 0.055, 0.055, 0.157], [0.01, 0.01, 0.008]);
    for (const k of [-1, 1]) cyl(h, '#ddd', [s * 0.08, -0.04 + k * 0.012, 0.19], 0.003, 0.14, [0, 0, Math.PI / 2 + s * 0.12 * k]);
    blob(g, fur, [s * 0.14, 0.05, 0.1], [0.05, 0.05, 0.1]); blob(g, fur, [s * 0.1, 0.04, -0.2], [0.06, 0.05, 0.1]);
  }
  const tail = new THREE.CatmullRomCurve3([[0, 0.12, -0.28], [0, 0.08, -0.5], [0.12, 0.03, -0.62], [0.2, 0.1, -0.78]].map((p) => new THREE.Vector3(...p)));
  add(g, new THREE.TubeGeometry(tail, 20, 0.018, 6), mat(pink));
  return g;
}

/** Generic anime woman, seated/standing from the waist up; returns group with .rig points. */
export function buildFrau() {
  const g = new THREE.Group(), skin = '#ffe0c4', dress = '#c0392b';
  const body = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.38, 0], [0.34, 0.2], [0.22, 0.6], [0.14, 0.8], [0.0, 0.82]].map(([x, y]) => new THREE.Vector2(x, y)), 32), mat(dress)); body.castShadow = true; g.add(body);
  blob(g, '#ffffff', [0, 0.38, 0.17], [0.2, 0.34, 0.07]);
  blob(g, '#fff', [0, 0.62, 0.0], [0.17, 0.08, 0.15]);
  cyl(g, skin, [0, 0.86, 0], 0.05, 0.1);
  const h = new THREE.Group(); h.position.set(0, 1.02, 0); g.add(h);
  blob(h, skin, [0, 0, 0], [0.17, 0.18, 0.165]);
  blob(h, '#8a5a2c', [0, 0.04, -0.03], [0.18, 0.18, 0.17]); blob(h, '#8a5a2c', [0, 0.17, -0.02], [0.08, 0.08, 0.08]);
  for (const s of [-1, 1]) {
    blob(h, '#ffffff', [s * 0.07, -0.01, 0.145], [0.045, 0.055, 0.02]); blob(h, '#2c5fa8', [s * 0.07, -0.015, 0.16], [0.032, 0.045, 0.015]); blob(h, '#10131a', [s * 0.07, -0.015, 0.172], [0.018, 0.03, 0.01]); blob(h, '#fff', [s * 0.062, 0.003, 0.18], [0.01, 0.01, 0.006]);
    blob(h, '#ff8a8a', [s * 0.105, -0.07, 0.13], [0.03, 0.017, 0.01], [0, 0, 0], { transparent: true, opacity: 0.6 });
    blob(h, '#8a5a2c', [s * 0.17, -0.02, 0.0], [0.04, 0.12, 0.05]);
  }
  blob(h, '#8a5a2c', [0, 0.09, 0.14], [0.17, 0.07, 0.04]);
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 14, Math.PI), mat('#a8323a')); m.rotation.z = Math.PI; m.position.set(0, -0.08, 0.155); h.add(m);
  const braid = new THREE.CatmullRomCurve3([[-0.1, 0.9, -0.1], [-0.17, 0.75, -0.1], [-0.14, 0.55, -0.12], [-0.17, 0.4, -0.1]].map((p) => new THREE.Vector3(...p)));
  add(g, new THREE.TubeGeometry(braid, 16, 0.04, 8), mat('#8a5a2c'));
  g.userData.shoulder = { l: [0.2, 0.7, 0.0], r: [-0.2, 0.7, 0.0] };
  return g;
}

export function buildBarn() {
  const g = new THREE.Group();
  box(g, '#b8432f', [0, 1.1, 0], [3.2, 2.2, 1.8]);
  const roof = add(g, new THREE.CylinderGeometry(1, 1, 3.4, 3), mat('#6a3b24'), [0, 2.6, 0], [0, 0, Math.PI / 2], [1.0, 1, 1.15]); roof.rotation.set(0, 0, Math.PI / 2); roof.rotation.x = 0;
  box(g, '#ffffff', [0, 1.0, 0.91], [1.3, 1.9, 0.04]); box(g, '#a83222', [-0.325, 1.0, 0.94], [0.62, 1.8, 0.03]); box(g, '#a83222', [0.325, 1.0, 0.94], [0.62, 1.8, 0.03]);
  add(g, new THREE.PlaneGeometry(1, 1), mat('#ffffff'), [0, 1, 0]).visible = false;
  return g;
}
export function buildHay(parent, x, z, rot = 0) { const m = cyl(parent, '#e6c14a', [x, 0.28, z], 0.28, 0.56, [Math.PI / 2, 0, rot]); for (const y of [-0.15, 0, 0.15]) cyl(parent, '#a07a22', [x, 0.28, z + y], 0.285, 0.015, [Math.PI / 2, 0, rot]); return m; }
