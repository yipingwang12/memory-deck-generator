  // The CROW edits the RNA message, never the DNA book: nothing in the genome changes for good.
  const stage = makeStage({ ground: '#8fbf6a' }); const S = stage.scene;
  const wood = mat('#a8743c');
  box(S, wood, [3.6, 0.12, 1.3], [0, 0.9, 0.3]);
  for (const x of [-1.6, 1.6]) for (const z of [-0.2, 0.8]) box(S, mat('#7a5230'), [0.14, 0.9, 0.14], [x, 0.45, z]);
  // RNA scroll: paper strip with colour bases, one crossed out / corrected
  const paper = box(S, mat('#fff6df'), [1.9, 0.03, 0.7], [-0.55, 0.985, 0.35]);
  const cols = ['#ff6b6b', '#ffd23f', '#3fb8ff', '#4cd964'];
  for (let i = 0; i < 7; i++) box(S, mat(cols[(i * 3) % 4], { roughness: 0.3 }), [0.16, 0.06, 0.16], [-1.35 + i * 0.25, 1.02, 0.35]);
  box(S, mat('#e23b3b'), [0.28, 0.07, 0.06], [-1.35 + 3 * 0.25, 1.07, 0.35], [0, 0.7, 0]); box(S, mat('#e23b3b'), [0.28, 0.07, 0.06], [-1.35 + 3 * 0.25, 1.07, 0.35], [0, -0.7, 0]);
  const rl = label('RNA', { w: 0.5, h: 0.25, size: 0.55, bg: '#ffe0e0' }); rl.rotation.x = -Math.PI / 2; rl.position.set(-1.35, 1.0, 0.65); S.add(rl);
  // DNA book: closed, locked
  const book = new THREE.Group(); book.position.set(1.15, 1.2, 0.3); book.rotation.y = -0.3; S.add(book);
  box(book, mat('#2d4fa8'), [0.9, 0.3, 0.7], [0, 0, 0]); box(book, mat('#f5ecd2'), [0.84, 0.24, 0.66], [0.03, 0, 0]);
  box(book, mat('#2d4fa8'), [0.9, 0.04, 0.7], [0, 0.17, 0]);
  const dl = label('DNA', { w: 0.6, h: 0.3, size: 0.6, bg: '#2d4fa8', fg: '#ffd23f', border: '#ffd23f' }); dl.rotation.x = -Math.PI / 2; dl.position.set(0, 0.195, 0); book.add(dl);
  add(book, new THREE.TorusGeometry(0.4, 0.015, 8, 40), mat('#c0c0c8', { metalness: 0.8 }), [0, 0.0, 0.2], [Math.PI / 2, 0, 0]).scale.set(1.1, 0.8, 1);
  const lock = new THREE.Group(); lock.position.set(0, 0.0, 0.37); book.add(lock);
  box(lock, mat('#e2b13c', { metalness: 0.7, roughness: 0.3 }), [0.17, 0.14, 0.07], [0, 0, 0]);
  add(lock, new THREE.TorusGeometry(0.055, 0.016, 8, 20, Math.PI), mat('#c0c0c8', { metalness: 0.8 }), [0, 0.07, 0]);
  const crow = createCrow({ scale: 1.9 }); crow.position.set(-0.55, 0.0, -0.9); crow.rotation.y = 0.1; S.add(crow);
  crow.userData.pose({ headPitch: 0.45, beak: 0.04, headYaw: 0, wing: { l: [0.2, 0.5, 0.2], r: [0.2, 0.2, 0.1] } });
  // red pen held in the beak, tip on the paper
  crow.updateMatrixWorld(true);
  const pen = new THREE.Group(); cyl(pen, mat('#e23b3b'), 0.025, 0.025, 0.5, [0, 0.25, 0]); cyl(pen, mat('#222'), 0.0, 0.025, 0.1, [0, -0.05, 0]); pen.castShadow = true;
  const tip = new THREE.Vector3(-0.97, 1.03, 0.36), bk = crow.userData.parts.beak.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.1, 0.18));
  pen.position.copy(tip); S.add(pen); pen.lookAt(pen.position.clone().add(new THREE.Vector3(0, 0, 0))); pen.rotation.set(0.75, 0, -0.1); pen.position.copy(tip);
  finishScene(stage, crow, [0.0, 1.9, 3.9], [0.0, 1.15, 0]);
