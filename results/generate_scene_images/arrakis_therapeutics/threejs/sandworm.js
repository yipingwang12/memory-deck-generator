// Arrakis anchor: a cute SANDWORM rising from sand, mouth + big anime eyes on the head. Faces +z, base at y ~ 0.
// createSandworm({ scale = 1, tilt = 1.25, height = 1.3, open = 1 }) -> Group
//   tilt = angle (rad) of the head axis from vertical toward +z (mouth faces up-and-forward); open scales the mouth.
// userData.parts = { head, mouth, eyes:[l,r], body }; userData.mouthWorld() -> Vector3 of mouth centre (world).
import * as THREE from 'three';

const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
const disc = (rx, ry, color, z, parent, x = 0, y = 0) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat(color, { roughness: 0.4 }));
  m.scale.set(rx, ry, 1); m.position.set(x, y, z); parent.add(m); return m;
};

function eye(parent, pos, R) {
  const g = new THREE.Group(), n = new THREE.Vector3(...pos).normalize();
  g.position.copy(n).multiplyScalar(R + 0.002); g.lookAt(n.clone().multiplyScalar(5));
  const s = 0.0015;
  disc(0.062, 0.075, '#ffffff', 0, g);
  disc(0.047, 0.065, '#2a6a8a', s, g, 0, -0.004);
  disc(0.04, 0.03, '#58b4d0', 2 * s, g, 0, -0.03);
  disc(0.024, 0.037, '#0a1620', 3 * s, g, 0, 0);
  disc(0.016, 0.016, '#ffffff', 4 * s, g, -0.016, 0.026);
  disc(0.007, 0.007, '#ffffff', 4 * s, g, -0.016, -0.03);
  const lid = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 32, 1, 0.25, Math.PI - 0.5), mat('#2a1008'));
  lid.scale.set(0.066, 0.08, 1); lid.position.z = 5 * s; g.add(lid);
  g.scale.setScalar(1.45); parent.add(g); return g;
}

export function createSandworm({ scale = 1, tilt = 1.25, height = 1.3, open = 1 } = {}) {
  const root = new THREE.Group(), skin = mat('#c0603f'), rib = mat('#f0b97c');
  const end = new THREE.Vector3(0, height - 0.3, 0.1), tan = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt));
  const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, -0.5, -0.5), new THREE.Vector3(0, 0.3, -0.5),
    end.clone().addScaledVector(tan, -0.55), end);
  const body = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.22, 24), skin); root.add(body);
  const z = new THREE.Vector3(0, 0, 1);
  for (let i = 1; i < 9; i++) {
    const t = i / 9, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.222, 0.026, 10, 36), rib);
    r.position.copy(p); r.quaternion.setFromUnitVectors(z, tg); root.add(r);
  }
  const head = new THREE.Group(); head.position.copy(end); head.quaternion.setFromUnitVectors(z, tan); head.scale.setScalar(1.3); root.add(head);
  const R = 0.3;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), skin));
  const mouth = new THREE.Group(); mouth.position.set(0, -0.06, 0.25); mouth.scale.setScalar(open); head.add(mouth);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 12, 36), mat('#e0506a')); lip.position.z = 0.03; mouth.add(lip);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.17, 36), mat('#2a0a14')); hole.position.z = 0.0; mouth.add(hole);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), mat('#ff7a90')); tongue.scale.set(1, 0.6, 0.5);
  tongue.position.set(0, -0.06, 0.02); mouth.add(tongue);
  const tooth = new THREE.ConeGeometry(0.03, 0.12, 10), ivory = mat('#fff4dc', { roughness: 0.4 });
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, t = new THREE.Mesh(tooth, ivory);
    t.position.set(0.162 * Math.cos(a), 0.162 * Math.sin(a), 0.07); t.rotation.set(Math.PI / 2, 0, 0);
    t.lookAt(new THREE.Vector3(0.05 * Math.cos(a), 0.05 * Math.sin(a), 0.2).applyMatrix4(mouth.matrix)); 
    t.rotateX(Math.PI / 2); mouth.add(t);
  }
  const eyes = [-1, 1].map((s) => eye(head, [s * 0.15, 0.15, 0.2], R));
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.scale.setScalar(scale);
  root.userData.parts = { head, mouth, eyes, body };
  root.userData.mouthWorld = () => { root.updateMatrixWorld(true); return mouth.getWorldPosition(new THREE.Vector3()); };
  return root;
}
