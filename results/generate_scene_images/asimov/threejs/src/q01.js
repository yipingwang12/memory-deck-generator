import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q01 — A DOG drags the ASIMO robot out of its box.
function dog() {
  const g = new THREE.Group(), fur = '#d9963c', pale = '#f3cf8c', dark = '#6b3d1a';
  blob(g, fur, [0, 0.42, 0], [0.4, 0.2, 0.18]); blob(g, fur, [0.3, 0.48, 0], [0.2, 0.22, 0.17]); blob(g, fur, [-0.32, 0.44, 0], [0.2, 0.19, 0.17]);
  blob(g, pale, [0.06, 0.28, 0], [0.34, 0.08, 0.15]);
  const head = new THREE.Group(); head.position.set(0.5, 0.62, 0); g.add(head);
  blob(head, fur, [0, 0, 0], [0.17, 0.15, 0.15]); blob(head, pale, [0.17, -0.04, 0], [0.13, 0.085, 0.1]); blob(head, '#1b1210', [0.29, -0.01, 0], [0.035, 0.03, 0.04]);
  blob(head, '#ee7f8f', [0.2, -0.105, 0], [0.06, 0.015, 0.045]);
  for (const s of [-1, 1]) {
    blob(head, '#fff', [0.09, 0.05, s * 0.1], [0.05, 0.055, 0.03]); blob(head, '#1a1218', [0.105, 0.048, s * 0.118], [0.03, 0.036, 0.016]); blob(head, '#fff', [0.113, 0.062, s * 0.127], [0.011, 0.011, 0.009]);
    blob(head, dark, [-0.03, 0.0, s * 0.15], [0.055, 0.13, 0.04], [s * 0.3, 0, 0]);
  }
  for (const [x, z] of [[0.3, 0.11], [0.3, -0.11], [-0.3, 0.11], [-0.3, -0.11]]) { cyl(g, fur, 0.06, 0.05, 0.38, [x, 0.19, z]); blob(g, pale, [x, 0.03, z], [0.07, 0.04, 0.07]); }
  limbTo(g, fur, 0.035, [-0.48, 0.5, 0], [-0.72, 0.86, 0]); blob(g, pale, [-0.73, 0.88, 0], [0.05, 0.06, 0.05]);
  return g;
}
guard(() => {
  const { stage, scene } = makeStage({ ground: '#9ccf6b' });
  const bx = new THREE.Group(); bx.position.set(-1.05, 0, -0.1); bx.rotation.y = -0.8; scene.add(bx);
  const card = '#c99a5b';
  box(bx, card, [1.1, 0.04, 1.1], [0, 0.02, 0]); box(bx, card, [0.04, 0.9, 1.1], [-0.55, 0.45, 0]);
  box(bx, card, [1.1, 0.9, 0.04], [0, 0.45, 0.55]); box(bx, card, [1.1, 0.9, 0.04], [0, 0.45, -0.55]);
  box(bx, '#8d6a3a', [0.04, 0.9, 1.0], [-0.52, 0.45, 0]);
  for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(0, 0.9, s * 0.55); f.rotation.x = s * -1.0; bx.add(f); box(f, '#dcae6a', [1.1, 0.03, 0.5], [0, 0, s * 0.25]); }
  box(bx, '#e8d9a8', [0.04, 0.9, 0.18], [-0.55, 0.45, 0.3]);
  box(bx, '#f3f3f3', [0.35, 0.3, 0.5], [-0.15, 0.17, 0.15]); box(bx, '#f3f3f3', [0.3, 0.2, 0.4], [-0.3, 0.12, -0.25]);
  const r = rng(3); for (let i = 0; i < 14; i++) blob(scene, '#fbfbf3', [-0.4 + r() * 1.8, 0.03, 0.2 + r() * 1.0], [0.05, 0.03, 0.05]);
  const a = createAsimo({ scale: 1.2 }); a.position.set(-0.05, 0, 0.25); a.rotation.y = 0.55; scene.add(a);
  a.userData.pose({ lean: 0.18, arms: { r: [0.3, 0.7], l: [0, 0.4] }, legs: { l: [0.4, 0], r: [-0.3, 0] } });
  const d = dog(); d.scale.setScalar(1.15); d.position.set(1.25, 0, 0.3); d.rotation.y = Math.PI - 0.3; scene.add(d);
  reachW(a, 'l', d.localToWorld(V3(0.6, 0.58, 0)).toArray());
  wrap(stage, scene, a, { cam: [0.6, 0.85, 3.8], look: [0.6, 0.62, 0] });
});
