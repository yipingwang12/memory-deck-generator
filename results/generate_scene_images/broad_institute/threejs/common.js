// Shared helpers + props for the Broad scenes.
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createBroadsword } from './broadsword.js';
export { THREE, guard, canvasTexture, rng, createBroadsword };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Text on a canvas texture material. */
export function textMat(text, { bg = '#ffffff', fg = '#222', w = 512, h = 128, font = 'bold 84px Georgia' } = {}) {
  const t = canvasTexture(w, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2);
  });
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
}
export function sign(parent, text, pos, size, opts = {}) {
  const m = textMat(text, { w: 1024, font: opts.font ?? 'bold 150px Georgia', bg: opts.bg, fg: opts.fg });
  // square canvas is used by canvasTexture; squash text by plane aspect via texture repeat trick: draw in square, crop v
  m.map.repeat.set(1, 0.3); m.map.offset.set(0, 0.35);
  return add(parent, new THREE.PlaneGeometry(...size), m, pos);
}

export function setup(P, { cam = [0, 1, 4], look = [0, 0.8, 0], fov = 40, ground = '#6fae45', sky = {}, sunAz = 150, sunEl = 35, clouds = true } = {}) {
  const num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: sunEl, sunAzimuth: sunAz, exposure: 1,
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const finish = () => {
    stage.toonify(stage.scene, (m) => stage.chars.has(m));
    if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
    stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
    stage.finish();
  };
  stage.chars = new Set();
  stage.sword = (opts = {}) => {
    const s = createBroadsword({ scale: opts.scale ?? 1 });
    s.position.set(...(opts.pos ?? [0, 0, 0])); s.rotation.y = opts.ry ?? 0; stage.scene.add(s);
    s.traverse((o) => stage.chars.add(o)); return s;
  };
  stage.finishScene = finish;
  return stage;
}

/** Reach sword's hand to a world point. */
export function grab(sword, key, p) {
  sword.updateMatrixWorld(true);
  const t = sword.worldToLocal(new THREE.Vector3(...p)); sword.userData.reach(key, [t.x, t.y, t.z]);
}

/** Great Dome (MIT): colonnade + dome + lantern. Width ~ 3 */
export function makeDome(s = 1) {
  const g = new THREE.Group(), stone = mat('#e8e0cc'), grey = mat('#9aa7b2', { metalness: 0.3, roughness: 0.4 });
  box(g, stone, [0, 0.5, 0], [3, 1, 1.3]);
  for (let i = 0; i < 6; i++) cyl(g, mat('#f4eede'), [-1.05 + i * 0.42, 0.55, 0.75], 0.09, 1.0);
  box(g, stone, [0, 1.08, 0.7], [2.5, 0.12, 0.3]);
  box(g, stone, [0, 1.25, 0.0], [1.7, 0.3, 1.2]);
  const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(0.95 * Math.cos(a), 0.95 * Math.sin(a))); }
  add(g, new THREE.LatheGeometry(pts, 40), grey, [0, 1.4, 0]);
  cyl(g, stone, [0, 2.38, 0], 0.12, 0.2);
  blob(g, mat('#e2b13c', { metalness: 0.6 }), [0, 2.55, 0], [0.09, 0.09, 0.09]);
  g.scale.setScalar(s); return g;
}

/** Heater shield, crimson with HARVARD banner. Faces +z. */
export function makeShield(s = 1) {
  const g = new THREE.Group(), sh = new THREE.Shape();
  sh.moveTo(-0.5, 0.55); sh.lineTo(0.5, 0.55); sh.lineTo(0.5, 0); sh.quadraticCurveTo(0.5, -0.5, 0, -0.75); sh.quadraticCurveTo(-0.5, -0.5, -0.5, 0); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
  add(g, geo, mat('#a51c30', { roughness: 0.4 }), [0, 0, -0.04]);
  const inner = new THREE.Shape(); inner.moveTo(-0.38, 0.43); inner.lineTo(0.38, 0.43); inner.lineTo(0.38, 0); inner.quadraticCurveTo(0.38, -0.38, 0, -0.58); inner.quadraticCurveTo(-0.38, -0.38, -0.38, 0); inner.closePath();
  add(g, new THREE.ShapeGeometry(inner), mat('#d7385a', { roughness: 0.4 }), [0, 0, 0.075]);
  const label = add(g, new THREE.PlaneGeometry(0.76, 0.24), textMat('HARVARD', { bg: '#f4eede', fg: '#a51c30', w: 512, font: 'bold 92px Georgia' }), [0, 0.12, 0.08]);
  label.material.map.repeat.set(1, 0.32); label.material.map.offset.set(0, 0.34);
  g.scale.setScalar(s); return g;
}

/** Brass telescope along +x from origin, length ~1.1; lens end at +x. Cell-pattern lens. */
export function makeTelescope(s = 1) {
  const g = new THREE.Group(), brass = mat('#d9a441', { metalness: 0.7, roughness: 0.3 }), dark = mat('#5a3a1a', { roughness: 0.6 });
  cyl(g, brass, [0.2, 0, 0], 0.11, 0.55, [0, 0, Math.PI / 2]);
  cyl(g, dark, [0.45, 0, 0], 0.125, 0.06, [0, 0, Math.PI / 2]);
  cyl(g, brass, [0.72, 0, 0], 0.16, 0.5, [0, 0, Math.PI / 2]);
  cyl(g, dark, [0.99, 0, 0], 0.185, 0.07, [0, 0, Math.PI / 2]);
  cyl(g, mat('#bfe6ff', { metalness: 0.3, roughness: 0.1 }), [1.03, 0, 0], 0.15, 0.02, [0, 0, Math.PI / 2]);
  for (const [y, z] of [[0.05, 0.03], [-0.06, -0.05], [0.02, -0.07]]) blob(g, mat('#2f6fd0'), [1.045, y, z], [0.012, 0.04, 0.04]);
  cyl(g, brass, [-0.12, 0, 0], 0.07, 0.12, [0, 0, Math.PI / 2]);
  g.scale.setScalar(s); return g;
}

/** Cartoon cell: translucent blob + nucleus. */
export function makeCell(color = '#ff9ec0', s = 1) {
  const g = new THREE.Group();
  const body = blob(g, mat(color, { transparent: true, opacity: 0.85, roughness: 0.3 }), [0, 0, 0], [1, 0.9, 0.9]);
  blob(g, mat('#6b3a9a'), [0.1, 0.05, 0.55], [0.32, 0.32, 0.32]); blob(g, mat('#fff'), [0.02, 0.12, 0.8], [0.08, 0.08, 0.08]);
  g.scale.setScalar(s); return g;
}

export function makeMouse(s = 1) {
  const g = new THREE.Group(), fur = mat('#b9a58f'), pink = mat('#f2a7b0');
  blob(g, fur, [0, 0.35, 0], [0.55, 0.38, 0.38]); blob(g, fur, [0.6, 0.4, 0], [0.3, 0.26, 0.26]); blob(g, pink, [0.88, 0.4, 0], [0.06, 0.06, 0.06]);
  for (const z of [-1, 1]) { blob(g, fur, [0.55, 0.68, z * 0.17], [0.16, 0.16, 0.05]); blob(g, pink, [0.55, 0.68, z * 0.2], [0.1, 0.1, 0.03]);
    blob(g, mat('#111'), [0.76, 0.46, z * 0.15], [0.045, 0.06, 0.045]); }
  cyl(g, pink, [-0.7, 0.28, 0], 0.03, 0.7, [0, 0, 1.2], 0.015);
  g.scale.setScalar(s); return g;
}

export function makeSumo(s = 1) {
  const g = new THREE.Group(), skin = mat('#f0b88a'), white = mat('#f4f0e6'), dark = mat('#1a1410');
  blob(g, skin, [0, 0.75, 0], [0.62, 0.62, 0.5]);                    // belly
  blob(g, skin, [0, 1.35, 0], [0.4, 0.34, 0.33]);                    // chest
  blob(g, skin, [0, 1.8, 0.03], [0.28, 0.27, 0.27]);                 // head
  blob(g, dark, [0, 2.07, -0.03], [0.1, 0.1, 0.1]); cyl(g, dark, [0, 2.0, -0.03], 0.07, 0.1);
  add(g, new THREE.TorusGeometry(0.62, 0.09, 12, 36), white, [0, 0.55, 0], [Math.PI / 2, 0, 0], [1, 0.82, 1]);
  for (const x of [-1, 1]) {
    blob(g, white, [x * 0.1, 1.82, 0.26], [0.065, 0.07, 0.03]); blob(g, dark, [x * 0.1, 1.82, 0.285], [0.035, 0.05, 0.02]);
    blob(g, mat('#ff7f8f', { transparent: true, opacity: 0.6 }), [x * 0.19, 1.72, 0.24], [0.06, 0.035, 0.02]);
    cyl(g, skin, [x * 0.3, 0.18, 0.05], 0.15, 0.55); blob(g, skin, [x * 0.3, 0.05, 0.12], [0.18, 0.08, 0.24]);
    add(g, new THREE.BoxGeometry(0.1, 0.014, 0.014), dark, [x * 0.1, 1.9, 0.27], [0, 0, x * 0.3]);
  }
  add(g, new THREE.TorusGeometry(0.03, 0.01, 6, 14, Math.PI), mat('#7a2a2a'), [0, 1.68, 0.265], [0, 0, Math.PI]);
  g.scale.setScalar(s); return g;
}

export function makeLander(s = 1) {
  const g = new THREE.Group(), foil = mat('#e0a82e', { metalness: 0.6, roughness: 0.3 }), silver = mat('#cfd6dc', { metalness: 0.6, roughness: 0.3 });
  const body = add(g, new THREE.CylinderGeometry(0.75, 0.9, 0.8, 8), foil, [0, 1.35, 0]);
  add(g, new THREE.CylinderGeometry(0.55, 0.75, 0.35, 8), silver, [0, 1.9, 0]);
  blob(g, mat('#2a3a55', { metalness: 0.4, roughness: 0.2 }), [0, 1.5, 0.78], [0.22, 0.2, 0.08]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, x = Math.cos(a), z = Math.sin(a);
    const leg = cyl(g, silver, [x * 0.95, 0.65, z * 0.95], 0.04, 1.2); leg.rotation.set(z * 0.45, 0, -x * 0.45);
    cyl(g, silver, [x * 1.2, 0.03, z * 1.2], 0.2, 0.06);
  }
  cyl(g, mat('#555'), [0, 0.75, 0], 0.2, 0.3, [0, 0, 0], 0.32);
  g.scale.setScalar(s); return g;
}

/** Flat winding river ribbon from points [[x,z],...]. */
export function makeRiver(pts, width = 0.9, y = 0.01) {
  const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const N = 60, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPoint(t), tg = curve.getTangent(t), nx = -tg.z, nz = tg.x, w = width * (0.9 + 0.2 * Math.sin(t * 9)) / 2;
    pos.push(p.x + nx * w, y, p.z + nz * w, p.x - nx * w, y, p.z - nz * w);
    if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat('#3fa4e8', { roughness: 0.2, side: THREE.DoubleSide })); m.receiveShadow = true; g.add(m);
  const geo2 = geo.clone(); const m2 = new THREE.Mesh(geo2, mat('#a8e0ff', { roughness: 0.2 })); m2.scale.set(1, 1, 1); m2.position.y = 0.004; m2.scale.setScalar(1); g.add(m2); m2.visible = false;
  return g;
}

export function makeNose(s = 1) {
  const g = new THREE.Group(), sk = mat('#f2b38c');
  blob(g, sk, [0, 0.5, 0], [0.5, 0.55, 0.45]); blob(g, sk, [-0.28, 0.2, 0.15], [0.22, 0.2, 0.22]); blob(g, sk, [0.28, 0.2, 0.15], [0.22, 0.2, 0.22]);
  for (const x of [-1, 1]) blob(g, mat('#3a1c14'), [x * 0.15, 0.08, 0.3], [0.09, 0.07, 0.08]);
  g.scale.setScalar(s); return g;
}

export function sparks(scene, c, n = 40, r = 0.8, seed = 3) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) blob(scene, mat(['#ffd84a', '#ff8a2a', '#fff2b0'][i % 3], { emissive: '#ff9a20', emissiveIntensity: 0.8 }),
    [c[0] + (R() - 0.5) * r * 2, c[1] + R() * r, c[2] + (R() - 0.5) * r], [0.025, 0.025, 0.025]);
}
