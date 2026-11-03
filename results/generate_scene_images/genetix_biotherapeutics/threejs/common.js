// Shared scene helpers for the Genetix deck: stage, ground, materials, small prop builders.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { guard, rng } from './kit.js';
import { createAnimeStage } from './kit_anime.js';
import { createTicket } from './ticket.js';
export { THREE, guard, rng, createTicket };

export const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...e });
export const add = (parent, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scl);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
export const blob = (p, m, pos, scl, rot) => add(p, new THREE.SphereGeometry(1, 32, 20), m, pos, rot, scl);
export const cyl = (p, r1, r2, h, m, pos, rot) => add(p, new THREE.CylinderGeometry(r1, r2, h, 28), m, pos, rot);
export const rbox = (p, w, h, d, m, pos, rot, r = 0.02) => add(p, new RoundedBoxGeometry(w, h, d, 3, r), m, pos, rot);

export function labelMesh(text, w, h, { bg = '#ffffff', fg = '#222', font = 'bold 150px sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
}

export function setup({ ground = '#6fae45', sky = {}, stageOpts = {}, clouds = true } = {}) {
  const P = new URLSearchParams(location.search), num = (k, d) => Number(P.get(k) ?? d);
  const stage = createAnimeStage({
    fov: num('fov', 40), sunElevation: num('el', 35), sunAzimuth: num('az', 150), exposure: 1,
    sky: { cover: 2, seed: num('seed', 5), towerTop: 0.5, puffCover: 2, ...sky },
    rim: { color: '#fff3dc', strength: 1.4, width: 0.55 },
    sunIntensity: 2.6, ambient: { color: '#e8e2ff', intensity: 2.3 }, triBumpScale: 0.3,
    ink: { width: 1.2, strength: 0.85, normalThresh: 0.45, normalStrength: 0.45, fadeFar: 60 },
    flare: 0.7, fog: { near: 120, far: 1500 }, ...stageOpts,
  });
  const scene = stage.scene, chars = [];
  if (ground) add(scene, new THREE.PlaneGeometry(400, 400), mat(ground), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const api = {
    THREE, stage, scene, P, num,
    char: (o) => { chars.push(o); scene.add(o); return o; },
    ticket(x, z, ry, scale, pose = {}) {
      const t = createTicket({ scale }); t.position.set(x, 0, z); t.rotation.y = ry; api.char(t); t.userData.pose(pose); return t;
    },
    finish(cam, look) {
      scene.updateMatrixWorld(true);
      const set = new Set(); chars.forEach((c) => c.traverse((o) => set.add(o)));
      stage.toonify(scene, (m) => set.has(m));
      if (clouds) stage.addClouds([[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]]);
      stage.camera.position.set(...cam); stage.camera.lookAt(...look); stage.finish();
    },
  };
  return api;
}

export function reachTo(ticket, key, world) {
  ticket.updateMatrixWorld(true);
  const l = ticket.worldToLocal(new THREE.Vector3(...world)); ticket.userData.reach(key, [l.x, l.y, l.z]);
}

export function coin(parent, r, pos, rot = [Math.PI / 2, 0, 0], color = '#ffc928') {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
  const m = mat(color, { metalness: 0.5, roughness: 0.35 });
  cyl(g, r, r, r * 0.16, m); cyl(g, r * 0.78, r * 0.78, r * 0.2, mat('#ffe27a', { metalness: 0.4, roughness: 0.4 })); return g;
}

// Chibi anime person, ~1 unit tall, faces +z. parts: armL/armR (pivot groups, rotate x/z), head, legs.
export function person({ skin = '#ffdcb8', shirt = '#e85d5d', pants = '#445', hair = '#4a2c1a', shoes = '#3a2a22' } = {}) {
  const g = new THREE.Group(), s = mat(skin, { roughness: 0.55 });
  const disc = (rx, ry, c, x, y, z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(x, y, z); g.add(m); };
  const legs = [-1, 1].map((k) => { const l = new THREE.Group(); l.position.set(k * 0.07, 0.3, 0); g.add(l);
    cyl(l, 0.05, 0.05, 0.3, mat(pants), [0, -0.15, 0]); blob(l, mat(shoes), [0, -0.3, 0.03], [0.065, 0.04, 0.09]); return l; });
  cyl(g, 0.16, 0.2, 0.4, mat(shirt), [0, 0.5, 0]);
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(k * 0.2, 0.66, 0); g.add(a);
    cyl(a, 0.042, 0.04, 0.3, mat(shirt), [0, -0.15, 0]); blob(a, s, [0, -0.32, 0], [0.05, 0.05, 0.05]); a.rotation.z = k * 0.2; return a; });
  const head = new THREE.Group(); head.position.set(0, 0.92, 0); g.add(head);
  blob(head, s, [0, 0, 0], [0.22, 0.21, 0.2]);
  blob(head, mat(hair), [0, 0.04, -0.03], [0.235, 0.21, 0.21]);
  blob(head, mat(hair), [0, 0.11, 0.1], [0.2, 0.1, 0.12]);
  g.add(head);
  for (const k of [-1, 1]) {
    const hz = 0.2, ex = k * 0.08, ey = -0.01;
    for (const [rx, ry, c, dx, dy, dz] of [[0.052, 0.062, '#fff', 0, 0, 0], [0.038, 0.052, '#3a2416', 0, -0.004, 0.002], [0.02, 0.03, '#0b0504', 0, 0, 0.004], [0.013, 0.013, '#fff', -0.014, 0.018, 0.006]]) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
      m.scale.set(rx, ry, 1); m.position.set(ex + dx, ey + dy, hz - 0.012 + dz); head.add(m);
    }
    const b = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#ff8a9a', transparent: true, opacity: 0.5 }));
    b.scale.set(0.03, 0.018, 1); b.position.set(k * 0.13, -0.07, 0.15); head.add(b);
  }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 16, Math.PI), mat('#7a2a2a')); mo.rotation.z = Math.PI; mo.position.set(0, -0.08, 0.2); head.add(mo);
  g.userData = { armL: arms[1], armR: arms[0], head, legs };
  return g;
}
