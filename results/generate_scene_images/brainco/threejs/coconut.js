// The Brainco anchor: one procedural COCONUT character, reused (and re-posed) in every scene.
// Faces +z, feet on y = 0, ~0.85 unit tall. createCoconut({ scale = 1, blush = true }) -> Group.
// userData.parts = { shell, torso, arms:{l,r}, elbows:{l,r}, hands:{l,r}, legs:{l,r} }   (l = +x side)
// userData.pose({ lean, arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]} })  radians; arm z>0 swings l out
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a coconut-local point.
// userData.lie(yaw = 0)  lies on its side, resting on y = 0; set position.x/z after.
import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

const RAD = [0.3, 0.32, 0.3], CY = 0.5, HIP_Y = 0.24, SHOULDER = [0.29, 0.46, 0], ARM = 0.13;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
const blob = (parent, color, pos, scl, extra) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(color, extra));
  m.position.set(...pos); m.scale.set(...scl); parent.add(m); return m;
};

function huskTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, 0, s, s);
    const r = rng(3);
    for (let i = 0; i < 1400; i++) {
      const l = 60 + r() * 90; ctx.strokeStyle = `rgba(${l + 60},${l * 0.6 + 20},${l * 0.25},0.45)`; ctx.lineWidth = 1 + r() * 1.5;
      const x = r() * s, y = r() * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 12, y + 14 + r() * 26); ctx.stroke();
    }
  });
}

/** Group placed on the shell surface at (yaw, pitch), local +z pointing out of the shell. */
function onShell(parent, yaw, pitch, radius) {
  const g = new THREE.Group(), d = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  g.position.copy(d).multiplyScalar(radius).add(new THREE.Vector3(0, CY, 0));
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); parent.add(g); return g;
}

function face(shell, blush) {
  const cap = new THREE.SphereGeometry(RAD[0] + 0.006, 40, 20, 0, Math.PI * 2, 0, 0.95);
  cap.rotateX(Math.PI / 2); cap.translate(0, CY, 0);
  shell.add(new THREE.Mesh(cap, mat('#f0d3a4', { roughness: 0.5 })));
  for (const sx of [-1, 1]) {
    const e = onShell(shell, sx * 0.36, 0.14, 0.306);
    blob(e, '#ffffff', [0, 0, -0.004], [0.066, 0.082, 0.016], { roughness: 0.3 });
    blob(e, '#4a2c18', [0, -0.006, 0.004], [0.052, 0.07, 0.014]);
    blob(e, '#2c4a8a', [0, -0.02, 0.008], [0.044, 0.045, 0.012]);
    blob(e, '#100806', [0, 0, 0.012], [0.026, 0.04, 0.01]);
    blob(e, '#ffffff', [-0.016, 0.026, 0.02], [0.014, 0.016, 0.006], { roughness: 0.2 });
    blob(e, '#ffffff', [0.012, -0.03, 0.02], [0.007, 0.007, 0.005], { roughness: 0.2 });
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.007, 6, 24, Math.PI * 0.8), mat('#2a140a'));
    lid.rotation.z = Math.PI * 0.1; lid.position.set(0, 0.0, 0.006); lid.scale.set(1, 1.15, 1); e.add(lid);
    if (blush) { const b = onShell(shell, sx * 0.62, -0.1, 0.306); blob(b, '#ff8f9a', [0, 0, 0], [0.04, 0.022, 0.006], { transparent: true, opacity: 0.6 }); }
  }
  const m = onShell(shell, 0, -0.2, 0.307);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI), mat('#7a2a2a'));
  mouth.rotation.z = Math.PI; m.add(mouth);
}

function sprout(shell) {
  const leaf = mat('#3f9b3f');
  for (const a of [0, 2.1, 4.2]) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 8), leaf);
    l.position.set(Math.sin(a) * 0.05, CY + RAD[1] + 0.08, Math.cos(a) * 0.05);
    l.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7); l.scale.z = 0.4; shell.add(l);
  }
}

function limb(len, r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}

function mitten(color) {
  const g = new THREE.Group(), palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mat(color));
  palm.scale.set(0.95, 1.1, 0.8); const th = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mat(color));
  th.position.set(0.025, 0.005, 0.01); g.add(palm, th); g.position.y = -ARM; return g;
}

export function createCoconut({ scale = 1, blush = true } = {}) {
  const root = new THREE.Group(), torso = new THREE.Group(), upper = new THREE.Group();
  torso.position.y = HIP_Y; upper.position.y = -HIP_Y; torso.add(upper); root.add(torso);
  const skin = '#ffe0c0', shell = new THREE.Group();
  const husk = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ map: huskTexture(), roughness: 0.9 }));
  husk.scale.set(...RAD); husk.position.y = CY; shell.add(husk);
  face(shell, blush); sprout(shell); upper.add(shell);

  const arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SHOULDER[0], SHOULDER[1], 0);
    sh.add(limb(ARM, 0.012, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.012, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), mat(skin)));
    hands[k] = mitten(skin); el.add(hands[k]); sh.add(el); upper.add(sh);
    sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;

    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP_Y, 0.02); hip.add(limb(0.19, 0.02, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#e0583c')); shoe.scale.set(0.045, 0.03, 0.065);
    shoe.position.set(0, -0.2, 0.02); hip.add(shoe); root.add(hip); legs[k] = hip;
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { shell, torso, arms, elbows, legs, hands };

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

  root.userData.lie = (yaw = 0) => { root.rotation.set(0, yaw, Math.PI / 2, 'YXZ'); root.position.y = RAD[0] * scale; };
  return root;
}
