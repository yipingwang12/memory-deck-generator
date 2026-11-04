// Shared Quanterix props: fox, koala, hard hat, blood drop, molecule, brick texture. All face +z, feet on y = 0.
import { THREE, mat, add, blob, cyl, canvasTexture, rng } from './scene_common.js';

export const eye = (g, x, y, z, { cunning = false, s = 1 } = {}) => {
  blob(g, mat('#fff', { roughness: 0.3 }), [x, y, z], [0.05 * s, cunning ? 0.032 * s : 0.05 * s, 0.02]);
  blob(g, mat('#10141c', { roughness: 0.3 }), [x, y - 0.004, z + 0.012], [0.03 * s, cunning ? 0.03 * s : 0.04 * s, 0.015]);
  blob(g, mat('#fff'), [x - 0.01 * s, y + 0.01 * s, z + 0.024], [0.01 * s, 0.01 * s, 0.006]);
  if (cunning) add(g, new THREE.BoxGeometry(0.12 * s, 0.03 * s, 0.02), mat('#d96a1c'), [x, y + 0.03 * s, z + 0.026], [0, 0, x > 0 ? -0.35 : 0.35]);
};

export function buildFox({ cunning = true } = {}) {
  const g = new THREE.Group(), or = mat('#f08a24'), wh = mat('#fff4e4'), dk = mat('#2a1c18');
  blob(g, or, [0, 0.5, 0], [0.32, 0.45, 0.28]);
  blob(g, wh, [0, 0.45, 0.14], [0.2, 0.34, 0.16]);
  const head = new THREE.Group(); head.position.set(0, 1.12, 0.03); g.add(head);
  blob(head, or, [0, 0, 0], [0.34, 0.28, 0.3]);
  blob(head, wh, [0, -0.09, 0.14], [0.26, 0.16, 0.2]);
  add(head, new THREE.ConeGeometry(0.11, 0.3, 24), wh, [0, -0.06, 0.36], [Math.PI / 2 + 0.08, 0, 0]);
  blob(head, dk, [0, -0.01, 0.5], [0.05, 0.04, 0.04]);
  for (const s of [-1, 1]) {
    add(head, new THREE.ConeGeometry(0.12, 0.34, 24), or, [s * 0.2, 0.3, -0.02], [0, 0, -s * 0.3]);
    add(head, new THREE.ConeGeometry(0.07, 0.24, 24), dk, [s * 0.2, 0.29, 0.02], [0, 0, -s * 0.3]);
    eye(head, s * 0.13, 0.07, 0.25, { cunning, s: 1.1 });
  }
  add(head, new THREE.TorusGeometry(0.06, 0.008, 8, 16, Math.PI), dk, [0, -0.14, 0.45], [0, 0, Math.PI]);
  const tail = new THREE.Group(); tail.position.set(0.25, 0.22, -0.15); tail.rotation.z = -0.9; g.add(tail);
  blob(tail, or, [0, 0.3, 0], [0.15, 0.4, 0.15]); blob(tail, wh, [0, 0.62, 0], [0.12, 0.16, 0.12]);
  for (const s of [-1, 1]) { blob(g, dk, [s * 0.14, 0.05, 0.1], [0.1, 0.06, 0.15]); add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.25, 12), or, [s * 0.14, 0.17, 0.05]); }
  g.userData.head = head; return g;
}

export function buildKoala({ scale = 1 } = {}) {
  const g = new THREE.Group(), gr = mat('#9aa0ab'), lt = mat('#e8e8ee'), pink = mat('#f2a9b8'), dk = mat('#14161c', { roughness: 0.3 });
  blob(g, gr, [0, 0.32, 0], [0.26, 0.32, 0.22]); blob(g, lt, [0, 0.3, 0.12], [0.17, 0.24, 0.12]);
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.02); g.add(head);
  blob(head, gr, [0, 0, 0], [0.3, 0.26, 0.26]);
  for (const s of [-1, 1]) {
    blob(head, gr, [s * 0.3, 0.14, -0.03], [0.17, 0.17, 0.07]); blob(head, pink, [s * 0.3, 0.14, 0.01], [0.11, 0.11, 0.04]);
    blob(head, lt, [s * 0.3, 0.14, -0.005], [0.14, 0.14, 0.05]).material = lt;
    blob(head, pink, [s * 0.3, 0.14, 0.03], [0.09, 0.09, 0.03]);
    eye(head, s * 0.12, 0.06, 0.23, { s: 0.9 });
    blob(g, gr, [s * 0.27, 0.35, 0.08], [0.07, 0.22, 0.08], [0, 0, -s * 0.25]);
    blob(g, gr, [s * 0.13, 0.05, 0.1], [0.1, 0.06, 0.13]);
  }
  blob(head, dk, [0, -0.04, 0.27], [0.09, 0.12, 0.06]);
  blob(head, mat('#fff'), [-0.02, 0.0, 0.31], [0.02, 0.025, 0.01]);
  g.scale.setScalar(scale); g.userData.head = head; return g;
}

export function hardHat(color = '#ffcc1a') {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.35 });
  add(g, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, [0, 0, 0], [0, 0, 0], [0.26, 0.2, 0.26]);
  add(g, new THREE.CylinderGeometry(0.31, 0.31, 0.03, 32), m, [0, 0.005, 0.02]);
  add(g, new THREE.BoxGeometry(0.06, 0.2, 0.4), m, [0, 0.07, 0], [0, 0, 0]).scale.set(1, 0.6, 0.65);
  return g;
}

/** Teardrop via lathe: radius profile from bottom round belly to pointed top. */
export function dropMesh(r = 0.5, color = '#c8102e', opacity = 0.92) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI;
    pts.push(new THREE.Vector2(Math.max(r * 1.3 * Math.sin(a) * Math.sin(a / 2), 0.0005), -Math.cos(a) * r * 1.3));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.18, transparent: true, opacity, emissive: '#5a0010', emissiveIntensity: 0.5 }));
  m.castShadow = true; return m;
}

/** A glowing single protein: core + spikes. */
export function protein(r = 0.15, color = '#ffe14a') {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
  add(g, new THREE.SphereGeometry(r, 24, 16), m);
  const R = rng(3);
  for (let i = 0; i < 12; i++) {
    const v = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize();
    const s = add(g, new THREE.ConeGeometry(r * 0.28, r * 1.1, 10), m, v.clone().multiplyScalar(r * 1.25).toArray());
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
  }
  return g;
}

export function brickTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#e8d9c4'; ctx.fillRect(0, 0, s, s);
    const r = rng(11), bh = s / 8, bw = s / 4;
    for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2, l = 150 + r() * 40;
      ctx.fillStyle = `rgb(${l + 50},${l - 60},${l - 90})`; ctx.fillRect(x * bw + ox + 4, y * bh + 4, bw - 8, bh - 8);
    }
  });
}
export function brickMat(rx = 1, ry = 1) { const t = brickTexture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); }

export function buildWall({ scale = 1 } = {}) {
  const g = new THREE.Group(), br = brickMat(1.2, 1.6);
  add(g, new THREE.BoxGeometry(1.3, 1.7, 0.45), br, [0, 0.85, 0]);
  add(g, new THREE.BoxGeometry(1.4, 0.12, 0.55), mat('#cfc6b8'), [0, 1.76, 0]);
  for (const s of [-1, 1]) eye(g, s * 0.28, 1.25, 0.23, { s: 2.2 });
  add(g, new THREE.TorusGeometry(0.14, 0.022, 8, 20, Math.PI), mat('#4a1c1c'), [0, 0.98, 0.23], [0, 0, Math.PI]);
  g.scale.setScalar(scale); return g;
}

export function buildBrain({ scale = 1, color = '#f08aa4' } = {}) {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.55 }), R = rng(8);
  for (const s of [-1, 1]) blob(g, m, [s * 0.14, 0, 0], [0.2, 0.17, 0.26]);
  for (let i = 0; i < 26; i++) { const a = R() * 6.28, b = (R() - 0.2) * 2.2; blob(g, m, [Math.cos(a) * 0.3 * Math.cos(b * 0.5), 0.12 * Math.sin(b), Math.sin(a) * 0.26], [0.07, 0.07, 0.07]); }
  add(g, new THREE.CylinderGeometry(0.04, 0.05, 0.14, 12), mat('#e8a0ae'), [0, -0.2, -0.1], [0.3, 0, 0]);
  g.scale.setScalar(scale); return g;
}
