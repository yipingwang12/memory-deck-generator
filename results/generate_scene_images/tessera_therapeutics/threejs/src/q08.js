// q08 — through a big iron GATE (Gates Foundation), a LASSO throws coins to the TESSERACT to fix sickle-shaped blood cells.
function gate() {
  const g = new THREE.Group(), iron = mat('#2b2f3a', { metalness: 0.4, roughness: 0.5 }), stone = mat('#b9b2a4'), gold = mat('#ffcf2e', { metalness: 0.5 });
  for (const x of [-2.3, 2.3]) { box(g, stone, [x, 1.5, 0], [0.6, 3.0, 0.6]); box(g, stone, [x, 3.05, 0], [0.75, 0.15, 0.75]); blob(g, gold, [x, 3.35, 0], [0.22, 0.22, 0.22]); }
  box(g, iron, [0, 2.9, 0], [4.0, 0.12, 0.1]); box(g, iron, [0, 0.35, 0], [4.0, 0.12, 0.1]); box(g, iron, [0, 1.6, 0], [4.0, 0.08, 0.08]);
  for (let i = 0; i < 16; i++) { const x = -1.9 + i * 0.253; cyl(g, iron, [x, 1.5, 0], 0.04, 3.0); add(g, new THREE.ConeGeometry(0.07, 0.2, 6), iron, [x, 3.1, 0]); }
  return g;
}
function crescent() {
  const g = new THREE.Group(), m = mat('#d6203a');
  add(g, new THREE.TorusGeometry(0.34, 0.1, 12, 24, Math.PI * 1.35), m, [0, 0, 0], [0, 0, 0]);
  for (const a of [0, Math.PI * 1.35]) blob(g, m, [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0], [0.1, 0.1, 0.1]);
  return g;
}
run({
  cam: { p: [0.0, 1.8, 6.0], t: [0.0, 1.6, 0] },
  build({ scene, mark, tess }) {
    const gt = gate(); gt.position.set(-0.6, 0, -2.4); scene.add(gt);
    const t = tess({ scale: 1.8 }); t.position.set(1.0, 0, 0.5); t.rotation.y = -0.35; mark(t);
    t.userData.pose({ arms: { l: [0, 2.3, 0], r: [0, 2.0, 0] } });
    // lasso: rope loop high on the left, trailing rope to the frame edge, coins arcing to tess
    const rope = mat('#d8b070'), P = (u) => { const a = new THREE.Vector3(-3.1, 0.9, 1.4), b = new THREE.Vector3(-3.0, 3.1, 0.8), c = new THREE.Vector3(-1.7, 2.4, 0.8); return a.multiplyScalar((1 - u) ** 2).addScaledVector(b, 2 * u * (1 - u)).addScaledVector(c, u * u); };
    for (let i = 0; i <= 22; i++) blob(scene, rope, P(i / 22).toArray(), [0.06, 0.06, 0.06]);
    const loop = add(scene, new THREE.TorusGeometry(0.6, 0.06, 10, 40), rope, [-1.25, 2.3, 0.8], [0.3, 0.5, 0]);
    const coin = (x, y, z, r) => { const c = cyl(scene, mat('#ffcf2e', { metalness: 0.5, roughness: 0.3 }), [x, y, z], 0.2, 0.05, [Math.PI / 2 - 0.3, r, 0]); cyl(c, '#e0a81a', [0, 0.03, 0], 0.13, 0.03); };
    [[-0.6, 2.5, 1.0, 0.3], [-0.05, 2.75, 1.0, 0.8], [0.55, 2.8, 1.0, 0.1], [0.4, 2.45, 1.2, 1.2], [1.05, 2.6, 1.3, 0.5]].forEach((a) => coin(...a));
    const cs = [[-2.4, 0.5, 0.8], [2.6, 2.9, 0.2], [2.6, 0.6, 1.0]];
    cs.forEach(([x, y, z], i) => { const c = crescent(); c.position.set(x, y + 0.3, z); c.rotation.z = i * 1.2; c.scale.setScalar(0.9); scene.add(c); });
  },
});
