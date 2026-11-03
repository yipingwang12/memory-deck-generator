  // q01 — A NACHO cracks open the GLOBE's stealth shell.
  const S = makeScene({ ground: '#c9b48a' }), scene = S.scene;
  const globe = createGlobe({ scale: 1.5 }); globe.position.set(0.3, 0.38, 0.1); scene.add(S.character(globe));
  globe.userData.pose({ arms: { l: [0, 1.0, 0], r: [0, 1.0, 0] }, legs: { l: [0.2, 0], r: [-0.2, 0] } });
  // stealth shell: black faceted bowl with jagged shards
  const black = mat('#2e3552', { roughness: 0.35, metalness: 0.4 });
  const bowl = new THREE.SphereGeometry(0.88, 9, 4, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45);
  const shell = new THREE.Mesh(bowl, new THREE.MeshStandardMaterial({ color: '#2e3552', roughness: 0.35, metalness: 0.4, flatShading: true, side: THREE.DoubleSide }));
  shell.position.set(0.3, 0.8, 0.1); shell.castShadow = shell.receiveShadow = true; scene.add(shell);
  const R = rng(5);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + 0.2; if (Math.cos(a) > 0.45) continue;
    const s = add(scene, new THREE.ConeGeometry(0.16, 0.34 + R() * 0.2, 4), black, [0.3 + Math.sin(a) * 0.84, 0.72 + 0.14, 0.1 + Math.cos(a) * 0.84], [(R() - 0.5) * 0.4, a, (R() - 0.5) * 0.4]);
    s.material = new THREE.MeshStandardMaterial({ color: '#2e3552', roughness: 0.35, metalness: 0.4, flatShading: true });
  }
  // fallen shards on the sand
  for (let i = 0; i < 6; i++) add(scene, new THREE.TetrahedronGeometry(0.1 + R() * 0.07), black, [-1.9 + R() * 4.6, 0.06, 1 + R() * 0.8], [R() * 3, R() * 3, R() * 3]);
  // the NACHO: big triangular chip with cheese and jalapeños, smashing in from the left
  const nacho = new THREE.Group();
  const chip = add(nacho, new THREE.CylinderGeometry(0.62, 0.62, 0.1, 3, 1), mat('#f0b43c', { roughness: 0.8 }), [0, 0, 0], [Math.PI / 2, Math.PI / 6, 0]);
  chip.geometry.rotateX(0);
  const cheese = mat('#ff9a1c', { roughness: 0.35 });
  blob(nacho, cheese, [0, 0, 0.07], [0.26, 0.2, 0.05]);
  for (const [x, y] of [[-0.18, -0.12], [0.2, -0.1], [0, 0.16]]) { add(nacho, new THREE.TorusGeometry(0.075, 0.03, 10, 24), mat('#3f9a2e'), [x, y, 0.13]); blob(nacho, mat('#e8f08a'), [x, y, 0.12], [0.05, 0.05, 0.02]); }
  for (const x of [-0.25, 0.05, 0.3]) blob(nacho, cheese, [x, -0.38, 0.06], [0.05, 0.14, 0.05]);
  nacho.position.set(-0.85, 1.05, 1.0); nacho.scale.setScalar(0.9); nacho.rotation.set(0.1, 0.35, 0.95); scene.add(nacho);
