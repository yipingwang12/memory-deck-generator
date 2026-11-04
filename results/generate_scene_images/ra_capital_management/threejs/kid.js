// Chibi people for the SCARAB's crew and hero. createKid({ role, scale }) -> Group, faces +z, feet on y = 0, ~0.8 tall.
// roles: investor | physician | biologist | engineer | hero.  userData.arms = { l, r } pivots (rotation.x/z to pose).
import * as THREE from 'three';
import { canvasTexture } from './kit.js';
import { animeEye } from './scarab.js';
import { mat, add, blob, box } from './common.js';

const ROLES = {
  investor: { coat: '#23325c', hair: '#4a3626', iris: '#4a7a3a', skin: '#ffd9b8' },
  physician: { coat: '#f4f6fa', hair: '#2a1d18', iris: '#3a5fc0', skin: '#f2c8a0' },
  biologist: { coat: '#3fae6a', hair: '#b5482f', iris: '#7a3fc0', skin: '#ffd9b8' },
  engineer: { coat: '#f08a1e', hair: '#222233', iris: '#8a5a2a', skin: '#e0a878' },
  hero: { coat: '#2b5fd0', hair: '#2a1d18', iris: '#2a6bd1', skin: '#ffd9b8' },
};

function emblemTexture() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a2650'; ctx.strokeStyle = '#1a2650'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(s / 2, s * 0.58, s * 0.2, s * 0.26, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(s / 2, s * 0.26, s * 0.11, 0, 7); ctx.fill();
    for (const y of [0.45, 0.58, 0.72]) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s / 2 + sx * s * 0.18, s * y); ctx.lineTo(s / 2 + sx * s * 0.36, s * (y + 0.07)); ctx.stroke(); }
    ctx.strokeStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(s / 2, s * 0.34); ctx.lineTo(s / 2, s * 0.84); ctx.stroke();
  });
}

export function createKid({ role = 'investor', scale = 1 } = {}) {
  const C = ROLES[role], root = new THREE.Group(), skin = mat(C.skin), coat = mat(C.coat);
  for (const sx of [-1, 1]) {
    add(root, new THREE.CylinderGeometry(0.04, 0.036, 0.26, 12), mat(role === 'hero' ? '#c8283a' : '#33384a'), [sx * 0.05, 0.17, 0]);
    blob(root, mat('#5a3a28'), [sx * 0.05, 0.03, 0.025], [0.045, 0.032, 0.065]);
  }
  blob(root, coat, [0, 0.42, 0], [0.115, 0.17, 0.09]);
  const head = new THREE.Group(); head.position.set(0, 0.68, 0); root.add(head);
  blob(head, skin, [0, 0, 0], [0.14, 0.14, 0.14]);
  const hair = mat(C.hair);
  add(head, new THREE.SphereGeometry(0.15, 32, 20, 0, Math.PI * 2, 0, 1.45), hair, [0, 0.005, -0.005], [-0.25, 0, 0]);
  blob(head, hair, [0, 0.0, -0.05], [0.145, 0.14, 0.12]);
  for (const sx of [-1, 1]) {
    const x = sx * 0.058, y = -0.005, z = Math.sqrt(0.14 ** 2 - x * x - y * y) + 0.006;
    animeEye(head, sx, [x, y, z], sx * Math.asin(x / 0.14), 0.85, C.iris);
    const b = add(head, new THREE.CircleGeometry(1, 20), mat('#ff7f8f', { transparent: true, opacity: 0.5 }), [sx * 0.095, -0.06, 0.092], [0, sx * 1.0, 0], [0.022, 0.012, 1]);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, -0.075, 0.118); head.add(mouth);

  const arms = {};
  for (const [k, sx] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.13, 0.54, 0); root.add(sh);
    add(sh, new THREE.CylinderGeometry(0.03, 0.026, 0.22, 10), coat, [0, -0.11, 0]);
    blob(sh, skin, [0, -0.235, 0], [0.034, 0.034, 0.034]); sh.rotation.z = sx * 0.15; arms[k] = sh;
  }
  const hat = (color, r, h, y) => add(head, new THREE.CylinderGeometry(r, r, h, 24), mat(color), [0, y, 0]);
  if (role === 'investor') {
    hat('#15151c', 0.1, 0.13, 0.2); hat('#15151c', 0.17, 0.02, 0.14); hat('#f2c230', 0.102, 0.025, 0.17);
    box(root, mat('#f2c230'), [0, 0.45, 0.092], [0.025, 0.12, 0.01]);
    const bag = new THREE.Group(); bag.position.set(0, -0.26, 0.04); arms.r.add(bag);
    blob(bag, mat('#c9a26a'), [0, -0.04, 0], [0.07, 0.075, 0.07]); add(bag, new THREE.ConeGeometry(0.035, 0.05, 12), mat('#c9a26a'), [0, 0.04, 0]);
    add(bag, new THREE.TorusGeometry(0.03, 0.008, 6, 14), mat('#7a4a20'), [0, 0.02, 0], [Math.PI / 2, 0, 0]);
    blob(bag, mat('#f2c230', { metalness: 0.6 }), [0, -0.04, 0.062], [0.032, 0.032, 0.01]);
  } else if (role === 'physician') {
    add(head, new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20), mat('#d6dbe0', { metalness: 0.7, roughness: 0.3 }), [0, 0.11, 0.115], [1.2, 0, 0]);
    add(head, new THREE.TorusGeometry(0.15, 0.01, 6, 30, Math.PI), mat('#d6dbe0', { metalness: 0.6 }), [0, 0.06, 0], [0, 0, 0]);
    add(root, new THREE.TorusGeometry(0.075, 0.008, 8, 20), mat('#222'), [0, 0.5, 0.075], [0, 0, Math.PI]);
    blob(root, mat('#c8d0d8', { metalness: 0.7 }), [0, 0.43, 0.09], [0.02, 0.02, 0.012]);
    const cross = mat('#d8283a'); box(root, cross, [0.07, 0.44, 0.09], [0.04, 0.012, 0.01]); box(root, cross, [0.07, 0.44, 0.09], [0.012, 0.04, 0.01]);
  } else if (role === 'biologist') {
    for (const sx of [-1, 1]) add(head, new THREE.TorusGeometry(0.036, 0.009, 8, 20), mat('#f2c230'), [sx * 0.058, 0.02, 0.135]);
    add(head, new THREE.BoxGeometry(0.3, 0.02, 0.01), mat('#333'), [0, 0.1, 0.12]);
    const tube = add(arms.r, new THREE.CylinderGeometry(0.017, 0.017, 0.15, 12), mat('#9ff0d0', { transparent: true, opacity: 0.8, emissive: '#2fe0a0', emissiveIntensity: 0.4 }), [0, -0.26, 0.03]);
    add(arms.r, new THREE.CylinderGeometry(0.019, 0.019, 0.025, 12), mat('#222'), [0, -0.19, 0.03]);
  } else if (role === 'engineer') {
    blob(head, mat('#ffd21f'), [0, 0.09, 0], [0.16, 0.12, 0.16]);
    add(head, new THREE.CylinderGeometry(0.17, 0.17, 0.016, 28), mat('#ffd21f'), [0, 0.09, 0.02]);
    box(head, mat('#ffd21f'), [0, 0.15, 0.0], [0.03, 0.05, 0.2]);
    box(root, mat('#d8e060', { emissive: '#d8e060', emissiveIntensity: 0.2 }), [0, 0.42, 0.095], [0.23, 0.025, 0.01]);
    const g = new THREE.Group(); g.position.set(0, -0.28, 0.05); arms.r.add(g);
    add(g, new THREE.TorusGeometry(0.06, 0.02, 8, 8), mat('#8d96a0', { metalness: 0.7, roughness: 0.3 }));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; add(g, new THREE.BoxGeometry(0.03, 0.03, 0.04), mat('#8d96a0', { metalness: 0.7 }), [Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0], [0, 0, a]); }
  } else if (role === 'hero') {
    box(head, mat('#c8283a'), [0, 0.0, 0.0], [0.0001, 0.0001, 0.0001]);
    const mask = add(head, new THREE.SphereGeometry(0.146, 24, 12, 0, Math.PI * 2, 1.2, 0.5), mat('#c8283a'), [0, 0.0, 0.0], [0.1, 0, 0]);
    const cape = box(root, mat('#d8283a', { side: THREE.DoubleSide }), [0, 0.38, -0.1], [0.3, 0.42, 0.015], [0.18, 0, 0]);
    add(root, new THREE.CircleGeometry(0.06, 28), new THREE.MeshStandardMaterial({ map: emblemTexture(), roughness: 0.4 }), [0, 0.45, 0.092]);
    add(root, new THREE.CylinderGeometry(0.118, 0.118, 0.03, 20), mat('#f2c230', { metalness: 0.5 }), [0, 0.3, 0], [0, 0, 0], [1, 1, 0.8]);
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale); root.userData.arms = arms; root.userData.head = head;
  return root;
}
