// q03: the PIRANHA bites into EEG brain waves.
boot({ sky: { zenith: '#0b1033', horizon: '#46307c', cover: .01, puffCover: .01, towerTop: .01, cloudLit: '#6a58b0', cloudShade: '#2a2060' }, stage: { ambient: { color: '#b8b0ff', intensity: 1.8 } } }, ({ stage, scene, num, mark }) => {
  ground(scene, '#2b2060');
  const glow = (c) => mat(c, { emissive: c, emissiveIntensity: .9, roughness: .4 });
  const wave = (x0, x1, y, amp, fr, ph, z, c, taper = false) => {
    const pts = []; for (let x = x0; x <= x1; x += .08) pts.push([x, y + Math.sin(x * fr + ph) * amp * (.6 + .4 * Math.sin(x * .7)) * (taper ? Math.min(1, Math.abs(x - .8) / .9) : 1), z]);
    C.tube(scene, pts, .05, glow(c), pts.length * 3).castShadow = false;
  };
  wave(-2.0, .55, 1.84, .35, 4.5, 0, .6, '#4fe0ff', true); wave(1.05, 3.6, 1.84, .35, 4.5, 2.2, .6, '#4fe0ff', true);
  wave(-2.0, 3.6, 2.9, .22, 3.2, 1, -.4, '#6dffb0'); wave(-2.0, 3.6, .5, .22, 5, 0, -.4, '#ff6ad5');
  const br = createBrain({ scale: 2.6 }); br.position.set(-3.0, 1.65, 0); br.rotation.y = .6; scene.add(br); mark(br);
  const p = createPiranha({ scale: 2.0 }); p.position.set(.8, 1.0, 0); p.rotation.y = -.15; scene.add(p); p.userData.pose({ jaw: .6, lean: -.05, arms: { l: [0, .9, 0], r: [0, .9, 0] }, legs: { l: [-.3, .2], r: [-.2, -.2] } }); mark(p);
  for (const [x, y, z] of [[.4, 2.1, .6], [1.3, 1.3, .6], [.3, 1.35, .7], [1.4, 2.0, .5]]) blob(scene, glow('#9af0ff'), [x, y, z], [.045, .045, .045]);
  look(stage, num, [-.1, 2.0, 6.6], [-.1, 1.9, 0]);
});
