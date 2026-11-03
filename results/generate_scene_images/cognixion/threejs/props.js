// Shared scene scaffolding + props for the Cognixion scenes.
// start(build, { ground, sky, fov, cam:[x,y,z], look:[x,y,z], clouds }) builds a stage; build({scene, num, THREE, stage}) returns the character Object3Ds to toonify.
// URL params override: cx cy cz tx ty tz fov el az exp.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { guard, canvasTexture } from './kit.js';
import { createAnimeStage } from './kit_anime.js';

export { THREE, canvasTexture };
export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (parent, m, pos, scl, rot) => add(parent, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const rbox = (parent, m, size, pos, rot, r = 0.03) => add(parent, new RoundedBoxGeometry(size[0], size[1], size[2], 4, r), m, pos, rot);
export const cyl = (parent, m, rt, rb, h, pos, rot, seg = 32) => add(parent, new THREE.CylinderGeometry(rt, rb, h, seg), m, pos, rot);

/** Text on a plane (cue text only). */
export function textPlane(parent, str, { w = 1, h = 0.3, fg = '#ffffff', bg = '#2a4d9b', pos = [0, 0, 0], rot = [0, 0, 0] } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    ctx.translate(s / 2, s / 2); ctx.scale(h / w, 1); // square canvas is stretched to w x h: pre-compensate glyph aspect
    ctx.font = 'bold 100px sans-serif'; const fit = (0.9 * s * w / h) / ctx.measureText(str).width * 100;
    ctx.font = `bold ${Math.min(s * 0.7, fit)}px sans-serif`;
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 0);
  });
  return add(parent, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), pos, rot);
}

/** Wraparound VR/AR visor sized for the cog's face (centered at origin, faces +z). */
export function visor({ body = '#e9ecf2', glass = '#1c2a4a', strap = '#3b3f4a', w = 0.5 } = {}) {
  const g = new THREE.Group();
  rbox(g, mat(body, { metalness: 0.3, roughness: 0.3 }), [w, 0.2, 0.11], [0, 0, 0], [0, 0, 0], 0.05);
  rbox(g, mat(glass, { metalness: 0.7, roughness: 0.15 }), [w - 0.05, 0.15, 0.02], [0, 0, 0.055], [0, 0, 0], 0.03);
  add(g, new THREE.PlaneGeometry(w - 0.1, 0.05), new THREE.MeshBasicMaterial({ color: '#8fd2ff', transparent: true, opacity: 0.35 }), [0, 0.03, 0.067]);
  for (const s of [-1, 1]) rbox(g, mat(strap), [0.025, 0.07, 0.34], [s * (w / 2 + 0.005), 0, -0.17], [0, 0, 0], 0.01);
  return g;
}

/** Garden gnome ~0.5 tall, faces +z; userData.arm.l/r groups swing from the shoulder. */
export function gnome({ scale = 1 } = {}) {
  const g = new THREE.Group(), skin = mat('#f2c6a0'), blue = mat('#2f6bd1'), white = mat('#fbfaf5'), red = mat('#d22b2b');
  for (const s of [-1, 1]) { cyl(g, mat('#5a3a22'), 0.03, 0.035, 0.1, [s * 0.05, 0.05, 0]); blob(g, mat('#3b2a1c'), [s * 0.05, 0.02, 0.025], [0.04, 0.03, 0.06]); }
  blob(g, blue, [0, 0.2, 0], [0.12, 0.14, 0.1]);
  add(g, new THREE.TorusGeometry(0.115, 0.012, 8, 28), mat('#3a2a1a'), [0, 0.18, 0], [Math.PI / 2, 0, 0]);
  blob(g, skin, [0, 0.38, 0.01], [0.085, 0.08, 0.08]);
  blob(g, skin, [0, 0.375, 0.085], [0.02, 0.02, 0.02]);
  blob(g, white, [0, 0.31, 0.055], [0.1, 0.13, 0.05]);
  for (const s of [-1, 1]) {
    blob(g, mat('#120a08'), [s * 0.03, 0.4, 0.083], [0.012, 0.016, 0.008]);
    blob(g, mat('#fff'), [s * 0.027, 0.405, 0.09], [0.004, 0.004, 0.003]);
  }
  add(g, new THREE.ConeGeometry(0.1, 0.3, 28), red, [0, 0.55, 0], [-0.1, 0, 0.1]);
  add(g, new THREE.TorusGeometry(0.086, 0.015, 8, 28), white, [0, 0.43, 0], [Math.PI / 2 - 0.1, 0, 0]);
  g.userData.arm = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const a = new THREE.Group(); a.position.set(s * 0.115, 0.26, 0); g.add(a); g.userData.arm[k] = a;
    cyl(a, blue, 0.025, 0.022, 0.16, [0, -0.08, 0]); blob(a, skin, [0, -0.17, 0], [0.032, 0.032, 0.032]);
    a.rotation.z = s * 0.35;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(scale); return g;
}

/** 5-point star prism (badge/medal). */
export function star(color, r = 0.08, depth = 0.02) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; s[i ? 'lineTo' : 'moveTo'](rr * Math.cos(a), rr * Math.sin(a)); }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), mat(color, { metalness: 0.5, roughness: 0.3 }));
  m.castShadow = true; return m;
}

export function start(build, { ground = '#e8c98a', sky = {}, fov = 40, cam = [0, 0.8, 3], look = [0, 0.6, 0], clouds = true, el = 35, az = 150, shadowSize = 3, extraGround = true } = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', fov), sunElevation: num('el', el), sunAzimuth: num('az', az), exposure: num('exp', 1), shadowSize,
      sky: { cover: 1.5, seed: 5, towerTop: 0.5, puffCover: 1.5, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
      sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
      flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene;
    if (extraGround) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground, { roughness: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const chars = build({ scene, num, THREE, stage }) ?? [];
    const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
    stage.toonify(scene, (m) => set.has(m));
    if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
    stage.camera.position.set(num('cx', cam[0]), num('cy', cam[1]), num('cz', cam[2]));
    stage.camera.lookAt(num('tx', look[0]), num('ty', look[1]), num('tz', look[2]));
    stage.finish();
  });
}
