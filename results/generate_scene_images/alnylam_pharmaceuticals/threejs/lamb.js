// The Alnylam anchor: one procedural LAMB, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0. Pose via lamb.userData.pose({...}).
import * as THREE from 'three';
import { rng, fbm, canvasTexture, noiseFill, tileNoise, displace, sphereUV } from './kit.js';

const WOOL = new THREE.Color('#efe3cb');
const FACE = '#d8c4aa';
const LEG = '#5b4b40';

/** Curly-wool bump: overlapping small arcs. */
function curlBump() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    const r = rng(11);
    for (let i = 0; i < 2600; i++) {
      const x = r() * s, y = r() * s, rad = 3 + r() * 7, a = r() * Math.PI * 2;
      const g = 90 + r() * 140;
      ctx.strokeStyle = `rgb(${g},${g},${g})`; ctx.lineWidth = 1.5 + r() * 2;
      ctx.beginPath(); ctx.arc(x, y, rad, a, a + Math.PI * (1 + r())); ctx.stroke();
    }
  }, { repeat: 1, data: true });
}

function woolMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.95, sheen: 0.8, sheenRoughness: 0.45, sheenColor: new THREE.Color('#fff6e6'),
    bumpMap: curlBump(), bumpScale: 3.5,
  });
}

function skinMaterial(color, bump = 0.6) {
  const tex = canvasTexture(256, (ctx, s) => noiseFill(ctx, s, (u, v) => {
    const h = 128 + tileNoise(u, v, 60, 2) * 70; return [h, h, h];
  }), { repeat: 2, data: true });
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#fff0e0'), bumpMap: tex, bumpScale: bump });
}

/** One bumpy blob reused by every wool clump. */
const clumpGeometry = (() => {
  const g = displace(new THREE.IcosahedronGeometry(1, 3), (p) => 0.22 * fbm(p.x * 1.6, p.y * 1.6, p.z * 1.6, 3));
  return sphereUV(g, 2);
})();

/**
 * Cover an ellipsoid (center c, radii r) with wool clumps.
 * keep(dir) filters which surface directions get wool.
 */
function woolCoat({ c, r, count, size, seed, keep = () => true, mat, shade = 0.07 }) {
  const inst = new THREE.InstancedMesh(clumpGeometry, mat, count);
  const R = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  let n = 0;
  for (let t = 0; n < count && t < count * 10; t++) {
    const d = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1);
    if (d.lengthSq() > 1 || d.lengthSq() < 1e-3) continue;
    d.normalize();
    if (!keep(d)) continue;
    const p = new THREE.Vector3(c[0] + d.x * r[0], c[1] + d.y * r[1], c[2] + d.z * r[2]);
    const nrm = new THREE.Vector3(d.x / r[0], d.y / r[1], d.z / r[2]).normalize();
    const s = size * (0.7 + R() * 0.55);
    p.addScaledVector(nrm, s * 0.25);
    q.setFromUnitVectors(up, nrm);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(up, R() * Math.PI * 2));
    m.compose(p, q, new THREE.Vector3(s, s * 0.75, s));
    inst.setMatrixAt(n, m);
    // Underside and deep crevices a touch darker/warmer.
    const k = 1 - shade * (0.5 - 0.5 * nrm.y) - R() * 0.05;
    inst.setColorAt(n++, col.copy(WOOL).multiplyScalar(k));
  }
  inst.count = n;
  inst.castShadow = inst.receiveShadow = true;
  return inst;
}

function ellipsoid(r, mat, seg = 48) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), mat);
  m.scale.set(...r);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Eye: glossy dark iris with a soft brown rim; faces local +z. */
function eye(radius) {
  const map = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#f4ece0'; ctx.fillRect(0, 0, s, s);
    // Sphere UV: front pole region is at v≈0.5 around u=0.25 for +z after rotation below.
    const cx = s * 0.25, cy = s * 0.5;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, s * 0.17);
    g.addColorStop(0, '#120c08'); g.addColorStop(0.55, '#2a1a10'); g.addColorStop(0.85, '#6b4528'); g.addColorStop(1, '#3a2416');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.17, s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050302'; ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.03, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  });
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshPhysicalMaterial({ map, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 })); // u=0.25 faces +z
  const glint = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glint.position.set(radius * 0.25, radius * 0.4, radius * 0.88);
  glint.scale.z = 0.4;
  glint.userData.catchlight = true;
  m.add(glint);
  return m;
}

/** Leg: hip group → thigh → knee group → shin + hoof. Length ~0.5. */
function leg(skin, hoofMat, wool, seed, front) {
  const hip = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.2, 20), skin);
  thigh.position.y = -0.1; thigh.castShadow = true;
  const knee = new THREE.Group(); knee.position.y = -0.2;
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), skin); joint.castShadow = true;
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.025, 0.2, 20), skin);
  shin.position.y = -0.1; shin.castShadow = true;
  const fetlock = new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 12), skin);
  fetlock.position.y = -0.19; fetlock.scale.set(1, 0.8, 1.1);
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.033, 0.04, 20), hoofMat);
  hoof.position.set(0, -0.22, 0.004); hoof.castShadow = true;
  const cleft = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.041, 0.07), new THREE.MeshBasicMaterial({ color: 0x0a0806 }));
  cleft.position.copy(hoof.position).add(new THREE.Vector3(0, 0, 0.012));
  knee.add(joint, shin, fetlock, hoof, cleft);
  // Wool "trousers" on the upper leg.
  const trousers = woolCoat({ c: [0, -0.08, 0], r: [0.062, front ? 0.11 : 0.14, 0.066], count: 110, size: 0.04, seed, mat: wool, keep: (d) => d.y > -0.6 });
  hip.add(thigh, knee, trousers);
  return { hip, knee };
}

/** Build the lamb. Returns a Group with userData.parts and userData.pose(). */
export function createLamb() {
  const lamb = new THREE.Group();
  const wool = woolMaterial(), skin = skinMaterial(FACE), legSkin = skinMaterial(LEG, 0.4);
  const hoofMat = new THREE.MeshPhysicalMaterial({ color: '#1c1512', roughness: 0.35, clearcoat: 0.6 });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#2b1f1c', roughness: 0.45, clearcoat: 0.4 });
  const pink = skinMaterial('#d99a8e', 0.3);

  // Body: underbody + dense clump coat.
  const body = new THREE.Group();
  const under = ellipsoid([0.27, 0.24, 0.42], new THREE.MeshPhysicalMaterial({ color: WOOL.clone().multiplyScalar(0.8), roughness: 1 }));
  under.position.y = 0.57;
  body.add(under, woolCoat({ c: [0, 0.57, 0], r: [0.29, 0.26, 0.44], count: 1900, size: 0.058, seed: 1, mat: wool }));
  // Tail.
  body.add(woolCoat({ c: [0, 0.61, -0.47], r: [0.06, 0.07, 0.05], count: 40, size: 0.04, seed: 9, mat: wool }));
  lamb.add(body);

  // Legs.
  const legs = {};
  for (const [key, x, z, front] of [['fl', 0.14, 0.26, true], ['fr', -0.14, 0.26, true], ['hl', 0.14, -0.26, false], ['hr', -0.14, -0.26, false]]) {
    const l = leg(legSkin, hoofMat, wool, 20 + x * 100 + z * 10, front);
    l.hip.position.set(x, 0.44, z);
    lamb.add(l.hip);
    legs[key] = l;
  }

  // Neck → head.
  const neck = new THREE.Group();
  neck.position.set(0, 0.67, 0.3);
  neck.add(woolCoat({ c: [0, 0.12, 0.06], r: [0.14, 0.16, 0.14], count: 420, size: 0.05, seed: 4, mat: wool }));
  const head = new THREE.Group();
  head.position.set(0, 0.25, 0.22);
  neck.add(head);
  lamb.add(neck);

  const skull = ellipsoid([0.115, 0.125, 0.155], skin); skull.position.set(0, 0.0, 0.0);
  const muzzle = ellipsoid([0.085, 0.08, 0.1], skin); muzzle.position.set(0, -0.045, 0.115);
  const cheekL = ellipsoid([0.06, 0.07, 0.08], skin); cheekL.position.set(0.055, -0.03, 0.05);
  const cheekR = cheekL.clone(); cheekR.position.x = -0.055;
  const nose = ellipsoid([0.04, 0.026, 0.02], dark); nose.position.set(0, -0.02, 0.208); nose.rotation.x = -0.35;
  const nostrils = [-1, 1].map((sx) => { const n = ellipsoid([0.011, 0.007, 0.006], new THREE.MeshBasicMaterial({ color: 0x0b0706 }), 16); n.position.set(0.017 * sx, -0.024, 0.224); n.rotation.z = 0.5 * sx; return n; });
  const philtrum = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.035, 0.01), dark); philtrum.position.set(0, -0.053, 0.212); philtrum.rotation.x = -0.2;
  const mouthGeo = new THREE.TorusGeometry(0.03, 0.0035, 8, 24, Math.PI * 0.9); mouthGeo.rotateZ(Math.PI * 1.05);
  const mouth = new THREE.Mesh(mouthGeo, dark); mouth.position.set(0, -0.07, 0.198); mouth.rotation.x = -0.3;
  head.add(skull, muzzle, cheekL, cheekR, nose, ...nostrils, philtrum, mouth);

  // Eyes with upper lids.
  for (const sx of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(0.082 * sx, 0.03, 0.075);
    g.rotation.y = 0.55 * sx;
    g.add(eye(0.033));
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0335, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), skin);
    lid.rotation.x = -0.25; lid.castShadow = true;
    g.add(lid);
    head.add(g);
  }

  // Ears: outward and slightly drooping, pink inside.
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(0.1 * sx, 0.06, -0.03);
    ear.rotation.set(0.15, 0.35 * sx, -0.3 * sx);
    const outer = ellipsoid([0.1, 0.02, 0.048], skin); outer.position.x = 0.085 * sx;
    const inner = ellipsoid([0.08, 0.012, 0.034], pink); inner.position.set(0.09 * sx, 0.012, 0.008);
    ear.add(outer, inner);
    head.add(ear);
  }

  // Topknot of wool.
  head.add(woolCoat({ c: [0, 0.085, -0.03], r: [0.085, 0.06, 0.095], count: 150, size: 0.032, seed: 6, mat: wool, keep: (d) => d.y > -0.1 }));

  const mouthAnchor = new THREE.Object3D(); mouthAnchor.position.set(0, -0.07, 0.19); head.add(mouthAnchor);

  lamb.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

  const parts = { neck, head, legs, mouth: mouthAnchor, body };
  lamb.userData.parts = parts;
  /** Two-bone IK: put leg `key`'s hoof sole on `target` (lamb-local [x, y, z]); knee raised forward (pawing). */
  lamb.userData.reach = (key, target) => {
    const { hip, knee } = legs[key];
    const A = 0.2, B = 0.24;
    const dy = target[1] - hip.position.y, dz = target[2] - hip.position.z;
    const D = Math.min(Math.hypot(dy, dz), A + B - 1e-3);
    const phi = Math.atan2(dz, -dy);
    const atHip = Math.acos((A * A + D * D - B * B) / (2 * A * D));
    const atKnee = Math.acos((A * A + B * B - D * D) / (2 * A * B));
    hip.rotation.set(-(phi + atHip), 0, Math.atan2(target[0] - hip.position.x, -dy));
    knee.rotation.x = Math.PI - atKnee;
  };
  /** Angles in radians. legs: { fr: { hip: [x, z], knee: x } }. */
  lamb.userData.pose = ({ neckPitch = 0, headPitch = 0, headYaw = 0, headRoll = 0, legs: L = {} } = {}) => {
    neck.rotation.x = neckPitch;
    head.rotation.set(headPitch, headYaw, headRoll);
    for (const [k, v] of Object.entries(L)) {
      legs[k].hip.rotation.set(v.hip?.[0] ?? 0, 0, v.hip?.[1] ?? 0);
      legs[k].knee.rotation.x = v.knee ?? 0;
    }
  };
  return lamb;
}
