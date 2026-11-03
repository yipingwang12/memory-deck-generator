// Shared props for Exact Sciences scenes (armour, crab, blood, scene scaffolding).
import * as THREE from 'three';
import { guard, canvasTexture, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createRuler } from './ruler.js';
export { THREE, guard, canvasTexture, rng, createAnimeStage, createRuler };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const num = (P, k, d) => Number(P.get(k) ?? d);

export function textPlane(text, w, h, { bg = null, fg = '#fff', font = 'bold', px = 0.8 } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); } else ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = fg; ctx.font = `${font} ${Math.floor(s * px)}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, s / 2, s / 2 + s * 0.04);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
}

/** Standard sunny stage + meadow ground. Returns stage. */
export function makeStage(P, { ground = '#6fae45', az = 150, el = 35, sky = {} } = {}) {
  const stage = createAnimeStage({
    fov: num(P, 'fov', 40), sunElevation: num(P, 'el', el), sunAzimuth: num(P, 'az', az), exposure: 1,
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

/** Finish: toonify the given character roots, clouds, camera. */
export function wrapUp(stage, P, characters, cam) {
  const pm = new Set(); characters.forEach((c) => c.traverse((o) => pm.add(o)));
  stage.toonify(stage.scene, (m) => pm.has(m));
  stage.addClouds(CLOUDS);
  stage.camera.position.set(num(P, 'cx', cam.pos[0]), num(P, 'cy', cam.pos[1]), num(P, 'cz', cam.pos[2]));
  stage.camera.lookAt(num(P, 'tx', cam.look[0]), num(P, 'ty', cam.look[1]), num(P, 'tz', cam.look[2] ?? 0));
  stage.finish();
}

/** Dress the ruler in armour: helmet with plume, gorget, breastplate overlay, pauldrons. Returns shield (hung on left arm). */
export function armorUp(ruler, { shield = true, emblem = null } = {}) {
  const { upper, head } = ruler.userData.parts;
  const steel = mat('#aeb8c4', { metalness: 0.7, roughness: 0.3 }), gold = mat('#e3b23c', { metalness: 0.7, roughness: 0.3 });
  const red = mat('#c8312e');
  // helmet over the top of the ruler (above the eyes)
  const h = new THREE.Group(); h.position.set(0, 1.02, 0); head.add(h);
  add(h, new THREE.SphereGeometry(0.15, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), steel, [0, -0.03, 0], [0, 0, 0], [1, 0.62, 0.55]);
  add(h, new THREE.CylinderGeometry(0.15, 0.15, 0.035, 28), gold, [0, -0.035, 0], [0, 0, 0], [1, 1, 0.55]);
  add(h, new THREE.BoxGeometry(0.02, 0.1, 0.09), steel, [0, -0.0, 0.03]);
  for (let i = 0; i < 6; i++) blob(h, red, [0, 0.05 + i * 0.012 - Math.abs(i - 2.5) * 0.004, -0.03 - i * 0.025], [0.02, 0.05, 0.05 - i * 0.003]);
  // breastplate band under the face + gorget
  add(upper, new THREE.BoxGeometry(0.25, 0.2, 0.052), steel, [0, 0.58, 0]);
  add(upper, new THREE.BoxGeometry(0.255, 0.02, 0.056), gold, [0, 0.69, 0]);
  add(upper, new THREE.BoxGeometry(0.255, 0.02, 0.056), gold, [0, 0.47, 0]);
  blob(upper, gold, [0, 0.58, 0.028], [0.035, 0.05, 0.012]);
  for (const s of [-1, 1]) blob(upper, steel, [s * 0.14, 0.9, 0], [0.05, 0.04, 0.05]);
  if (!shield) return null;
  const sh = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-0.15, 0.17); shape.lineTo(0.15, 0.17); shape.lineTo(0.15, -0.02);
  shape.quadraticCurveTo(0.12, -0.17, 0, -0.24); shape.quadraticCurveTo(-0.12, -0.17, -0.15, -0.02); shape.lineTo(-0.15, 0.17);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 });
  add(sh, g, mat('#2c5fb8')); add(sh, new THREE.TorusGeometry(0.0, 0.0), gold);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.005, bevelEnabled: false }), gold);
  rim.scale.set(1.0, 1.0, 1); rim.position.z = -0.012; sh.add(rim);
  if (emblem) { emblem.position.set(0, 0, 0.034); sh.add(emblem); }
  return sh;
}

/** Blood drop emblem: flat extruded teardrop facing +z, ~size*0.3 tall. */
export function bloodDrop(size = 1, color = '#d8142b') {
  const sh = new THREE.Shape(), r = 0.5;
  sh.moveTo(0, 1.0); sh.bezierCurveTo(0.15, 0.55, r, 0.3, r, -0.1);
  sh.absarc(0, -0.1, r, 0, Math.PI, true); sh.bezierCurveTo(-r, 0.3, -0.15, 0.55, 0, 1.0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  g.translate(0, -0.35, -0.05);
  const m = new THREE.Mesh(g, mat(color, { roughness: 0.25 }));
  m.scale.setScalar(0.18 * size); m.castShadow = true; return m;
}

/** Crab (zodiac Cancer): faces +z, ~0.35 wide. */
export function crab(color = '#e4572e', s = 1) {
  const g = new THREE.Group(), c = mat(color, { roughness: 0.45 }), dk = mat('#a8321a');
  blob(g, c, [0, 0.1, 0], [0.2, 0.08, 0.14]);
  for (const x of [-1, 1]) {
    blob(g, mat('#fff'), [x * 0.06, 0.2, 0.09], [0.028, 0.034, 0.028]);
    blob(g, mat('#111'), [x * 0.06, 0.2, 0.115], [0.014, 0.018, 0.012]);
    add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), c, [x * 0.06, 0.16, 0.08]);
    // claws: raised arm + two pincers
    add(g, new THREE.CylinderGeometry(0.02, 0.025, 0.2, 8), c, [x * 0.26, 0.17, 0.12], [0.5, 0, -x * 0.5]);
    blob(g, c, [x * 0.28, 0.27, 0.2], [0.07, 0.06, 0.09], [0, 0, 0]);
    blob(g, c, [x * 0.2, 0.3, 0.3], [0.035, 0.03, 0.09], [0, x * 0.4, 0]);
    blob(g, c, [x * 0.33, 0.3, 0.3], [0.035, 0.03, 0.09], [0, -x * 0.4, 0]);
    for (let i = 0; i < 3; i++) add(g, new THREE.CylinderGeometry(0.008, 0.01, 0.17, 6), c, [x * 0.2, 0.06, -0.04 + i * 0.045], [0, 0, x * 1.2]);
  }
  g.scale.setScalar(s); return g;
}

/** Test tube of blood standing on y=0. */
export function vial(h = 0.4, r = 0.05, fill = 0.7) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(r, r, h * fill, 20), mat('#c4132a', { roughness: 0.25 }), [0, h * fill / 2 + 0.005, 0]);
  add(g, new THREE.CylinderGeometry(r * 1.12, r * 1.12, h, 20, 1, true), mat('#cfe9f5', { transparent: true, opacity: 0.35, roughness: 0.1 }), [0, h / 2 + 0.005, 0]);
  add(g, new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.05, 20), mat('#2a9d8f'), [0, h + 0.03, 0]);
  return g;
}

/** Simple chibi person (head + body), faces +z, ~1 tall. */
export function person({ skin = '#f6cfa6', shirt = '#3d8fd1', pants = '#3a3f66', hair = '#3a2412' } = {}) {
  const g = new THREE.Group();
  blob(g, mat(pants), [0, 0.2, 0], [0.18, 0.2, 0.12]);
  add(g, new THREE.CylinderGeometry(0.1, 0.13, 0.3, 20), mat(shirt), [0, 0.5, 0]);
  blob(g, mat(skin), [0, 0.88, 0], [0.19, 0.19, 0.18]);
  blob(g, mat(hair), [0, 0.95, -0.03], [0.2, 0.15, 0.18]);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.28, 10), mat(skin), [s * 0.15, 0.5, 0], [0, 0, s * 0.2]);
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.18, 10), mat(pants), [s * 0.06, 0.09, 0]);
  }
  return g;
}

/** Knight: person-shaped armoured figure with helmet, visor slit. */
export function knight(plume = '#c8312e') {
  const g = new THREE.Group(), st = mat('#aeb8c4', { metalness: 0.7, roughness: 0.3 }), dk = mat('#2a2f38');
  add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.3, 14), st, [0, 0.15, 0]);
  for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.045, 0.05, 0.3, 12), st, [s * 0.07, 0.15, 0]);
  add(g, new THREE.CylinderGeometry(0.15, 0.12, 0.34, 20), st, [0, 0.47, 0]);
  blob(g, mat('#e3b23c', { metalness: 0.6, roughness: 0.3 }), [0, 0.47, 0.12], [0.06, 0.08, 0.03]);
  blob(g, st, [0, 0.8, 0], [0.16, 0.17, 0.16]);
  box(g, dk, [0, 0.8, 0.15], [0.17, 0.03, 0.02]);
  box(g, dk, [0, 0.76, 0.15], [0.01, 0.1, 0.02]);
  blob(g, mat(plume), [0, 0.99, -0.02], [0.03, 0.08, 0.1]);
  for (const s of [-1, 1]) { blob(g, st, [s * 0.17, 0.62, 0], [0.06, 0.05, 0.06]); add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), st, [s * 0.19, 0.46, 0], [0, 0, s * 0.15]); }
  return g;
}

/** Cheese wedge (triangular prism with holes), lying with the slice profile in xy, depth along z. */
export function cheese(size = 1, color = '#ffc928') {
  const g = new THREE.Group(), s = new THREE.Shape();
  s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.28); s.lineTo(-0.5, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  geo.translate(0, 0, -0.3);
  add(g, geo, mat(color, { roughness: 0.5 }));
  const hole = mat('#d99a10');
  [[0.3, 0.12, 0.34, 0.06], [-0.1, 0.04, 0.34, 0.045], [0.1, 0.2, 0.34, 0.04], [0.38, 0.05, 0.34, 0.035]].forEach(([x, y, z, r]) => blob(g, hole, [x, y, z], [r, r, 0.01]));
  [[0.0, 0.03, -0.34, 0.05], [0.3, 0.15, -0.34, 0.04]].forEach(([x, y, z, r]) => blob(g, hole, [x, y, z], [r, r, 0.01]));
  g.scale.setScalar(size); return g;
}

/** Angry/happy expression kit for person(): eyes, brows, mouth on the head at (0,0.88,0.18). */
export function faceOn(p, { angry = false, mouth = 'frown', skin = null } = {}) {
  const f = new THREE.Group(); f.position.set(0, 0.88, 0.17); p.add(f);
  for (const s of [-1, 1]) {
    blob(f, mat('#fff', { roughness: 0.3 }), [s * 0.065, 0.02, 0], [0.04, 0.045, 0.012]);
    blob(f, mat('#1a1010'), [s * 0.065, 0.015, 0.008], [0.022, 0.03, 0.01]);
    blob(f, mat('#fff'), [s * 0.058, 0.03, 0.016], [0.008, 0.008, 0.005]);
    if (angry) box(f, mat('#2a1408'), [s * 0.065, 0.085, 0.035], [0.09, 0.022, 0.02], [0, 0, s * 0.45]);
  }
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI), mat('#6a1a1a'));
  m.position.set(0, mouth === 'frown' ? -0.07 : -0.04, 0.005); m.rotation.z = mouth === 'frown' ? 0 : Math.PI; f.add(m);
  return f;
}

/** Put `obj` into the scene at ruler hand `key` (call after pose/reach). */
export function holdAt(ruler, key, obj, offset = [0, 0, 0]) {
  ruler.updateMatrixWorld(true);
  const p = new THREE.Vector3(); ruler.userData.parts.hands[key].getWorldPosition(p);
  obj.position.copy(p).add(new THREE.Vector3(...offset)); ruler.parent.add(obj); return obj;
}

/** Armoured ruler ready for a scene: shield on body front-left, hand tucked behind it. */
export function guardRuler(scale = 1.6, { sword = true, emblem = true } = {}) {
  const r = createRuler({ scale }), em = emblem ? bloodDrop(1.0) : null;
  if (em) em.rotation.x = 0;
  const sh = armorUp(r, { shield: true, emblem: em });
  sh.position.set(0.19, 0.62, 0.06); sh.rotation.y = -0.25; r.userData.parts.upper.add(sh);
  r.userData.pose({ headTilt: 0.04, legs: { l: [0.08, 0], r: [-0.08, 0] } });
  r.userData.reach('l', [0.18, 0.55, 0.1]);
  return r;
}

export function sword(len = 0.9) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.05, len, 0.012), mat('#dfe6ee', { metalness: 0.8, roughness: 0.2 }), [0, len / 2 + 0.1, 0]);
  add(g, new THREE.ConeGeometry(0.025, 0.07, 4), mat('#dfe6ee', { metalness: 0.8, roughness: 0.2 }), [0, len + 0.13, 0]);
  add(g, new THREE.BoxGeometry(0.24, 0.035, 0.04), mat('#e3b23c', { metalness: 0.7 }), [0, 0.1, 0]);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.14, 10), mat('#6a3b1c'), [0, 0.02, 0]);
  return g;
}

/** Big syringe along +y with needle tip at top. */
export function syringe(s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.045, 0.045, 0.5, 20, 1, true), mat('#d7ecf7', { transparent: true, opacity: 0.45, roughness: 0.1 }), [0, 0.25, 0]);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.34, 20), mat('#c4132a', { roughness: 0.25 }), [0, 0.19, 0]);
  add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), mat('#cfd6dd', { metalness: 0.8 }), [0, 0.59, 0]);
  add(g, new THREE.ConeGeometry(0.02, 0.06, 12), mat('#cfd6dd'), [0, 0.52, 0]);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10), mat('#555'), [0, -0.1, 0]);
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), mat('#555'), [0, -0.25, 0]);
  add(g, new THREE.BoxGeometry(0.14, 0.015, 0.03), mat('#2a9d8f'), [0, 0.5, 0]);
  g.scale.setScalar(s); return g;
}

/** Cylinder limb from point a to point b (Vector3 or arrays). */
export function limbBetween(a, b, r, m) {
  const A = new THREE.Vector3(...[].concat(a.toArray ? a.toArray() : a)), B = new THREE.Vector3(...[].concat(b.toArray ? b.toArray() : b));
  const d = B.clone().sub(A), len = d.length();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), m); c.castShadow = true;
  c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c;
}
