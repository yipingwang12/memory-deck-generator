// q01 — a white DOVE pecks the glowing egg open; the TESSERACT climbs out on its first day.
function dove() {
  const g = new THREE.Group(), w = mat('#ffffff'), sh = mat('#e8eefc');
  blob(g, w, [0, 0.5, 0], [0.55, 0.38, 0.3]);                       // body
  blob(g, w, [0.5, 0.78, 0], [0.22, 0.22, 0.2]);                    // head (faces +x)
  add(g, new THREE.ConeGeometry(0.07, 0.24, 12), mat('#ff9a2e'), [0.78, 0.74, 0], [0, 0, -Math.PI / 2 - 0.5]); // beak
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [0.58, 0.84, s * 0.15], [0.06, 0.075, 0.03]); blob(g, mat('#10101c'), [0.6, 0.84, s * 0.17], [0.035, 0.05, 0.02]);
    blob(g, mat('#fff'), [0.595, 0.865, s * 0.185], [0.013, 0.013, 0.01]);
    const wing = new THREE.Group(); wing.position.set(-0.05, 0.62, s * 0.22); wing.rotation.set(s * 0.9, 0, 0.25); g.add(wing);
    blob(wing, sh, [-0.1, 0.35, 0], [0.3, 0.55, 0.06], [0, 0, 0.5]);
  }
  add(g, new THREE.ConeGeometry(0.14, 0.6, 12), w, [-0.7, 0.42, 0], [0, 0, Math.PI / 2 + 0.25], [1, 1, 0.5]); // tail
  for (const z of [-0.1, 0.1]) { add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), mat('#ff8a5a'), [0.05, 0.15, z]); }
  return g;
}
run({
  cam: { p: [0.0, 1.8, 5.6], t: [0.0, 1.55, 0] },
  build({ scene, mark, tess }) {
    const bowl = eggBowl(1.2); scene.add(bowl);
    const t = tess({ scale: 1.75 }); t.position.set(0, 0.92, 0); t.rotation.y = -0.2;
    t.userData.pose({ arms: { l: [0, 2.2, 0], r: [0, 2.2, 0] }, legs: { l: [0, 0.1], r: [0, -0.1] } }); mark(t);
    const top = eggTop(0.95); top.position.set(2.4, 0.8, 0.5); top.rotation.set(0.3, 0.4, 0.9); scene.add(top);
    const d = dove(); d.scale.setScalar(1.05); d.position.set(-2.2, 0.1, 0.6); d.rotation.set(0, -0.35, 0); scene.add(d); mark(d);
    // glow motes
    const r = rng(2); for (let i = 0; i < 14; i++) add(scene, new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: '#cfeaff' }), [(r() - 0.3) * 3.6, 0.4 + r() * 2.6, (r() - 0.5) * 1.2]);
  },
});
