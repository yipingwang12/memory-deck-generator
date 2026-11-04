// q09 — in March, a MILL grinds through the TESSERACT's lab, and about a third of its staff walk out with their boxes.
function windmill() {
  const g = new THREE.Group(), wall = mat('#e8dcc0'), roof = mat('#a8432d'), wood = mat('#8a5a2c');
  add(g, new THREE.CylinderGeometry(0.9, 1.4, 3.4, 24), wall, [0, 1.7, 0]);
  add(g, new THREE.ConeGeometry(1.05, 1.0, 24), roof, [0, 3.85, 0]);
  box(g, mat('#5a3a1c'), [0, 0.55, 1.25], [0.6, 1.1, 0.1]); box(g, mat('#7fb8e8'), [0, 2.3, 1.0], [0.4, 0.5, 0.1]);
  const hub = new THREE.Group(); hub.position.set(0, 3.5, 1.1); hub.rotation.z = 0.5; g.add(hub);
  blob(hub, wood, [0, 0, 0], [0.18, 0.18, 0.18]);
  for (let i = 0; i < 4; i++) { const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; hub.add(arm); box(arm, wood, [0, 1.1, 0], [0.1, 2.2, 0.06]); box(arm, '#f2ecdc', [0.28, 1.35, 0.04], [0.5, 1.4, 0.03]); }
  return g;
}
function millstone() {
  const g = new THREE.Group(), st = mat('#9a9a9e');
  cyl(g, st, [0, 0.12, 0], 0.9, 0.24); cyl(g, mat('#85858a'), [0, 0.27, 0], 0.8, 0.08); cyl(g, '#3a3a3e', [0, 0.32, 0], 0.14, 0.04);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; box(g, '#6a6a70', [Math.cos(a) * 0.45, 0.325, Math.sin(a) * 0.45], [0.7, 0.02, 0.05], [0, -a, 0]); }
  return g;
}
run({
  cam: { p: [0.0, 1.8, 6.4], t: [0.0, 1.7, 0] },
  build({ scene, mark, tess }) {
    const m = windmill(); m.position.set(-2.9, 0, -1.8); m.scale.setScalar(0.62); scene.add(m);
    const ms = millstone(); ms.position.set(-2.1, 0, 0.9); ms.scale.setScalar(1.1); scene.add(ms);
    for (const [x, z] of [[-3.1, 0.2], [-1.7, 1.5]]) { const s = add(scene, new THREE.SphereGeometry(0.4, 16, 12), mat('#f5efe0'), [x, 0.38, z], [0, 0, 0], [0.9, 1.0, 0.8]); box(scene, '#8a5a2c', [x, 0.82, z], [0.2, 0.05, 0.1]); }
    const t = tess({ scale: 1.7 }); t.position.set(-0.1, 0, 0.5); t.rotation.y = -0.2; mark(t);
    t.userData.pose({ headTilt: 0.12, arms: { l: [0, 0.15, 0], r: [0, 0.15, 0] } });
    const cols = ['#e0304a', '#2e8bff', '#3fbf5a', '#ff8a2a'];
    [[1.4, 0, 0], [2.05, 0, 1], [2.7, 0, 2]].forEach(([x, z, i]) => {
      const p = makePerson({ shirt: cols[i], pants: '#3a3a4a', hair: ['#2a1a12', '#5a3a1c', '#1a1a1a'][i], scale: 0.8 }); p.position.set(x, 0, 1.0); p.rotation.y = 1.15; scene.add(p); mark(p);
      p.userData.arms.l.rotation.set(-1.3, 0, 0); p.userData.arms.r.rotation.set(-1.3, 0, 0);
      p.userData.legs.l.rotation.x = 0.4; p.userData.legs.r.rotation.x = -0.4;
      box(p, '#c89a5a', [0, 1.1, 0.5], [0.5, 0.42, 0.42]); box(p, '#e8c88a', [0, 1.32, 0.5], [0.52, 0.04, 0.44]);
    });
  },
});
