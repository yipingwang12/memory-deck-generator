// q10 — a SPRINTER on a fast TRACK runs an ORPHAN child to the TESSERACT's page.
run({
  ground: '#6fae45', cam: { p: [0.2, 1.6, 6.0], t: [0.2, 1.3, 0] },
  build({ scene, mark, tess }) {
    // red track with white lane lines
    box(scene, '#c8533a', [0, 0.01, 0.6], [30, 0.02, 4.6]);
    for (const z of [-0.9, 0.3, 1.5, 2.7]) box(scene, '#ffffff', [0, 0.025, z], [30, 0.01, 0.07]);
    box(scene, '#ffffff', [-0.7, 0.026, 0.9], [0.1, 0.01, 1.2]);
    const sp = makePerson({ shirt: '#1d4fd8', pants: '#111827', hair: '#2a1a12', scale: 1.25 }); sp.position.set(-1.0, 0, 1.3); sp.rotation.y = 1.15; scene.add(sp); mark(sp);
    sp.userData.legs.l.rotation.x = -0.9; sp.userData.legs.r.rotation.x = 0.9;
    sp.userData.arms.l.rotation.set(-1.2, 0, 0.2); sp.userData.arms.r.rotation.set(-1.2, 0, -0.2);
    box(sp, '#ffffff', [0, 1.25, 0.18], [0.3, 0.3, 0.02]); box(sp.userData.head, '#e0304a', [0, 0.1, 0], [0.42, 0.06, 0.4]);
    // orphan child, carried in the arms
    const ch = makePerson({ shirt: '#8a7a5a', pants: '#5a4a3a', hair: '#7a4a1a', scale: 0.55 }); ch.position.set(0.0, 0.7, 0.55); ch.rotation.set(Math.PI / 2 - 0.2, 0, 0); sp.add(ch);
    ch.scale.setScalar(0.56); ch.position.set(0.05, 0.62, 0.5); ch.rotation.set(0, -1.15, 0); ch.userData.head.scale.setScalar(1.3);
    box(ch.userData.head, '#6a5a3a', [0, 0.17, 0], [0.4, 0.1, 0.4]); box(ch, '#a08a5a', [0.0, 1.12, 0.22], [0.2, 0.2, 0.02]);
    // speed lines
    for (const [x, y, w] of [[-3.4, 1.4, 1.2], [-3.2, 0.9, 1.6], [-3.6, 1.9, 1.0]]) box(scene, '#ffffff', [x, y, 0.8], [w, 0.04, 0.02]);
    const t = tess({ scale: 1.8 }); t.position.set(1.6, 0, 0.6); t.rotation.y = -0.4; mark(t);
    const p = page(0.9, 1.2); p.position.set(0.55, 0.9, 1.0); p.rotation.set(0, 0.1, 0.1); scene.add(p);
    reachWorld(t, 'r', new THREE.Vector3(0.45, 1.5, 1.0)); reachWorld(t, 'l', new THREE.Vector3(2.5, 1.8, 0.5)); t.userData.pose({});
    reachWorld(t, 'r', new THREE.Vector3(0.5, 1.45, 1.05));
  },
});
