// The GeneDx anchor: one procedural pair of JEANS (a character), reused and re-posed in every scene.
// Faces +z, feet on y = 0, ~1 unit tall. createJeans({ scale = 1, denim = '#3b6cb8', blush = true }) -> Group.
// userData.parts = { torso, arms:{l,r}, legs:{l,r}, hands:{l,r}, frontPockets:[l,r], backPockets:[l,r] }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a jeans-local point.
// userData.front(x, y) -> z of the torso surface (jeans-local), for sticking things on.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

const HIP_Y = 0.52, BOT = 0.5, TOP = 1.0, R0 = 0.2, R1 = 0.172, ZS = 0.62, ARM = 0.115, SH = [0.185, 0.92, 0];
const THREAD = '#f0a020';
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
const rAt = (y) => R0 + (R1 - R0) * ((y - BOT) / (TOP - BOT));
const front = (x, y) => ZS * Math.sqrt(Math.max(rAt(y) ** 2 - x * x, 1e-6));
const yawAt = (x, y) => { const a = rAt(y), z = front(x, y); return Math.atan2(x / (a * a), z / (ZS * a * ZS * a)); };

function denimTexture(base) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    const r = rng(11);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,30,0.08)'; const x = r() * s, y = r() * s; ctx.fillRect(x, y, 2, 6); }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    for (let k = -s; k < s * 2; k += 5) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + s, s); ctx.stroke(); }
  }, { repeat: 3 });
}

export function pocketTexture(base, kind) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = THREAD; ctx.lineWidth = 6; ctx.setLineDash([16, 10]); ctx.beginPath();
    if (kind === 'back') { ctx.moveTo(14, 14); ctx.lineTo(242, 14); ctx.lineTo(242, 150); ctx.lineTo(128, 240); ctx.lineTo(14, 150); ctx.closePath(); }
    else { ctx.moveTo(14, 14); ctx.lineTo(14, 120); ctx.quadraticCurveTo(14, 242, 150, 242); ctx.lineTo(242, 242); }
    ctx.stroke();
  });
}

function shell(thetaCenter, span, y0, y1, material, grow = 0.004) {
  const g = new THREE.CylinderGeometry(rAt(y1) + grow, rAt(y0) + grow, y1 - y0, 24, 1, true, thetaCenter - span / 2, span);
  g.scale(1, 1, ZS); g.translate(0, (y0 + y1) / 2, 0);
  const m = new THREE.Mesh(g, material); return m;
}

function face(group, blush) {
  const y = 0.8, step = 0.0015;
  const disc = (rx, ry, color, z, parent, x = 0, yy = 0, extra = {}) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4, ...extra }));
    m.scale.set(rx, ry, 1); m.position.set(x, yy, z); parent.add(m); return m;
  };
  for (const sx of [-1, 1]) {
    const x = sx * 0.062, g = new THREE.Group();
    g.position.set(x, y, front(x, y) + 0.003); g.rotation.y = yawAt(x, y); group.add(g);
    disc(0.034, 0.043, '#ffffff', 0, g);
    disc(0.026, 0.037, '#2a1a30', step, g, 0, -0.002);
    disc(0.0225, 0.017, '#4a86c8', 2 * step, g, 0, -0.016);
    disc(0.0125, 0.021, '#0c0814', 3 * step, g);
    disc(0.0085, 0.0085, '#ffffff', 4 * step, g, -0.009, 0.014);
    disc(0.004, 0.004, '#ffffff', 4 * step, g, -0.009, -0.016);
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32, 1, 0.2, Math.PI - 0.4), mat('#150c10'));
    lid.scale.set(0.036, 0.045, 1); lid.position.z = 5 * step; g.add(lid);
    if (blush) { const bx = sx * 0.1, bg = new THREE.Group(); bg.position.set(bx, y - 0.04, front(bx, y) + 0.002); bg.rotation.y = yawAt(bx, y); group.add(bg);
      const b = disc(0.018, 0.01, '#ff7f8f', 0, bg, 0, 0, { transparent: true, opacity: 0.6 }); }
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, y - 0.052, front(0, y) + 0.003); group.add(mouth);
}

const tube = (a, b, r, m) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m);
  c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c;
};

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), mat(color));
  th.position.set(0.026, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createJeans({ scale = 1, denim = '#3b6cb8', blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const dm = new THREE.MeshStandardMaterial({ map: denimTexture(denim), roughness: 0.8 });
  const dark = mat('#2c4f8f'), light = mat('#8db3e2'), thread = mat(THREAD, { roughness: 0.5 }), cream = '#fff0dc';

  const bodyG = new THREE.CylinderGeometry(R1, R0, TOP - BOT, 48); bodyG.scale(1, 1, ZS); bodyG.translate(0, (TOP + BOT) / 2, 0);
  const body = new THREE.Mesh(bodyG, dm); upper.add(body);
  const bandG = new THREE.CylinderGeometry(R1 + 0.004, rAt(0.945) + 0.004, 0.055, 48); bandG.scale(1, 1, ZS); bandG.translate(0, 0.9725, 0);
  upper.add(new THREE.Mesh(bandG, dark));
  const capG = new THREE.CircleGeometry(R1, 48); capG.scale(1, ZS, 1); capG.rotateX(-Math.PI / 2); capG.translate(0, TOP, 0);
  upper.add(new THREE.Mesh(capG, mat('#1d2f55')));
  for (const t of [-2.4, -1.5, -0.45, 0.45, 1.5, 2.4, Math.PI]) {
    const x = R1 * Math.sin(t), z = ZS * R1 * Math.cos(t), loop = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.075, 0.014), dark);
    loop.position.set(x * 1.01, 0.97, z * 1.03); loop.rotation.y = Math.atan2(x / R1 ** 2, z / (ZS * R1) ** 2); upper.add(loop);
  }
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 20), mat('#e2b13c', { metalness: 0.7, roughness: 0.3 }));
  button.rotation.x = Math.PI / 2; button.position.set(0, 0.97, front(0, 0.97) + 0.006); upper.add(button);
  face(upper, blush);
  upper.add(tube([0, 0.52, front(0, 0.6) + 0.002], [0, 0.69, front(0, 0.69) + 0.002], 0.004, thread));
  const pull = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.008), mat('#d6dbe0', { metalness: 0.7, roughness: 0.3 })); pull.position.set(0, 0.71, front(0, 0.71) + 0.006); upper.add(pull);

  const fp = [], bp = [];
  for (const s of [-1, 1]) {
    const fm = shell(s * 0.78 + 0, 0.7, 0.55, 0.7, new THREE.MeshStandardMaterial({ map: pocketTexture('#3568b0', 'front'), roughness: 0.8, side: THREE.DoubleSide }));
    const bm = shell(Math.PI + s * 0.65, 0.78, 0.7, 0.88, new THREE.MeshStandardMaterial({ map: pocketTexture('#3568b0', 'back'), roughness: 0.8, side: THREE.DoubleSide }));
    upper.add(fm, bm); fp.push(fm); bp.push(bm);
    upper.add(tube([s * rAt(0.52), 0.52, 0.002], [s * rAt(0.94), 0.94, 0.002], 0.004, thread));
  }

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.017, denim)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.017, denim));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(denim)));
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.03, 12), light); cuff.position.y = -ARM + 0.015; el.add(cuff);
    hands[k] = mitten(cream); el.add(hands[k]); sh.add(el); upper.add(sh); sh.rotation.z = s * 0.2; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.095, HIP_Y, 0);
    const legG = new THREE.CylinderGeometry(0.1, 0.088, 0.47, 28); legG.scale(1, 1, 0.9); legG.translate(0, -0.235, 0);
    hip.add(new THREE.Mesh(legG, dm));
    const cufG = new THREE.CylinderGeometry(0.094, 0.094, 0.05, 28); cufG.scale(1, 1, 0.9); cufG.translate(0, -0.42, 0);
    hip.add(new THREE.Mesh(cufG, light));
    hip.add(tube([s * 0.099, -0.04, 0], [s * 0.088, -0.4, 0], 0.004, thread));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat('#d8483c')); shoe.scale.set(0.068, 0.04, 0.115); shoe.position.set(0, -0.475, 0.035); hip.add(shoe);
    const sole = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8), mat('#fafafa')); sole.scale.set(0.07, 0.016, 0.118); sole.position.set(0, -0.505, 0.035); hip.add(sole);
    root.add(hip); legs[k] = hip;
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { torso, body, arms, legs, hands, frontPockets: fp, backPockets: bp };
  root.userData.front = front;

  root.userData.pose = ({ lean = 0, arms: A = {}, legs: L = {} } = {}) => {
    torso.rotation.x = lean;
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
  };

  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    torso.updateMatrix(); upper.updateMatrix();
    const t = new THREE.Vector3(...target).applyMatrix4(torso.matrix.clone().multiply(upper.matrix).invert());
    const d = t.clone().sub(sh.position), D = Math.min(d.length(), 2 * ARM - 1e-3), dn = d.normalize();
    const pole = new THREE.Vector3(s * 0.5, -0.1, -1); pole.addScaledVector(dn, -pole.dot(dn)).normalize();
    const a = Math.acos(D / (2 * ARM));
    const u = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(pole, Math.sin(a));
    sh.quaternion.setFromUnitVectors(Y, u);
    const elbowPos = sh.position.clone().addScaledVector(u, ARM);
    const f = dn.clone().multiplyScalar(D).add(sh.position).sub(elbowPos).applyQuaternion(sh.quaternion.clone().invert());
    el.quaternion.setFromUnitVectors(Y, f.normalize());
  };
  return root;
}
