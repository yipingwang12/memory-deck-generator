import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng, canvasTexture } from './common.js';
// q09 — With a second EDGE, the ASIMO robot builds cells that pack LENTILS into boxes: LV Edge.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#e8d2a6' });
  const a = createAsimo({ scale: 1.4 }); a.position.set(-1.15, 0, 0.0); a.rotation.y = 0.3; scene.add(a);
  a.userData.pose({ arms: { r: [0, 0.8] } });
  reachW(a, 'l', [-0.45, 1.1, 0.35]);
  const h = handPos(a, 'l');
  const bl = blade({ steel: '#9cc7ff', handle: '#ffc933', glow: '#9ff6ff' }); bl.scale.setScalar(1.2); bl.position.copy(h).add(V3(0.08, 0.1, 0)); bl.rotation.z = 0.85; scene.add(bl);
  // conveyor
  const cv = new THREE.Group(); cv.position.set(0.9, 0, 0.1); scene.add(cv);
  box(cv, '#3b4050', [3.0, 0.12, 0.8], [0.3, 0.5, 0]); for (const x of [-1.0, 1.6]) for (const z of [-0.3, 0.3]) cyl(cv, '#6b7285', 0.04, 0.04, 0.5, [x, 0.25, z]);
  for (let i = 0; i < 12; i++) cyl(cv, '#7d8599', 0.045, 0.045, 0.82, [-1.1 + i * 0.25, 0.5, 0], [Math.PI / 2, 0, 0]);
  box(cv, '#ffc933', [3.0, 0.04, 0.05], [0.3, 0.58, 0.41]);
  const r = rng(4);
  for (const x of [-0.7, 0.05]) {
    const c = new THREE.Group(); c.position.set(x, 0.9, 0); cv.add(c);
    blob(c, '#ff9ec2', [0, 0, 0], [0.3, 0.3, 0.3], [0, 0, 0], { transparent: true, opacity: 0.28, roughness: 0.2 });
    blob(c, '#b24d9c', [0.05, 0.03, 0], [0.09, 0.09, 0.09]);
    for (let i = 0; i < 26; i++) { const t = r() * 6.28, u = r() * 3.14, q = 0.12 + r() * 0.12; lens(c, ['#c4551c', '#d9742a', '#a8431a'][i % 3], [Math.cos(t) * Math.sin(u) * q * 1.1, Math.cos(u) * q, Math.sin(t) * Math.sin(u) * q * 1.1], 0.07); }
  }
  crate(cv, [0.95, 0.56, 0.0], 0.5, 0); crate(cv, [1.5, 0.56, 0.0], 0.5, 0.1);
  for (let i = 0; i < 6; i++) lens(cv, '#c4551c', [0.62 + i * 0.04, 0.78 + (i % 2) * 0.04 - i * 0.02, 0.0 + (i % 3) * 0.06], 0.045);
  wrap(stage, scene, a, { cam: [0.55, 1.0, 5.0], look: [0.55, 1.0, 0] });
});
