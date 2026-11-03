// Shared props for Flourish scenes: brain, windmill, bulb, coin, gold bar, flag.
import { THREE, mat, add, blob, box, cyl, rng, canvasTexture } from './base.js';
import { fbm } from './kit.js';

/** Pink wrinkled brain, ~1 unit wide, centred at origin. */
export function buildBrain({ color = '#f48fb1', fold = '#d96a93' } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const geo = new THREE.SphereGeometry(1, 96, 64), p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = fbm(v.x * 3 + s * 5, v.y * 3, v.z * 3, 3), ridge = 1 - Math.abs(Math.sin((v.x * 9 + v.y * 8 + n * 11) * 1.7));
      v.multiplyScalar(1 + 0.13 * ridge); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const h = new THREE.Mesh(geo, mat(color, { roughness: 0.55 })); h.scale.set(0.27, 0.34, 0.42); h.position.x = s * 0.24;
    h.castShadow = h.receiveShadow = true; g.add(h);
  }
  blob(g, mat(fold), [0, 0.03, 0], [0.04, 0.3, 0.4]);
  blob(g, mat('#e58aa8'), [0, -0.32, -0.2], [0.13, 0.1, 0.13]);
  return g;
}

/** Brick-and-wood windmill (the FLOUR mill), ~3 units tall, sails face +z. */
export function buildMill() {
  const g = new THREE.Group(), wall = mat('#f2e3c6'), wood = mat('#8a5a35'), roof = mat('#b4472f');
  cyl(g, wall, [0, 1.0, 0], 0.95, 2.0, [0, 0, 0], 0.65);
  cyl(g, mat('#c9b48e'), [0, 0.1, 0], 1.05, 0.2);
  add(g, new THREE.ConeGeometry(0.85, 0.8, 28), roof, [0, 2.35, 0]);
  box(g, wood, [0, 0.55, 0.9], [0.42, 0.8, 0.12]);
  box(g, mat('#7fc4f0', { emissive: '#7fc4f0', emissiveIntensity: 0.3 }), [0, 1.4, 0.72], [0.25, 0.3, 0.06]);
  const hub = new THREE.Group(); hub.position.set(0, 2.0, 0.7); hub.rotation.z = 0.3; g.add(hub);
  blob(hub, wood, [0, 0, 0.05], [0.1, 0.1, 0.12]);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; hub.add(arm);
    box(arm, wood, [0, 0.9, 0.1], [0.07, 1.8, 0.05]);
    box(arm, mat('#f4efe3'), [0.2, 1.1, 0.14], [0.36, 1.2, 0.02]);
  }
  return g;
}

/** Lightbulb on a stem, glass globe radius r. glow in 0..1. */
export function buildBulb({ r = 0.5, glow = 0.35 } = {}) {
  const g = new THREE.Group();
  blob(g, new THREE.MeshStandardMaterial({ color: '#fff4c2', emissive: '#ffd166', emissiveIntensity: glow, transparent: true, opacity: 0.4, roughness: 0.15 }), [0, 0, 0], [r, r, r]);
  cyl(g, mat('#b9bec6', { metalness: 0.7, roughness: 0.35 }), [0, -r * 1.12, 0], r * 0.42, r * 0.5);
  for (const y of [-1.0, -1.18]) add(g, new THREE.TorusGeometry(r * 0.42, r * 0.04, 8, 28), mat('#8f959e', { metalness: 0.7 }), [0, y * r * 1.1, 0], [Math.PI / 2, 0, 0]);
  cyl(g, mat('#333'), [0, -r * 1.42, 0], r * 0.16, r * 0.1);
  return g;
}

export const coin = (r = 0.08) => { const g = new THREE.CylinderGeometry(r, r, r * 0.22, 24); return g; };
export const COIN_MAT = () => mat('#ffc933', { metalness: 0.8, roughness: 0.3 });

/** Gold bar (trapezoid-ish box). */
export function goldBar(w = 0.3) {
  const g = new THREE.Group(), m = mat('#ffcf3a', { metalness: 0.85, roughness: 0.25 });
  box(g, m, [0, 0, 0], [w, w * 0.3, w * 0.5]); box(g, mat('#ffe27a', { metalness: 0.85, roughness: 0.2 }), [0, w * 0.17, 0], [w * 0.8, w * 0.06, w * 0.35]);
  return g;
}

/** Small flag on a pole, height h, standing at origin. */
export function flag(color, h = 0.5) {
  const g = new THREE.Group();
  cyl(g, mat('#e8e0d0'), [0, h / 2, 0], 0.012, h);
  box(g, mat(color), [0.1, h - 0.07, 0], [0.2, 0.13, 0.01]);
  blob(g, mat('#ffd54a', { metalness: 0.5 }), [0, h + 0.01, 0], [0.025, 0.025, 0.025]);
  return g;
}
