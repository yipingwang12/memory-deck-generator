import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q02 — Under the MIT DOME, Professor VOTE plants a flag on the ASIMO robot's head.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#86b95a' });
  add(scene, new THREE.PlaneGeometry(3.5, 40), mat('#dccfb2'), [0, 0.004, -8], [-Math.PI / 2, 0, 0]);
  const B = new THREE.Group(); B.position.set(0, 0, -9); B.scale.setScalar(0.5); scene.add(B);
  const stone = '#e8e2d2';
  box(B, stone, [11, 3.2, 3], [0, 1.6, 0]); box(B, stone, [8.5, 2.2, 3], [0, 4.3, -0.2]);
  for (let i = 0; i < 8; i++) cyl(B, '#f2ede0', 0.26, 0.26, 3.2, [-3.5 + i, 1.6, 2.2]);
  box(B, stone, [8.4, 0.5, 0.9], [0, 3.45, 2.2]);
  const ped = new THREE.Shape(); ped.moveTo(-4.2, 0); ped.lineTo(4.2, 0); ped.lineTo(0, 1.3); ped.closePath();
  add(B, new THREE.ExtrudeGeometry(ped, { depth: 0.8, bevelEnabled: false }), mat(stone), [0, 3.7, 1.8]);
  cyl(B, stone, 2.6, 2.6, 1.6, [0, 6.2, -0.2]);
  add(B, new THREE.SphereGeometry(2.5, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), mat('#c3cad3', { metalness: 0.3, roughness: 0.4 }), [0, 7, -0.2]);
  cyl(B, '#d8dde3', 0.35, 0.35, 0.7, [0, 9.7, -0.2]); blob(B, '#d8dde3', [0, 10.1, -0.2], [0.3, 0.3, 0.3]);
  for (const [x, z, s] of [[-3.6, -3, 1.2], [3.8, -4.5, 1.4], [-5.5, -6, 1.5], [5.8, -2, 1.0]]) { cyl(scene, '#6b4a2a', 0.12 * s, 0.16 * s, 1.2 * s, [x, 0.6 * s, z]); blob(scene, '#4f9b3f', [x, 1.5 * s, z], [0.7 * s, 0.75 * s, 0.7 * s]); }
  const a = createAsimo({ scale: 1.25 }); a.position.set(-0.4, 0, 0); a.rotation.y = 0.3; scene.add(a);
  a.userData.pose({ arms: { l: [0, 0.5], r: [0, 0.5] } });
  const poleX = -0.4;
  cyl(scene, '#d9d9df', 0.016, 0.016, 1.0, [poleX, 1.55, 0.04], [0, 0, 0], { metalness: 0.5 });
  textPlane(scene, 'VOTE', 0.8, 0.48, [poleX - 0.4, 1.76, 0.04], [0, 0, 0], { bg: '#c0392b', fg: '#ffffff', border: '#ffffff' });
  blob(scene, '#ffd23f', [poleX, 2.07, 0.04], [0.03, 0.03, 0.03]);
  const p = person({ coat: '#7a4a2a', pants: '#40424f', hair: '#f1f1f1', glasses: true, mustache: true }); p.scale.setScalar(1.1); p.position.set(0.55, 0, 0.05); p.rotation.y = -0.55; scene.add(p);
  armW(p, 'r', [poleX + 0.03, 1.5, 0.08]); armW(p, 'l', [0.85, 0.95, 0.25]);
  blob(p, '#d62828', [0, 1.3, 0.16], [0.05, 0.1, 0.02]);
  wrap(stage, scene, [a, p], { cam: [0.1, 1.1, 3.8], look: [0.1, 1.1, 0] });
});
