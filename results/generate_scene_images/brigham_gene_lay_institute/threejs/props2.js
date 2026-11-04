// Extra props for the Gene Lay HEN scenes (local). All units ~ metres, feet on y = 0.
import { THREE, mat, add, blob, box, cyl, person, createHen, nest, egg } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cvTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const disc = (p, rx, ry, c, pos) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat(c, { roughness: 0.4 })); m.scale.set(rx, ry, 1); m.position.set(...pos); p.add(m); return m; };

/** Aim a person's/hen's limb at a world point. fn = userData.aim|reach. */
export function aimAt(obj, fn, key, world) {
  obj.updateMatrixWorld(true); const t = obj.worldToLocal(V(...world)); fn(key, [t.x, t.y, t.z]);
}

/** Hen placed in the scene (marked as character). opts: x,y,z,ry,scale,sit(bool) */
export function placeHen(S, { x = 0, y = 0, z = 0, ry = 0, scale = 1.2, sit = false } = {}) {
  const h = createHen({ scale }); h.position.set(x, y, z); h.rotation.y = ry; S.scene.add(h); S.mark(h);
  if (sit) h.userData.sit();
  return h;
}
export function placePerson(S, o, { x, z = 0, ry = 0, scale = 1.4 }) {
  const p = person({ ...o, scale }); p.position.set(x, 0, z); p.rotation.y = ry; S.scene.add(p); S.mark(p); return p;
}
export function placeNest(S, x, z, s = 1.3, y = 0) { const n = nest(0.55); n.scale.setScalar(s); n.position.set(x, y, z); S.scene.add(n); return n; }

export function flame(s = 1) {
  const g = new THREE.Group();
  const lay = [['#e8341c', 1, 0], ['#ff8a1e', 0.72, 0.18], ['#ffe14a', 0.42, 0.34]];
  for (const [c, k, dz] of lay) {
    const m = mat(c, { emissive: c, emissiveIntensity: 0.5, roughness: 0.5 });
    blob(g, m, [0, 0.36 * s * k + 0.02, dz], [0.4 * s * k, 0.38 * s * k, 0.4 * s * k]);
    add(g, new THREE.ConeGeometry(0.4 * s * k, 1.15 * s * k, 24), m, [0.0, (0.36 + 0.55) * s * k, dz]);
    add(g, new THREE.ConeGeometry(0.16 * s * k, 0.7 * s * k, 16), m, [0.2 * s * k, (0.5 + 0.4) * s * k, dz], [0, 0, -0.35]);
  }
  return g;
}

export function antibody(s = 1, col = '#3a7bd5') {
  const g = new THREE.Group(), m = mat(col, { roughness: 0.4 }), tip = mat('#ffd23a', { roughness: 0.4 });
  cyl(g, m, [0, 0.45 * s, 0], 0.11 * s, 0.9 * s);
  blob(g, m, [0, 0.9 * s, 0], [0.13 * s, 0.13 * s, 0.13 * s]);
  for (const k of [-1, 1]) {
    cyl(g, m, [k * 0.3 * s, 1.2 * s, 0], 0.1 * s, 0.7 * s, [0, 0, -k * 0.55]);
    blob(g, tip, [k * 0.51 * s, 1.5 * s, 0], [0.15 * s, 0.15 * s, 0.15 * s]);
  }
  return g;
}

/** Immune cell: pale blob with purple nucleus and spikes. */
export function cell(r = 0.25) {
  const g = new THREE.Group();
  blob(g, mat('#f4f0ff', { roughness: 0.5 }), [0, 0, 0], [r, r, r]);
  blob(g, mat('#8a5bd0'), [0.03, 0.02, r * 0.5], [r * 0.55, r * 0.5, r * 0.5]);
  return g;
}

export function shield(r = 0.5, glyph = 'Y') {
  const g = new THREE.Group();
  cyl(g, mat('#c99a3c', { metalness: 0.5, roughness: 0.35 }), [0, 0, 0], r, 0.08, [Math.PI / 2, 0, 0]);
  const t = cvTex(256, 256, (c, w) => { c.fillStyle = '#2d62c4'; c.fillRect(0, 0, w, w); c.strokeStyle = '#fff'; c.lineWidth = 34; c.lineCap = 'round';
    c.beginPath(); c.moveTo(128, 210); c.lineTo(128, 130); c.moveTo(128, 130); c.lineTo(68, 56); c.moveTo(128, 130); c.lineTo(188, 56); c.stroke(); });
  const f = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 36), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); f.position.z = 0.045; g.add(f);
  return g;
}

export function bookTex() {
  return cvTex(512, 640, (c, w, h) => { c.fillStyle = '#1f6b3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffd23a'; c.lineWidth = 14; c.strokeRect(22, 22, w - 44, h - 44);
    c.fillStyle = '#ffd23a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 190px sans-serif'; c.fillText('BIO', w / 2, 220); c.font = 'bold 100px sans-serif'; c.fillText('LEGEND', w / 2, 400);
    c.beginPath(); c.arc(w / 2, 530, 32, 0, 7); c.fill(); });
}
export function book(w = 1.0, h = 1.25) {
  const g = new THREE.Group(), pg = mat('#f6ecd0');
  box(g, pg, [0.02, 0, -0.02], [w, h, 0.18]);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.05), [mat('#17502b'), mat('#17502b'), mat('#17502b'), mat('#17502b'), new THREE.MeshStandardMaterial({ map: bookTex(), roughness: 0.6 }), mat('#17502b')]);
  cover.position.z = 0.1; cover.castShadow = true; g.add(cover);
  return g;
}

export function swordStone() {
  const g = new THREE.Group();
  blob(g, mat('#8d8f99'), [0, 0.35, 0], [0.7, 0.4, 0.55]); blob(g, mat('#a2a5af'), [0.25, 0.55, 0.1], [0.4, 0.3, 0.35]);
  const steel = mat('#dfe6f2', { metalness: 0.6, roughness: 0.25, emissive: '#aaccff', emissiveIntensity: 0.25 }), gold = mat('#ffc928', { metalness: 0.5, roughness: 0.3, emissive: '#ffb000', emissiveIntensity: 0.3 });
  box(g, steel, [0, 1.25, 0], [0.16, 1.2, 0.05]); add(g, new THREE.ConeGeometry(0.08, 0.2, 4), steel, [0, 1.95, 0], [0, Math.PI / 4, 0], [1, 1, 0.3]);
  box(g, gold, [0, 1.68, 0], [0.62, 0.1, 0.1]); cyl(g, gold, [0, 1.8, 0], 0.045, 0.28); blob(g, gold, [0, 2.0, 0], [0.09, 0.09, 0.09]);
  return g;
}

export function megaphone(len = 0.75) {
  const g = new THREE.Group();
  cyl(g, mat('#e8392f'), [0, 0, 0], 0.4, len, [0, 0, 0], 0.13);
  cyl(g, mat('#fff'), [0, len * 0.1, 0], 0.32, 0.1, [0, 0, 0], 0.28);
  cyl(g, mat('#2a2a30'), [0, -len / 2 - 0.06, 0], 0.12, 0.14);
  return g;
}

export function kangaroo() {
  const g = new THREE.Group(), fur = mat('#c98a4b'), pale = mat('#f1d3a8'), dark = mat('#5a3a22');
  blob(g, fur, [0, 0.85, 0], [0.36, 0.55, 0.32], [0.12, 0, 0]); blob(g, pale, [0, 0.8, 0.14], [0.26, 0.4, 0.2], [0.12, 0, 0]);
  blob(g, mat('#e6b982'), [0, 0.55, 0.26], [0.18, 0.1, 0.06]);
  for (const s of [-1, 1]) {
    blob(g, fur, [s * 0.22, 0.4, -0.04], [0.17, 0.3, 0.24]);
    blob(g, fur, [s * 0.22, 0.12, 0.2], [0.13, 0.09, 0.4]); blob(g, dark, [s * 0.22, 0.06, 0.52], [0.08, 0.05, 0.08]);
  }
  add(g, new THREE.ConeGeometry(0.2, 1.2, 20), fur, [0, 0.28, -0.7], [-1.35, 0, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0.16); g.add(head);
  blob(head, fur, [0, 0, 0], [0.22, 0.22, 0.22]); blob(head, pale, [0, -0.09, 0.19], [0.12, 0.1, 0.14]); blob(head, dark, [0, -0.04, 0.33], [0.045, 0.035, 0.035]);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.12, 0.14, -0.02); ear.rotation.z = -s * 0.22; head.add(ear);
    add(ear, new THREE.ConeGeometry(0.075, 0.46, 16), fur, [0, 0.22, 0], [0, 0, 0], [1, 1, 0.5]); add(ear, new THREE.ConeGeometry(0.045, 0.36, 16), mat('#f0b3a6'), [0, 0.2, 0.015], [0, 0, 0], [1, 1, 0.3]);
    const x = s * 0.1, z = 0.19;
    disc(head, 0.065, 0.078, '#fff', [x, 0.04, z]); disc(head, 0.05, 0.07, '#4a2a12', [x, 0.04, z + 0.002]); disc(head, 0.03, 0.045, '#0c0806', [x, 0.04, z + 0.004]); disc(head, 0.017, 0.017, '#fff', [x - 0.015, 0.065, z + 0.006]);
    disc(head, 0.035, 0.02, '#ff8f8f', [s * 0.16, -0.06, z - 0.03]).material.transparent = true;
    const arm = new THREE.Group(); arm.position.set(s * 0.3, 1.2, 0.1); g.add(arm); arm.rotation.x = -0.9; arm.rotation.z = -s * 0.2;
    cyl(arm, fur, [0, -0.17, 0], 0.06, 0.38); blob(arm, fur, [0, -0.39, 0], [0.07, 0.07, 0.09]);
    g.userData[s > 0 ? 'armL' : 'armR'] = arm;
  }
  // beret = director's cap
  blob(head, mat('#1d1d26'), [0.04, 0.2, 0], [0.25, 0.07, 0.25], [0, 0, -0.15]); blob(head, mat('#1d1d26'), [0.04, 0.27, 0], [0.04, 0.04, 0.04]);
  g.userData.head = head; return g;
}

export function clapper(w = 0.6) {
  const g = new THREE.Group();
  box(g, mat('#20202a'), [0, 0, 0], [w, w * 0.62, 0.05]);
  const top = new THREE.Group(); top.position.set(-w / 2, w * 0.31, 0.03); top.rotation.z = 0.35; g.add(top);
  for (let i = 0; i < 6; i++) box(top, mat(i % 2 ? '#fff' : '#20202a'), [w * (i + 0.5) / 6, w * 0.06, 0], [w / 6, w * 0.12, 0.05]);
  for (let i = 0; i < 6; i++) box(g, mat(i % 2 ? '#fff' : '#20202a'), [-w / 2 + w * (i + 0.5) / 6, w * 0.22, 0.03], [w / 6, w * 0.1, 0.05]);
  for (const y of [-0.05, -0.15]) box(g, mat('#e9e9ee'), [0, y * w * 1.5, 0.03], [w * 0.8, 0.02, 0.01]);
  return g;
}

/** Giant standing pin: red ball head at the bottom, silver shaft, needle tip up. */
export function pin(h = 2.2) {
  const g = new THREE.Group(), steel = mat('#d9e0ea', { metalness: 0.7, roughness: 0.2 }), top = h - 0.32;
  cyl(g, steel, [0, 0.5 + (h - 1.05) / 2, 0], 0.085, h - 1.05, [0, 0, 0], 0.1);
  add(g, new THREE.ConeGeometry(0.085, 0.5, 20), steel, [0, 0.25, 0], [Math.PI, 0, 0]);
  blob(g, mat('#e8283a', { roughness: 0.3 }), [0, top, 0], [0.34, 0.34, 0.34]);
  for (const s of [-1, 1]) { disc(g, 0.075, 0.1, '#fff', [s * 0.13, top + 0.04, 0.318]).rotation.y = s * 0.4; disc(g, 0.053, 0.078, '#101020', [s * 0.13, top + 0.04, 0.325]).rotation.y = s * 0.4; }
  return g;
}

export function saviour(S, x, scale = 1.3, ry = 0) {
  const p = placePerson(S, { skin: '#ffd9b8', robe: '#fbf7ee', hair: '#5a3a22', beard: '#5a3a22' }, { x, ry, scale });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 36), mat('#ffd23a', { emissive: '#ffc000', emissiveIntensity: 0.7 }));
  halo.position.set(0, 0.34, -0.02); halo.rotation.x = Math.PI / 2 - 0.2; p.userData.head.add(halo);
  box(p, mat('#e8c34a'), [0, 0.62, 0.0], [0.26, 0.06, 0.2]);
  return p;
}

export function monitor(w = 2.0, h = 1.25) {
  const g = new THREE.Group();
  const t = cvTex(640, 400, (c, W, H) => {
    c.fillStyle = '#0d1b3a'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2a4a8a'; c.lineWidth = 2; for (let i = 0; i < W; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, H); c.stroke(); }
    // DNA helix
    for (let i = 0; i <= 60; i++) { const y = 30 + i * 5.8, a = i * 0.32, x1 = 170 + Math.sin(a) * 70, x2 = 170 - Math.sin(a) * 70;
      c.fillStyle = '#ff5d8f'; c.beginPath(); c.arc(x1, y, 9, 0, 7); c.fill(); c.fillStyle = '#4de0ff'; c.beginPath(); c.arc(x2, y, 9, 0, 7); c.fill();
      if (i % 3 === 0) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke(); } }
    // network graph
    const N = [[420, 80], [540, 120], [470, 200], [380, 250], [560, 280], [450, 340]]; c.strokeStyle = '#ffd23a'; c.lineWidth = 5;
    [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [1, 4]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...N[a]); c.lineTo(...N[b]); c.stroke(); });
    N.forEach(([x, y], i) => { c.fillStyle = i % 2 ? '#7dff8a' : '#ff9a3a'; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); });
  });
  box(g, mat('#2a2d38'), [0, h / 2 + 0.55, 0], [w + 0.15, h + 0.15, 0.1]);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); scr.position.set(0, h / 2 + 0.55, 0.056); g.add(scr);
  box(g, mat('#2a2d38'), [0, 0.3, -0.05], [0.18, 0.5, 0.1]); box(g, mat('#2a2d38'), [0, 0.04, 0], [0.8, 0.08, 0.5]);
  return g;
}

export function hospital(wd = 4.6, ht = 2.6) {
  const g = new THREE.Group(), wall = mat('#f2f0ea'), glass = mat('#7fb8e8', { roughness: 0.2 });
  box(g, wall, [0, ht / 2, 0], [wd, ht, 1.6]); box(g, mat('#b8bcc8'), [0, ht + 0.06, 0], [wd + 0.2, 0.14, 1.8]);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) if (!(r === 0 && c === 2)) box(g, glass, [(c - 2) * 0.85, 0.75 + r * 0.9, 0.81], [0.5, 0.5, 0.04]);
  box(g, mat('#7a5a3a'), [0, 0.5, 0.81], [0.7, 1.0, 0.05]);
  const x = mat('#e0262e'); box(g, x, [wd / 2 - 0.55, ht - 0.6, 0.82], [0.7, 0.2, 0.04]); box(g, x, [wd / 2 - 0.55, ht - 0.6, 0.82], [0.2, 0.7, 0.04]);
  return g;
}

export function giftEgg(s = 1.5) {
  const g = egg(s, '#ffcf3a'); const red = mat('#e0262e', { roughness: 0.4 });
  g.children[0].material = mat('#ffcf3a', { metalness: 0.5, roughness: 0.3, emissive: '#ffb000', emissiveIntensity: 0.15 });
  const w = add(g, new THREE.TorusGeometry(0.5 * s, 0.045 * s, 10, 40), red, [0, 0.65 * s, 0], [Math.PI / 2, 0, 0], [1.02, 1.02, 1.0]); w.scale.set(1.02, 1.02, 1);
  add(g, new THREE.TorusGeometry(0.5 * s, 0.045 * s, 10, 40), red, [0, 0.65 * s, 0], [0, 0, 0], [1.0, 1.28, 1]);
  for (const k of [-1, 1]) blob(g, red, [k * 0.17 * s, 1.34 * s, 0], [0.18 * s, 0.1 * s, 0.07 * s], [0, 0, k * 0.4]);
  blob(g, red, [0, 1.3 * s, 0], [0.07 * s, 0.07 * s, 0.07 * s]);
  return g;
}

export function plankTex() {
  return cvTex(1024, 128, (c, w, h) => { c.fillStyle = '#c8924f'; c.fillRect(0, 0, w, h); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(${90 + r() * 40},${50 + r() * 20},20,${0.15 + r() * 0.2})`; c.fillRect(0, r() * h, w, 1 + r() * 3); }
    c.fillStyle = 'rgba(80,45,15,.5)'; for (const x of [260, 700]) { c.beginPath(); c.ellipse(x, 64, 26, 14, 0, 0, 7); c.fill(); } });
}
