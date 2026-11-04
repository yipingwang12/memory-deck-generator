import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q04 — The ASIMO robot rents out three things from its chest: DNA bricks, a drawing board (CAD), a dreaming machine.
guard(() => {
  const { stage, scene } = makeStage({ ground: '#ecd3a0' });
  const a = createAsimo({ scale: 1.4 }); a.position.set(0, 0, 0); scene.add(a);
  a.userData.pose({ arms: { l: [0, 1.15], r: [0, 1.15] } });
  // DNA bricks
  const bricks = new THREE.Group(); bricks.position.set(-1.6, 0.05, 0); bricks.scale.setScalar(1.15); scene.add(bricks);
  const cols = ['#e8453c', '#f5b82e', '#37a86b', '#3b7bd8'];
  for (let i = 0; i < 12; i++) {
    const th = i * 0.55, y = 0.06 + i * 0.09;
    for (const s of [0, 1]) {
      const g = new THREE.Group(); g.position.set(Math.cos(th + s * Math.PI) * 0.2, y, Math.sin(th + s * Math.PI) * 0.2); g.rotation.y = -(th + s * Math.PI) + Math.PI / 2; bricks.add(g);
      box(g, cols[(i + s * 2) % 4], [0.32, 0.1, 0.13], [0, 0, 0]); for (const sx of [-0.08, 0.08]) cyl(g, cols[(i + s * 2) % 4], 0.032, 0.032, 0.03, [sx, 0.06, 0]);
    }
    box(bricks, cols[(i + 1) % 4], [0.24, 0.045, 0.05], [0, y, 0], [0, -th, 0]);
  }
  // CAD drawing board
  const E = new THREE.Group(); E.position.set(1.65, 0, 0); E.rotation.y = -0.3; scene.add(E);
  for (const x of [-0.35, 0.35]) limbTo(E, '#8a5a2e', 0.025, [x, 0.0, -0.15], [x * 0.9, 1.05, -0.05]);
  limbTo(E, '#8a5a2e', 0.025, [0, 0.0, -0.45], [0, 0.95, -0.12]);
  const bd = new THREE.Group(); bd.position.set(0, 0.85, 0.0); bd.rotation.x = -0.12; E.add(bd);
  box(bd, '#6e4a26', [1.0, 0.76, 0.05], [0, 0, 0]);
  textPlane(bd, '', 0.92, 0.68, [0, 0, 0.03], [0, 0, 0], { bg: '#1c55a6', draw: (c, w, h) => {
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineJoin = 'round'; const cx = w * 0.42, cy = h * 0.5, s = h * 0.27;
    const P = (x, y) => [cx + x * s, cy + y * s]; const L = (p, q) => { c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); };
    const A = [P(-1, -0.5), P(0, -1), P(1, -0.5), P(1, 0.6), P(0, 1.1), P(-1, 0.6)]; c.beginPath(); A.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.stroke();
    L(P(-1, -0.5), P(0, 0)); L(P(1, -0.5), P(0, 0)); L(P(0, 0), P(0, 1.1));
    c.beginPath(); c.arc(w * 0.82, h * 0.3, h * 0.14, 0, 7); c.stroke(); L([w * 0.7, h * 0.78], [w * 0.95, h * 0.78]); L([w * 0.7, h * 0.7], [w * 0.7, h * 0.86]); L([w * 0.95, h * 0.7], [w * 0.95, h * 0.86]);
  } });
  // dreaming machine
  const D = new THREE.Group(); D.position.set(0, 2.1, 0); scene.add(D);
  box(D, '#2f9aa8', [0.7, 0.34, 0.4], [0, 0, 0]); box(D, '#1f6f7c', [0.74, 0.06, 0.44], [0, 0.18, 0]);
  for (const s of [-1, 0, 1]) cyl(D, '#ffd84a', 0.05, 0.05, 0.04, [s * 0.2, -0.02, 0.21], [Math.PI / 2, 0, 0], { emissive: '#ffd84a', emissiveIntensity: 0.4 });
  for (const [x, y, r] of [[-0.25, 0.4, 0.2], [0, 0.55, 0.26], [0.27, 0.42, 0.2], [0, 0.4, 0.2], [-0.1, 0.72, 0.15], [0.14, 0.7, 0.15]]) blob(D, '#f6e8ff', [x, y, 0], [r, r, r * 0.8], [0, 0, 0], { emissive: '#c9a6ff', emissiveIntensity: 0.45 });
  const r = rng(9); for (let i = 0; i < 8; i++) { const st = add(D, new THREE.OctahedronGeometry(0.05), mat('#ffe566', { emissive: '#ffd23f', emissiveIntensity: 1 }), [(r() - 0.5) * 1.3, 0.15 + r() * 0.8, 0.1]); }
  add(D, new THREE.TorusGeometry(0.13, 0.04, 10, 24, Math.PI * 1.4), mat('#ffe566', { emissive: '#ffd23f', emissiveIntensity: 1 }), [0.62, 0.62, 0], [0, 0, 1.2]);
  a.updateMatrixWorld(true); const ch = a.userData.parts.chest.getWorldPosition(V3());
  for (const t of [[-1.4, 0.8, 0.15], [1.4, 1.0, 0.1], [0, 1.9, 0.05]]) limbTo(scene, '#fff1b0', 0.012, ch.toArray(), t, { emissive: '#ffe58a', emissiveIntensity: 1.2 });
  wrap(stage, scene, a, { cam: [0, 1.2, 4.9], look: [0, 1.2, 0] });
});
