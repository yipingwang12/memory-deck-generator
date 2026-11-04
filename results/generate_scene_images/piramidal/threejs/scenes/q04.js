// q04: In the ICU, a CLEVER LAND clinic (Cleveland Clinic) works with the PIRANHA.
boot({ sky: { cover: .02, puffCover: .02, towerTop: .02 } }, ({ stage, scene, num, mark }) => {
  room(scene, { w: 16, d: 9 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: textTex('ICU', { w: 512, h: 256, bg: '#d8404f', size: 170 }) }));
  sign.position.set(-3.3, 3.0, -3.9); scene.add(sign);
  const bed = createBed(); bed.position.set(3.4, 0, -2.4); scene.add(bed);
  const mon = createMonitor({ w: .9, h: .65 }); mon.position.set(1.9, 0, -3.2); scene.add(mon);
  box(scene, mat('#b7d9d3'), [-1, 1.5, -3.95], [1.4, 1.8, .05]);
  // land + clinic
  const turf = cyl(scene, mat('#5fb34a', { roughness: 1 }), [.2, .08, .3], 2.3, .16, [0, 0, 0], 2.15);
  const cl = new THREE.Group(), wh = mat('#fbfbf6');
  box(cl, wh, [0, .38, 0], [.8, .76, .56]); box(cl, mat('#1f8a6a'), [0, .8, 0], [.92, .1, .68]); box(cl, mat('#1f8a6a'), [0, .9, 0], [.62, .1, .5]);
  box(cl, mat('#1f8a6a'), [0, .62, .29], [.34, .1, .02]); box(cl, mat('#1f8a6a'), [0, .62, .29], [.1, .34, .02]);
  box(cl, mat('#7a4a2a'), [0, .14, .29], [.22, .28, .02]);
  for (const s of [-1, 1]) {
    blob(cl, mat('#fff', { roughness: .3 }), [s * .17, .4, .29], [.1, .12, .02]); blob(cl, mat('#2b4a3a'), [s * .17, .39, .31], [.075, .1, .015]);
    blob(cl, mat('#111'), [s * .17, .39, .325], [.04, .06, .01]); blob(cl, mat('#fff'), [s * .15, .43, .335], [.02, .022, .01]);
    cyl(cl, mat('#222'), [s * .17, .4, .31], .115, .015, [Math.PI / 2, 0, 0], .115).scale.set(1, 1, 1);
  }
  cl.children.slice(-2).forEach((m) => { m.geometry.dispose(); m.geometry = new THREE.TorusGeometry(.12, .012, 8, 24); m.rotation.set(0, 0, 0); m.scale.set(1, 1.1, 1); m.position.z = .305; });
  add(cl, new THREE.TorusGeometry(.04, .012, 8, 14, Math.PI), mat('#8a3a3a'), [0, .22, .295], [0, 0, Math.PI]);
  blob(cl, mat('#ffe680', { emissive: '#ffd54a', emissiveIntensity: .8, roughness: .2 }), [0, 1.18, 0], [.15, .17, .15]); cyl(cl, mat('#888'), [0, 1.03, 0], .06, .08);
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + .8; box(cl, mat('#ffd54a'), [Math.cos(a) * .3, 1.2 + Math.sin(a) * .3, 0], [.1, .025, .025], [0, 0, a]); }
  cl.position.set(1.1, .16, .3); cl.scale.setScalar(1.6); scene.add(cl); mark(cl);
  const H = [-.28, .5, 1.0], sk = mat('#fbfbf6');
  mark(rod(scene, [.3, .85, .6], H, .06, sk)); mark(blob(scene, sk, H, [.07, .07, .07]));
  const p = createPiranha({ scale: 1.5 }); p.position.set(-.95, .16, .75); p.rotation.y = .45; scene.add(p); mark(p);
  p.userData.pose({ jaw: .08 }); p.updateMatrixWorld(true);
  const t = p.worldToLocal(new THREE.Vector3(...H)); p.userData.reach('r', [t.x, t.y, t.z]);
  look(stage, num, [.2, 1.4, 5.3], [.1, 1.1, 0]);
});
