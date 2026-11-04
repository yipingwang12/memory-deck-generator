A FRAU in a HOF (Fraunhofer) sews the ZANDER's electrode patches.
===
{}
===
  ground(scene, '#9bbf5a'); add(scene, new THREE.PlaneGeometry(400, 3.5), mat('#c9a66b'), [0, 0.003, 1.3], [-Math.PI / 2, 0, 0]);
  const prof = new THREE.Shape(); [[-2.2, 0], [2.2, 0], [2.2, 2.4], [0, 3.6], [-2.2, 2.4]].forEach(([x, y], i) => prof[i ? 'lineTo' : 'moveTo'](x, y));
  const barn = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: 2.6, bevelEnabled: false }), mat('#b8432f')); barn.position.set(0.2, 0, -4.6); barn.castShadow = barn.receiveShadow = true; scene.add(barn);
  box(scene, '#fff4e0', [0.2, 1.1, -1.98], [1.7, 2.2, 0.06]); box(scene, '#8a2a1e', [0.2, 1.1, -1.94], [1.7, 0.14, 0.05], [0, 0, 0.9]); box(scene, '#8a2a1e', [0.2, 1.1, -1.94], [1.7, 0.14, 0.05], [0, 0, -0.9]);
  box(scene, '#fff4e0', [0.2, 2.9, -1.98], [0.7, 0.55, 0.06]);
  for (const [x, z, r] of [[-3.6, -1.2, 0], [-3.3, -0.6, 0], [3.4, -1.0, 0], [3.9, -0.3, 0]]) buildHay(scene, x, z, r);
  for (let i = 0; i < 9; i++) box(scene, '#8a5a2c', [-4.5 + i * 1.1, 0.35, 0], [0.08, 0.7, 0.08]);
  box(scene, '#8a5a2c', [0, 0.5, 0], [10, 0.06, 0.05]); box(scene, '#8a5a2c', [0, 0.25, 0], [10, 0.06, 0.05]);
  box(scene, '#a8794a', [-1.15, 0.78, 0.55], [1.5, 0.08, 0.8]); for (const x of [-1.8, -0.5]) for (const zz of [0.25, 0.85]) cyl(scene, '#7a4a22', [x, 0.37, zz], 0.04, 0.74);
  const mach = new THREE.Group(); box(mach, '#2a2f3a', [0, 0.04, 0], [0.5, 0.08, 0.3]); box(mach, '#e8e6ea', [0, 0.22, -0.06], [0.44, 0.22, 0.14]); box(mach, '#e8e6ea', [0.17, 0.33, 0.02], [0.14, 0.1, 0.14]); cyl(mach, '#888', [0.2, 0.2, 0.05], 0.01, 0.2); blob(mach, '#d8283a', [-0.2, 0.28, 0.08], [0.05, 0.05, 0.02]); mach.position.set(-1.15, 0.82, 0.55); scene.add(mach);
  const patch = (x, y, zz, rx = 0) => { const g = new THREE.Group(); cyl(g, '#ffffff', [0, 0, 0], 0.09, 0.012); cyl(g, mat('#c0c8d0', { metalness: 0.8, roughness: 0.3 }), [0, 0.008, 0], 0.035, 0.012); blob(g, '#ffcf2e', [0, 0.014, 0], [0.012, 0.012, 0.012]); g.position.set(x, y, zz); g.rotation.x = rx; scene.add(g); return g; };
  patch(-0.7, 0.835, 0.72); patch(-0.95, 0.835, 0.8); patch(-1.45, 0.835, 0.78);
  const frau = buildFrau(); frau.scale.setScalar(1.7); frau.position.set(-1.15, 0, 0.0); scene.add(frau);
  const sh = (s) => [-1.15 + s * 0.2 * 1.7, 0.7 * 1.7, 0.0];
  for (const [s, hx] of [[1, -0.95], [-1, -1.3]]) { const a = sh(s), h = [hx, 0.86, 0.5], el = [(a[0] + h[0]) / 2 + s * 0.12, 0.8, 0.3]; limbBetween(scene, a, el, 0.035, '#c0392b'); limbBetween(scene, el, h, 0.03, '#ffe0c4'); blob(scene, '#ffe0c4', h, [0.045, 0.04, 0.045]); }
  const z = createZander({ scale: 1.9 }); z.position.set(1.7, 0, 0.7); z.rotation.y = -0.4; scene.add(z);
  z.userData.pose({ headTilt: 0.07, arms: { r: [0, -0.4, 0] } });
  z.updateMatrixWorld(true); const tg = z.worldToLocal(new THREE.Vector3(1.0, 1.3, 1.0)); z.userData.reach('l', [tg.x, tg.y, tg.z]);
  patch(1.0, 1.3, 1.0, Math.PI / 2);
  camera(stage, num, { c: [0.3, 1.6, 5.6], t: [0.3, 1.25, 0] });
  finish(stage, [z]);
