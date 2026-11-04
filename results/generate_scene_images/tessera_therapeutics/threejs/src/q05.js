// q05 — the TESSERACT signs the auntie's page with its own letters T-S-R-A and a number: TSRA-196.
run({
  cam: { p: [0.2, 1.6, 5.6], t: [0.2, 1.4, 0] },
  build({ scene, mark, tess }) {
    const t = tess({ scale: 1.8 }); t.position.set(-1.7, 0, 0.4); t.rotation.y = 0.55; mark(t);
    // page on an easel
    const e = new THREE.Group(); e.position.set(1.2, 0, 0); scene.add(e);
    for (const x of [-0.7, 0.7]) box(e, '#8a5a2c', [x, 1.2, -0.1], [0.08, 2.4, 0.08], [0, 0, x > 0 ? -0.04 : 0.04]);
    box(e, '#8a5a2c', [0, 0.45, 0.05], [1.8, 0.07, 0.12]);
    const p = page(1.7, 2.1); p.position.set(0, 0.55, 0.02); e.add(p);
    const a = label('T · S · R · A', 1.4, 0.38, { fg: '#c4302b' }); a.position.set(0, 2.15, 0.04); e.add(a);
    const b = label('TSRA-196', 1.5, 0.5, { fg: '#16348a' }); b.position.set(0, 1.35, 0.04); e.add(b);
    t.userData.pose({ arms: { r: [0, 0.3, 0] } });
    const tip = new THREE.Vector3(0.6, 1.2, 0.2);
    reachWorld(t, 'l', new THREE.Vector3(0.15, 1.3, 0.5));
    quill(scene, worldHand(t, 'l'), tip);
  },
});
