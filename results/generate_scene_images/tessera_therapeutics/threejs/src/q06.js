// q06 — a weak AUNTIE TRIPS on her ALPHA badge; lungs and liver lack one protein; the TESSERACT sees it.
function lungs() {
  const g = new THREE.Group(), pink = mat('#ff8aa6');
  for (const s of [-1, 1]) { blob(g, pink, [s * 0.3, 0, 0], [0.26, 0.4, 0.15], [0, 0, s * 0.2]); blob(g, mat('#ffb0c4'), [s * 0.26, 0.05, 0.1], [0.14, 0.26, 0.05], [0, 0, s * 0.2]); }
  cyl(g, '#f2d0a8', [0, 0.35, 0], 0.045, 0.4);
  return g;
}
function liver() {
  const g = new THREE.Group(); blob(g, mat('#9a3a22'), [0, 0, 0], [0.5, 0.26, 0.18], [0, 0, 0.15]); blob(g, mat('#b84a2c'), [-0.2, 0.08, 0.1], [0.24, 0.12, 0.06], [0, 0, 0.3]);
  blob(g, mat('#2e9a4a'), [0.3, -0.2, 0.05], [0.06, 0.09, 0.05]);
  return g;
}
run({
  cam: { p: [0.2, 1.6, 5.6], t: [0.2, 1.5, 0] },
  build({ scene, mark, tess }) {
    const a = makePerson({ skin: '#f0c8a0', shirt: '#9a5ab0', pants: '#6a7a8a', hair: '#cfcfd8', scale: 1.25 });
    const root = new THREE.Group(); root.position.set(-2.0, 0, 0); root.rotation.z = -0.5; scene.add(root); root.add(a); mark(root);
    blob(a.userData.head, mat('#cfcfd8'), [0, 0.2, -0.05], [0.1, 0.1, 0.1]);   // bun
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 20), mat('#222')); r.position.set(s * 0.075, -0.01, 0.2); a.userData.head.add(r); }
    box(a.userData.head, '#222', [0, -0.01, 0.21], [0.05, 0.01, 0.01]);
    cyl(a, mat('#6f4a8a'), [0, 0.85, 0], 0.34, 0.6, [0, 0, 0], 0.18);               // long skirt
    a.userData.arms.l.rotation.set(0, 0, 2.4); a.userData.arms.r.rotation.set(0.5, 0, -2.2);
    a.userData.legs.l.rotation.set(-0.7, 0, 0); a.userData.legs.r.rotation.set(0.2, 0, 0);
    a.userData.head.rotation.z = 0.3;
    // ALPHA badge underfoot
    const bd = new THREE.Group(); bd.position.set(-1.2, 0.05, 0.5); scene.add(bd);
    cyl(bd, '#1d3c8f', [0, 0, 0], 0.7, 0.1); cyl(bd, '#ffd23a', [0, 0.056, 0], 0.62, 0.02);
    const l = label('ALPHA', 1.1, 0.4, { fg: '#1d3c8f' }); l.rotation.x = -Math.PI / 2; l.position.set(0.2, 0.075, 0); bd.add(l);
    const t = tess({ scale: 1.8 }); t.position.set(1.2, 0, 0.2); t.rotation.y = -0.45; mark(t);
    t.userData.pose({ arms: { l: [0, 0.5, 0], r: [0, 0.6, 0] } });
    // thought cloud with lungs + liver
    const c = new THREE.Group(); c.position.set(1.6, 2.65, -0.2); scene.add(c);
    for (const [x, y, r] of [[0, 0, 0.9], [-0.8, -0.1, 0.55], [0.8, -0.1, 0.55], [-0.4, 0.45, 0.5], [0.4, 0.45, 0.5]]) blob(c, new THREE.MeshBasicMaterial({ color: '#ffffff' }), [x, y, 0], [r * 1.1, r * 0.8, r * 0.3]);
    const lu = lungs(); lu.position.set(-0.45, 0.05, 0.3); lu.scale.setScalar(0.85); c.add(lu);
    const li = liver(); li.position.set(0.5, -0.05, 0.3); li.scale.setScalar(0.8); c.add(li);
  },
});
