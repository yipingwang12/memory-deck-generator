// q01: a big letter Y (Y Combinator) launches the PIRANHA.
boot({ clouds: [[150, 900, 90, 1.2], [168, 1300, 200, 2.2], [187, 1000, 120, 1.6], [214, 950, 70, 0.9], [252, 900, 80, 1.1]] }, ({ stage, scene, num, mark }) => {
  ground(scene);
  const pts = [[-.14, 0], [.14, 0], [.14, .68], [.66, 1.5], [.38, 1.5], [0, .9], [-.38, 1.5], [-.66, 1.5], [-.14, .68]];
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(...p))), { depth: .2, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 3 });
  geo.translate(0, 0, -.1);
  const S = 1.9, X = -1.3;
  add(scene, geo, mat('#f26522', { roughness: .5 }), [X, 0, 0], [0, 0, 0], [S, S, S]);
  const band = mat('#4a2c1a');
  C.tube(scene, [[X - .52 * S, 1.5 * S, 0], [X - .3, 1.95 * S - .6, .1], [X, 1.98 * S - .55, .12], [X + .3, 1.95 * S - .6, .1], [X + .52 * S, 1.5 * S, 0]], .035, band, 40);
  const p = createPiranha({ scale: 1.4 }); p.position.set(1.0, 3.3, .3); p.rotation.set(0, -.35, -.35); scene.add(p);
  p.userData.pose({ lean: .15, jaw: .25, arms: { l: [0, 1.6, 0], r: [0, 1.6, 0] }, legs: { l: [-.5, .1], r: [-.3, -.1] } });
  mark(p);
  const puff = mat('#ffffff', { roughness: 1 });
  [[-.2, 3.1, .3, .2], [-.6, 2.95, .4, .26], [-1.0, 2.8, .3, .2], [.15, 3.05, .0, .13]].forEach(([x, y, z, r]) => blob(scene, puff, [x, y, z], [r, r, r]));
  for (let i = 0; i < 5; i++) { const s = box(scene, mat('#fff7c0'), [-.1 - i * .35, 3.5 + (i % 2) * .2 - i * .08, -.2], [.4, .035, .035]); s.castShadow = false; }
  look(stage, num, [-.1, 2.4, 7.6], [-.1, 2.3, 0]);
});
