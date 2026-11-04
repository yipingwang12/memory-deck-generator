// q03 — a ROMAN soldier in a coat of many colours puts on the TESSERACT's crown.
import { canvasTexture } from './kit.js';
function rainbow() {
  const cols = ['#e0304a', '#ff8a2a', '#ffd23a', '#3fbf5a', '#2e8bff', '#7a4bd8'];
  const t = canvasTexture(256, (ctx, s) => cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * s / 6, s, s / 6 + 1); }));
  return t;
}
run({
  cam: { p: [0, 1.7, 5.4], t: [0.1, 1.35, 0] },
  build({ scene, mark, tess }) {
    const t = tess({ scale: 1.8 }); t.position.set(0.9, 0, 0); t.rotation.y = -0.35; mark(t);
    t.userData.pose({ arms: { l: [0, 0.5, 0], r: [0, 0.5, 0] } });
    const s = makePerson({ shirtMap: rainbow(), scale: 1.2, hair: '#3a2a20' }); s.position.set(-0.5, 0, 0.2); s.rotation.y = 0.2; scene.add(s); mark(s);
    // roman helmet + crest, skirt strips
    const h = s.userData.head, bronze = mat('#d9a23a', { metalness: 0.5, roughness: 0.4 });
    blob(h, bronze, [0, 0.11, 0], [0.225, 0.17, 0.22]); cyl(h, bronze, [0, 0.07, 0], 0.235, 0.04, [0, 0, 0]);
    box(h, '#d32d3a', [0, 0.3, 0], [0.06, 0.22, 0.4]);
    for (let i = 0; i < 7; i++) { const a = (i / 7 - 0.5) * 2.2; box(s, '#9a5a2a', [Math.sin(a) * 0.3, 0.8, Math.cos(a) * 0.2], [0.09, 0.3, 0.03], [0, -a, 0]); }
    // big shield
    const sh = new THREE.Group(); sh.position.set(-1.8, 0.8, 0.9); sh.rotation.y = 0.6; scene.add(sh);
    box(sh, '#b3262f', [0, 0, 0], [0.7, 1.1, 0.07]); box(sh, '#ffd23a', [0, 0, 0.045], [0.5, 0.08, 0.02]); box(sh, '#ffd23a', [0, 0, 0.045], [0.08, 0.9, 0.02]); blob(sh, mat('#ffd23a'), [0, 0, 0.06], [0.1, 0.1, 0.04]);
    // soldier's arms raise the crown above tess
    const c = crown(0.22); c.scale.setScalar(1.6); scene.add(c);
    s.userData.arms.r.rotation.set(-0.3, 0, 0);
    s.updateMatrixWorld(true);
    const hp = s.userData.hand('l');
    const dir = new THREE.Vector3(0.8, 0.6, 0.1);
    const a = s.userData.arms.l; a.rotation.set(0, 0, 0); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize().applyQuaternion(s.quaternion.clone().invert()));
    s.updateMatrixWorld(true); const hw = s.userData.hand('l'); c.position.copy(hw).add(new THREE.Vector3(0, 0.12, 0)); t.position.x = hw.x + 0.45;
  },
});
