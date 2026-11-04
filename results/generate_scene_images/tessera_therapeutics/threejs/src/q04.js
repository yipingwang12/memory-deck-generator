// q04 — with a glowing quill, the TESSERACT writes new letters straight into the genes of a cell: Gene Writing.
function helix(h = 2.6, r = 0.4) {
  const g = new THREE.Group(), cols = ['#ff4d6d', '#ffd23a', '#3fbf5a', '#2e8bff'];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = t * Math.PI * 4, y = t * h;
    const p1 = [Math.cos(a) * r, y, Math.sin(a) * r], p2 = [-Math.cos(a) * r, y, -Math.sin(a) * r];
    blob(g, mat('#ffffff'), p1, [0.07, 0.07, 0.07]); blob(g, mat('#ffffff'), p2, [0.07, 0.07, 0.07]);
    if (i % 2 === 0) { const rung = add(g, new THREE.CylinderGeometry(0.035, 0.035, 2 * r, 8), mat(cols[(i / 2) % 4 | 0]), [0, y, 0], [0, 0, Math.PI / 2]); rung.rotation.set(0, -a, Math.PI / 2); }
  }
  return g;
}
run({
  cam: { p: [0.4, 1.5, 5.4], t: [0.4, 1.3, 0] },
  build({ scene, mark, tess }) {
    // cell: big flattened disc facing camera, with a nucleus
    const cell = new THREE.Group(); cell.position.set(1.75, 1.45, -0.6); cell.scale.setScalar(0.85); scene.add(cell);
    blob(cell, mat('#ff9fb8'), [0, 0, 0], [2.1, 2.1, 0.45]); blob(cell, mat('#ffc4d4'), [0, 0, 0.3], [1.85, 1.85, 0.3]);
    blob(cell, mat('#9a6ad8'), [0, 0, 0.5], [1.3, 1.3, 0.3]);
    const hx = helix(); hx.position.set(0, -1.2, 0.9); hx.rotation.y = 0.3; cell.add(hx);
    // floating letters
    const L = [['A', '#ff4d6d', -0.9, 2.65], ['T', '#ffd23a', -0.25, 2.6], ['G', '#3fbf5a', 0.4, 2.65]];
    L.forEach(([c, col, x, y]) => { const l = label(c, 0.42, 0.42, { fg: '#fff', bg: col }); l.position.set(x + 0.3, y, 1.0); scene.add(l); });
    const t = tess({ scale: 1.8 }); t.position.set(-0.9, 0, 0.9); t.rotation.y = 0.45; mark(t);
    t.userData.pose({ arms: { r: [0, 0.4, 0] } }); t.userData.reach('l', [0.75, 1.3, 0.8]);
    // quill: pen shaft from tess hand toward helix
    const q = new THREE.Group(); scene.add(q);
    const hp = new THREE.Vector3(1.05, 1.55, 1.0), tip = new THREE.Vector3(1.4, 1.8, 1.3);
    t.updateMatrixWorld(true);
    const hand = t.userData.parts.hands.l.getWorldPosition(new THREE.Vector3());
    const dir = tip.clone().sub(hand), len = dir.length();
    const shaft = add(q, new THREE.CylinderGeometry(0.02, 0.03, len, 8), mat('#ffffff'), [0, 0, 0]); q.position.copy(hand).addScaledVector(dir, 0.5);
    q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    blob(q, mat('#ffffff'), [0.06, -len * 0.25, 0], [0.07, 0.35, 0.015], [0, 0, 0.3]); blob(q, mat('#cfd8ff'), [0.1, -len * 0.12, 0], [0.06, 0.28, 0.015], [0, 0, 0.4]);
    add(q, new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: '#7fe6ff' }), [0, len / 2, 0]);
    add(q, new THREE.SphereGeometry(0.19, 12, 8), new THREE.MeshBasicMaterial({ color: '#bff3ff' }), [0, len / 2, 0]).scale.setScalar(0.5);
  },
});
