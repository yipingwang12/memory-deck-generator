A JAGUAR (de Jager) wears the ZANDER's CEO crown.
===
{}
===
  ground(scene, '#c9b48a');
  box(scene, '#8c2f3a', [0.2, 0.01, 0.4], [6.5, 0.02, 3.5]);
  box(scene, '#4a2f5c', [1.0, 1.1, -1.0], [1.5, 2.2, 0.2]); box(scene, '#d8a93a', [1.0, 2.25, -1.0], [1.6, 0.14, 0.24]);
  box(scene, '#6b3a7c', [1.0, 0.15, -0.3], [1.5, 0.3, 1.0]);
  const jag = buildJaguar(); jag.position.set(1.0, 0.3, -0.25); jag.scale.setScalar(1.45); scene.add(jag);
  const crown = buildCrown(); crown.position.set(0, 0.2, 0.0); crown.scale.setScalar(1.1); crown.rotation.x = -0.08; jag.userData.head.add(crown);
  const z = createZander({ scale: 2.0 }); z.position.set(-1.6, 0, 0.6); z.rotation.y = 0.5; scene.add(z);
  z.userData.pose({ headTilt: -0.08, arms: { r: [0.1, -0.5, 0] } });
  z.updateMatrixWorld(true); const tg = z.worldToLocal(new THREE.Vector3(-0.8, 1.9, 0.6)); z.userData.reach('l', [tg.x, tg.y, tg.z]);
  camera(stage, num, { c: [-0.1, 1.5, 6.0], t: [-0.05, 1.1, 0] });
  finish(stage, [z, jag]);
