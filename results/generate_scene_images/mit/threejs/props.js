// Cue props for the MIT deck. Each factory returns a Group standing on y = 0 (origin at base centre), facing +z.
import { THREE, mat, add, blob, cyl, box, canvasTexture, rng } from './common.js';

const G = () => new THREE.Group();
const tex = (size, draw) => new THREE.MeshStandardMaterial({ map: canvasTexture(size, draw), roughness: 0.8 });

/** Sail panel (w x h) with canvas-drawn cloth, gently billowed toward +z. Origin at bottom centre. */
export function sailPanel(w, h, draw, { size = 512, bulge = 0.18 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, 24, 24), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / w, v = p.getY(i) / h; p.setZ(i, bulge * Math.cos(u * Math.PI) * Math.cos(v * Math.PI) * 0.9); }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: canvasTexture(size, draw), roughness: 0.85, side: THREE.DoubleSide });
  const o = new THREE.Mesh(g, m); o.position.y = h / 2; o.castShadow = o.receiveShadow = true; return o;
}

/** Small sailboat: hull + mast; pass a sail Object3D (bottom-centre origin) to hang on it. */
export function boat(sail, { len = 2.4, mastH = 2.8 } = {}) {
  const g = G(), wood = mat('#9a5b2c'), dark = mat('#6b3a1a');
  const hull = blob(g, wood, [0, 0.2, 0], [len / 2, 0.28, 0.5]); hull.scale.y = 0.3 * 1;
  box(g, dark, len * 0.9, 0.05, 0.9, [0, 0.38, 0]);
  cyl(g, dark, 0.045, 0.055, mastH, [0, mastH / 2 + 0.3, 0]);
  if (sail) { sail.position.set(0, 0.8, 0.08); g.add(sail); }
  return g;
}

export function sword() {
  const g = G(), steel = mat('#cfd8e3', { metalness: 0.6, roughness: 0.3 }), gold = mat('#e2b13c', { metalness: 0.6, roughness: 0.35 });
  const s = new THREE.Shape(); s.moveTo(-0.22, 0); s.lineTo(0.22, 0); s.lineTo(0.2, 1.5); s.lineTo(0, 1.8); s.lineTo(-0.2, 1.5); s.closePath();
  const bl = add(g, new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), steel, [0, 0.55, -0.025]);
  box(g, mat('#9fb0c4', { metalness: 0.5 }), 0.06, 1.5, 0.08, [0, 1.3, 0.0]);
  box(g, gold, 0.9, 0.12, 0.14, [0, 0.52, 0]);
  cyl(g, mat('#5a2a1a'), 0.06, 0.06, 0.4, [0, 0.28, 0]);
  blob(g, gold, [0, 0.05, 0], [0.1, 0.1, 0.1]);
  return g;
}

/** Peaked tower: stone shaft, glowing windows, a pointed mountain-peak roof with a snow cap. */
export function tower({ h = 3, brain = false } = {}) {
  const g = G(), stone = mat('#b8a99a'), roof = mat('#3f6fb5');
  cyl(g, stone, 0.62, 0.7, 0.3, [0, 0.15, 0]);
  const shaft = cyl(g, stone, 0.46, 0.55, h, [0, h / 2 + 0.3, 0]); shaft.geometry = new THREE.CylinderGeometry(0.46, 0.55, h, 8);
  for (let k = 0; k < 4; k++) for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) {
    const y = 0.9 + k * (h - 0.9) / 4, r = 0.55 - 0.09 * (y / h);
    box(g, mat('#ffd65a', { emissive: '#ffb020', emissiveIntensity: 0.9 }), 0.16, 0.26, 0.05, [Math.sin(a) * r, y, Math.cos(a) * r], [0, a, 0]);
  }
  cyl(g, mat('#8a7a6a'), 0.62, 0.62, 0.08, [0, h + 0.3, 0]);
  const pk = cyl(g, roof, 0.01, 0.6, 1.5, [0, h + 1.1, 0]); pk.geometry = new THREE.ConeGeometry(0.6, 1.5, 8);
  const snow = add(g, new THREE.ConeGeometry(0.26, 0.55, 8), mat('#ffffff'), [0, h + 1.65, 0]);
  if (brain) blob(g, mat('#ff9fb5', { emissive: '#ff6f9a', emissiveIntensity: 0.5 }), [0, h + 0.62, 0.0], [0.2, 0.15, 0.2]);
  return g;
}

export function wheel({ r = 0.9, spokes = 24, color = '#e2b13c' } = {}) {
  const g = G(), m = mat(color, { metalness: 0.6, roughness: 0.35 }), w = G(); w.position.y = r + 0.25; g.add(w);
  add(w, new THREE.TorusGeometry(r, 0.08, 12, 64), m);
  add(w, new THREE.TorusGeometry(r * 0.2, 0.07, 12, 32), m);
  for (let i = 0; i < spokes; i++) {
    const a = i / spokes * Math.PI * 2;
    add(w, new THREE.CylinderGeometry(0.018, 0.018, r * 0.8, 6), m, [Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, 0], [0, 0, a - Math.PI / 2]);
    blob(w, m, [Math.cos(a + Math.PI / spokes) * r * 0.97, Math.sin(a + Math.PI / spokes) * r * 0.97, 0], [0.04, 0.04, 0.04]);
  }
  cyl(w, m, 0.12, 0.12, 0.2, [0, 0, 0], [Math.PI / 2, 0, 0]);
  box(g, mat('#7b5a3a'), r * 1.4, 0.25, 0.5, [0, 0.125, 0]);
  g.userData.wheel = w; return g;
}

/** Wood/gold-bodied mandolin standing upright, face to +z. ~1.25 tall. */
export function mandolin() {
  const g = G(), wood = mat('#c0762f'), top = mat('#ebb15a'), dark = mat('#3d2312');
  blob(g, wood, [0, 0.32, 0], [0.26, 0.32, 0.11]);
  const p = add(g, new THREE.CircleGeometry(1, 40), top, [0, 0.32, 0.1], [0, 0, 0], [0.235, 0.29, 1]);
  add(g, new THREE.CircleGeometry(1, 28), mat('#150a05'), [0, 0.36, 0.103], [0, 0, 0], [0.075, 0.075, 1]);
  box(g, dark, 0.2, 0.025, 0.03, [0, 0.14, 0.115]);
  box(g, mat('#2a1608'), 0.1, 0.62, 0.05, [0, 0.9, 0.04]);
  box(g, dark, 0.15, 0.2, 0.04, [0, 1.3, 0.03]);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) cyl(g, mat('#e8d9a0', { metalness: 0.5 }), 0.018, 0.018, 0.07, [s * 0.1, 1.24 + i * 0.06, 0.03], [0, 0, Math.PI / 2]);
  for (const x of [-0.03, -0.01, 0.01, 0.03]) box(g, mat('#f2f2f2'), 0.004, 1.2, 0.004, [x, 0.72, 0.125]);
  return g;
}

export function brickMaterial() {
  return tex(512, (ctx, s) => {
    ctx.fillStyle = '#6b3a2a'; ctx.fillRect(0, 0, s, s); const r = rng(3);
    for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) {
      const l = 150 + r() * 40; ctx.fillStyle = `rgb(${l + 30},${l - 50},${l - 90})`; ctx.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
    }
  });
}

/** Brick kiln with a glowing arched mouth; a Group (`g.userData.mouth`) marks where to stand something inside. */
export function kiln() {
  const g = G(), bm = brickMaterial();
  const dome = add(g, new THREE.SphereGeometry(1.35, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2), bm, [0, 0.2, 0], [0, 0, 0], [1, 0.85, 1]);
  cyl(g, bm, 1.35, 1.4, 0.2, [0, 0.1, 0]);
  cyl(g, bm, 0.22, 0.26, 1.0, [0, 1.6, -0.35]);
  const glow = mat('#ff8a2a', { emissive: '#ff6a10', emissiveIntensity: 1.1 });
  box(g, mat('#1a0e0a'), 1.0, 0.9, 0.3, [0, 0.62, 1.1]);
  add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24, 1, false, 0, Math.PI), mat('#1a0e0a'), [0, 1.07, 1.1], [Math.PI / 2, 0, Math.PI / 2]);
  add(g, new THREE.PlaneGeometry(0.9, 1.0), glow, [0, 0.62, 1.27]);
  const stone = mat('#7a6a60'); for (const s of [-1, 1]) box(g, stone, 0.14, 1.0, 0.36, [s * 0.58, 0.6, 1.15]);
  return g;
}

/** Pink lumpy brain facing +x; frontal lobe (+x end) tinted `front`. */
export function brain({ s = 1, front = '#ffb347' } = {}) {
  const g = G(), r = rng(11); const pink = mat('#ff9fb5'), fr = mat(front, { emissive: front, emissiveIntensity: 0.35 });
  const n = 46;
  for (let i = 0; i < n; i++) {
    const t = Math.acos(1 - 2 * (i + 0.5) / n), p = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = Math.sin(t) * Math.cos(p) * 0.62, y = Math.abs(Math.cos(t)) * 0.45 * Math.sign(Math.cos(t) + 0.2), z = Math.sin(t) * Math.sin(p) * 0.42;
    const isFront = x > 0.2; blob(g, isFront ? fr : pink, [x, y + 0.45, z], [0.19, 0.17, 0.17], [r(), r(), r()]);
  }
  blob(g, pink, [0, 0.45, 0], [0.5, 0.38, 0.36]);
  blob(g, mat('#e7849b'), [-0.35, 0.12, 0], [0.16, 0.18, 0.14]);
  g.scale.setScalar(s); return g;
}

export function shield({ w = 1.4, h = 1.7 } = {}) {
  const g = G(), s = new THREE.Shape(); s.moveTo(-w / 2, h); s.lineTo(w / 2, h); s.lineTo(w / 2, h * 0.45); s.quadraticCurveTo(w / 2, 0.1, 0, 0); s.quadraticCurveTo(-w / 2, 0.1, -w / 2, h * 0.45); s.closePath();
  add(g, new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 3 }), mat('#3a78d0', { metalness: 0.3 }), [0, 0.25, 0]);
  box(g, mat('#ffffff'), 0.28, 1.0, 0.06, [0, 0.25 + h * 0.52, 0.17]); box(g, mat('#ffffff'), 0.8, 0.28, 0.06, [0, 0.25 + h * 0.6, 0.17]);
  return g;
}

/** Y-shaped antibody. */
export function antibody(color = '#8a4fd8') {
  const g = G(), m = mat(color);
  cyl(g, m, 0.04, 0.04, 0.3, [0, 0.15, 0]);
  for (const s of [-1, 1]) cyl(g, m, 0.04, 0.04, 0.26, [s * 0.1, 0.4, 0], [0, 0, -s * 0.6]);
  return g;
}

export function shallot({ s = 1 } = {}) {
  const g = G(), pts = [[0, 0], [0.18, 0.02], [0.36, 0.22], [0.37, 0.45], [0.28, 0.7], [0.12, 0.95], [0.03, 1.15], [0, 1.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = tex(256, (ctx, w) => { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#b2566f' : '#c9718a'; ctx.fillRect(i * w / 16, 0, w / 16, w); } });
  add(g, new THREE.LatheGeometry(pts, 32), m);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; cyl(g, mat('#f3e7d3'), 0.004, 0.004, 0.14, [Math.cos(a) * 0.08, -0.02, Math.sin(a) * 0.08], [0.6 * Math.sin(a), 0, -0.6 * Math.cos(a)]); }
  for (const [x, a] of [[-0.05, 0.25], [0.04, -0.2], [0, 0.05]]) cyl(g, mat('#5fae3c'), 0.012, 0.045, 0.7, [x, 1.5, 0], [0, 0, a]);
  g.scale.setScalar(s); return g;
}

export function teacup({ s = 1 } = {}) {
  const g = G(), china = mat('#fbf4ea', { roughness: 0.3 });
  const pts = [[0, 0], [0.12, 0], [0.16, 0.03], [0.27, 0.22], [0.3, 0.3], [0.285, 0.3], [0.25, 0.22], [0.12, 0.05], [0, 0.05]].map(([x, y]) => new THREE.Vector2(x, y));
  const c = add(g, new THREE.LatheGeometry(pts, 36), china, [0, 0.08, 0]);
  cyl(g, china, 0.42, 0.45, 0.05, [0, 0.025, 0]);
  add(g, new THREE.CircleGeometry(0.265, 32), mat('#b4602a'), [0, 0.355, 0], [-Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI * 1.3), china, [0.3, 0.24, 0], [0, 0, -1.9]);
  const band = add(g, new THREE.TorusGeometry(0.265, 0.012, 8, 36), mat('#d8333b'), [0, 0.3, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) add(g, new THREE.TorusGeometry(0.06 + i * 0.01, 0.012, 8, 20, Math.PI * 1.4), mat('#ffffff', { transparent: true, opacity: 0.7 }), [0.03 * (i - 1), 0.5 + i * 0.16, 0], [0, 0, 1 + i]);
  g.scale.setScalar(s); return g;
}

/** Eye mask (domino) on a stick, face to +z. */
export function mask() {
  const g = G(), s = new THREE.Shape(); s.moveTo(-0.5, 0.05); s.quadraticCurveTo(-0.5, 0.3, -0.2, 0.28); s.quadraticCurveTo(0, 0.18, 0.2, 0.28); s.quadraticCurveTo(0.5, 0.3, 0.5, 0.05);
  s.quadraticCurveTo(0.45, -0.22, 0.2, -0.2); s.quadraticCurveTo(0.08, -0.1, 0, -0.1); s.quadraticCurveTo(-0.08, -0.1, -0.2, -0.2); s.quadraticCurveTo(-0.45, -0.22, -0.5, 0.05);
  for (const x of [-0.24, 0.24]) { const h = new THREE.Path(); h.absellipse(x, 0.03, 0.12, 0.07, 0, Math.PI * 2); s.holes.push(h); }
  add(g, new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), mat('#6a2fb8', { roughness: 0.4 }), [0, 0, 0]);
  const gold = mat('#e2b13c', { metalness: 0.6 });
  for (const x of [-0.42, 0.42]) blob(g, gold, [x, 0.2, 0.05], [0.05, 0.05, 0.02]);
  cyl(g, mat('#c8a46a'), 0.015, 0.015, 0.8, [0.42, -0.35, 0.02], [0, 0, 0.25]);
  g.scale.setScalar(1.4); return g;
}

/** Generic little person. Origin at feet; h total height. */
export function person({ h = 1, shirt = '#3d8c5a', pants = '#3b4a7a', hair = '#2a1a10', skin = '#f3c9a0', armsUp = false, bare = false } = {}) {
  const g = G(), u = h / 1.7;
  for (const s of [-1, 1]) { cyl(g, mat(pants), 0.07 * u, 0.06 * u, 0.8 * u, [s * 0.09 * u, 0.4 * u, 0]); blob(g, mat('#3a2a20'), [s * 0.09 * u, 0.03 * u, 0.05 * u], [0.08 * u, 0.05 * u, 0.12 * u]); }
  blob(g, mat(bare ? skin : shirt), [0, 1.08 * u, 0], [0.24 * u, 0.34 * u, 0.17 * u]);
  for (const s of [-1, 1]) {
    const a = cyl(g, mat(bare ? skin : shirt), 0.05 * u, 0.045 * u, 0.55 * u, [s * 0.27 * u, armsUp ? 1.45 * u : 0.95 * u, 0], [0, 0, armsUp ? -s * 0.15 : s * 0.15]);
    blob(g, mat(skin), [s * (armsUp ? 0.31 : 0.31) * u, armsUp ? 1.74 * u : 0.65 * u, 0], [0.06 * u, 0.06 * u, 0.06 * u]);
  }
  blob(g, mat(skin), [0, 1.52 * u, 0], [0.17 * u, 0.19 * u, 0.17 * u]);
  blob(g, mat(hair), [0, 1.6 * u, -0.02 * u], [0.18 * u, 0.15 * u, 0.17 * u]);
  for (const s of [-1, 1]) { blob(g, mat('#fff'), [s * 0.06 * u, 1.53 * u, 0.15 * u], [0.035 * u, 0.045 * u, 0.02 * u]); blob(g, mat('#1a1a1a'), [s * 0.06 * u, 1.53 * u, 0.165 * u], [0.02 * u, 0.028 * u, 0.012 * u]); }
  return g;
}

export function sumo() {
  const g = G(), skin = mat('#f0bf92');
  for (const s of [-1, 1]) { cyl(g, skin, 0.2, 0.16, 0.8, [s * 0.28, 0.45, 0]); blob(g, skin, [s * 0.28, 0.06, 0.1], [0.17, 0.08, 0.26]); }
  blob(g, skin, [0, 1.15, 0], [0.62, 0.55, 0.5]);
  blob(g, mat('#223a8a'), [0, 0.8, 0.02], [0.64, 0.17, 0.52]);
  box(g, mat('#223a8a'), 0.3, 0.5, 0.05, [0, 0.55, 0.45]);
  for (const s of [-1, 1]) { cyl(g, skin, 0.14, 0.12, 0.8, [s * 0.65, 1.55, 0.05], [0, 0, -s * 0.35]); blob(g, skin, [s * 0.78, 1.95, 0.08], [0.13, 0.13, 0.13]); }
  blob(g, skin, [0, 1.82, 0.05], [0.33, 0.31, 0.3]);
  blob(g, mat('#14100e'), [0, 2.0, 0], [0.31, 0.2, 0.28]); blob(g, mat('#14100e'), [0, 2.2, -0.08], [0.1, 0.12, 0.1]);
  for (const s of [-1, 1]) { blob(g, mat('#fff'), [s * 0.12, 1.84, 0.3], [0.07, 0.08, 0.03]); blob(g, mat('#111'), [s * 0.12, 1.84, 0.33], [0.04, 0.055, 0.02]); blob(g, mat('#ff8a8a'), [s * 0.22, 1.74, 0.28], [0.06, 0.035, 0.02]); }
  add(g, new THREE.TorusGeometry(0.05, 0.012, 8, 12, Math.PI), mat('#7a2a2a'), [0, 1.72, 0.32], [0, 0, Math.PI]);
  return g;
}

export function raincoat() {
  const g = G(), y = mat('#f7c820', { roughness: 0.4 }), d = mat('#d9a410');
  const body = box(g, y, 0.9, 1.3, 0.08, [0, 0.65, 0]);
  for (const s of [-1, 1]) cyl(g, y, 0.11, 0.1, 0.9, [s * 0.75, 0.95, 0], [0, 0, -s * 1.15]);
  blob(g, y, [0, 1.38, -0.03], [0.34, 0.28, 0.2]); blob(g, d, [0, 1.36, 0.06], [0.2, 0.2, 0.05]);
  for (let i = 0; i < 4; i++) blob(g, mat('#3a2a1a'), [0, 1.05 - i * 0.26, 0.06], [0.05, 0.05, 0.02]);
  for (const s of [-1, 1]) box(g, d, 0.26, 0.2, 0.03, [s * 0.28, 0.35, 0.05]);
  return g;
}

export function tongaFlag(w = 1.5, h = 1) {
  return sailPanel(w, h, (ctx, s) => {
    ctx.fillStyle = '#c10000'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, s * 0.4, s * 0.45);
    ctx.fillStyle = '#c10000'; ctx.fillRect(s * 0.15, s * 0.07, s * 0.1, s * 0.31); ctx.fillRect(s * 0.05, s * 0.17, s * 0.3, s * 0.1);
  }, { bulge: 0.04 });
}

export function wagon() {
  const g = G(), wood = mat('#a8672f'), dark = mat('#5e3516');
  box(g, wood, 1.9, 0.12, 1.0, [0, 0.55, 0]);
  for (const s of [-1, 1]) { box(g, wood, 1.9, 0.4, 0.07, [0, 0.8, s * 0.48]); box(g, wood, 0.07, 0.4, 1.0, [s * 0.93, 0.8, 0]); }
  for (const [x, z] of [[-0.6, 0.58], [0.6, 0.58], [-0.6, -0.58], [0.6, -0.58]]) {
    const w = G(); w.position.set(x, 0.38, z); g.add(w);
    add(w, new THREE.TorusGeometry(0.34, 0.05, 10, 32), dark);
    for (let i = 0; i < 6; i++) add(w, new THREE.CylinderGeometry(0.02, 0.02, 0.66, 6), dark, [0, 0, 0], [0, 0, i * Math.PI / 6]);
    cyl(w, dark, 0.07, 0.07, 0.12, [0, 0, 0], [Math.PI / 2, 0, 0]);
  }
  box(g, dark, 1.1, 0.06, 0.07, [1.45, 0.45, 0]);
  return g;
}

/** Stilt walker: ~3.6 tall. */
export function stiltMan() {
  const g = G(), wood = mat('#b07a3c');
  for (const s of [-1, 1]) { box(g, wood, 0.08, 2.2, 0.08, [s * 0.14, 1.1, 0]); box(g, wood, 0.2, 0.05, 0.3, [s * 0.14, 1.0, 0.06]); blob(g, mat('#3a2a20'), [s * 0.14, 1.04, 0.1], [0.07, 0.04, 0.12]); }
  const p = person({ h: 1.7, shirt: '#d8643a', pants: '#2f3c6a', armsUp: true }); p.position.y = 1.05; g.add(p);
  return g;
}

export function coralReef() {
  const g = G(), r = rng(8);
  const rock = mat('#c98a6a');
  for (const [x, z, sx, sy, sz] of [[0, 0, 2.6, 0.5, 1.5], [0.2, -0.1, 1.9, 0.9, 1.1], [0.1, -0.2, 1.2, 1.3, 0.8]]) blob(g, rock, [x, sy * 0.4, z], [sx, sy, sz]);
  const cols = ['#ff7a6a', '#ffb347', '#e06fd0', '#ffd84a'];
  const brainTex = tex(256, (ctx, s) => { ctx.fillStyle = '#e8b86a'; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = '#a8733a'; ctx.lineWidth = 6; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(r() * s, r() * s, 14 + r() * 20, 0, 6.3); ctx.stroke(); } });
  for (const [x, z, s] of [[-1.2, 0.5, 0.45], [1.3, 0.6, 0.5], [0.0, 0.7, 0.4]]) blob(g, brainTex, [x, 0.55 * s + 0.2, z], [s, s * 0.7, s]);
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = 0.4 + r() * 1.7, h = 0.2 + r() * 0.25; const c = mat(cols[i % 4]); const x = Math.cos(a) * d * 1.3, z = Math.sin(a) * d * 0.6 + 0.5; cyl(g, c, 0.04, 0.09, h, [x, 0.2 + h / 2, z]); blob(g, c, [x, 0.3 + h, z], [0.1, 0.1, 0.1]); }
  return g;
}

/** Axon with myelin segments; `frayed` indices have peeling strips. Runs along x, centre y=1. */
export function axon({ n = 7, frayed = [3, 4] } = {}) {
  const g = G(), r = rng(5), ax = mat('#f3b7c9'), my = mat('#ffe27a', { roughness: 0.5 }), line = mat('#e0b83c');
  cyl(g, ax, 0.12, 0.12, n * 0.8 + 0.6, [0, 1, 0], [0, 0, Math.PI / 2]);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.8, f = frayed.includes(i);
    const s = blob(g, my, [x, 1, 0], [f ? 0.3 : 0.36, f ? 0.2 : 0.3, f ? 0.2 : 0.3]);
    for (let k = -2; k <= 2; k++) if (!f) add(g, new THREE.TorusGeometry(0.3 * Math.sqrt(1 - (k / 3) ** 2), 0.012, 6, 28), line, [x + k * 0.1, 1, 0], [0, Math.PI / 2, 0]);
    if (f) for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; add(g, new THREE.BoxGeometry(0.4, 0.02, 0.1), my, [x + (r() - 0.5) * 0.2, 1 + Math.sin(a) * 0.26 - 0.12, Math.cos(a) * 0.26], [a + 0.5, 0.3 * (r() - 0.5), r() * 1.2 - 0.6]); }
  }
  return g;
}

/** Upright board on two legs with a canvas picture; origin at base centre. */
export function board(draw, w = 3, h = 2, { size = 1024, color = '#fff6dc' } = {}) {
  const g = G(), wood = mat('#8a5a2c');
  for (const s of [-1, 1]) { box(g, wood, 0.1, h + 0.5, 0.1, [s * (w / 2 - 0.1), (h + 0.5) / 2, -0.1]); }
  box(g, wood, w + 0.2, h + 0.2, 0.08, [0, h / 2 + 0.5, -0.04]);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: canvasTexture(size, (c, s) => { c.fillStyle = color; c.fillRect(0, 0, s, s); draw(c, s); }), roughness: 0.9 }));
  pic.position.set(0, h / 2 + 0.5, 0.01); pic.castShadow = true; g.add(pic); return g;
}
export function crown() {
  const g = G(), gold = mat('#ffcf3a', { metalness: 0.6, roughness: 0.3 });
  cyl(g, gold, 0.12, 0.12, 0.08, [0, 0, 0]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; add(g, new THREE.ConeGeometry(0.03, 0.12, 8), gold, [Math.cos(a) * 0.11, 0.1, Math.sin(a) * 0.11]); blob(g, mat('#d8333b'), [Math.cos(a) * 0.12, 0.17, Math.sin(a) * 0.12], [0.02, 0.02, 0.02]); }
  return g;
}
export function book(color = '#2f6fb5') {
  const g = G(); box(g, mat(color), 0.5, 0.06, 0.38, [0, 0, 0]); box(g, mat('#fff'), 0.46, 0.05, 0.34, [0.015, 0, 0]); return g;
}
export function water(scene, color = '#2f95d6', pos = [0, 0.01, 0]) {
  return add(scene, new THREE.PlaneGeometry(400, 400), mat(color, { roughness: 0.25, metalness: 0.1 }), pos, [-Math.PI / 2, 0, 0]);
}
