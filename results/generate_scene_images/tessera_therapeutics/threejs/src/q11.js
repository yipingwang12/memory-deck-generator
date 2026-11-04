// q11 — the egg falls into a garden under a SUMMER sun in Somerville; the TESSERACT lands in its new home.
function house() {
  const g = new THREE.Group(), side = mat('#e9c46a'), trim = mat('#ffffff'), glass = mat('#7fb8e8');
  for (let f = 0; f < 3; f++) {
    box(g, side, [0, 0.9 + f * 1.8, 0], [4.2, 1.8, 2.4]);
    box(g, trim, [0, 0.02 + f * 1.8, 1.21], [4.3, 0.1, 0.05]);
    for (const x of [-1.3, 0, 1.3]) { box(g, trim, [x, 1.0 + f * 1.8, 1.22], [0.7, 1.0, 0.04]); box(g, glass, [x, 1.0 + f * 1.8, 1.25], [0.55, 0.85, 0.03]); }
  }
  add(g, new THREE.CylinderGeometry(0, 1.9, 1.4, 4, 1), mat('#8a3a2a'), [0, 5.5, 0], [0, Math.PI / 4, 0], [1.2, 1, 0.75]);
  box(g, trim, [0, 0.45, 1.6], [4.0, 0.1, 0.8]); for (const x of [-1.8, 0, 1.8]) box(g, trim, [x, 0.9, 1.9], [0.1, 0.9, 0.1]);
  return g;
}
function sunflower(h) {
  const g = new THREE.Group(); cyl(g, '#3d8a35', [0, h / 2, 0], 0.03, h);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; blob(g, mat('#ffd21a'), [Math.cos(a) * 0.2, h, Math.sin(a) * 0.2 * 0.25 + 0.02], [0.13, 0.06, 0.03], [0, 0, a]); }
  blob(g, mat('#5a3a1a'), [0, h, 0.04], [0.14, 0.14, 0.05]);
  g.rotation.y = 0; return g;
}
run({
  sky: { cover: 1 }, ground: '#5fae3a',
  cam: { p: [0.0, 2.0, 7.6], t: [0.0, 2.0, 0] },
  build({ scene, mark, tess }) {
    const h = house(); h.position.set(-0.8, 0, -5.5); h.scale.setScalar(0.8); scene.add(h);
    // summer sun disc with rays
    const sun = new THREE.Group(); sun.position.set(4.8, 4.4, -9); scene.add(sun);
    add(sun, new THREE.CircleGeometry(1.7, 40), new THREE.MeshBasicMaterial({ color: '#fff2a0' }));
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(sun, new THREE.ConeGeometry(0.17, 0.9, 4), new THREE.MeshBasicMaterial({ color: '#ffd23a' }), [Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0], [0, 0, a - Math.PI / 2]); }
    // fence + sign
    for (let i = 0; i < 13; i++) { const x = -5 + i * 0.85; box(scene, '#ffffff', [x, 0.45, -2.2], [0.16, 0.9, 0.04]); add(scene, new THREE.ConeGeometry(0.08, 0.1, 4), mat('#ffffff'), [x, 0.95, -2.2], [0, Math.PI / 4, 0]); }
    box(scene, '#ffffff', [0, 0.35, -2.2], [11, 0.07, 0.04]); box(scene, '#ffffff', [0, 0.7, -2.2], [11, 0.07, 0.04]);
    const sg = new THREE.Group(); sg.position.set(-2.4, 0, 0.9); scene.add(sg);
    cyl(sg, '#6a4a2a', [0, 1.0, 0], 0.05, 2.0); box(sg, '#1f7a46', [0, 1.9, 0.05], [2.0, 0.55, 0.05]);
    const l = label('SOMERVILLE', 1.9, 0.42, { fg: '#ffffff' }); l.position.set(0, 1.9, 0.09); sg.add(l);
    const r = rng(6);
    for (let i = 0; i < 9; i++) { const f = sunflower(1.0 + r() * 1.0); f.position.set(i % 2 ? 2.6 + r() * 1.5 : -2.8 - r() * 1.2, 0, -1.0 + r() * 1.2); f.scale.setScalar(1.5); scene.add(f); }
    for (let i = 0; i < 40; i++) blob(scene, mat(['#ff8fa8', '#ffffff', '#ffd23a'][i % 3]), [(r() - 0.5) * 9, 0.06, -1.5 + r() * 3.5], [0.06, 0.06, 0.06]);
    // landed egg
    const bowl = eggBowl(1.2); bowl.position.set(0, 0, 0.4); bowl.rotation.z = 0.12; scene.add(bowl);
    const t = tess({ scale: 1.9 }); t.position.set(0, 0.92, 0.4); t.rotation.z = 0.12; mark(t);
    t.userData.pose({ arms: { l: [0, 2.3, 0], r: [0, 2.3, 0] } });
    const top = eggTop(0.8); top.position.set(2.0, 0.5, 1.2); top.rotation.set(0.3, 0.4, -0.9); scene.add(top);
  },
});
