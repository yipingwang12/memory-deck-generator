The ZANDER listens to the brain's idle chatter, not to commands: a passive BCI.
===
{ sky: { cover: 0.2, puffCover: 0.2 } }
===
  add(scene, new THREE.PlaneGeometry(60, 14), mat('#24486e'), [0, 5, -3.2]);
  ground(scene, '#c9d6e6');
  for (let i = 0; i < 6; i++) box(scene, '#2f5d8c', [-6 + i * 2.4, 3.3, -3.15], [1.4, 1.4, 0.05]);
  const brain = buildBrain(0.8); brain.position.set(1.5, 1.8, 0); brain.rotation.y = -0.5; scene.add(brain);
  const wcol = ['#5ee6ff', '#ffd25e', '#ff8fd0'];
  [[0.0, 0.07, 4.5, 0], [-0.17, 0.05, 5.5, 1.5], [0.17, 0.05, 3.5, 3]].forEach(([dy, a, f, ph], i) => wave(scene, sineWave(0.8, -0.7, 1.75 + dy, 0.35, a, f, 60, ph), wcol[i]));
  for (const [x, y, s] of [[2.3, 3.2, 0.22], [0.6, 3.1, 0.18]]) { blob(scene, mat('#ffffff'), [x, y, 0.2], [s * 1.5, s, s * 0.4]); for (let k = -1; k <= 1; k++) blob(scene, '#6a7fa0', [x + k * s * 0.5, y, 0.2 + s * 0.4], [s * 0.13, s * 0.13, s * 0.1]); }
  box(scene, '#333b48', [2.5, 0.08, 0.6], [0.8, 0.16, 0.6]); cyl(scene, '#333b48', [2.5, 0.3, 0.6], 0.04, 0.3); blob(scene, '#d8283a', [2.5, 0.5, 0.6], [0.11, 0.11, 0.11]);
  box(scene, '#e0202c', [2.5, 0.55, 0.95], [1.5, 0.12, 0.06], [0, 0, 0.8]); box(scene, '#e0202c', [2.5, 0.55, 0.95], [1.5, 0.12, 0.06], [0, 0, -0.8]);
  const z = createZander({ scale: 2.0 }); z.position.set(-0.95, 0, 0.6); z.rotation.y = -0.45; scene.add(z);
  z.userData.parts.head.add(buildEEGCap());
  z.userData.pose({ headTilt: -0.12, arms: { l: [0, 0.25, 0], r: [0, -0.2, 0] } });
  camera(stage, num, { c: [0.5, 1.6, 5.8], t: [0.5, 1.5, 0] });
  finish(stage, [z], false);
