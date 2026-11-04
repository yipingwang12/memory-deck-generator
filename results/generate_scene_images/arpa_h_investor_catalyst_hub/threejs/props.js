// Shared props for ARPA-H scenes q02-q05.
import { THREE, mat, add, blob, cyl, box, animeEyes, smile, coin } from './common.js';

/** Cylinder of radius r from point a to point b (arrays or Vector3). */
export function limbTo(parent, m, a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const o = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 14), m, A.clone().add(B).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}

/** Mummy facing +z, ~2.6 tall. Returns { g, hand } where hand is the raised right-hand world-local point. */
export function mummy(handTo) {
  const g = new THREE.Group(), wrap = mat('#efe6cf'), shade = mat('#d8cba8');
  for (const s of [-1, 1]) { cyl(g, wrap, 0.17, 0.9, [s * 0.2, 0.45, 0]); blob(g, wrap, [s * 0.2, 0.05, 0.1], [0.2, 0.1, 0.3]); }
  blob(g, wrap, [0, 1.3, 0], [0.5, 0.65, 0.34]);
  for (let i = 0; i < 6; i++) add(g, new THREE.TorusGeometry(0.5 - Math.abs(i - 2.5) * 0.03, 0.035, 8, 32), i % 2 ? shade : wrap, [0, 0.85 + i * 0.19, 0], [Math.PI / 2, 0, 0], [1, 0.68, 1]);
  const head = new THREE.Group(); head.position.y = 2.15; g.add(head);
  blob(head, wrap, [0, 0, 0], [0.38, 0.4, 0.36]);
  for (let i = 0; i < 4; i++) add(head, new THREE.TorusGeometry(0.36, 0.03, 8, 32), i % 2 ? shade : wrap, [0, -0.22 + i * 0.17, 0], [Math.PI / 2, 0, 0], [1, 0.95, 1]);
  box(head, mat('#2a1a2e'), 0.58, 0.24, 0.05, [0, 0.03, 0.335]);
  animeEyes(head, { y: 0.03, z: 0.365, gap: 0.14, r: 0.075, iris: '#ffb347' }); smile(head, 0, -0.17, 0.36, 0.06);
  const sh = [-0.5, 1.75, 0], sh2 = [0.5, 1.75, 0];
  limbTo(g, wrap, sh, [-0.65, 1.0, 0.25], 0.09); blob(g, wrap, [-0.65, 1.0, 0.25], [0.11, 0.11, 0.11]);
  limbTo(g, wrap, sh2, handTo, 0.09); blob(g, wrap, handTo, [0.13, 0.13, 0.13]);
  for (let i = 0; i < 3; i++) add(g, new THREE.PlaneGeometry(0.1, 0.5), wrap, [0.5 + i * 0.08, 0.5, 0.2], [0, 0, 0.2 * i]); // trailing wrap
  return g;
}
export { coin };
