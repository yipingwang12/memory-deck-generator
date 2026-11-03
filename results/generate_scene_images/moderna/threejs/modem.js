// The Moderna anchor: a cheerful MODEM (router box) with antennas, blinking LEDs, anime eyes, stubby limbs.
// Faces +z, feet on y = 0, ~1 unit tall. createModem({ scale = 1, bodyColor = '#2fb6c8' }) -> Group.
// userData.parts = { body, arms:{l,r}, legs:{l,r}, hands:{l,r}, leds:[mesh], antennas:[Group], port }  (l = +x side)
// userData.pose({ arms:{l:[x,z,elbowX], r:[..]}, legs:{l:[x,z], r:[..]}, antenna:[zl, zr] })  radians
// userData.reach('l'|'r', [x,y,z])  two-bone IK: hand to a modem-local point.
// userData.setLeds(on)  lights/dims LEDs (emissive).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const SH = [0.33, 0.6, 0], ARM = 0.15;
const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};
const limb = (len, r, color) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color)); m.geometry.translate(0, -len / 2, 0); return m; };

export function createModem({ scale = 1, bodyColor = '#2fb6c8' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.56, 0.3, 5, 0.06), mat(bodyColor));
  body.position.y = 0.62; root.add(body);
  const z = 0.152, step = 0.0015;
  const screen = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.26, 0.02, 4, 0.02), mat('#15303a', { roughness: 0.3 }));
  screen.position.set(0, 0.56, 0.148); root.add(screen);
  const zf = 0.16;
  for (const sx of [-1, 1]) {
    const x = sx * 0.1, y = 0.57;
    disc(0.062, 0.078, '#ffffff', zf, root, x, y);
    disc(0.048, 0.068, '#3a2416', zf + step, root, x, y - 0.004);
    disc(0.04, 0.032, '#b4753a', zf + 2 * step, root, x, y - 0.03);
    disc(0.024, 0.038, '#120a08', zf + 3 * step, root, x, y);
    disc(0.016, 0.016, '#ffffff', zf + 4 * step, root, x - 0.017, y + 0.025);
    disc(0.007, 0.007, '#ffffff', zf + 4 * step, root, x - 0.017, y - 0.03);
    const b = disc(0.03, 0.017, '#ff7f8f', zf, root, sx * 0.205, 0.5); b.material.transparent = true; b.material.opacity = 0.7;
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), mat('#ffd0c0'));
  mouth.rotation.z = Math.PI; mouth.position.set(0, 0.5, zf + step); root.add(mouth);
  // LED row + port
  const leds = [];
  ['#52ff7a', '#52ff7a', '#ffb02e', '#52ff7a'].forEach((c, i) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), mat(c, { emissive: c, emissiveIntensity: 1.2 }));
    l.position.set(-0.15 + i * 0.1, 0.77, 0.15); root.add(l); leds.push(l);
  });
  const port = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.05, 0.03, 3, 0.01), mat('#101820'));
  port.position.set(0, 0.36, 0.15); root.add(port);
  // antennas
  const antennas = [];
  for (const sx of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(sx * 0.22, 0.9, -0.05);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.3, 10), mat('#26323a')); rod.position.y = 0.15; g.add(rod);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), mat('#ff5a3c', { emissive: '#ff3a1c', emissiveIntensity: 0.5 })); tip.position.y = 0.31; g.add(tip);
    g.rotation.z = -sx * 0.22; root.add(g); antennas.push(g);
  }
  // limbs
  const skin = '#ffe0c0', arms = {}, hands = {}, elbows = {}, legs = {};
  for (const [k, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group(); sh.position.set(s * SH[0], SH[1], 0);
    sh.add(limb(ARM, 0.014, skin)); const el = new THREE.Group(); el.position.y = -ARM; el.add(limb(ARM, 0.014, skin));
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(skin)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat(skin)); hand.position.y = -ARM; hands[k] = hand; el.add(hand);
    sh.add(el); root.add(sh); sh.rotation.z = s * 0.35; arms[k] = sh; elbows[k] = el;
    const hip = new THREE.Group(); hip.position.set(s * 0.15, 0.35, 0); hip.add(limb(0.2, 0.022, skin));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat('#c8483c')); shoe.scale.set(0.05, 0.04, 0.075);
    shoe.position.set(0, -0.215, 0.025); hip.add(shoe); root.add(hip); legs[k] = hip;
  }
  const setLeds = (on) => leds.forEach((l) => { l.material.emissiveIntensity = on ? 1.4 : 0.05; });
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { body, arms, legs, hands, leds, antennas, port };
  root.userData.setLeds = setLeds;
  root.userData.pose = ({ arms: A = {}, legs: L = {}, antenna } = {}) => {
    for (const [k, v] of Object.entries(A)) { arms[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0); elbows[k].rotation.set(v[2] ?? 0, 0, 0); }
    for (const [k, v] of Object.entries(L)) legs[k].rotation.set(v[0] ?? 0, 0, v[1] ?? 0);
    if (antenna) antennas.forEach((a, i) => { a.rotation.z = antenna[i]; });
  };
  const Y = new THREE.Vector3(0, -1, 0);
  root.userData.reach = (key, target) => {
    const s = key === 'l' ? 1 : -1, sh = arms[key], el = elbows[key];
    const t = new THREE.Vector3(...target);
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
