// The Life Biosciences anchor: one cartoon LIFEBOAT with a face on its +z flank, reused in every scene.
// Bow points +x, waterline at y = 0, ~1.5 units long.
// createLifeboat({ scale = 1, flag = null, hull = '#ff7a1a' }) -> Group   (flag: short text on the mast pennant, e.g. 'ER-100')
// userData.parts = { hull, face, arms:{l,r}, hands:{l,r}, mast }   (l = bow side, r = stern side)
// userData.aim('l'|'r', [x,y,z])  stretchy arm: points the mitten at a boat-local point.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const FLANK = 0.25, ARM_LEN = 0.3;
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function outline() {
  const s = new THREE.Shape();
  s.moveTo(-0.65, 0.45); s.lineTo(-0.65, 0.05); s.quadraticCurveTo(-0.62, -0.15, -0.4, -0.15);
  s.lineTo(0.35, -0.15); s.quadraticCurveTo(0.7, -0.1, 0.85, 0.45); s.quadraticCurveTo(0.1, 0.36, -0.65, 0.45);
  return s;
}

function extrude(shape, depth, color, bevel = 0.025) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3 });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, mat(color));
}

function keelBand() {
  const lower = new THREE.Shape(outline().getPoints(24).map((p) => new THREE.Vector2(p.x, Math.min(p.y, 0.0))));
  return extrude(lower, 0.5, '#c8322e', 0.03);
}

function face(group) {
  const z = FLANK + 0.03, step = 0.0015;
  for (const sx of [-1, 1]) {
    const x = 0.05 + sx * 0.14, y = 0.24;
    disc(0.062, 0.078, '#ffffff', z, group, x, y);
    disc(0.05, 0.07, '#1d5fa8', z + step, group, x, y - 0.003);
    disc(0.045, 0.035, '#52b8e8', z + 2 * step, group, x, y - 0.03);
    disc(0.026, 0.04, '#0a1830', z + 3 * step, group, x, y);
    disc(0.017, 0.017, '#ffffff', z + 4 * step, group, x - 0.02, y + 0.03);
    disc(0.008, 0.008, '#ffffff', z + 4 * step, group, x - 0.018, y - 0.032);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#1a0f0a'));
    lid.scale.set(0.066, 0.083, 1); lid.position.set(x, y, z + 5 * step); group.add(lid);
    const b = disc(0.034, 0.018, '#ff6f86', z, group, 0.05 + sx * 0.26, 0.13); b.material.transparent = true; b.material.opacity = 0.6;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#7a2020'));
  mouth.rotation.z = Math.PI; mouth.position.set(0.05, 0.125, z + step); group.add(mouth);
}

function lifebuoy() {
  const g = new THREE.Group(), N = 8;
  for (let i = 0; i < N; i++) {
    const seg = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.034, 10, 8, (Math.PI * 2) / N), mat(i % 2 ? '#ffffff' : '#e23b30'));
    seg.rotation.z = (i * Math.PI * 2) / N; g.add(seg);
  }
  return g;
}

function flagTexture(text) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#b01e1e'; ctx.font = 'bold 62px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2);
  });
}

function mast(flag) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.8, 10), mat('#f2f2f2')); pole.position.y = 0.4; g.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat('#ffe55c', { emissive: '#ffcc33', emissiveIntensity: 0.6 })); lamp.position.y = 0.82; g.add(lamp);
  if (flag) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: flagTexture(flag), side: THREE.DoubleSide, roughness: 0.8 }));
    p.position.set(0.0, 0.63, 0); p.rotation.y = Math.PI / 2; p.position.z = -0.25; p.rotation.y = 0; g.add(p);
    p.position.set(-0.25, 0.63, 0);
  }
  return g;
}

function arm(side) {
  const root = new THREE.Group(), skin = '#fff0dc';
  root.position.set(side * 0.5 + 0.1, 0.34, FLANK + 0.02);
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 12), mat(skin)); limb.geometry.translate(0, -0.5, 0);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), mat(skin)); hand.scale.set(0.95, 1.1, 0.85);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), mat(skin));
  root.add(limb, hand, shoulder);
  return { root, limb, hand };
}

export function createLifeboat({ scale = 1, flag = null, hull = '#ff7a1a' } = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const hullMesh = extrude(outline(), 0.5, hull); body.add(hullMesh);
  const rail = extrude(new THREE.Shape(outline().getPoints(24).map((p) => new THREE.Vector2(p.x, Math.max(p.y, 0.38)))), 0.54, '#ffffff', 0.02); body.add(rail);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.46), mat('#d9a65b')); deck.position.set(0.1, 0.43, 0); body.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.34), mat('#f4f1ea')); cabin.position.set(-0.3, 0.55, 0); body.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.4), mat('#e23b30')); roof.position.set(-0.3, 0.68, 0); body.add(roof);
  for (const z of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), mat('#7fd0ff', { emissive: '#3b9ad8', emissiveIntensity: 0.3 })); w.position.set(-0.3, 0.56, z * 0.171); w.rotation.y = z > 0 ? 0 : Math.PI; body.add(w); }
  const m = mast(flag); m.position.set(0.35, 0.44, 0); body.add(m);
  const buoy = lifebuoy(); buoy.position.set(-0.5, 0.48, FLANK + 0.07); buoy.scale.setScalar(0.85); body.add(buoy);
  const faceG = new THREE.Group(); body.add(faceG); face(faceG); faceG.scale.set(1.35, 1.35, 1); faceG.position.set(-0.0175, -0.07, 0);

  const arms = {}, hands = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) { const a = arm(s); body.add(a.root); arms[k] = a; hands[k] = a.hand; }
  const aim = (key, target) => {
    const a = arms[key], d = new THREE.Vector3(...target).sub(a.root.position), len = Math.max(d.length(), 0.08);
    a.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
    a.limb.scale.y = len; a.hand.position.y = -len;
  };
  aim('l', [0.75, 0.2, 0.55]); aim('r', [-0.75, 0.2, 0.55]);

  body.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData = { parts: { hull: hullMesh, face: faceG, arms, hands, mast: m }, aim, ARM_LEN };
  return root;
}
