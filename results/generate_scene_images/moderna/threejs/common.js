// Shared helpers for the Moderna scenes (stage, primitives, people, text signs).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createModem } from './modem.js';
export { THREE, RoundedBoxGeometry, createModem, canvasTexture };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 28, 18), m, pos, rot, scl);
export const rbox = (p, m, w, h, d, pos, rot, r = 0.02) => add(p, new RoundedBoxGeometry(w, h, d, 3, r), m, pos, rot);
export const num = (P, k, d) => Number(P.get(k) ?? d);

export function textSprite(text, { w = 512, h = 256, bg = '#111820', fg = '#7dff9a', font = 'bold 150px monospace' } = {}) {
  return canvasTexture(w, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, w / 2);
  });
}

export function makeStage(P, { sky = {}, ground = '#6fae45', size = 400, el = 35, az = 150, exp = 1 } = {}) {
  const stage = createAnimeStage({
    fov: num(P, 'fov', 40), sunElevation: num(P, 'el', el), sunAzimuth: num(P, 'az', az), exposure: num(P, 'exp', exp),
    sky: { cover: 2, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 },
  });
  if (ground) add(stage.scene, new THREE.PlaneGeometry(size, size), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  return stage;
}
export const CLOUDS = [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]];

// Finish: toonify characters (modem + extra groups), camera, render.
export function finishScene(stage, P, chars, cam) {
  const pm = new Set(); chars.forEach((c) => c.traverse((o) => pm.add(o)));
  stage.toonify(stage.scene, (m) => pm.has(m));
  stage.addClouds(CLOUDS);
  const [cx, cy, cz, tx, ty, tz] = cam;
  stage.camera.position.set(num(P, 'cx', cx), num(P, 'cy', cy), num(P, 'cz', cz));
  stage.camera.lookAt(num(P, 'tx', tx), num(P, 'ty', ty), num(P, 'tz', tz));
  stage.finish();
}

// A simple human (chibi). opts: coat, hat ('bicorne'|null), skin, hair. Faces +z, feet y=0, ~1.1 tall.
export function createPerson({ coat = '#2a4a8a', trim = '#e8c040', hat = null, skin = '#ffd9b8', hair = '#6a4a2a', scale = 1, beard = false } = {}) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.17, 0.22, 0.55, 20), mat(coat), [0, 0.55, 0]);
  add(g, new THREE.CylinderGeometry(0.225, 0.225, 0.04, 20), mat(trim), [0, 0.3, 0]);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), mat(trim), [s * 0.17, 0.82, 0], [0, 0, 0.5 * s]);
    add(g, new THREE.CylinderGeometry(0.05, 0.06, 0.3, 12), mat('#222833'), [s * 0.08, 0.15, 0]);
    blob(g, mat('#2b2220'), [s * 0.08, 0.02, 0.04], [0.065, 0.04, 0.1]);
  }
  for (let i = 0; i < 3; i++) blob(g, mat(trim), [0, 0.7 - i * 0.12, 0.2 - i * 0.015], [0.022, 0.022, 0.015]);
  const head = new THREE.Group(); head.position.y = 1.0; g.add(head);
  blob(head, mat(skin), [0, 0, 0], [0.21, 0.2, 0.2]);
  blob(head, mat(hair), [0, 0.06, -0.04], [0.22, 0.17, 0.19]);
  if (beard) blob(head, mat('#f3f0ea'), [0, -0.11, 0.1], [0.15, 0.1, 0.1]);
  const z = 0.185;
  for (const s of [-1, 1]) {
    const e = (r, c, dz, dy = 0, rx = 1) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), mat(c, { roughness: 0.3 })); m.scale.x = rx; m.position.set(s * 0.075, 0.015 + dy, z + dz); head.add(m); return m; };
    e(0.05, '#fff', 0.004, 0, 0.85); e(0.038, '#3a2a60', 0.008, -0.004, 0.9); e(0.022, '#120a10', 0.012);
    const c = e(0.014, '#fff', 0.016, 0.018); c.position.x -= 0.012 * s * -1;
    const b = e(0.03, '#ff8f9f', 0.0, -0.075); b.material.transparent = true; b.material.opacity = 0.5; b.position.x = s * 0.12; b.scale.y = 0.5;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 14, Math.PI), mat('#8a3030'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.07, z + 0.01); head.add(mouth);
  if (hat === 'bicorne') {
    const h = new THREE.Group(); h.position.y = 0.17; head.add(h);
    add(h, new THREE.CylinderGeometry(0.2, 0.2, 0.1, 24), mat('#15192a'), [0, 0, 0], [0, 0, 0], [1.55, 1, 0.8]);
    add(h, new THREE.CylinderGeometry(0.18, 0.2, 0.012, 24), mat(trim), [0, -0.04, 0], [0, 0, 0], [1.55, 1, 0.8]);
    blob(h, mat('#d8352f'), [0.28, 0.0, 0.12], [0.03, 0.03, 0.03]);
  }
  // arms
  const arms = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.8, 0);
    const up = add(sh, new THREE.CylinderGeometry(0.045, 0.045, 0.3, 12), mat(coat), [0, -0.15, 0]);
    const hand = blob(sh, mat(skin), [0, -0.32, 0], [0.05, 0.05, 0.05]);
    g.add(sh); sh.rotation.z = s * 0.25; arms[k] = { sh, hand };
  }
  g.userData.arms = arms; g.userData.head = head;
  g.scale.setScalar(scale); return g;
}

// Hand a person's arm toward a world point (simple aim, single segment).
export function aimArm(person, key, worldTarget) {
  const { sh } = person.userData.arms[key];
  person.updateMatrixWorld(true);
  const p = person.worldToLocal(worldTarget.clone()).sub(sh.position);
  const dir = p.normalize();
  sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
}

// An mRNA strand: tube along a sine wave with pink-orange gradient-ish colour.
export function strand({ len = 0.3, amp = 0.05, turns = 2.5, color = '#ff5fa2', r = 0.012 } = {}) {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3((t - 0.5) * len, Math.sin(t * turns * 2 * Math.PI) * amp, Math.cos(t * turns * 2 * Math.PI) * amp * 0.6)); }
  const g = new THREE.Group();
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, r, 8), mat(color, { roughness: 0.4 }));
  return g;
}

// Lipid nanoparticle: glass bubble, ring of yellow lipid heads, mRNA strand inside.
export function lipidBubble(R = 0.2, color = '#ff5fa2') {
  const g = new THREE.Group();
  const N = 46;
  for (let i = 0; i < N; i++) { // fibonacci sphere of lipid heads = bilayer
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
    const p = [Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R];
    blob(g, mat('#ffd24a', { roughness: 0.4 }), p, [R * 0.15, R * 0.15, R * 0.15]);
    blob(g, mat('#fff3c0', { roughness: 0.4 }), p.map((v) => v * 0.82), [R * 0.06, R * 0.06, R * 0.06]);
  }
  const s = strand({ len: R * 1.3, amp: R * 0.3, turns: 2, color, r: R * 0.1 }); g.add(s);
  return g;
}
