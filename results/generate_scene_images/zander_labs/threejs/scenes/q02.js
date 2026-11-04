THOR's STONE holds the ZANDER's science microscope.
===
{}
===
  ground(scene, '#6fae45');
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), mat('#8d9096', { flatShading: true, roughness: 0.95 })); stone.scale.set(1.0, 0.7, 0.85); stone.position.set(1.0, 0.65, -0.1); stone.rotation.y = 0.5; stone.castShadow = stone.receiveShadow = true; scene.add(stone);
  box(scene, '#8d9096', [1.0, 1.2, -0.1], [1.1, 0.12, 0.9], [0, 0.5, 0]);
  const mic = buildMicroscope(); mic.scale.setScalar(1.5); mic.position.set(1.0, 1.26, -0.05); mic.rotation.y = -0.5; scene.add(mic);
  box(scene, '#c42d33', [1.0, 0.9, -1.0], [2.2, 1.9, 0.05], [-0.1, 0, 0]);
  const helm = new THREE.Group(); helm.position.set(1.9, 0, 1.0); scene.add(helm);
  add(helm, new THREE.SphereGeometry(0.28, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b9c2cc', { metalness: 0.7, roughness: 0.3 }), [0, 0.0, 0]);
  cyl(helm, '#b9c2cc', [0, 0.02, 0], 0.285, 0.05);
  for (const s of [-1, 1]) add(helm, new THREE.ConeGeometry(0.07, 0.4, 14), mat('#f6efd8'), [s * 0.3, 0.22, 0], [0, 0, -s * 0.7]);
  const ham = new THREE.Group(); ham.position.set(2.5, 0, 0.1); scene.add(ham);
  cyl(ham, '#7a4a22', [0, 0.45, 0], 0.035, 0.9, [0, 0, 0.12]); box(ham, '#59606a', [0.05, 0.9, 0], [0.46, 0.24, 0.24]);
  const z = createZander({ scale: 1.9 }); z.position.set(-0.35, 0, 0.75); z.rotation.y = 0.45; scene.add(z);
  z.userData.pose({ lean: 0.08, headTilt: 0.08, arms: { r: [0.1, -0.5, 0] } });
  z.updateMatrixWorld(true); const tg = z.worldToLocal(new THREE.Vector3(0.7, 1.45, 0.1)); z.userData.reach('l', [tg.x, tg.y, tg.z]);
  camera(stage, num, { c: [0.5, 1.3, 5.2], t: [0.55, 1.0, 0] });
  finish(stage, [z]);
