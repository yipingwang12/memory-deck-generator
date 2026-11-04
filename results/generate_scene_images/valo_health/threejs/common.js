// Shared scene helpers for the Valo Health set: stage, primitives, and reusable characters/props.
import * as THREE from 'three';
import { guard, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createViola } from './viola.js';
export { THREE, guard, canvasTexture, createViola };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (parent, m, pos, size, rot) => add(parent, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (parent, m, pos, r, h, rot, r2 = r) => add(parent, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);
export const disc = (parent, color, x, y, z, rx, ry = rx, extra = {}) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat(color, { roughness: 0.4, ...extra }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

/** Stage with ground; P = URLSearchParams-backed `num`. */
export function makeStage({ ground = '#7cb84a', sky = {}, el = 35, az = 150, fov = 40, groundSize = 400 } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
  });
  const g = add(stage.scene, new THREE.PlaneGeometry(groundSize, groundSize), mat(ground, { roughness: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return { stage, scene: stage.scene, num, ground: g };
}

/** Toonify characters (2-band + rim), place camera, finish. */
export function finishScene(S, chars, cam, look, clouds = true) {
  const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
  S.stage.toonify(S.scene, (m) => set.has(m));
  if (clouds) S.stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
  const n = S.num;
  S.stage.camera.position.set(n('cx', cam[0]), n('cy', cam[1]), n('cz', cam[2]));
  S.stage.camera.lookAt(n('tx', look[0]), n('ty', look[1]), n('tz', look[2] ?? 0));
  S.stage.finish();
}

/** Anime eye pair on a +z-facing surface at depth z. */
export function eyes(parent, { y, z, dx, rw = 0.04, rh = 0.05, iris = '#3a2416', pupilK = 0.55 }) {
  for (const s of [-1, 1]) {
    const x = s * dx;
    disc(parent, '#ffffff', x, y, z, rw, rh);
    disc(parent, iris, x, y - rh * 0.04, z + 0.0015, rw * 0.8, rh * 0.9);
    disc(parent, '#120a08', x, y, z + 0.003, rw * pupilK, rh * 0.6);
    disc(parent, '#ffffff', x - rw * 0.3, y + rh * 0.35, z + 0.0045, rw * 0.28);
    disc(parent, '#ffffff', x + rw * 0.25, y - rh * 0.4, z + 0.0045, rw * 0.12);
  }
}
export function smile(parent, x, y, z, r = 0.03, color = '#7a2a2a') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 8, 20, Math.PI), mat(color));
  m.rotation.z = Math.PI; m.position.set(x, y, z); parent.add(m); return m;
}

/** Stand a viola on the ground with arms posed; returns it. */
export function placeViola(scene, { x = 0, z = 0, scale = 1.5, ry = 0, pose = {} } = {}) {
  const v = createViola({ scale }); v.position.set(x, 0, z); v.rotation.y = ry; scene.add(v); v.userData.pose(pose); return v;
}

// ---------- people ----------
/** Chunky stylised person: kind 'admiral' (bicorne, beard, medals) or 'coach' (cap, whistle, tracksuit). Faces +z, ~1.5 tall. */
export function buildPerson(kind) {
  const g = new THREE.Group(), skin = mat('#f6caa0');
  const adm = kind === 'admiral';
  const coat = mat(adm ? '#1c2f66' : '#d63a2f'), pants = mat(adm ? '#f3f0e6' : '#233045'), gold = mat('#f0c030', { metalness: 0.5, roughness: 0.3 });
  for (const s of [-1, 1]) { cyl(g, pants, [s * 0.11, 0.33, 0], 0.085, 0.66); blob(g, mat('#2a1a14'), [s * 0.11, 0.04, 0.05], [0.1, 0.06, 0.15]); }
  blob(g, coat, [0, 0.88, 0], [0.33, 0.4, 0.22]);
  box(g, mat('#2b2b30'), [0, 0.62, 0.0], [0.38, 0.05, 0.25]);
  if (adm) {
    for (let i = 0; i < 4; i++) blob(g, gold, [0.0, 0.7 + i * 0.1, 0.2], [0.025, 0.025, 0.02]);
    for (let i = 0; i < 3; i++) { cyl(g, gold, [0.14 + i * 0.045, 0.98 - i * 0.01, 0.2], 0.022, 0.012, [Math.PI / 2, 0, 0]); }
    box(g, mat('#f3f0e6'), [0, 1.1, 0.19], [0.1, 0.12, 0.03]); // shirt front
  } else {
    box(g, mat('#ffffff'), [0, 0.9, 0.205], [0.06, 0.55, 0.01]); // stripe
    cyl(g, mat('#2b2b30'), [0.06, 0.98, 0.215], 0.012, 0.3, [0, 0, 0.0]); // whistle lanyard
    blob(g, mat('#f2c230', { metalness: 0.3 }), [0.06, 0.83, 0.225], [0.04, 0.022, 0.03]); // whistle
  }
  cyl(g, skin, [0, 1.12, 0], 0.06, 0.1);
  const head = new THREE.Group(); head.position.y = 1.32; g.add(head);
  blob(head, skin, [0, 0, 0], [0.19, 0.2, 0.18]);
  eyes(head, { y: 0.02, z: 0.172, dx: 0.075, rw: 0.032, rh: 0.042, iris: adm ? '#2a5a9a' : '#2a7a3a' });
  smile(head, 0, -0.07, 0.178, 0.03);
  for (const s of [-1, 1]) { const b = disc(head, '#ff8f8f', s * 0.125, -0.05, 0.14, 0.03, 0.016); b.material.transparent = true; b.material.opacity = 0.5; }
  if (adm) {
    const white = mat('#f4f4f0');
    blob(head, white, [-0.0, -0.1, 0.1], [0.14, 0.1, 0.1]); // beard
    blob(head, white, [0.07, -0.035, 0.17], [0.065, 0.025, 0.03], [0, 0, 0.3]); blob(head, white, [-0.07, -0.035, 0.17], [0.065, 0.025, 0.03], [0, 0, -0.3]);
    blob(head, mat('#e8e8e4'), [0, 0.06, -0.05], [0.2, 0.15, 0.17]);
    box(head, mat('#14224f'), [0, 0.22, 0], [0.5, 0.13, 0.24], [0, 0, 0.0]);
    box(head, gold, [0, 0.2, 0.125], [0.5, 0.03, 0.01]);
    for (const sx of [-1, 1]) blob(head, mat('#14224f'), [sx * 0.25, 0.25, 0], [0.05, 0.08, 0.12], [0, 0, sx * 0.4]);
    blob(head, gold, [0, 0.24, 0.13], [0.045, 0.045, 0.02]);
  } else {
    blob(head, mat('#3a2a20'), [0, 0.09, -0.04], [0.2, 0.16, 0.17]);
    blob(head, mat('#c92a2a'), [0, 0.12, -0.0], [0.2, 0.12, 0.19]);
    add(head, new THREE.CylinderGeometry(0.19, 0.19, 0.025, 28, 1, false, -Math.PI * 0.4, Math.PI * 0.8), mat('#c92a2a'), [0, 0.12, 0.17], [0, Math.PI * 0.0, 0], [1, 1, 0.9]).scale.set(1, 1, 0.9);
    box(head, mat('#c92a2a'), [0, 0.13, 0.24], [0.22, 0.02, 0.14]);
  }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.3, 1.08, 0); g.add(sh);
    cyl(sh, coat, [0, -0.2, 0], 0.07, 0.42); blob(sh, mat('#ffffff'), [0, -0.44, 0], [0.075, 0.075, 0.075]);
    sh.rotation.z = s * 0.25; arms[k] = sh;
    if (adm) cyl(sh, gold, [0, 0.0, 0], 0.085, 0.04);
  }
  g.userData.arms = arms; g.userData.head = head;
  return g;
}

// ---------- characters ----------
/** NOVO egg: Novo-blue sash, face, little arms/legs. ~0.9 tall, faces +z. */
export function buildEgg() {
  const g = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 28; i++) { const t = i / 28 * Math.PI, y = -Math.cos(t), r = Math.sin(t) * (0.34 - 0.07 * y); prof.push(new THREE.Vector2(r, 0.46 * y)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), mat('#fff7e8', { roughness: 0.35 })); body.position.y = 0.58; body.castShadow = true; g.add(body);
  const sash = add(g, new THREE.TorusGeometry(0.325, 0.03, 10, 40), mat('#0a4fb0'), [0, 0.36, 0], [Math.PI / 2, 0, 0], [1, 1, 1]);
  const zf = (x, y) => 0.34 * 0.97 * Math.sqrt(Math.max(0.1, 1 - ((x / 0.34) ** 2) - (((y - 0.58) / 0.46) ** 2))) * (1 - 0.07 * (y - 0.58) / 0.46 / 0.34 * 0.34);
  for (const s of [-1, 1]) {
    const x = s * 0.11, z = zf(x, 0.68) + 0.012;
    const e = new THREE.Group(); e.position.set(x, 0.68, z); e.rotation.y = s * 0.28; g.add(e);
    eyes(e, { y: 0, z: 0, dx: 0, rw: 0.058, rh: 0.075, iris: '#1a5fcf' });
  }
  const m = smile(g, 0, 0.52, zf(0, 0.52) + 0.012, 0.045); m.scale.set(1, 1.1, 1);
  for (const s of [-1, 1]) { const b = disc(g, '#ff8f9f', s * 0.2, 0.55, zf(s * 0.2, 0.55) + 0.006, 0.04, 0.022); b.material.transparent = true; b.material.opacity = 0.6; b.rotation.y = s * 0.5; }
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.33, 0.55, 0); g.add(sh);
    cyl(sh, mat('#fff7e8'), [0, -0.1, 0], 0.025, 0.24); blob(sh, mat('#ffffff'), [0, -0.24, 0], [0.045, 0.05, 0.045]);
    sh.rotation.z = s * 0.5; arms[k] = sh;
    cyl(g, mat('#fff7e8'), [s * 0.1, 0.07, 0.0], 0.03, 0.16);
    blob(g, mat('#0a4fb0'), [s * 0.1, 0.02, 0.04], [0.06, 0.035, 0.09]);
  }
  g.userData.arms = arms;
  return g;
}

/** Heart mesh: extruded heart shape, ~size wide, faces +z. */
export function heart(color = '#e8284a', size = 0.4, depth = 0.5) {
  const s = new THREE.Shape(), k = size;
  s.moveTo(0, -0.5 * k); s.bezierCurveTo(-0.9 * k, 0.05 * k, -0.55 * k, 0.6 * k, 0, 0.25 * k);
  s.bezierCurveTo(0.55 * k, 0.6 * k, 0.9 * k, 0.05 * k, 0, -0.5 * k);
  const geo = new THREE.ExtrudeGeometry(s, { depth: depth * k, bevelEnabled: true, bevelSize: 0.06 * k, bevelThickness: 0.08 * k, bevelSegments: 5, curveSegments: 20 });
  geo.translate(0, 0, -depth * k / 2);
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.35 })); m.castShadow = true; return m;
}

export function coin(parent, x, y, z, r = 0.05, rot = [Math.PI / 2, 0, 0]) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(...rot); parent.add(g);
  const gold = mat('#f6c21c', { metalness: 0.6, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(r, r, r * 0.22, 24), gold);
  add(g, new THREE.TorusGeometry(r * 0.78, r * 0.07, 6, 24), mat('#c98a10', { metalness: 0.6, roughness: 0.4 }), [0, r * 0.12, 0], [Math.PI / 2, 0, 0]);
  return g;
}

/** Open instrument case (dark shell, plum velvet) lying on the ground, opening up; ~1.4 long. */
export function buildCase() {
  const g = new THREE.Group(), shell = mat('#20181a', { roughness: 0.5 });
  box(g, shell, [0, 0.07, 0], [1.4, 0.14, 0.56]);
  box(g, mat('#7a1f5a', { roughness: 0.9 }), [0, 0.145, 0], [1.28, 0.02, 0.44]);
  box(g, shell, [0, 0.45, -0.3], [1.4, 0.7, 0.05], [-0.18, 0, 0]);
  box(g, mat('#7a1f5a', { roughness: 0.9 }), [0, 0.45, -0.27], [1.28, 0.6, 0.02], [-0.18, 0, 0]);
  for (const x of [-0.5, 0.5]) box(g, mat('#c9a040', { metalness: 0.6 }), [x, 0.09, 0.285], [0.1, 0.07, 0.02]);
  return g;
}

export function dollarTexture(txt = '$') {
  return canvasTexture(256, (ctx, s) => { ctx.fillStyle = '#3b8f3b'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#f4ffe8'; ctx.font = 'bold 190px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, s / 2, s / 2 + 8); });
}
export function labelTexture(txt, bg = '#ffffff', fg = '#1a1a2a', size = 512, font = 'bold 300px sans-serif') {
  return canvasTexture(size, (ctx, s) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s); ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, s / 2, s / 2 + 15); });
}

/** Money bag with a $ label. */
export function moneyBag(size = 0.3) {
  const g = new THREE.Group(), sack = mat('#c8a46a', { roughness: 0.9 });
  blob(g, sack, [0, size * 0.8, 0], [size, size * 0.9, size]);
  cyl(g, sack, [0, size * 1.75, 0], size * 0.28, size * 0.5, [0, 0, 0], size * 0.4);
  add(g, new THREE.TorusGeometry(size * 0.38, size * 0.07, 8, 24), mat('#7a4a2a'), [0, size * 1.55, 0], [Math.PI / 2, 0, 0]);
  const flare = add(g, new THREE.ConeGeometry(size * 0.55, size * 0.4, 18, 1, true), sack, [0, size * 2.1, 0], [Math.PI, 0, 0]); flare.material.side = THREE.DoubleSide;
  const lab = add(g, new THREE.CircleGeometry(size * 0.55, 28), new THREE.MeshStandardMaterial({ map: dollarTexture(), roughness: 0.6 }), [0, size * 0.85, size * 0.93]);
  return g;
}

/** Rotate a buildPerson/egg arm so its hand reaches toward a world point. */
export function pointArm(person, key, world) {
  person.updateMatrixWorld(true);
  const sh = person.userData.arms[key], t = person.worldToLocal(new THREE.Vector3(...world)).sub(sh.position);
  sh.rotation.set(0, 0, Math.atan2(t.x, -t.y));
}

/** Sailing ship, bow toward +x, ~3 long. */
export function buildShip() {
  const g = new THREE.Group(), wood = mat('#7a4a28'), sail = mat('#fbf4e2', { side: THREE.DoubleSide });
  const hull = new THREE.Shape([[-1.6, 0.5], [1.4, 0.5], [1.9, 0.75], [1.2, 0], [-1.3, 0]].map(([x, y]) => new THREE.Vector2(x, y)));
  const h = new THREE.Mesh(new THREE.ExtrudeGeometry(hull, { depth: 0.8, bevelEnabled: false }), wood); h.position.z = -0.4; h.castShadow = true; g.add(h);
  box(g, mat('#c8402a'), [0, 0.52, 0], [3.0, 0.05, 0.84]);
  for (const [x, hh] of [[-0.6, 2.4], [0.5, 2.0]]) {
    cyl(g, wood, [x, 0.5 + hh / 2, 0], 0.04, hh);
    add(g, new THREE.PlaneGeometry(0.9, hh * 0.7), sail, [x + 0.08, 0.7 + hh * 0.38, 0.05], [0, 0.0, 0]);
    cyl(g, wood, [x, 0.9 + hh * 0.72, 0], 0.025, 1.0, [0, 0, Math.PI / 2]);
  }
  return g;
}

/** Gold CEO crown (with CEO plaque); sits on y=0. */
export function buildCrown(r = 0.2) {
  const g = new THREE.Group(), gold = mat('#f6c21c', { metalness: 0.6, roughness: 0.3 });
  cyl(g, gold, [0, r * 0.3, 0], r, r * 0.6);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(g, new THREE.ConeGeometry(r * 0.2, r * 0.7, 12), gold, [Math.cos(a) * r * 0.85, r * 0.9, Math.sin(a) * r * 0.85]);
    blob(g, mat(['#e8284a', '#2a7fff', '#27c06a'][i % 3], { roughness: 0.2 }), [Math.cos(a) * r * 0.85, r * 1.3, Math.sin(a) * r * 0.85], [r * 0.09, r * 0.09, r * 0.09]); }
  add(g, new THREE.PlaneGeometry(r * 1.1, r * 0.46), new THREE.MeshStandardMaterial({ map: labelTexture('CEO', '#7a1630', '#ffe27a', 512, 'bold 260px sans-serif'), roughness: 0.5 }), [0, r * 0.32, r * 1.005]).scale.set(1, 1, 1);
  return g;
}

export function opalTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f4f0ff'; ctx.fillRect(0, 0, s, s);
    const cols = ['#27d6a0', '#2a7fff', '#ff5fa8', '#ffa030', '#9a5aff', '#41e8ff'];
    for (let i = 0; i < 60; i++) { const x = (i * 97 % 100) / 100 * s, y = (i * 53 % 100) / 100 * s, r = 30 + (i * 31 % 70);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, cols[i % 6] + 'dd'); g.addColorStop(1, cols[i % 6] + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); }
  });
}
export function buildOpal(r = 0.14) {
  const g = new THREE.Group();
  const stone = add(g, new THREE.SphereGeometry(1, 40, 24), new THREE.MeshStandardMaterial({ map: opalTexture(), emissiveMap: opalTexture(), emissive: '#ffffff', emissiveIntensity: 0.45, roughness: 0.25 }), [0, 0, 0], [0, 0, 0], [r, r * 1.2, r * 0.55]);
  const gold = mat('#f6c21c', { metalness: 0.7, roughness: 0.3 });
  add(g, new THREE.TorusGeometry(r * 1.02, r * 0.14, 12, 40), gold, [0, 0, -r * 0.02], [0, 0, 0], [1, 1.2, 1]);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; blob(g, gold, [Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.35, r * 0.05], [r * 0.12, r * 0.12, r * 0.12]); }
  return g;
}
export function sparkle(parent, x, y, z, s = 0.1, color = '#fffbd0') {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const m = new THREE.MeshBasicMaterial({ color });
  for (const r of [0, Math.PI / 2]) { const t = new THREE.Mesh(new THREE.ConeGeometry(s * 0.18, s, 4), m); t.rotation.z = r; g.add(t); const u = new THREE.Mesh(new THREE.ConeGeometry(s * 0.18, s, 4), m); u.rotation.z = r + Math.PI; u.position.y = 0; g.add(u); }
  return g;
}


/** Thin cylinder between two points. */
export function edge(parent, a, b, color = '#888', r = 0.012) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat(color));
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(m); return m;
}
/** Arrow along +x from origin, length len. */
export function arrow(len = 1.4) {
  const g = new THREE.Group();
  cyl(g, mat('#e8d8b0'), [len / 2, 0, 0], 0.012, len, [0, 0, Math.PI / 2]);
  add(g, new THREE.ConeGeometry(0.04, 0.12, 12), mat('#cfd6de', { metalness: 0.7 }), [len + 0.04, 0, 0], [0, 0, -Math.PI / 2]);
  for (const r of [0, 1, 2]) add(g, new THREE.BoxGeometry(0.16, 0.002, 0.07), mat('#e8284a'), [0.1, 0, 0], [r * Math.PI / 3, 0, 0]);
  return g;
}
