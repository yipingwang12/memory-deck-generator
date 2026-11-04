NAFAS: the ZANDER helps machines adapt to the brain: Neuroadaptivity for Autonomous Systems.
===
{ sky: { cover: 0.2, puffCover: 0.2 } }
===
  add(scene, new THREE.PlaneGeometry(60, 14), mat('#e8dcc4'), [0, 5, -3.2]);
  ground(scene, '#b8c4d0');
  const banner = textPlane('NAFAS', 4.4, 1.05, { bg: '#1f4fb5', fg: '#ffffff', frame: '#ffcf2e' }); banner.position.set(0.2, 3.1, -1.8); scene.add(banner);
  for (const x of [-1.95, 2.35]) cyl(scene, '#59606a', [x, 1.55, -1.85], 0.05, 3.1);
  const robot = buildRobot(); robot.scale.setScalar(1.7); robot.position.set(1.4, 0, 0); robot.rotation.y = -0.35; scene.add(robot);
  const car = new THREE.Group(); box(car, '#e8452e', [0, 0.17, 0], [0.9, 0.2, 0.45]); box(car, '#ffffff', [-0.05, 0.34, 0], [0.45, 0.16, 0.38]);
  for (const x of [-0.3, 0.3]) for (const zz of [-0.23, 0.23]) cyl(car, '#222', [x, 0.09, zz], 0.09, 0.07, [Math.PI / 2, 0, 0]);
  cyl(car, '#2a2f3a', [-0.05, 0.47, 0], 0.07, 0.07); blob(car, '#6ee0ff', [-0.05, 0.53, 0], [0.05, 0.02, 0.05], [0, 0, 0], { emissive: '#6ee0ff' });
  car.position.set(3.0, 0, 0.4); car.rotation.y = -0.5; car.scale.setScalar(1.2); scene.add(car);
  const gear = (x, y, r, col) => { const g = new THREE.Group(); cyl(g, col, [0, 0, 0], r, 0.1, [Math.PI / 2, 0, 0]); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; box(g, col, [Math.cos(a) * r, Math.sin(a) * r, 0], [r * 0.3, r * 0.3, 0.1], [0, 0, a]); } cyl(g, '#e8dcc4', [0, 0, 0.01], r * 0.35, 0.12, [Math.PI / 2, 0, 0]); g.position.set(x, y, -1.2); scene.add(g); };
  gear(-1.0, 2.3, 0.4, '#ffcf2e'); gear(-0.3, 2.25, 0.28, '#e8452e');
  const z = createZander({ scale: 1.9 }); z.position.set(-0.9, 0, 0.9); z.rotation.y = 0.4; scene.add(z);
  z.userData.parts.head.add(buildEEGCap());
  z.userData.pose({ headTilt: 0.06, arms: { r: [0, -0.5, 0] } });
  z.updateMatrixWorld(true); const tg = z.worldToLocal(new THREE.Vector3(0.1, 1.3, 0.9)); z.userData.reach('l', [tg.x, tg.y, tg.z]);
  wave(scene, sineWave(-0.7, 1.15, 1.95, 0.2, 0.06, 3.5, 60), '#5ee6ff'); wave(scene, sineWave(-0.7, 1.15, 1.8, 0.2, 0.05, 3, 60, 2), '#ff8fd0');
  camera(stage, num, { c: [0.7, 1.7, 5.6], t: [0.7, 1.5, 0] });
  finish(stage, [z], false);
