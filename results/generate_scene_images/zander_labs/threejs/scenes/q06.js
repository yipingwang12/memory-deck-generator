A MOUSE carries thirty million euro coins to the ZANDER through a SEWER for four years.
===
{ sky: { cover: 0.3 } }
===
  const brick = canvasTexture(512, (ctx, s) => { ctx.fillStyle = '#6d4a3a'; ctx.fillRect(0, 0, s, s); const r = rng(5); for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) { const ox = (y % 2) * 32; const l = 90 + r() * 40; ctx.fillStyle = `rgb(${l + 40},${l - 20},${l - 40})`; ctx.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 28); } });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(2.2, 1.3);
  add(scene, new THREE.PlaneGeometry(14, 7), new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9 }), [0.5, 3.2, -1.3]);
  ground(scene, '#7c7f86');
  add(scene, new THREE.TorusGeometry(1.35, 0.17, 16, 48), mat('#a0a3ab'), [1.9, 1.5, -1.25]);
  add(scene, new THREE.CircleGeometry(1.35, 48), mat('#0d1512'), [1.9, 1.5, -1.28]);
  box(scene, '#5f9a4a', [1.9, 0.04, -0.6], [2.2, 0.06, 1.4]);
  const gold = mat('#ffcf2e', { metalness: 0.8, roughness: 0.28 });
  for (let k = 0; k < 14; k++) cyl(scene, gold, [-2.5, 0.02 + k * 0.032, 0.6], 0.2, 0.03);
  for (let i = 0; i < 7; i++) cyl(scene, gold, [-2.9 + i * 0.12, 0.02, 1.0 - (i % 3) * 0.1], 0.14, 0.03);
  const mouse = buildMouse(); mouse.scale.setScalar(2.4); mouse.position.set(-0.4, 0, 1.0); mouse.rotation.y = 1.25; scene.add(mouse);
  const big = buildCoin(0.3, 0.07); big.position.set(0, 0.5, 0); big.rotation.y = -1.25 + 1.35; mouse.add(big);
  const z = createZander({ scale: 2.1 }); z.position.set(2.0, 0.0, -0.3); z.rotation.y = -0.35; scene.add(z);
  z.userData.pose({ headTilt: 0.07, arms: { l: [0, 0.9, 0.3], r: [0, -0.9, 0.3] } });
  camera(stage, num, { c: [0.6, 1.5, 5.4], t: [0.6, 1.3, 0] });
  finish(stage, [z], false);
