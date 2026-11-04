// Shared helpers for the CRISPR scenes: stage, primitives, canvas text, person, DNA, snake, scissors, flag.
import * as THREE from 'three';
import { guard } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createCrisp } from './crisp.js';
export { THREE };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
export const cyl = (p, m, pos, r, h, rot, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, h, 28), m, pos, rot);

/** Canvas-text material map: short bold text on a coloured panel. */
export function textTexture(text, { bg = '#111', fg = '#fff', w = 512, h = 256, font = 'bold', pad = 0.84 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  let size = h * 0.7; x.font = `${font} ${size}px Arial Black, Helvetica, Arial, sans-serif`;
  const m = x.measureText(text).width; if (m > w * pad) { size *= (w * pad) / m; x.font = `${font} ${size}px Arial Black, Helvetica, Arial, sans-serif`; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function textPlane(text, w, h, opts = {}) {
  const px = 512; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: textTexture(text, { w: px, h: Math.round(px * h / w), ...opts }), roughness: 0.6, side: THREE.DoubleSide }));
  m.castShadow = true; return m;
}

export function flag(color, { h = 1.4, w = 0.55, cross = false } = {}) {
  const g = new THREE.Group();
  cyl(g, '#d8d2c4', [0, h / 2, 0], 0.018, h);
  blob(g, mat('#f2c230'), [0, h + 0.01, 0], [0.04, 0.04, 0.04]);
  const cloth = add(g, new THREE.PlaneGeometry(w, w * 0.65), mat(color, { side: THREE.DoubleSide }), [w / 2 + 0.02, h - w * 0.35, 0]);
  if (cross) {
    add(g, new THREE.PlaneGeometry(w * 0.5, w * 0.14), mat('#fff', { side: THREE.DoubleSide }), [w / 2 + 0.02, h - w * 0.35, 0.002]);
    add(g, new THREE.PlaneGeometry(w * 0.14, w * 0.5), mat('#fff', { side: THREE.DoubleSide }), [w / 2 + 0.02, h - w * 0.35, 0.003]);
  }
  return g;
}

/** Chibi person facing +z, ~1.6 tall. parts: head, armL, armR (shoulder pivots; l = +x), legL, legR. */
export function person({ skin = '#f5cfa8', shirt = '#3a7bd5', pants = '#35405a', hair = '#4a2c1a', s = 1 } = {}) {
  const g = new THREE.Group(), parts = {};
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.1, 0.55, 0); g.add(leg);
    cyl(leg, pants, [0, -0.25, 0], 0.075, 0.5); blob(leg, mat('#3b2a22'), [0, -0.52, 0.04], [0.09, 0.06, 0.14]); parts['leg' + k] = leg;
    const arm = new THREE.Group(); arm.position.set(sx * 0.27, 1.05, 0); g.add(arm);
    cyl(arm, shirt, [0, -0.2, 0], 0.06, 0.4); blob(arm, mat(skin), [0, -0.43, 0], [0.07, 0.07, 0.07]); arm.rotation.z = sx * 0.15; parts['arm' + k] = arm;
  }
  cyl(g, shirt, [0, 0.82, 0], 0.22, 0.6, [0, 0, 0], 0.19);
  const head = new THREE.Group(); head.position.y = 1.32; g.add(head); parts.head = head;
  blob(head, mat(skin), [0, 0, 0], [0.27, 0.26, 0.25]);
  blob(head, mat(hair), [0, 0.07, -0.03], [0.285, 0.25, 0.27]);
  for (const sx of [-1, 1]) {
    blob(head, mat('#fff'), [sx * 0.095, -0.01, 0.225], [0.06, 0.075, 0.03]);
    blob(head, mat('#2a1a10'), [sx * 0.095, -0.015, 0.245], [0.04, 0.058, 0.02]);
    blob(head, mat('#fff'), [sx * 0.085, 0.01, 0.262], [0.014, 0.014, 0.01]);
  }
  g.scale.setScalar(s); g.userData.parts = parts; return g;
}

/** Double helix along y: height h, radius r. */
export function helix({ h = 2, r = 0.25, turns = 2, a = '#2f7fe0', b = '#ff5aa5', n = 40 } = {}) {
  const g = new THREE.Group(), rungs = ['#ffd24a', '#5be37a', '#ffffff', '#ff9a3c'];
  for (let i = 0; i <= n; i++) {
    const t = i / n, ang = t * turns * Math.PI * 2, y = (t - 0.5) * h;
    const p1 = [Math.cos(ang) * r, y, Math.sin(ang) * r], p2 = [-p1[0], y, -p1[2]];
    blob(g, mat(a), p1, [0.055, 0.055, 0.055]); blob(g, mat(b), p2, [0.055, 0.055, 0.055]);
    if (i % 2 === 0) { const rung = cyl(g, mat(rungs[(i / 2) % 4]), [0, y, 0], 0.022, 2 * r, [0, 0, 0]); rung.rotation.set(0, -ang, Math.PI / 2); }
  }
  return g;
}

/** Cartoon snake along points; head at the last point facing along the tail->head direction. */
export function snake(points, { r = 0.07, body = '#4fae3a', belly = '#e8d36a' } = {}) {
  const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  add(g, new THREE.TubeGeometry(curve, 160, r, 14, false), mat(body));
  for (let i = 1; i < 18; i++) { const p = curve.getPoint(i / 18); blob(g, mat('#2f7a2a'), [p.x, p.y, p.z], [r * 1.05, r * 1.05, r * 1.05]); }
  const end = curve.getPoint(1), dir = curve.getTangent(1), head = new THREE.Group(); head.position.copy(end);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); g.add(head);
  blob(head, mat(body), [0, 0, r * 1.2], [r * 1.5, r * 1.25, r * 2.2]);
  for (const sx of [-1, 1]) {
    blob(head, mat('#fff'), [sx * r * 0.95, r * 0.6, r * 2], [r * 0.6, r * 0.7, r * 0.5]);
    blob(head, mat('#111'), [sx * r * 1.05, r * 0.6, r * 2.3], [r * 0.3, r * 0.45, r * 0.25]);
  }
  cyl(head, mat('#e0283a'), [0, -r * 0.1, r * 4], r * 0.12, r * 3, [Math.PI / 2, 0, 0]);
  return g;
}

export function scissors({ open = 0.45, len = 1, color = '#c9d3dd' } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.rotation.z = s * open / 2; g.add(arm);
    box(arm, mat(color, { metalness: 0.6, roughness: 0.3 }), [0, len / 2, 0], [0.07, len, 0.035]);
    add(arm, new THREE.TorusGeometry(0.17, 0.035, 10, 24), mat('#d8312f'), [0, -0.18, 0], [0, 0, 0], [0.8, 1, 1]);
    arm.position.z = s * 0.018;
  }
  cyl(g, mat('#444'), [0, 0, 0], 0.04, 0.12, [Math.PI / 2, 0, 0]);
  return g;
}

/** Page wrapper: stage + ground + crisp placement + finish. */
export function startScene(build, { ground = '#6fae45', fov = 40, el = 35, az = 150, cover = 2, shadow = 6, sky = {} } = {}) {
  guard(() => {
    const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
    const stage = createAnimeStage({
      fov: num('fov', fov), sunElevation: el, sunAzimuth: az, exposure: 1, shadowSize: shadow,
      sky: { cover, seed: 5, towerTop: 0.5, puffCover: 2, ...sky },
      rim: { color: '#fff3dc', strength: 1.4, width: 0.55 }, sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
      ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 }, flare: 0.7, fog: { near: 120, far: 1500 },
    });
    const scene = stage.scene, chars = new Set();
    if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
    const crisp = ({ x = 0, y = 0, z = 0, s = 1.5, ry = 0, pose = {}, lie = false } = {}) => {
      const c = createCrisp({ scale: s }); c.position.set(x, y, z); c.rotation.y = ry; c.userData.pose({ arms: { l: [0, 0.5, 0], r: [0, 0.5, 0] }, legs: { l: [0.1, 0], r: [-0.1, 0] }, ...pose });
      scene.add(c); c.updateMatrixWorld(true); c.traverse((o) => chars.add(o)); return c;
    };
    /** Aim a crisp hand at a world point. */
    const reach = (c, key, wp) => { c.updateMatrixWorld(true); const t = c.worldToLocal(new THREE.Vector3(...wp)); c.userData.reach(key, [t.x, t.y, t.z]); };
    const finish = (cam, look) => {
      stage.toonify(scene, (m) => chars.has(m));
      stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
      stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
    };
    build({ scene, stage, crisp, reach, finish, num, THREE });
  });
}
