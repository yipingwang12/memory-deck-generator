import { THREE, guard, makeStage, createAsimo, wrap, blob, box, cyl, add, mat, limbTo, limbArm, textPlane, tube, ribbon, dnaHelix, blade, person, armW, reachW, handPos, lens, crate, V3, rng } from './common.js';
// q08 — A CHRYSALIS opens on the ASIMO robot's hand, and the butterfly folds itself into the genome.
function butterfly() {
  const g = new THREE.Group();
  const fan = (P, c1, c2, s, z) => P.slice(1, -1).forEach((_, i) => {
    const t = new THREE.BufferGeometry(); const v = [P[0], P[i + 1], P[i + 2]].flatMap(([x, y]) => [x * s, y, z]);
    t.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); t.computeVertexNormals();
    const m = new THREE.Mesh(t, new THREE.MeshStandardMaterial({ color: i % 2 ? c1 : c2, side: THREE.DoubleSide, roughness: 0.6 })); m.castShadow = true; g.add(m); });
  const up = [[0.02, 0.03], [0.1, 0.28], [0.3, 0.42], [0.52, 0.36], [0.5, 0.14], [0.24, 0.0]];
  const lo = [[0.02, -0.01], [0.24, 0.0], [0.4, -0.12], [0.34, -0.34], [0.14, -0.4], [0.04, -0.2]];
  const grow = (P, k) => { const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length; return P.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]); };
  for (const s of [-1, 1]) {
    fan(grow(up, 1.1), '#151515', '#151515', s, -0.004); fan(grow(lo, 1.12), '#151515', '#151515', s, -0.004);
    fan(up, '#ff8a1a', '#ff6a00', s, 0); fan(lo, '#ffb02e', '#ff9a1a', s, 0.001);
    for (const [x, y] of [[0.42, 0.3], [0.5, 0.2], [0.3, -0.3], [0.2, -0.34]]) blob(g, '#fff', [s * x, y, 0.004], [0.02, 0.02, 0.005]);
  }
  blob(g, '#222', [0, 0, 0], [0.035, 0.2, 0.035]); blob(g, '#222', [0, 0.22, 0], [0.05, 0.05, 0.05]);
  for (const s of [-1, 1]) limbTo(g, '#222', 0.007, [0, 0.25, 0], [s * 0.1, 0.42, 0]);
  return g;
}
guard(() => {
  const { stage, scene } = makeStage({ ground: '#bfe08a' });
  const a = createAsimo({ scale: 1.4 }); a.position.set(-1.0, 0, 0.1); a.rotation.y = 0.3; scene.add(a);
  a.userData.pose({ arms: { r: [0, 0.6] } });
  reachW(a, 'l', [-0.35, 0.9, 0.45]);
  const h = handPos(a, 'l');
  const ch = new THREE.Group(); ch.position.copy(h).add(V3(0, 0.07, 0.0)); ch.scale.setScalar(2.2); scene.add(ch);
  const prof = (y0, y1) => [[0, 0], [0.05, 0.03], [0.075, 0.12], [0.07, 0.2], [0.04, 0.27], [0, 0.3]].filter((p) => p[1] >= y0 && p[1] <= y1).map(([r, y]) => new THREE.Vector2(r, y - y0));
  const shell = mat('#8fe07a', { roughness: 0.4 });
  add(ch, new THREE.LatheGeometry([[0.0, 0], [0.05, 0.03], [0.075, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 20), shell);
  for (const s of [-1, 1]) { const gp = new THREE.Group(); gp.position.set(0, 0.12, 0); gp.rotation.z = s * 0.32; ch.add(gp);
    const half = add(gp, new THREE.LatheGeometry([[0.075, 0], [0.07, 0.08], [0.04, 0.15], [0.0, 0.18]].map(([r, y]) => new THREE.Vector2(r, y)), 14, s > 0 ? 0 : Math.PI, Math.PI), shell); half.material.side = THREE.DoubleSide; }
  blob(ch, '#ffb02e', [0, 0.13, 0], [0.05, 0.03, 0.05], [0, 0, 0], { emissive: '#ff9a1a', emissiveIntensity: 0.8 });
  for (let i = 0; i < 4; i++) blob(ch, '#ffd84a', [0.06, 0.04 + i * 0.025, 0.03], [0.012, 0.012, 0.012]);
  const b = butterfly(); b.scale.setScalar(0.95); b.position.set(0.45, 1.7, 0.35); b.rotation.set(-0.1, -0.2, -0.3); scene.add(b);
  const dna = dnaHelix(scene, { h: 1.9, r: 0.26, turns: 2.5, n: 28 }); dna.position.set(1.6, 0.08, 0); dna.scale.setScalar(1.1);
  const star = (p, s = 0.045) => add(scene, new THREE.OctahedronGeometry(s), mat('#ffe566', { emissive: '#ffd23f', emissiveIntensity: 1 }), p);
  for (let i = 0; i < 9; i++) { const t = i / 8; star([0.6 + 0.65 * t, 1.5 - 0.3 * t + 0.08 * Math.sin(t * 9), 0.4], 0.04 + 0.01 * Math.sin(i * 2)); }
  wrap(stage, scene, a, { cam: [0.3, 1.05, 4.0], look: [0.3, 1.05, 0] });
});
