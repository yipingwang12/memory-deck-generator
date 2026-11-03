// q01 set: desert, stone desk, papers, pen and the posed lamb. Style-neutral (standard materials);
// style kits restyle it afterwards.
import * as THREE from 'three';
import { fbm, rng, canvasTexture, rock, stoneTextures, terrain, sandMaterial, scatter, grassTuftGeometry, displace } from './kit.js';
import { createLamb } from './lamb.js';

/** Document page with text-like grey bars, a seal and a signature line — no letters. */
export function paperTexture(seed, { top = true } = {}) {
  return canvasTexture(1024, (ctx, s) => {
    const r = rng(seed);
    ctx.fillStyle = '#f3ecdc'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(120,100,70,${r() * 0.04})`; ctx.fillRect(r() * s, r() * s, 2, 2); }
    if (!top) return;
    ctx.fillStyle = '#5a5248'; ctx.fillRect(s * 0.3, s * 0.08, s * 0.4, s * 0.025);
    ctx.fillStyle = '#8a8276'; ctx.fillRect(s * 0.38, s * 0.125, s * 0.24, s * 0.012);
    for (let y = s * 0.19; y < s * 0.72; y += s * 0.028) {
      if (r() < 0.12) { y += s * 0.015; continue; }
      const len = y > s * 0.7 ? 0.4 : 0.66 + r() * 0.14;
      ctx.fillStyle = 'rgba(70,64,58,0.55)'; ctx.fillRect(s * 0.14, y, s * len, s * 0.009);
    }
    // Gold seal with a red ribbon.
    const cx = s * 0.26, cy = s * 0.84;
    ctx.fillStyle = '#9b2b25'; ctx.beginPath(); ctx.moveTo(cx - 25, cy); ctx.lineTo(cx - 55, cy + 110); ctx.lineTo(cx - 20, cy + 95); ctx.lineTo(cx, cy); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 25, cy); ctx.lineTo(cx + 55, cy + 110); ctx.lineTo(cx + 20, cy + 95); ctx.lineTo(cx, cy); ctx.fill();
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; ctx.fillStyle = '#b8902e'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 9, 0, Math.PI * 2); ctx.fill(); }
    const g = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, 64);
    g.addColorStop(0, '#f1d27a'); g.addColorStop(1, '#a87a22');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.stroke();
    // Signature line with a fresh ink stroke, half written.
    ctx.fillStyle = '#3a342e'; ctx.fillRect(s * 0.55, s * 0.86, s * 0.33, 3);
    ctx.strokeStyle = '#1d2f6b'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(s * 0.57, s * 0.85);
    for (let t = 0; t <= 1; t += 0.02) ctx.lineTo(s * (0.57 + 0.18 * t), s * (0.85 - 0.03 * Math.sin(t * 14) - 0.012 * t));
    ctx.stroke();
  });
}

export function paperStack(group) {
  const W = 0.3, H = 0.38;
  const sheets = [];
  for (let i = 0; i < 4; i++) {
    const top = i === 3;
    const geo = new THREE.PlaneGeometry(W, H, 12, 12).rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) p.setY(k, 0.004 * Math.sin(p.getX(k) * 9 + i) * (top ? 0.4 : 1));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: paperTexture(30 + i, { top }), roughness: 0.82, side: THREE.DoubleSide }));
    m.position.set((i - 2) * 0.012, i * 0.0035, (2 - i) * 0.008);
    m.rotation.y = (i - 2) * 0.05;
    m.castShadow = m.receiveShadow = true;
    group.add(m); sheets.push(m);
  }
  return sheets[3];
}

/** Fountain pen along the segment tail → nib (world space). */
export function pen(tail, nib) {
  const g = new THREE.Group();
  const len = tail.distanceTo(nib);
  const black = new THREE.MeshPhysicalMaterial({ color: '#0d0d10', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d9a94a', metalness: 1, roughness: 0.22 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0095, len * 0.8, 24), black);
  barrel.position.y = len * 0.6;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 16, 12), black); cap.position.y = len;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.0096, 0.0018, 8, 24).rotateX(Math.PI / 2), gold); band.position.y = len * 0.25;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.007, len * 0.12, 24), black); grip.position.y = len * 0.15;
  const nibM = new THREE.Mesh(new THREE.ConeGeometry(0.0065, len * 0.1, 4).rotateY(Math.PI / 4), gold); nibM.position.y = len * 0.05; nibM.rotation.x = Math.PI;
  g.add(barrel, cap, band, grip, nibM);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.copy(nib);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tail.clone().sub(nib).normalize());
  return g;
}

/** Build the q01 set into `scene`; `num(key, default)` reads tuning overrides. Returns key objects. */
export function buildQ01(scene, num) {
  // Desert: near ground nearly flat, dunes rising with distance.
  const height = (x, z) => {
    const d = Math.hypot(x, z);
    const far = THREE.MathUtils.smoothstep(d, 10, 80);
    return 0.06 * fbm(x * 0.35, 0, z * 0.35, 3) + far * (5 * fbm(x * 0.012, 3, z * 0.012, 4) + 3) - 0.0;
  };
  scene.add(terrain({ size: 1600, seg: 640, height, material: sandMaterial({ repeat: 700 }) }));

  // Distant mesas toward and around the sun.
  const stoneFar = stoneTextures({ base: [168, 112, 74], seed: 2, repeat: 6 });
  const R = rng(5);
  for (let i = 0; i < 9; i++) {
    const a = THREE.MathUtils.degToRad(150 + i * 22 + R() * 10), d = 260 + R() * 220;
    const m = rock({ radius: 30 + R() * 30, seed: i * 3.1, squash: [1.6 + R(), 0.55 + R() * 0.3, 1.2], flatTop: 0.55, flatBottom: -0.2, textures: stoneFar, detail: 5 });
    m.position.set(Math.sin(a) * d, height(Math.sin(a) * d, Math.cos(a) * d) - 6, Math.cos(a) * d);
    m.rotation.y = R() * 6;
    scene.add(m);
  }

  // Mid-ground boulders.
  const stone = stoneTextures({ base: [180, 136, 96], seed: 1, repeat: 2 });
  for (const [x, z, r, s] of [[-3.2, -5, 0.9, 1], [-5.5, -9, 1.4, 2], [4.5, -7, 0.7, 3], [-1.8, -3.2, 0.35, 4], [2.6, -2.8, 0.25, 5], [-8, -16, 2.2, 6]]) {
    const m = rock({ radius: r, seed: s * 1.7, squash: [1.1, 0.75 + (s % 3) * 0.15, 0.9], rough: 0.5, textures: stone });
    m.position.set(x, height(x, z) - r * 0.2, z);
    scene.add(m);
  }

  // Rig: lamb faces local +z, stone desk in front.
  const rig = new THREE.Group();
  rig.rotation.y = num('yaw', 1.05);
  scene.add(rig);
  const deskStone = stoneTextures({ base: [170, 124, 86], seed: 4, repeat: 1 });
  const desk = rock({ radius: 0.36, seed: 9.3, squash: [1.3, 0.9, 0.9], flatTop: 0.3, flatBottom: -0.05, rough: 0.2, textures: deskStone });
  // Lectern: desk + papers pivot about the desk top; `tilt` leans the writing surface toward `tiltaz` (rig-local azimuth).
  const lectern = new THREE.Group();
  const tilt = num('tilt', 0), tiltAz = num('tiltaz', -0.94);
  lectern.position.set(0.02, 0.3 - num('tiltdrop', 0), 0.66);
  lectern.quaternion.setFromAxisAngle(new THREE.Vector3(Math.cos(tiltAz), 0, -Math.sin(tiltAz)), tilt);
  rig.add(lectern);
  desk.position.set(0, -0.3, 0);
  lectern.add(desk);
  const papers = new THREE.Group();
  papers.position.set(-0.02, 0.002, -0.04);
  papers.rotation.y = -0.25;
  lectern.add(papers);
  const topSheet = paperStack(papers);

  const lamb = createLamb();
  rig.add(lamb);
  lamb.userData.pose({
    neckPitch: num('neck', 0.55), headPitch: num('head', 0.45), headYaw: num('hyaw', -0.1),
  });
  // Hoof on the sheet's lamb-side edge, wherever the lectern puts it.
  rig.updateMatrixWorld(true);
  const hoof = lamb.worldToLocal(topSheet.localToWorld(new THREE.Vector3(num('hx', -0.07), 0.012, num('hz', -0.14))));
  lamb.userData.reach('fr', hoof.toArray());

  // Pen from the mouth to the signature's end on the top sheet.
  rig.updateMatrixWorld(true);
  const mouth = new THREE.Vector3(); lamb.userData.parts.mouth.getWorldPosition(mouth);
  const nib = topSheet.localToWorld(new THREE.Vector3(0.3 * (0.75 - 0.5), 0.004, 0.38 * (0.84 - 0.5)));
  const dir = mouth.clone().sub(nib).normalize();
  scene.add(pen(mouth.clone().addScaledVector(dir, 0.05), nib));

  // Ground clutter.
  const pebbleGeo = displace(new THREE.IcosahedronGeometry(0.035, 2), (p) => 0.012 * fbm(p.x * 40, p.y * 40, p.z * 40, 2));
  const pebbleMat = new THREE.MeshStandardMaterial({ color: '#a07a58', roughness: 0.9 });
  const clear = (x, z) => Math.hypot(x, z) < 1.1;
  scene.add(scatter({ geometry: pebbleGeo, material: pebbleMat, count: 500, rMin: 0.3, rMax: 9, height, seed: 2, scale: [0.4, 1.8], avoid: clear }));
  const tuft = grassTuftGeometry({ height: 0.32 });
  const tuftMat = new THREE.MeshStandardMaterial({ color: '#b39461', roughness: 0.9, side: THREE.DoubleSide });
  scene.add(scatter({ geometry: tuft, material: tuftMat, count: 70, rMin: 1.8, rMax: 25, height, seed: 8, scale: [0.6, 1.6], avoid: clear }));
  const shrubGeo = displace(new THREE.IcosahedronGeometry(0.4, 3), (p) => 0.15 * fbm(p.x * 6, p.y * 6, p.z * 6, 3));
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#6d6638', roughness: 1 });
  scene.add(scatter({ geometry: shrubGeo, material: shrubMat, count: 25, rMin: 6, rMax: 40, height, seed: 13, scale: [0.6, 1.5], avoid: clear }));

  return { lamb, rig, topSheet, height };
}
