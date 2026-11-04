import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q06 — An old CANADIAN pensioner carries a giant bag of money to the ASIMO robot.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#e9f0f7' });
  const r = rng(6);
  for (const [x, z, s] of [[-3.4, -3, 1.4], [3.6, -4, 1.7], [-1.8, -6, 1.6], [1.5, -7, 2.0]]) { add(scene, new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.5 * s, 10), mat('#5a3b22'), [x, 0.25 * s, z]); for (let k = 0; k < 3; k++) add(scene, new THREE.ConeGeometry((0.6 - k * 0.15) * s, 0.9 * s, 14), mat('#2f7a4a'), [x, (0.8 + k * 0.5) * s, z]); }
  const a = createAsimo({ scale: 1.25 }); a.position.set(-0.85, 0, 0.1); a.rotation.y = 0.4; scene.add(a);
  a.userData.pose({ arms: { r: [0, 0.8] } });
  const p = person({ coat: '#c42a2a', pants: '#3c4a5a', hair: '#f6f6f6', glasses: true, mustache: true }); p.scale.setScalar(1.1); p.position.set(1.05, 0, 0); p.rotation.y = -1.1; scene.add(p);
  const hat = new THREE.Group(); hat.position.set(0, 0.12, 0); p.userData.head.add(hat);
  blob(hat, '#d62828', [0, 0.06, -0.01], [0.19, 0.13, 0.18]); blob(hat, '#fff', [0, 0.2, -0.01], [0.06, 0.06, 0.06]);
  add(p, new THREE.TorusGeometry(0.1, 0.045, 10, 24), mat('#fff'), [0, 1.4, 0], [Math.PI / 2, 0, 0]);
  // bag
  const bag = new THREE.Group(); bag.position.set(0.12, 0.62, 0.15); scene.add(bag);
  blob(bag, '#c9a26b', [0, 0, 0], [0.5, 0.55, 0.45]); cyl(bag, '#c9a26b', 0.16, 0.22, 0.2, [0, 0.58, 0]); add(bag, new THREE.TorusGeometry(0.17, 0.03, 8, 24), mat('#7a2a2a'), [0, 0.52, 0], [Math.PI / 2, 0, 0]);
  textPlane(bag, '$', 0.4, 0.4, [0, -0.02, 0.455], [0, 0, 0], { bg: '#cba56c', fg: '#1f7a3a', draw: (c, w, h) => { c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(w / 2, h / 2, h * 0.46, 0, 7); c.fill(); } });
  for (let i = 0; i < 9; i++) add(bag, new THREE.CylinderGeometry(0.07, 0.07, 0.02, 18), mat('#ffc933', { metalness: 0.6, roughness: 0.3 }), [(r() - 0.5) * 0.3, 0.72 + r() * 0.1, (r() - 0.5) * 0.2], [r(), 0, r()]);
  // flag
  limbTo(scene, '#d9d9df', 0.015, [0.35, 1.25, 0.0], [0.35, 2.0, 0.0], { metalness: 0.5 });
  textPlane(scene, '', 0.78, 0.4, [0.0, 1.8, 0], [0, 0, 0], { bg: '#fff', draw: (c, w, h) => {
    c.fillStyle = '#d62828'; c.fillRect(0, 0, w * 0.25, h); c.fillRect(w * 0.75, 0, w * 0.25, h);
    c.beginPath(); for (let i = 0; i < 22; i++) { const t = i * Math.PI / 11 - Math.PI / 2, rr = i % 2 ? h * 0.2 : h * 0.4; c.lineTo(w / 2 + Math.cos(t) * rr, h * 0.48 + Math.sin(t) * rr); } c.closePath(); c.fill(); c.fillRect(w / 2 - 6, h * 0.8, 12, h * 0.16);
  } });
  armW(p, 'l', [0.62, 0.52, 0.5]); armW(p, 'r', [0.55, 0.72, -0.2]);
  reachW(a, 'l', [-0.2, 0.7, 0.25]);
  for (let i = 0; i < 8; i++) add(scene, new THREE.CylinderGeometry(0.06, 0.06, 0.015, 18), mat('#ffc933', { metalness: 0.6, roughness: 0.3 }), [-0.3 + r() * 1.2, 0.012, 0.7 + r() * 0.9]);
  wrap(stage, scene, [a, p], { cam: [0.15, 0.98, 4.2], look: [0.15, 0.98, 0] });
});
