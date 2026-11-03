// Agios scene props: pirate king, crab, mighty pivot door, cells, tea bag, etc. Each builder returns a Group on y=0.
import { THREE, mat, add, blob, box, cyl, textPlane, rbc } from './common.js';

// PIRATE KING (pyruvate kinase): crowned tricorn, eyepatch, beard, red coat. Faces +z, ~0.9 tall. awake=false -> closed eyes.
export function createPirateKing({ awake = true } = {}) {
  const g = new THREE.Group(), skin = mat('#f3c9a0'), coat = mat('#b3262e'), gold = mat('#f2b632', { metalness: 0.6, roughness: 0.3 }), black = mat('#1d1a20'), beard = mat('#5a3a22');
  cyl(g, mat('#2a2230'), [-0.09, 0.14, 0], 0.06, 0.28); cyl(g, mat('#2a2230'), [0.09, 0.14, 0], 0.06, 0.28);
  blob(g, black, [-0.09, 0.03, 0.05], [0.07, 0.05, 0.1]); blob(g, black, [0.09, 0.03, 0.05], [0.07, 0.05, 0.1]);
  add(g, new THREE.CylinderGeometry(0.16, 0.26, 0.5, 28), coat, [0, 0.52, 0]);
  add(g, new THREE.TorusGeometry(0.2, 0.03, 8, 32), gold, [0, 0.45, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) { cyl(g, coat, [s * 0.24, 0.55, 0.02], 0.045, 0.3, [0, 0, s * 0.35]); blob(g, skin, [s * 0.3, 0.4, 0.03], [0.045, 0.045, 0.045]); }
  const head = new THREE.Group(); head.position.set(0, 0.88, 0); g.add(head);
  blob(head, skin, [0, 0, 0], [0.17, 0.17, 0.16]);
  blob(head, beard, [0, -0.1, 0.06], [0.15, 0.11, 0.1]);
  blob(head, skin, [0, -0.02, 0.15], [0.03, 0.03, 0.03]);
  for (const s of [-1, 1]) {
    if (awake) { blob(head, mat('#fff', { roughness: 0.3 }), [s * 0.06, 0.03, 0.14], [0.04, 0.045, 0.02]); blob(head, black, [s * 0.06, 0.03, 0.155], [0.022, 0.03, 0.012]); }
    else add(head, new THREE.TorusGeometry(0.04, 0.008, 6, 14, Math.PI), black, [s * 0.06, 0.03, 0.15], [0, 0, Math.PI]);
  }
  add(head, new THREE.CircleGeometry(0.05, 20), black, [0.06, 0.035, 0.158]);                      // eyepatch (right eye)
  add(head, new THREE.TorusGeometry(0.17, 0.008, 6, 30, Math.PI * 0.9), black, [0, 0.0, 0.0], [0, 0, 0.3]);
  // tricorn hat + crown + skull
  add(head, new THREE.CylinderGeometry(0.25, 0.25, 0.03, 3), black, [0, 0.14, 0], [0, Math.PI / 6, 0]).scale.set(1, 1, 1.1);
  cyl(head, black, [0, 0.2, 0], 0.15, 0.1, [0, 0, 0], 0.12);
  cyl(head, gold, [0, 0.29, 0], 0.115, 0.07, [0, 0, 0], 0.13);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(head, new THREE.ConeGeometry(0.025, 0.06, 8), gold, [Math.sin(a) * 0.12, 0.35, Math.cos(a) * 0.12]); }
  blob(head, mat('#f5f5ee'), [0, 0.2, 0.135], [0.04, 0.04, 0.015]);
  blob(head, black, [-0.015, 0.205, 0.148], [0.01, 0.01, 0.005]); blob(head, black, [0.015, 0.205, 0.148], [0.01, 0.01, 0.005]);
  box(head, mat('#f5f5ee'), [0, 0.15, 0.14], [0.1, 0.012, 0.01], [0, 0, 0.5]); box(head, mat('#f5f5ee'), [0, 0.15, 0.14], [0.1, 0.012, 0.01], [0, 0, -0.5]);
  g.userData.head = head;
  return g;
}

// CRAB (cancer / oncology): red, big claws. Faces +z, ~0.5 wide.
export function createCrab() {
  const g = new THREE.Group(), shell = mat('#e8452c'), dark = mat('#b52a1a');
  blob(g, shell, [0, 0.18, 0], [0.3, 0.14, 0.22]);
  for (const s of [-1, 1]) {
    blob(g, mat('#fff'), [s * 0.1, 0.34, 0.15], [0.05, 0.05, 0.05]); blob(g, mat('#111'), [s * 0.1, 0.34, 0.195], [0.025, 0.03, 0.015]);
    cyl(g, dark, [s * 0.1, 0.27, 0.14], 0.012, 0.1);
    const arm = new THREE.Group(); arm.position.set(s * 0.3, 0.22, 0.1); arm.rotation.z = -s * 0.5; g.add(arm);
    cyl(arm, shell, [s * 0.08, 0.06, 0.1], 0.03, 0.22, [0.7, 0, s * 0.2]);
    blob(arm, shell, [s * 0.1, 0.18, 0.22], [0.12, 0.09, 0.07]);
    blob(arm, dark, [s * 0.1 + s * 0.03, 0.18, 0.28], [0.05, 0.04, 0.05]);
    for (let i = 0; i < 3; i++) { const l = new THREE.Group(); l.position.set(s * 0.26, 0.1, -0.05 + i * 0.07); l.rotation.z = -s * 1.0; g.add(l); cyl(l, dark, [0, -0.08, 0], 0.016, 0.2); }
  }
  add(g, new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), mat('#411'), [0, 0.15, 0.215], [0, 0, Math.PI]);
  return g;
}

// MIGHTY PIVOT door (mitapivat): flexed muscle arms on a door spinning on a centre pivot. ~1.3 tall.
export function createPivotDoor({ open = 0.5 } = {}) {
  const g = new THREE.Group(), wood = mat('#8a4f2a'), pale = mat('#b87642'), steel = mat('#c8ced6', { metalness: 0.7, roughness: 0.3 });
  box(g, mat('#e6d9bd'), [0, 0.7, -0.04], [0.9, 1.4, 0.06]);                       // frame
  const door = new THREE.Group(); door.position.set(0, 0.7, 0); door.rotation.y = open; g.add(door);
  box(door, wood, [0, 0, 0], [0.7, 1.2, 0.06]);
  for (const y of [0.3, -0.3]) box(door, pale, [0, y, 0.034], [0.5, 0.4, 0.012]);
  cyl(door, steel, [0, 0.62, 0], 0.035, 0.08); cyl(door, steel, [0, -0.62, 0], 0.035, 0.08);   // pivot pins
  cyl(g, steel, [0, 1.42, 0], 0.04, 0.05);
  const skin = mat('#f0b27a');
  for (const s of [-1, 1]) {                                                    // flexed bicep arms
    const a = new THREE.Group(); a.position.set(s * 0.37, 0.0, 0.05); door.add(a);
    cyl(a, skin, [s * 0.08, -0.0, 0.0], 0.06, 0.2, [0, 0, s * 1.2]);
    blob(a, skin, [s * 0.2, 0.1, 0.0], [0.11, 0.1, 0.1]); cyl(a, skin, [s * 0.25, 0.22, 0], 0.05, 0.2, [0, 0, -s * 0.2]); blob(a, skin, [s * 0.25, 0.36, 0], [0.07, 0.07, 0.07]);
  }
  for (const s of [-1, 1]) { blob(door, mat('#fff'), [s * 0.12, 0.42, 0.04], [0.05, 0.055, 0.02]); blob(door, mat('#111'), [s * 0.12, 0.42, 0.055], [0.027, 0.035, 0.012]); }
  add(door, new THREE.TorusGeometry(0.06, 0.01, 6, 14, Math.PI), mat('#411'), [0, 0.3, 0.04], [0, 0, Math.PI]);
  return g;
}

// Round sickle/target/platelet cells
export function sickle(r = 0.14, color = '#c71f3a') {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(r, r * 0.3, 14, 28, Math.PI * 1.35), mat(color, { roughness: 0.4 }), [0, 0, 0], [0, 0, 0.4]);
  blob(g, mat(color, { roughness: 0.4 }), [r * Math.cos(0.4), r * Math.sin(0.4), 0], [r * 0.08, r * 0.08, r * 0.08]);
  return g;
}
export function platelet(r = 0.07) { const g = new THREE.Group(); blob(g, mat('#c9a8e8', { roughness: 0.5 }), [0, 0, 0], [r, r * 0.55, r]); for (let i = 0; i < 5; i++) blob(g, mat('#a785d4'), [Math.cos(i * 1.3) * r * 0.5, r * 0.4, Math.sin(i * 1.3) * r * 0.5], [r * 0.15, r * 0.15, r * 0.15]); return g; }
export { rbc };
