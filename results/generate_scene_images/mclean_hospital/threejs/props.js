// McLean scene props: baker, microscope, phone, mood faces, mountain, tree, gear, brain, pizza.
import { THREE, mat, add, blob, rng } from './stage_common.js';
import { canvasTexture } from './kit.js';

/** Cylinder segment between two points. */
export function seg(parent, a, b, r, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), m);
  o.position.copy(A.clone().add(B).multiplyScalar(0.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  o.castShadow = true; parent.add(o); return o;
}
/** Two-segment arm from shoulder to hand with a bent elbow. */
export function arm(parent, sh, hand, len, m, bend = [0, -0.5, -0.3]) {
  const S = new THREE.Vector3(...sh), H = new THREE.Vector3(...hand), d = H.clone().sub(S), D = Math.min(d.length(), 2 * len - 1e-3);
  const h = Math.sqrt(len * len - (D / 2) ** 2), E = S.clone().add(d.clone().normalize().multiplyScalar(D / 2)).add(new THREE.Vector3(...bend).normalize().multiplyScalar(h));
  seg(parent, S.toArray(), E.toArray(), 0.045, m); seg(parent, E.toArray(), H.toArray(), 0.04, m);
  blob(parent, m, E.toArray(), [0.05, 0.05, 0.05]); blob(parent, mat('#ffd9b8'), H.toArray(), [0.06, 0.06, 0.06]);
}

/** Baker: chef hat, white jacket, apron. Faces +z, ~1.7 tall. handsL/R = world-local hand targets. */
export function buildBaker({ handL = [0.55, 1.1, 0.5], handR = [-0.55, 1.1, 0.5] } = {}) {
  const g = new THREE.Group(), white = mat('#fbf7ee'), skin = mat('#ffd9b8'), pants = mat('#3b4a73');
  for (const s of [-1, 1]) { seg(g, [s * 0.1, 0.05, 0], [s * 0.1, 0.8, 0], 0.07, pants); blob(g, mat('#2a2220'), [s * 0.1, 0.04, 0.05], [0.09, 0.05, 0.13]); }
  add(g, new THREE.CylinderGeometry(0.2, 0.25, 0.7, 24), white, [0, 1.1, 0]);
  add(g, new THREE.BoxGeometry(0.36, 0.55, 0.03), mat('#e9a26a'), [0, 0.98, 0.225]);
  for (const y of [1.2, 1.1, 1.0]) blob(g, mat('#9a5a2a'), [0, y, 0.21], [0.025, 0.025, 0.012]);
  const head = new THREE.Group(); head.position.y = 1.62; g.add(head);
  blob(head, skin, [0, 0, 0], [0.19, 0.2, 0.19]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [s * 0.07, 0.02, 0.165], [0.045, 0.055, 0.02]); blob(head, mat('#4a2a1a'), [s * 0.07, 0.015, 0.18], [0.033, 0.044, 0.02]);
    blob(head, mat('#fff'), [s * 0.063, 0.035, 0.195], [0.011, 0.011, 0.01]); blob(head, mat('#ff9aa8'), [s * 0.1, -0.05, 0.15], [0.035, 0.02, 0.02]);
    seg(head, [s * 0.04, 0.1, 0.17], [s * 0.1, 0.095, 0.16], 0.008, mat('#4a2a1a'));
  }
  const sm = add(head, new THREE.TorusGeometry(0.04, 0.007, 8, 16, Math.PI), mat('#a33'), [0, -0.055, 0.18], [0, 0, Math.PI]);
  add(head, new THREE.CylinderGeometry(0.2, 0.19, 0.22, 24), white, [0, 0.24, 0]);
  for (const [x, z] of [[0, 0], [0.13, 0.05], [-0.13, 0.05], [0.07, -0.1], [-0.07, -0.1], [0, 0.12]]) blob(head, white, [x, 0.4, z], [0.12, 0.1, 0.12]);
  blob(head, mat('#5a3a22'), [0, 0.12, -0.12], [0.19, 0.12, 0.1]);
  arm(g, [0.24, 1.35, 0], handL, 0.33, white); arm(g, [-0.24, 1.35, 0], handR, 0.33, white);
  return g;
}

/** Brass microscope, ~0.7 tall, eyepiece facing +z/up. */
export function buildMicroscope() {
  const g = new THREE.Group(), cream = mat('#e8e2d0', { metalness: 0.3, roughness: 0.4 }), brass = mat('#c8963a', { metalness: 0.6, roughness: 0.3 }), blk = mat('#262629', { metalness: 0.4 });
  add(g, new THREE.BoxGeometry(0.42, 0.06, 0.34), blk, [0, 0.03, 0]);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 16), cream, [0, 0.3, -0.1], [0.25, 0, 0]);
  add(g, new THREE.BoxGeometry(0.3, 0.025, 0.24), blk, [0, 0.26, 0.04]);
  const tube = new THREE.Group(); tube.position.set(0, 0.42, 0.0); tube.rotation.x = 0.4; g.add(tube);
  add(tube, new THREE.CylinderGeometry(0.05, 0.05, 0.36, 20), cream, [0, 0.1, 0]);
  add(tube, new THREE.CylinderGeometry(0.035, 0.035, 0.14, 20), blk, [0, 0.33, 0]);
  add(tube, new THREE.CylinderGeometry(0.04, 0.035, 0.03, 20), brass, [0, 0.41, 0]);
  add(tube, new THREE.CylinderGeometry(0.025, 0.04, 0.09, 20), brass, [0, -0.12, 0]);
  add(g, new THREE.TorusGeometry(0.04, 0.012, 8, 16), brass, [0.06, 0.32, -0.12], [0, Math.PI / 2, 0]);
  return g;
}

/** Phone card: dark body, glowing screen with a pulse line. */
export function buildPhone(hue = '#5fd0ff') {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.1, 0.19, 0.014), mat('#1b1d24', { roughness: 0.3 }));
  const tex = canvasTexture(128, (ctx, s) => { ctx.fillStyle = hue; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(8, 70); ctx.lineTo(40, 70); ctx.lineTo(54, 30); ctx.lineTo(74, 104); ctx.lineTo(88, 70); ctx.lineTo(120, 70); ctx.stroke(); });
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.17), new THREE.MeshBasicMaterial({ map: tex })); sc.position.z = 0.0075; g.add(sc);
  return g;
}

/** Mood disc face: kind = 'happy' | 'sad' | 'flat'. Faces +z. */
export function moodFace(kind, color) {
  const tex = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(64, 64, 62, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.arc(42, 50, 9, 0, 7); ctx.arc(86, 50, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
    if (kind === 'happy') ctx.arc(64, 76, 24, 0.15 * Math.PI, 0.85 * Math.PI); else if (kind === 'sad') ctx.arc(64, 108, 24, 1.15 * Math.PI, 1.85 * Math.PI); else { ctx.moveTo(42, 90); ctx.lineTo(86, 90); }
    ctx.stroke();
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  return m;
}

/** Faceted mountain with snow cap. */
export function buildMountain(R = 2.6, H = 3.6, rock = '#8a7a6a', seed = 3) {
  const g = new THREE.Group(), r = rng(seed);
  const body = add(g, new THREE.ConeGeometry(R, H, 9, 3), new THREE.MeshStandardMaterial({ color: rock, roughness: 0.9, flatShading: true }), [0, H / 2, 0]);
  const p = body.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < H / 2 - 0.01) { { const f = 0.9 + 0.1 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 3 + seed); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } } body.geometry.computeVertexNormals();
  const ch = H * 0.3; add(g, new THREE.ConeGeometry(R * 0.3 + 0.02, ch, 9, 1), mat('#ffffff', { roughness: 0.6 }), [0, H - ch / 2 + 0.01, 0]);
  return g;
}

/** Flat heart facing +z, width ~ s. */
export function buildHeart(s = 0.2, color = '#d02a4a') {
  const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.9, 0.1, -0.5, 0.7, 0, 0.3); sh.bezierCurveTo(0.5, 0.7, 0.9, 0.1, 0, -0.5);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color })); m.scale.setScalar(s); return m;
}

export function buildPine(h = 1, c = '#2f7a43') {
  const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.05 * h, 0.07 * h, 0.3 * h, 8), mat('#6a4425'), [0, 0.15 * h, 0]);
  for (let i = 0; i < 3; i++) add(g, new THREE.ConeGeometry((0.4 - i * 0.1) * h, 0.5 * h, 9), mat(c), [0, (0.45 + i * 0.3) * h, 0]);
  return g;
}

/** Gear facing +z, outer radius r. */
export function buildGear(r = 0.5, color = '#d8a23a', teeth = 10) {
  const g = new THREE.Group(), m = mat(color, { metalness: 0.5, roughness: 0.4 });
  add(g, new THREE.CylinderGeometry(r * 0.82, r * 0.82, r * 0.28, 32), m, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2; add(g, new THREE.BoxGeometry(r * 0.28, r * 0.3, r * 0.28), m, [Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, 0], [0, 0, a]); }
  add(g, new THREE.CylinderGeometry(r * 0.3, r * 0.3, r * 0.34, 24), mat('#2b3a55'), [0, 0, 0], [Math.PI / 2, 0, 0]);
  return g;
}

/** Bumpy pink brain, radius r. */
export function buildBrain(r = 0.4, color = '#f08fa0') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.5 }), rg = rng(11);
  for (let i = 0; i < 46; i++) {
    const u = rg() * Math.PI * 2, v = Math.acos(2 * rg() - 1), x = Math.sin(v) * Math.cos(u), y = Math.abs(Math.cos(v)) * 0.8, z = Math.sin(v) * Math.sin(u) * 1.15;
    blob(g, m, [x * r * 0.8, y * r * 0.9, z * r * 0.8], [r * 0.3, r * 0.27, r * 0.3]);
  }
  blob(g, m, [0, r * 0.2, 0], [r * 0.85, r * 0.6, r * 1.0]);
  add(g, new THREE.BoxGeometry(0.01 * r * 10, r * 0.5, r * 2.0), mat('#c8566e'), [0, r * 0.75, 0]);
  blob(g, mat('#d86c82'), [0, -r * 0.45, -r * 0.7], [r * 0.3, r * 0.3, r * 0.28]);
  return g;
}

/** Pizza facing +z, radius r, with a slice missing. */
export function buildPizza(r = 0.6) {
  const g = new THREE.Group(), crust = mat('#d9953f'), sauce = mat('#c8372a'), cheese = mat('#ffd75a'), pep = mat('#a3241f');
  add(g, new THREE.CylinderGeometry(r, r, 0.07, 40, 1, false, 0.5, Math.PI * 2 - 0.9), crust, [0, 0, 0], [Math.PI / 2, 0, 0]);
  add(g, new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.09, 40, 1, false, 0.5, Math.PI * 2 - 0.9), cheese, [0, 0, 0.005], [Math.PI / 2, 0, 0]);
  const rg = rng(2); for (let i = 0; i < 9; i++) { const a = 1.0 + rg() * 4.9, d = (0.2 + rg() * 0.55) * r; add(g, new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.1, 16), pep, [Math.cos(a) * d, Math.sin(a) * d, 0.012], [Math.PI / 2, 0, 0]); }
  for (let i = 0; i < 5; i++) { const a = 1.0 + i * 1.2; add(g, new THREE.CylinderGeometry(r * 0.04, r * 0.04, 0.1, 8), mat('#3d8f3a'), [Math.cos(a + 0.5) * r * 0.55, Math.sin(a + 0.5) * r * 0.55, 0.014], [Math.PI / 2, 0, 0]);}
  return g;
}

/** Sparkle star. */
export function sparkle(parent, pos, s = 0.06, color = '#fff2a0') { return add(parent, new THREE.OctahedronGeometry(s), new THREE.MeshBasicMaterial({ color }), pos, [0.3, 0.5, 0], [1, 1.6, 1]); }
export function dust(parent, pos, s = 0.1) { return blob(parent, new THREE.MeshBasicMaterial({ color: '#fff7e6' }), pos, [s, s * 0.8, s]); }
