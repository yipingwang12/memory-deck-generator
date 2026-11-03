// q08 — "The LAMB serves six plates of SUSHI, one plate for each approved medicine."
import * as THREE from 'three';
import { createLamb } from './lamb.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };

/** Rounded box via scaled capsule-ish sphere-free approach: beveled cylinder-free box. */
function roundedBox(w, h, d, r, m) {
  const s = new THREE.Shape(), x = w / 2, z = d / 2;
  s.moveTo(-x + r, -z); s.lineTo(x - r, -z); s.quadraticCurveTo(x, -z, x, -z + r); s.lineTo(x, z - r);
  s.quadraticCurveTo(x, z, x - r, z); s.lineTo(-x + r, z); s.quadraticCurveTo(-x, z, -x, z - r);
  s.lineTo(-x, -z + r); s.quadraticCurveTo(-x, -z, -x + r, -z);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: r * 0.5, bevelThickness: r * 0.5, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, r * 0.5, 0);
  return mesh(g, m);
}

const RICE = mat('#fffaf0', { roughness: 0.9 }), NORI = mat('#1c2a22'), SALMON = mat('#ff7a3d', { roughness: 0.35 }),
  TUNA = mat('#d8283c', { roughness: 0.35 }), FAT = mat('#ffd2b8'), CUKE = mat('#7ccf4a'), AVO = mat('#b8d65a');

/** Nigiri: rice block + topping slab with a pale fat stripe. */
export function nigiri(top) {
  const g = new THREE.Group();
  g.add(roundedBox(0.1, 0.03, 0.05, 0.012, RICE));
  const slab = roundedBox(0.112, 0.012, 0.06, 0.008, top); slab.position.y = 0.036; g.add(slab);
  for (const x of [-0.025, 0.012]) { const f = mesh(new THREE.BoxGeometry(0.006, 0.003, 0.05), FAT, x, 0.056, 0); f.rotation.y = 0.15; g.add(f); }
  return g;
}

/** Maki: nori ring, rice, coloured centre; upright so the cut face shows. */
export function maki(centre) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.05, 28), NORI, 0, 0.025, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.052, 28), RICE, 0, 0.026, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.054, 20), centre, 0, 0.027, 0));
  return g;
}

/** Round plate with raised rim, three pieces of sushi. */
export function sushiPlate(color, i) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.125, 0.02, 40), mat(color, { roughness: 0.3 }), 0, 0.01, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.004, 40), mat('#fff6e6', { roughness: 0.3 }), 0, 0.021, 0));
  const top = i % 2 ? TUNA : SALMON;
  for (const [x, z, r] of [[-0.03, 0.045, 0.2], [-0.03, -0.045, -0.15]]) { const n = nigiri(i % 2 ? SALMON : TUNA); n.position.set(x, 0.022, z); n.rotation.y = r + Math.PI / 2; n.scale.setScalar(0.95); g.add(n); }
  const m = maki(i % 3 === 0 ? CUKE : i % 3 === 1 ? AVO : top); m.position.set(0.055, 0.022, 0); g.add(m);
  return g;
}

export function buildQ08(scene, num) {
  const WOOD = mat('#c98a52', { roughness: 0.5 }), WOOD_D = mat('#a8683a'), WALL = mat('#f2c58e', { roughness: 0.95 });
  // Room: floor, back wall, wainscot.
  scene.add(mesh(new THREE.PlaneGeometry(40, 20), mat('#b0743f'), 0, 0, -2).rotateX(-Math.PI / 2));
  const wall = mesh(new THREE.PlaneGeometry(40, 8), WALL, 0, 3, -2.2); scene.add(wall);
  scene.add(mesh(new THREE.BoxGeometry(40, 0.9, 0.1), WOOD_D, 0, 0.45, -2.1));
  // Shelf with bottles and glowing lanterns for warmth.
  scene.add(mesh(new THREE.BoxGeometry(3.4, 0.06, 0.3), WOOD_D, 0, 1.55, -2.0));
  [['#3f7f5a', -1.3], ['#2f5f8a', -0.9], ['#8a3a2a', 0.8], ['#3f7f5a', 1.2]].forEach(([c, x]) =>
    scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 20), mat(c, { roughness: 0.2 }), x, 1.78, -2.0)));
  for (const [x, y, s] of [[-1.9, 2.0, 0.28], [1.9, 2.1, 0.32], [-0.2, 2.35, 0.2], [0.5, 2.3, 0.2]]) {
    const lan = mesh(new THREE.SphereGeometry(s, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffb35c' }), x, y, -1.8);
    lan.scale.y = 1.25; lan.castShadow = false; scene.add(lan);
    scene.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 2, 6), mat('#3a2a20'), x, y + 1.2, -1.8));
  }
  // Counter: top slab, front panel, lip.
  const cz = num('cz0', 0.72), top = num('top', 0.42);
  scene.add(mesh(new THREE.BoxGeometry(2.6, 0.06, 0.62), mat('#e0a468', { roughness: 0.45 }), 0, top - 0.03, cz));
  scene.add(mesh(new THREE.BoxGeometry(2.5, top - 0.06, 0.5), WOOD_D, 0, (top - 0.06) / 2, cz - 0.04));
  scene.add(mesh(new THREE.BoxGeometry(2.6, 0.03, 0.04), WOOD, 0, top - 0.075, cz + 0.3));

  // Six plates, one colour each.
  const cols = ['#e8505b', '#f2b138', '#4fa86a', '#3f8fd2', '#9a63c9', '#f27ea8'];
  const pz = cz + 0.08;
  cols.forEach((c, i) => {
    const p = sushiPlate(c, i);
    p.position.set((i - 2.5) * 0.37, top, pz + (i === 2 ? -0.02 : 0));
    p.rotation.y = (i % 2 ? 0.08 : -0.06);
    scene.add(p);
  });

  // Lamb behind the counter, forehoof reaching a plate edge.
  const lamb = createLamb();
  lamb.position.set(num('lx', -0.1), 0, num('lz', 0.12));
  lamb.rotation.y = num('lyaw', 0.12);
  scene.add(lamb);
  lamb.userData.pose({ neckPitch: num('neck', 0.12), headPitch: num('head', 0.1), headYaw: num('hyaw', 0), headRoll: 0.06 });
  scene.updateMatrixWorld(true);
  const tgt = lamb.worldToLocal(new THREE.Vector3(0.2 + num('hx', 0), top + 0.01 + num('hy', 0), pz - 0.05 + num('hz', 0)));
  lamb.userData.reach('fr', tgt.toArray());
  return { lamb };
}
