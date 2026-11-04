// Shared props for the Arctop scenes.
import { THREE, mat, add, blob, rng, textTex, basic } from './common.js';

/** Fighter jet, nose toward +x, ~2 long. label = text painted on the fuselage (e.g. AFWERX). */
export function buildJet(label = '') {
  const g = new THREE.Group(), grey = mat('#9aa6b4', { roughness: 0.4 }), dark = mat('#55606e', { roughness: 0.4 });
  const pts = [[0, -1], [0.07, -0.9], [0.13, -0.4], [0.14, 0.2], [0.1, 0.7], [0.04, 0.95], [0, 1]].map(([r, y]) => new THREE.Vector2(r, y));
  add(g, new THREE.LatheGeometry(pts, 24), grey, [0, 0, 0], [0, 0, -Math.PI / 2], [1, 1, 1]).scale.set(1, 1, 1);
  g.children[0].rotation.z = -Math.PI / 2; g.children[0].scale.set(1, 1, 1);
  blob(g, mat('#4aa6e8', { roughness: 0.15 }), [0.35, 0.12, 0], [0.28, 0.1, 0.09]);
  for (const s of [-1, 1]) {
    const w = add(g, new THREE.BoxGeometry(0.55, 0.025, 0.7), grey, [-0.12, -0.02, s * 0.36], [s * 0.0, s * 0.45, 0]);
    w.geometry.translate(0, 0, 0);
    add(g, new THREE.BoxGeometry(0.3, 0.02, 0.28), grey, [-0.78, 0, s * 0.2], [0, s * 0.4, 0]);
    add(g, new THREE.BoxGeometry(0.06, 0.3, 0.02), dark, [-0.8, 0.14, s * 0.07], [s * 0.2, 0, 0.3]);
    add(g, new THREE.CylinderGeometry(0.055, 0.07, 0.18, 14), dark, [-0.95, 0, s * 0.07], [0, 0, Math.PI / 2]);
    // US-style star roundel on the wings
    add(g, new THREE.CircleGeometry(0.1, 20), mat('#1c3f94'), [-0.1, 0.0125 + 0.012, s * 0.55], [-Math.PI / 2, 0, 0]);
  }
  if (label) {
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), new THREE.MeshBasicMaterial({ map: textTex(label, { w: 900, h: 200, fg: '#ffffff', font: 'bold 150px Arial' }), transparent: true }));
      p.position.set(-0.1, 0.075, s * 0.145); p.rotation.y = s > 0 ? 0 : Math.PI; g.add(p);
    }
  }
  return g;
}

/** Gold trophy cup, ~0.6 tall. */
export function buildTrophy() {
  const g = new THREE.Group(), gold = mat('#ffc933', { metalness: 0.5, roughness: 0.3 });
  const pts = [[0.01, 0], [0.14, 0.02], [0.14, 0.05], [0.05, 0.08], [0.03, 0.24], [0.08, 0.3], [0.2, 0.52], [0.21, 0.6], [0.0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(pts, 32), gold);
  for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.09, 0.018, 10, 24), gold, [s * 0.24, 0.42, 0], [0, 0, 0]);
  add(g, new THREE.BoxGeometry(0.34, 0.06, 0.34), mat('#6a3f1d'), [0, -0.02, 0]);
  add(g, new THREE.OctahedronGeometry(0.06), mat('#fff3a8'), [0, 0.68, 0]);
  return g;
}

/** Pink wrinkled brain ~1 wide, basic-lit so it glows. */
export function buildBrain() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const geo = new THREE.SphereGeometry(1, 64, 48), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const w = 1 + 0.07 * Math.sin(x * 11 + y * 4) * Math.cos(z * 10 - y * 3) + 0.05 * Math.sin(y * 17 + z * 5);
      p.setXYZ(i, x * w * 0.5, y * w * 0.6, z * w * 0.82);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ff9fb8', roughness: 0.5, emissive: '#ff4f86', emissiveIntensity: 0.25 }));
    m.position.x = s * 0.27; m.castShadow = true; g.add(m);
  }
  add(g, new THREE.CylinderGeometry(0.1, 0.13, 0.3, 16), mat('#f2849e'), [0.0, -0.5, -0.2], [0.3, 0, 0]);
  return g;
}

/** Furry man ~1.7 tall facing +z, wearing a crown. */
export function buildFurMan() {
  const g = new THREE.Group(), fur = '#8a5a34', r = rng(11);
  const furM = mat(fur, { roughness: 1 }), tuft = mat('#a46f42', { roughness: 1 });
  const body = blob(g, furM, [0, 0.8, 0], [0.5, 0.65, 0.42]);
  const head = blob(g, furM, [0, 1.62, 0], [0.4, 0.38, 0.36]);
  const spots = [[body.position, [0.5, 0.65, 0.42], 150], [head.position, [0.4, 0.38, 0.36], 110]];
  for (const [c, rad, n] of spots) for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, q = Math.sqrt(1 - u * u), d = new THREE.Vector3(q * Math.cos(th), u, q * Math.sin(th));
    if (c === head.position && d.z > 0.3 && d.y < 0.5 && d.y > -0.7) continue;
    const t = add(g, new THREE.ConeGeometry(0.055, 0.2, 6), tuft, [c.x + d.x * rad[0], c.y + d.y * rad[1], c.z + d.z * rad[2]]);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  }
  const skin = mat('#f0c9a2');
  blob(g, skin, [0, 1.58, 0.3], [0.27, 0.24, 0.12]);
  for (const s of [-1, 1]) {
    blob(g, basic('#ffffff'), [s * 0.12, 1.64, 0.4], [0.07, 0.085, 0.03]);
    blob(g, basic('#2a1a10'), [s * 0.12, 1.64, 0.425], [0.045, 0.06, 0.02]);
    blob(g, basic('#fff'), [s * 0.12 - 0.015, 1.67, 0.445], [0.016, 0.016, 0.01]);
    add(g, new THREE.CylinderGeometry(0.09, 0.11, 0.7, 14), furM, [s * 0.52, 0.8, 0.05], [0, 0, s * 0.25]);
    blob(g, tuft, [s * 0.6, 0.45, 0.05], [0.1, 0.1, 0.1]);
    add(g, new THREE.CylinderGeometry(0.13, 0.14, 0.5, 14), furM, [s * 0.2, 0.18, 0]);
    blob(g, mat('#3b2a20'), [s * 0.2, 0.0, 0.08], [0.17, 0.08, 0.22]);
  }
  const mouth = add(g, new THREE.TorusGeometry(0.07, 0.014, 8, 20, Math.PI), mat('#7a2a2a'), [0, 1.52, 0.41], [0, 0, Math.PI]);
  blob(g, mat('#e58a8a'), [0, 1.57, 0.43], [0.035, 0.025, 0.02]);
  const crown = buildCrown(); crown.position.set(0, 1.95, 0); g.add(crown);
  return g;
}

/** Gold crown, ~0.3 wide. */
export function buildCrown() {
  const g = new THREE.Group(), gold = mat('#ffc933', { metalness: 0.5, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(0.19, 0.17, 0.12, 24, 1, true), gold).material.side = THREE.DoubleSide;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    add(g, new THREE.ConeGeometry(0.045, 0.16, 4), gold, [Math.cos(a) * 0.18, 0.13, Math.sin(a) * 0.18]);
    add(g, new THREE.SphereGeometry(0.028, 10, 8), mat(['#e83c4a', '#3c8ce8'][i % 2]), [Math.cos(a) * 0.18, 0.23, Math.sin(a) * 0.18]);
  }
  return g;
}

/** Robot bear (BigBear) ~2 tall facing +z, one arm holding a wrench. */
export function buildBear() {
  const g = new THREE.Group(), steel = mat('#8fa2bd', { metalness: 0.4, roughness: 0.35 }), dark = mat('#3a4558', { metalness: 0.4 }), glow = basic('#6ee8ff');
  const arm = {};
  blob(g, steel, [0, 1.0, 0], [0.6, 0.72, 0.5]);
  blob(g, mat('#c9d6ea', { metalness: 0.3 }), [0, 0.95, 0.4], [0.4, 0.5, 0.15]);
  add(g, new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), glow, [0, 1.05, 0.55], [Math.PI / 2, 0, 0]);
  blob(g, steel, [0, 2.0, 0.02], [0.52, 0.45, 0.46]);
  blob(g, mat('#c9d6ea', { metalness: 0.3 }), [0, 1.9, 0.38], [0.26, 0.2, 0.17]);
  blob(g, dark, [0, 1.96, 0.54], [0.08, 0.055, 0.05]);
  for (const s of [-1, 1]) {
    blob(g, steel, [s * 0.4, 2.35, -0.05], [0.18, 0.18, 0.1]);
    blob(g, dark, [s * 0.4, 2.35, 0.03], [0.1, 0.1, 0.05]);
    blob(g, basic('#ffffff'), [s * 0.2, 2.1, 0.4], [0.09, 0.1, 0.04]);
    blob(g, glow, [s * 0.2, 2.1, 0.435], [0.06, 0.075, 0.03]);
    blob(g, basic('#111'), [s * 0.2, 2.1, 0.46], [0.03, 0.045, 0.02]);
    add(g, new THREE.CylinderGeometry(0.2, 0.24, 0.8, 16), steel, [s * 0.3, 0.3, 0.05]);
    blob(g, dark, [s * 0.3, 0.02, 0.15], [0.26, 0.1, 0.32]);
    arm[s] = new THREE.Group(); arm[s].position.set(s * 0.64, 1.45, 0.05); g.add(arm[s]);
    add(arm[s], new THREE.CylinderGeometry(0.14, 0.12, 0.9, 14), steel, [0, -0.45, 0]);
    blob(arm[s], dark, [0, -0.95, 0], [0.17, 0.17, 0.17]);
  }
  add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8), dark, [0, 2.55, 0]);
  blob(g, mat('#ff4f4f'), [0, 2.78, 0], [0.06, 0.06, 0.06]);
  g.userData.arms = arm; return g;
}

/** Wrench ~0.5 long along y. */
export function buildWrench() {
  const g = new THREE.Group(), m = mat('#d0d6de', { metalness: 0.6, roughness: 0.3 });
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10), m);
  for (const y of [0.27, -0.27]) { add(g, new THREE.TorusGeometry(0.07, 0.04, 8, 16, Math.PI * 1.5), m, [0, y, 0], [0, 0, y > 0 ? 0.8 : 3.9]); }
  return g;
}

/** Lollipop fruit tree with `n` fruits. */
export function buildFruitTree(n = 5, h = 1.4) {
  const g = new THREE.Group(), r = rng(3 + n);
  add(g, new THREE.CylinderGeometry(0.07, 0.1, h * 0.55, 12), mat('#7a4b25'), [0, h * 0.275, 0]);
  const leaf = mat('#3f9e3f');
  blob(g, leaf, [0, h * 0.8, 0], [h * 0.38, h * 0.32, h * 0.38]);
  blob(g, mat('#4bb04b'), [-h * 0.12, h * 0.95, h * 0.05], [h * 0.26, h * 0.22, h * 0.26]);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.4, ra = h * 0.36;
    blob(g, mat('#e8352f', { roughness: 0.35 }), [Math.cos(a) * ra * 0.95, h * 0.8 + Math.sin(a * 2) * h * 0.1, Math.sin(a) * ra * 0.95 + 0.05], [0.1, 0.1, 0.1]);
  }
  return g;
}

/** Palm tree. */
export function buildPalm(h = 4) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.1, 0.16, h, 10), mat('#a47a4a'), [0, h / 2, 0], [0, 0, 0.08]);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const f = add(g, new THREE.ConeGeometry(0.2, 1.8, 5), mat('#3b9a45'), [Math.cos(a) * 0.8, h - 0.1, Math.sin(a) * 0.8], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2], [1, 1, 0.25]);
  }
  return g;
}
