  // The CROW reaches only about two micromolar, far below the protective eleven.
  const stage = makeStage({ ground: '#e8d8b8' }); const S = stage.scene;
  // tall measuring column
  const col = new THREE.Group(); col.position.set(1.3, 0, 0); S.add(col);
  add(col, new THREE.CylinderGeometry(0.4, 0.4, 4.4, 28, 1, true), glass('#d8f2ff', 0.28), [0, 2.2, 0]);
  cyl(col, mat('#2d4fa8'), 0.45, 0.5, 0.15, [0, 0.07, 0]);
  cyl(col, mat('#3fb8ff', { transparent: true, opacity: 0.8 }), 0.36, 0.36, 1.35, [0, 0.75, 0]);
  for (let i = 0; i <= 12; i++) box(col, mat('#222'), [i % 2 ? 0.25 : 0.4, 0.03, 0.03], [-0.42, 0.2 + i * 0.33, 0.1]);
  const mk = (y, txt, bg, fg, w = 0.5) => { const l = label(txt, { w, h: 0.4, size: 0.7, bg, fg, border: fg }); l.position.set(-0.95, y, 0.2); col.add(l); };
  mk(1.35, '2', '#fff6df', '#1d6fd0'); mk(3.65, '11', '#e8ffe8', '#1f9a3a', 0.62);
  box(col, mat('#2fb050'), [1.3, 0.07, 0.07], [0.35, 3.65, 0.4]);
  // protective shield at 11
  const sh = new THREE.Shape(); sh.moveTo(0, 0.28); sh.lineTo(0.22, 0.2); sh.lineTo(0.2, -0.05); sh.quadraticCurveTo(0.12, -0.22, 0, -0.3); sh.quadraticCurveTo(-0.12, -0.22, -0.2, -0.05); sh.lineTo(-0.22, 0.2); sh.closePath();
  add(col, new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), mat('#2fb050', { metalness: 0.2 }), [0.0, 4.05, 0.4], [0, 0, 0], [1.3, 1.3, 1]);
  const crow = createCrow({ scale: 1.8 }); crow.position.set(-0.55, 0, 0.5); crow.rotation.y = 0.5; S.add(crow);
  crow.userData.pose({ headTilt: -0.08, headPitch: -0.45, beak: 0.25, wing: { l: [2.6, 0.1, 0.0], r: [0.25, 0, 0.1] } });
  crow.userData.parts.legs.l.rotation.x = 0.0;
  // dashed trail from crow wing-tip to 2 mark
  finishScene(stage, crow, [num('cx', 0.4), num('cy', 2.3), num('cz', 7.3)], [0.4, 2.0, 0]);
