// Shared Axoft scene props: seg (limb between two points), hand, textPlane, crown, mountain, star, sparks.
import { THREE, mat, add, blob, cyl, canvasTexture, rng } from './lib.js';

/** cylinder between two points */
export function seg(parent, m, p1, p2, r = 0.04) {
  const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2), d = b.clone().sub(a);
  const o = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 12), m);
  o.position.copy(a.clone().add(b).multiplyScalar(0.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}
export const hand = (a, k) => a.userData.parts.hands[k].getWorldPosition(new THREE.Vector3());

/** undistorted text plane (w x h world units) */
export function textPlane(text, { w = 1, h = 0.4, bg = '#ffffff', fg = '#222', frame = null } = {}) {
  const tex = canvasTexture(512, (ctx, s) => {
    ctx.scale(1, w / h); const H = s * h / w;
    ctx.fillStyle = frame ?? bg; ctx.fillRect(0, 0, s, H);
    if (frame) { ctx.fillStyle = bg; ctx.fillRect(s * 0.03, s * 0.03, s * 0.94, H - s * 0.06); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = H * 0.62; ctx.font = `bold ${fs}px sans-serif`;
    while (ctx.measureText(text).width > s * 0.88) { fs *= 0.92; ctx.font = `bold ${fs}px sans-serif`; }
    ctx.fillText(text, s / 2, H / 2 + fs * 0.04);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

export function crown(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const gold = mat('#ffc928', { metalness: 0.5, roughness: 0.3 });
  cyl(g, gold, [0, 0, 0], 0.2 * s, 0.14 * s, [0, 0, 0], 0.17 * s);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 0.18 * s, z = Math.sin(a) * 0.18 * s;
    add(g, new THREE.ConeGeometry(0.055 * s, 0.2 * s, 8), gold, [x, 0.15 * s, z]);
    blob(g, mat('#e8383d'), [x, 0.26 * s, z], [0.03 * s, 0.03 * s, 0.03 * s]);
  }
  return g;
}

export function mountain(parent, [x, z], r, h, rock = '#6f7fa6') {
  const m = add(parent, new THREE.ConeGeometry(r, h, 9), mat(rock), [x, h / 2, z]);
  add(parent, new THREE.ConeGeometry(r * 0.42, h * 0.42, 9), mat('#f6f8ff'), [x, h * 0.79, z]);
  return m;
}

export function starShape(R = 0.45, r = 0.2, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < 2 * n; i++) { const a = Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * d, Math.sin(a) * d); }
  s.closePath(); return s;
}

/** n glowing sparks scattered around c */
export function sparks(parent, c, n = 26, spread = 0.7, seed = 4) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.03 + r() * 0.035, 8, 6), new THREE.MeshBasicMaterial({ color: ['#ffe066', '#ff9d2e', '#fff3b0'][i % 3] }));
    m.position.set(c[0] + (r() - 0.5) * spread * 2, c[1] + r() * spread * 1.2, c[2] + (r() - 0.5) * spread); parent.add(m);
  }
}
