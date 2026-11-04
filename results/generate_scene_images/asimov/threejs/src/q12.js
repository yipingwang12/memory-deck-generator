import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng, canvasTexture } from './common.js';
// q12 — The ASIMO robot climbs out of a TEA chest in Boston.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#9a6a38' });
  const planks = new THREE.Group(); scene.add(planks);
  for (let i = 0; i < 14; i++) box(planks, i % 2 ? '#8f6031' : '#a47342', [30, 0.02, 0.34], [0, 0.011, 3 - i * 0.355 + 1.4]);
  add(scene, new THREE.PlaneGeometry(200, 120), mat('#3f8fc6', { roughness: 0.3 }), [0, 0.0, -66], [-Math.PI / 2, 0, 0]);
  box(scene, '#7a5230', [30, 0.3, 1], [0, 0.15, -3.3]);
  // buildings
  const win = (c) => canvasTexture(256, (g, s) => { g.fillStyle = c; g.fillRect(0, 0, s, s); g.fillStyle = '#e9f2ff'; for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) g.fillRect(14 + x * 40, 12 + y * 30, 22, 16); });
  const r = rng(12);
  for (let i = 0; i < 12; i++) { const h = 2.2 + r() * 2.2, w = 1.7 + r() * 0.8, x = -9 + i * 1.8; add(scene, new THREE.BoxGeometry(w, h, 1.6), new THREE.MeshStandardMaterial({ map: win(i % 3 ? '#a8533c' : '#9a4a37'), roughness: 0.8 }), [x, h / 2, -11]); }
  add(scene, new THREE.BoxGeometry(1.5, 9, 1.5), new THREE.MeshStandardMaterial({ map: win('#6f8fb0'), roughness: 0.4 }), [3.8, 4.5, -13]);
  // ship
  const ship = new THREE.Group(); ship.position.set(-3.1, 0.0, -6.5); ship.rotation.y = 0.25; ship.scale.setScalar(1.1); scene.add(ship);
  box(ship, '#5a3a1e', [2.6, 0.55, 0.9], [0, 0.5, 0]); add(ship, new THREE.ConeGeometry(0.45, 0.6, 4), mat('#5a3a1e'), [1.55, 0.5, 0], [0, 0, -Math.PI / 2], [1, 1, 1.0]); box(ship, '#e0b25a', [2.6, 0.06, 0.92], [0, 0.72, 0]);
  for (const x of [-0.6, 0.5]) { cyl(ship, '#6e4a26', 0.04, 0.05, 2.2, [x, 1.75, 0]); box(ship, '#f6ecd2', [0.08, 0.9, 1.0], [x, 1.65, 0.0]); box(ship, '#f6ecd2', [0.08, 0.7, 0.9], [x, 2.55, 0.0]); }
  // chest
  const ch = new THREE.Group(); scene.add(ch);
  const W = 1.5, Hh = 0.75, D = 0.7, wood = '#b07a3e', dark = '#6b3b10';
  box(ch, wood, [W, 0.04, D], [0, 0.02, 0]); box(ch, wood, [W, Hh, 0.05], [0, Hh / 2, D / 2]); box(ch, '#8f5f2c', [W, Hh, 0.05], [0, Hh / 2, -D / 2]);
  for (const s of [-1, 1]) box(ch, '#9a6732', [0.05, Hh, D], [s * W / 2, Hh / 2, 0]);
  for (const s of [-1, 1]) for (const z of [-1, 1]) box(ch, '#3a3f4a', [0.09, Hh + 0.02, 0.09], [s * W / 2, Hh / 2, z * D / 2]);
  for (const y of [0.1, Hh - 0.1]) box(ch, '#3a3f4a', [W + 0.02, 0.05, 0.06], [0, y, D / 2 + 0.02]);
  textPlane(ch, 'TEA', 1.0, 0.44, [0, 0.4, D / 2 + 0.035], [0, 0, 0], { bg: '#f6e7c4', fg: '#a01818', border: '#6b3b10' });
  const lid = new THREE.Group(); lid.position.set(0, Hh, -D / 2); lid.rotation.x = -1.95; ch.add(lid);
  box(lid, wood, [W + 0.04, 0.05, D + 0.04], [0, 0, D / 2]); for (const x of [-0.5, 0.5]) box(lid, '#3a3f4a', [0.07, 0.06, D + 0.05], [x, 0, D / 2]);
  blob(ch, '#5a7a2a', [0, 0.35, 0], [0.7, 0.14, 0.3]); for (let i = 0; i < 24; i++) blob(ch, ['#4f7a2a', '#6b8f33', '#3f6a24'][i % 3], [(r() - 0.5) * 1.1, 0.46 + r() * 0.04, (r() - 0.5) * 0.4], [0.07, 0.025, 0.04], [0, r() * 3, 0]);
  const a = createAsimo({ scale: 1.4 }); a.position.set(0, 0.32, 0.0); scene.add(a);
  a.userData.pose({ lean: 0.22, headTilt: 0.05, arms: { l: [0, 0.3], r: [0, 0.3] } });
  reachW(a, 'l', [0.3, 0.8, 0.35]); reachW(a, 'r', [-0.3, 0.8, 0.35]);
  for (let i = 0; i < 18; i++) blob(scene, ['#4f7a2a', '#6b8f33', '#3f6a24'][i % 3], [(r() - 0.5) * 3.4, 0.03 + (i > 12 ? 0.3 + r() * 1.2 : 0), 0.6 + r() * 1.1], [0.08, 0.025, 0.045], [0, r() * 3, r() * 0.8]);
  wrap(stage, scene, a, { cam: [0, 0.95, 3.5], look: [0, 0.9, 0] });
});
