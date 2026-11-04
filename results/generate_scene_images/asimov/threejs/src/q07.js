import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q07 — With a sharp EDGE, the ASIMO robot trims RNA ribbons into better medicines: RNA Edge.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#f1dcb9' });
  const a = createAsimo({ scale: 1.45 }); a.position.set(-0.95, 0, 0.1); a.rotation.y = 0.25; scene.add(a);
  a.userData.pose({ arms: { r: [0, 1.0] } });
  reachW(a, 'l', [-0.3, 0.95, 0.3]);
  const h = handPos(a, 'l');
  const bl = blade(); bl.scale.setScalar(1.3); bl.position.copy(h).add(V3(0.1, 0.02, 0)); bl.rotation.z = 0.1; scene.add(bl);
  const cutY = h.y - 0.1 * 1.25 * 0.5 - 0.0;
  const colors = ['#ff5a5f', '#ffc83d', '#3ec27a', '#3b8bf0'];
  const rail = new THREE.Group(); scene.add(rail);
  box(rail, '#6e4a26', [1.9, 0.08, 0.1], [0.9, 2.2, 0.1]); for (const x of [-0.05, 1.85]) box(rail, '#6e4a26', [0.08, 2.2, 0.1], [x, 1.1, 0.1]);
  const strand = (x, z, y0, y1, c, ph = 0) => {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([x + 0.07 * Math.sin(t * 9 + ph), y0 + (y1 - y0) * t, z]); }
    ribbon(rail, c, pts, 0.17, { emissive: c, emissiveIntensity: 0.12 });
    for (let i = 1; i < 40; i += 2) { const p = pts[i]; blob(rail, colors[(i / 2 | 0) % 4], [p[0] + 0.12, p[1], z], [0.035, 0.035, 0.035]); blob(rail, colors[((i / 2 | 0) + 2) % 4], [p[0] - 0.12, p[1], z], [0.035, 0.035, 0.035]); }
  };
  strand(0.65, 0.2, 2.15, cutY + 0.04, '#ff9ec2'); strand(0.7, 0.2, cutY - 0.08, cutY - 0.55, '#ff9ec2', 2);
  strand(1.15, -0.1, 2.15, 0.7, '#9ed2ff', 1); strand(1.6, -0.25, 2.15, 0.9, '#c4f09e', 3);
  const pill = (x, y, z, rot, c1, c2) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(...rot); scene.add(g);
    add(g, new THREE.CapsuleGeometry(0.075, 0.12, 8, 16), mat(c1, { roughness: 0.3 }), [0, 0.06, 0]); add(g, new THREE.CapsuleGeometry(0.075, 0.12, 8, 16), mat(c2, { roughness: 0.3 }), [0, -0.06, 0]).scale.set(1.0, 0.5, 1.0); };
  pill(1.0, 0.09, 0.9, [0, 0, 1.5], '#ff5a5f', '#ffffff'); pill(1.5, 0.09, 0.6, [0, 0.6, 1.4], '#3b8bf0', '#ffffff'); pill(1.25, 0.09, 1.2, [0, 0.2, 1.7], '#3ec27a', '#ffffff');
  pill(0.75, 0.5, 0.45, [0.4, 0, 0.7], '#ffc83d', '#ffffff'); pill(0.95, 0.3, 0.7, [0, 0, 0.4], '#ff9ec2', '#ffffff');
  wrap(stage, scene, a, { cam: [0.4, 1.05, 3.9], look: [0.4, 1.05, 0] });
});
