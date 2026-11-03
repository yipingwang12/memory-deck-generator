SC = {}
SC['q01'] = ("GOLF club, GARAGE WAY, LANDER lay the CORNERSTONE", "{}", '''
box(scene, '#bdb6a6', [1.5, 0.2, 1.3], [0, 0.1, 0]);
const c = stone({ scale: 1.5 }); c.position.set(0, 0.2, 0.1); c.rotation.y = -0.15;
c.userData.pose({ arms: { l: [-0.5, 0.3, -0.6], r: [-0.3, 0.2, -0.4] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const club = L.golfClub(); club.position.set(-1.35, 0, 0.9); club.rotation.set(0.1, 0.3, -0.12); club.scale.setScalar(1.15); scene.add(club);
const gar = L.garage(); gar.position.set(-3.2, 0, -1.2); gar.rotation.y = 0.35; gar.scale.setScalar(1.25); scene.add(gar);
const lan = L.lander(); lan.position.set(2.5, 0, -0.6); lan.scale.setScalar(1.2); scene.add(lan);
finish([0.2, 1.7, 5.4], [-0.2, 1.0, 0]);''')
SC['q02'] = ("CORNERSTONE cut from BROADSWORD's hall and FARMER's field", "{ground:'#7fb34e'}", '''
const hall = new THREE.Group(); scene.add(hall); hall.position.set(-2.8, 0, -1.5);
box(hall, '#b8a58a', [2.8, 1.4, 1.8], [0, 0.7, 0]);
const rs = new THREE.Shape(); rs.moveTo(-1.6, 1.4); rs.lineTo(0, 2.5); rs.lineTo(1.6, 1.4); rs.closePath(); add(hall, new THREE.ExtrudeGeometry(rs, { depth: 2.0, bevelEnabled: false }), '#8c3b2c', [0, 0, -1.0]);
box(hall, '#5a3a22', [0.6, 0.9, 0.05], [0, 0.45, 0.93]);
const sw = L.broadsword(1.8); sw.position.set(-1.1, 2.4, 1.6); sw.rotation.set(0, 0.2, Math.PI + 0.15); scene.add(sw);
const c = stone({ scale: 1.2 }); c.position.set(0.3, 0, 0.8);
c.userData.pose({ arms: { l: [-0.6, 0.4, -0.5], r: [-0.4, 0.3, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const chisel = cyl(scene, mat('#9aa3ad', { metalness: 0.6 }), 0.03, 0.4, [0.95, 1.1, 1.1], [0.2, 0, 0.8]);
const r = rng(5); for (let i = 0; i < 70; i++) { const w = new THREE.Group(); const x = 1.6 + r() * 3.2, z = -1.5 + r() * 3; const h = 0.5 + r() * 0.2;
  cyl(w, mat('#d9b44a'), 0.012, h, [0, h / 2, 0]); add(w, new THREE.SphereGeometry(1, 8, 6), '#e8c35a', [0, h + 0.05, 0], [0, 0, 0], [0.03, 0.09, 0.03]); w.position.set(x, 0, z); scene.add(w); }
const f = L.person({ shirt: '#4a7ad0', pants: '#6b4a2a', hat: 'straw', scale: 1.7 }); f.position.set(2.1, 0, 0.6); f.rotation.y = -0.5; scene.add(f); toon(f);
const fork = new THREE.Group(); cyl(fork, mat('#7a4e2c'), 0.025, 1.9, [0, 0.95, 0]);
for (const x of [-0.07, 0, 0.07]) cyl(fork, mat('#aab2ba', { metalness: 0.6 }), 0.012, 0.35, [x, 1.98, 0]); box(fork, '#aab2ba', [0.2, 0.025, 0.025], [0, 1.82, 0]);
fork.position.set(2.65, 0, 1.2); fork.rotation.z = -0.1; scene.add(fork);
finish([0.2, 1.7, 6.2], [0.2, 1.3, 0]);''')
SC['q03'] = ("DOVE flies CORNERSTONE to the BROOCH", "{ground:'#7fb34e', el:30}", '''
const hill = blob(scene, mat('#86bb5a'), [3.4, -1.0, -2.5], [4.5, 2.4, 3]);
const ped = cyl(scene, mat('#c9b48e'), 0.8, 0.5, [3.4, 1.55, -2.0]);
const br = L.brooch(1.1); br.position.set(3.4, 2.5, -1.9); br.rotation.y = -0.35; scene.add(br);
const d = L.dove(); d.scale.setScalar(1.9); d.position.set(-0.6, 4.5, 0); scene.add(d); toon(d);
const c = stone({ scale: 1.25 }); c.position.set(-0.7, 1.9, 0.2); c.rotation.y = 0.3;
c.userData.pose({ arms: { l: [0, 0.2, 0], r: [0, 0.2, 0] }, legs: { l: [0.2, 0.1], r: [0.1, -0.1] } });
for (const x of [-0.35, 0.35]) cyl(scene, mat('#d9b878'), 0.015, 2.3, [-0.7 + x * 0.5, 3.2, 0.1], [0, 0, -x * 0.5]);
finish([0.5, 2.8, 6.8], [0.9, 2.7, 0]);''')
SC['q04'] = ("PEACH tree drops four coins on the CORNERSTONE", "{ground:'#7fb34e'}", '''
const t = L.peachTree(2.6); t.position.set(-2.1, 0, -0.8); t.scale.setScalar(1.35); scene.add(t);
const c = stone({ scale: 1.25 }); c.position.set(0.7, 0, 0.6); c.rotation.y = -0.2;
c.userData.pose({ arms: { l: [0, 0.9, 0.2], r: [0, 0.9, 0.2] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
[[0.2, 2.1], [0.95, 2.75], [0.45, 3.4], [1.1, 4.0]].forEach(([x, y], i) => { const k = L.coin(0.27); k.position.set(x, y, 0.7); k.rotation.set(0.25 * (i % 2 ? 1 : -1), 0.3, 0.2 * i); scene.add(k); });
const pp = L.peach(0.2); pp.position.set(-0.4, 0.2, 1.4); scene.add(pp);
finish([-0.2, 2.5, 6.6], [-0.2, 2.2, 0]);''')
SC['q05'] = ("MALLARD wears the CORNERSTONE's CEO crown", "{ground:'#7fb34e'}", '''
const c = stone({ scale: 1.5 }); c.position.set(-0.3, 0, 0); c.rotation.y = 0.1;
c.userData.pose({ arms: { l: [-0.3, 0.8, -0.3], r: [-0.3, 0.8, -0.3] }, legs: { l: [0, 0], r: [0, 0] } });
const m = L.mallard(); m.scale.setScalar(1.7); m.position.set(-0.3, 1.5, 0.05); m.rotation.y = -0.55; scene.add(m); toon(m);
const cr = L.crown(0.15); cr.scale.setScalar(1.7); cr.position.set(-0.3 + 0.26 * 1.7 * Math.cos(0.55), 1.5 + 0.63 * 1.7, 0.05 + 0.26 * 1.7 * Math.sin(0.55)); cr.rotation.z = -0.1; scene.add(cr);
finish([0.2, 2.1, 5.0], [-0.2, 1.7, 0]);''')
SC['q06'] = ("CORNERSTONE reads tumour genes to pick targeted drug and clinical trial", "{ground:'#cfe3ef'}", '''
const c = stone({ scale: 1.7 }); c.position.set(-2.0, 0, 0.5); c.rotation.y = 0.35;
c.userData.pose({ arms: { l: [-1.1, 0.3, -0.5], r: [-0.2, 0.2, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const mg = L.magnifier(); mg.scale.setScalar(2.0); mg.position.set(-0.8, 1.35, 1.1); mg.rotation.set(0, -0.3, -0.5); scene.add(mg);
cyl(scene, mat('#c9b48e'), 0.5, 0.5, [0.7, 0.25, 0]); const tu = L.tumour(0.5); tu.position.set(0.7, 0.95, 0); scene.add(tu);
const dn = L.dna(2.2, 0.28); dn.position.set(2.2, 1.4, 0); scene.add(dn);
const tg = new THREE.Group(); tg.position.set(0.5, 2.9, -0.8); scene.add(tg);
[[0.7, '#ffffff'], [0.55, '#d8243a'], [0.4, '#ffffff'], [0.25, '#d8243a'], [0.1, '#ffffff']].forEach(([r, col], i) => cyl(tg, mat(col), r, 0.04 + i * 0.002, [0, 0, i * 0.01], [Math.PI / 2, 0, 0]));
const p = L.pill(); p.scale.setScalar(2.2); p.position.set(0.0, 3.0, 0.1); p.rotation.z = 0.9; scene.add(p);
const cb = new THREE.Group(); box(cb, '#8a5a2c', [0.9, 1.2, 0.05], [0, 0, 0]); box(cb, '#fbfbf5', [0.78, 1.05, 0.02], [0, -0.02, 0.035]); box(cb, '#999', [0.3, 0.1, 0.06], [0, 0.57, 0.04]);
for (const y of [0.3, -0.05, -0.4]) { tubeAlong(cb, mat('#2fae60'), [[-0.3, y, 0.06], [-0.24, y - 0.07, 0.06], [-0.12, y + 0.08, 0.06]], 0.025); box(cb, '#b8c0c8', [0.35, 0.05, 0.01], [0.15, y, 0.05]); }
cb.position.set(3.7, 1.6, -0.3); cb.rotation.y = -0.3; scene.add(cb);
finish([0.9, 2.1, 7.4], [0.7, 1.7, 0]);''')
SC['q07'] = ("CDX on CORNERSTONE guides drugs for five tumours", "{ground:'#c9d6e0'}", '''
const sg = L.sign('CDX', { w: 2.6, h: 1.1, fg: '#2a5db0' }); sg.position.set(0, 0.0, -0.6); scene.add(sg);
const c = stone({ scale: 1.4 }); c.position.set(0, 0, 2.3);
c.userData.pose({ arms: { l: [-0.4, 0.7, -0.3], r: [-0.4, 0.7, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
['ovary', 'lung', 'ribbon', 'colon', 'skin'].forEach((k, i) => { const x = -4.0 + i * 2.0;
  cyl(scene, mat('#e9e2d0'), 0.62, 1.5, [x, 0.75, -2.4]); const o = L.organ(k); o.scale.setScalar(2.0); o.position.set(x, 2.3, -2.2); scene.add(o); });
finish([0, 2.4, 7.4], [0, 1.3, -0.5]);''')
SC['q08'] = ("HEME test reads blood cancers and SARCOMAS", "{ground:'#d8e6ee'}", '''
const c = stone({ scale: 1.6 }); c.position.set(0.9, 0, 1.2);
c.userData.pose({ arms: { l: [-0.9, 0.3, -0.7], r: [-0.3, 0.3, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const v = L.vial(); v.scale.setScalar(2.2); v.position.set(1.8, 1.45, 1.75); v.rotation.z = -0.1; scene.add(v);
const sg = L.sign('HEME', { w: 2.0, h: 0.8, fg: '#c0172e' }); sg.position.set(-1.6, 0.5, -1.2); scene.add(sg);
const r = rng(11); for (let i = 0; i < 9; i++) { const b = L.bloodCell(0.2); b.position.set(-4 + r() * 3, 0.6 + r() * 3, -0.5 + r() * 1.5); b.rotation.set(r() * 3, r() * 3, 0); scene.add(b); }
for (let i = 0; i < 3; i++) { const w = L.whiteCell(0.3); w.position.set(-3.2 + i * 0.9, 3.2 - i * 0.3, 0.3); scene.add(w); }
const bn = L.bone(2.0); bn.position.set(3.4, 1.6, -0.2); bn.rotation.z = 0.45; scene.add(bn);
cyl(scene, mat('#c9d0d8'), 0.6, 0.5, [3.2, 0.25, 0.3]).visible = false;
finish([0, 2.2, 6.6], [0, 1.5, 0]);''')
SC['q09'] = ("CORNERSTONE ACTS then turns LIQUID", "{ground:null, sky:{cover:0.2}}", '''
scene.background = new THREE.Color('#2a1020');
box(scene, '#8a5a32', [9, 0.3, 4.5], [0, 0.15, 0]);
box(scene, '#6a1a30', [9.4, 5.5, 0.2], [0, 3, -2.2]);
for (const s of [-1, 1]) { box(scene, '#c0243c', [1.6, 5.4, 0.9], [s * 4.1, 2.9, -0.8]); box(scene, '#e8b848', [1.7, 0.2, 0.95], [s * 4.1, 5.6, -0.8]); }
box(scene, '#c0243c', [9.4, 1.0, 0.9], [0, 5.4, -0.8]);
const c = stone({ scale: 1.5 }); c.position.set(-0.4, 0.3, 0.7); c.rotation.y = 0.2;
c.userData.pose({ tilt: 0.12, arms: { l: [-0.5, 1.9, 0], r: [-1.2, 0.5, -0.5] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const v = L.vial(); v.scale.setScalar(2.4); v.position.set(1.2, 1.1, 1.7); v.rotation.z = -1.5; scene.add(v);
const drip = cyl(scene, mat('#d8243a', { roughness: 0.2 }), 0.03, 0.9, [1.95, 0.8, 1.7]); 
cyl(scene, mat('#d8243a', { roughness: 0.15, metalness: 0.2 }), 1.1, 0.02, [2.0, 0.32, 1.5]);
for (const [x, z, r] of [[1.2, 1.9, 0.3], [2.9, 1.2, 0.35], [2.6, 2.0, 0.2]]) cyl(scene, mat('#d8243a', { roughness: 0.15 }), r, 0.02, [x, 0.32, z]);
for (const [x, y] of [[-3.0, 3.7], [3.0, 3.8]]) { const m = new THREE.Group(); m.position.set(x, y, -1.9); scene.add(m);
  blob(m, mat(x < 0 ? '#f2c230' : '#4a8ad0', { roughness: 0.4 }), [0, 0, 0], [0.8, 1.0, 0.18]);
  for (const s of [-1, 1]) blob(m, mat('#222'), [s * 0.28, 0.2, 0.15], [0.14, 0.09, 0.04], [0, 0, s * -0.3 * (x < 0 ? 1 : -1)]);
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24, Math.PI), mat('#222')); mo.position.set(0, x < 0 ? -0.15 : -0.4, 0.17); mo.rotation.z = x < 0 ? Math.PI : 0; m.add(mo); }
const sp = new THREE.SpotLight('#fff1c8', 600, 0, 0.55, 0.5); sp.position.set(0, 9, 5); sp.target.position.set(0, 1, 0.5); scene.add(sp, sp.target);
finish([0, 3.0, 8.8], [0.2, 2.2, 0]);''')
SC['q10'] = ("BROOCH adds SAGA storybook to CORNERSTONE", "{ground:'#7fb34e'}", '''
const c = stone({ scale: 1.6 }); c.position.set(1.9, 0, 0.5); c.rotation.y = -0.4;
c.userData.pose({ arms: { l: [-1.2, 0.2, -0.4], r: [-0.5, 0.3, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const br = L.brooch(0.8); br.position.set(-2.8, 1.8, 0); br.rotation.y = 0.4; scene.add(br);
cyl(scene, mat('#c9b48e'), 0.5, 0.3, [-2.8, 0.15, 0]);
const bk = L.book({ text: 'SAGA', w: 1.1, h: 1.45, t: 0.22 }); bk.position.set(-0.4, 1.9, 0.9); bk.rotation.set(0.1, -0.35, -0.15); scene.add(bk);
const r = rng(3); for (let i = 0; i < 7; i++) blob(scene, mat('#8a3f9e'), [0.4 + r() * 1.6, 0.06, 1.6 + r() * 1.0], [0.07, 0.05, 0.07]);
const mg = L.magnifier(); mg.scale.setScalar(1.6); mg.position.set(0.7, 0.35, 2.6); mg.rotation.set(-1.1, 0, 0); scene.add(mg);
finish([0, 2.1, 7.0], [0, 1.5, 0]);''')
SC['q11'] = ("NACHO marks the deadline: SAGA joins CORNERSTONE by third quarter", "{ground:'#7fb34e'}", '''
const c = stone({ scale: 1.6 }); c.position.set(0.3, 0, 0.5); c.rotation.y = -0.1;
c.userData.pose({ arms: { l: [-1.2, 0.35, -0.6], r: [-0.4, 0.2, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const bk = L.book({ text: 'SAGA', w: 0.8, h: 1.05, t: 0.18 }); bk.position.set(1.3, 1.65, 0.95); bk.rotation.set(0.1, -0.3, 0.2); scene.add(bk);
const cal = new THREE.Group(); cal.position.set(-2.8, 0, -0.2); scene.add(cal);
for (const x of [-0.8, 0.8]) cyl(cal, mat('#7a4e2c'), 0.05, 2.4, [x, 1.2, -0.2], [0, 0, x * 0.08]);
box(cal, '#fbfbf5', [2.0, 1.7, 0.08], [0, 1.9, 0]); box(cal, '#d8243a', [2.0, 0.4, 0.1], [0, 2.55, 0.01]);
const q3 = L.textSprite('Q3', { w: 1.5, h: 1.1, bg: '#fbfbf5', fg: '#1a3a7a', font: 'bold 260px sans-serif' }); q3.position.set(0, 1.75, 0.05); cal.add(q3);
const pole = cyl(scene, mat('#7a4e2c'), 0.05, 4.2, [3.0, 2.1, -0.5]); const n = L.nacho(2.2); n.position.set(3.0, 3.6, -0.4); n.rotation.z = 0.15; scene.add(n);
finish([0, 2.3, 6.6], [0.1, 2.0, 0]);''')
SC['q12'] = ("GARRET FRAME leads the CORNERSTONE's Computational Discovery group as VP", "{ground:'#b58a5a'}", '''
const wall = box(scene, '#c9a878', [10, 5.5, 0.2], [0, 2.75, -2.4]);
const roof = new THREE.Shape(); roof.moveTo(-5, 5.5); roof.lineTo(0, 7.8); roof.lineTo(5, 5.5); roof.closePath();
add(scene, new THREE.ExtrudeGeometry(roof, { depth: 0.2, bevelEnabled: false }), '#c9a878', [0, 0, -2.5]);
box(scene, '#6a3a22', [1.5, 1.7, 0.1], [0, 5.0, -2.25]); box(scene, '#bfe6ff', [1.3, 1.5, 0.05], [0, 5.0, -2.2]);
box(scene, '#6a3a22', [0.08, 1.5, 0.08], [0, 5.0, -2.15]); box(scene, '#6a3a22', [1.3, 0.08, 0.08], [0, 5.0, -2.15]);
const fr = L.frameChar(); fr.scale.setScalar(1.7); fr.position.set(-1.1, 0, 0.6); fr.rotation.y = 0.2; scene.add(fr); toon(fr);
const c = stone({ scale: 1.6 }); c.position.set(1.8, 0, 0.7); c.rotation.y = -0.35;
c.userData.pose({ arms: { l: [-0.5, 0.4, -0.4], r: [-0.3, 0.3, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const mo = L.monitor(L.codeTex(), 1.5, 0.95); mo.position.set(4.0, 0, -1.3); mo.rotation.y = -0.4; scene.add(mo);
const mo2 = L.monitor(L.tissueTex(), 1.5, 0.95); mo2.position.set(-4.0, 0, -1.3); mo2.rotation.y = 0.4; scene.add(mo2);
finish([0, 2.5, 6.8], [0, 2.0, 0]);''')
SC['q13'] = ("GARRET FRAME's group studies cancer genes, slides read by computer, patient outcomes", "{ground:'#d8e0e8'}", '''
const mo = L.monitor(L.tissueTex(), 2.2, 1.4); mo.position.set(0, 0.4, -1.4); scene.add(mo);
box(scene, '#8a6a4a', [9, 0.15, 2.4], [0, 0.35, -0.3]);
const fr = L.frameChar(); fr.scale.setScalar(1.5); fr.position.set(-1.8, 0.43, 1.1); fr.rotation.y = 0.3; scene.add(fr); toon(fr);
const c = stone({ scale: 1.4 }); c.position.set(1.6, 0.43, 1.1); c.rotation.y = -0.3;
c.userData.pose({ arms: { l: [-0.6, 0.4, -0.5], r: [-0.3, 0.3, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const dn = L.dna(2.2, 0.3); dn.position.set(-3.6, 1.9, -0.6); scene.add(dn);
const gr = new THREE.Group(); gr.position.set(3.7, 2.2, -0.9); gr.rotation.y = -0.25; scene.add(gr);
box(gr, '#fbfbf5', [2.0, 1.5, 0.08], [0, 0, 0]); box(gr, '#8a6a4a', [2.1, 1.6, 0.06], [0, 0, -0.04]);
tubeAlong(gr, mat('#2fae60'), [[-0.8, -0.5, 0.06], [-0.3, -0.25, 0.06], [0.2, 0.05, 0.06], [0.8, 0.5, 0.06]], 0.035);
for (const [x, y] of [[-0.8, -0.5], [-0.3, -0.25], [0.2, 0.05], [0.8, 0.5]]) blob(gr, mat('#2fae60'), [x, y, 0.08], [0.08, 0.08, 0.05]);
box(gr, '#999', [1.7, 0.03, 0.02], [0, -0.65, 0.05]); box(gr, '#999', [0.03, 1.3, 0.02], [-0.9, 0, 0.05]);
const rc = new THREE.Group(); rc.position.set(3.7, 0.9, -0.9); scene.add(rc); box(rc, '#d8243a', [0.9, 0.3, 0.1]); box(rc, '#d8243a', [0.3, 0.9, 0.1]);
finish([0, 2.4, 7.4], [0, 1.9, 0]);''')
SC['q14'] = ("computational biology team: computer biologists, molecular biologists, software engineers", "{ground:'#d8e0e8'}", '''
const c = stone({ scale: 1.3 }); c.position.set(0, 0, 2.2);
c.userData.pose({ arms: { l: [-0.3, 0.8, -0.3], r: [-0.3, 0.8, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const a = L.person({ shirt: '#3a8ad0', pants: '#2a3a5a', hair: '#2a1a10', scale: 1.8 }); a.position.set(-2.8, 0, -0.2); a.rotation.y = 0.35; scene.add(a); toon(a);
const dn = L.dna(1.6, 0.25); dn.position.set(-2.3, 2.9, 0.3); scene.add(dn);
const lt = L.laptop(L.tissueTex()); lt.scale.setScalar(1.3); lt.position.set(-2.2, 0.9, 0.9); lt.rotation.y = 0.3; scene.add(lt);
const b = L.person({ shirt: '#f4f4f4', pants: '#3a3a4a', hair: '#8a5a2a', scale: 1.8 }); b.position.set(0, 0, -1.4); b.scale.setScalar(2.4); scene.add(b); toon(b);
const fl = new THREE.Group(); blob(fl, mat('#58d68d', { roughness: 0.2 }), [0, 0.18, 0], [0.2, 0.2, 0.2]); cyl(fl, mat('#e8f4ff', { transparent: true, opacity: 0.5 }), 0.05, 0.3, [0, 0.45, 0]); fl.scale.setScalar(1.6); fl.position.set(0.7, 2.2, -0.4); scene.add(fl);
const e = L.person({ shirt: '#4a4a52', pants: '#2a2a30', hair: '#1a1a1a', scale: 1.8 }); e.position.set(2.8, 0, -0.2); e.rotation.y = -0.35; scene.add(e); toon(e);
const l2 = L.laptop(L.codeTex()); l2.scale.setScalar(1.3); l2.position.set(2.2, 0.9, 0.9); l2.rotation.y = -0.3; scene.add(l2);
for (const [x, y, col] of [[2.0, 3.6, '#58d68d'], [2.6, 3.9, '#5dade2'], [3.1, 3.5, '#f5b041']]) box(scene, col, [0.5, 0.12, 0.02], [x + 0.2, y, 0.2]);
finish([0, 2.0, 7.6], [0, 1.6, 0]);''')
SC['q15'] = ("CORNERSTONE under a BRIDGE in Cambridge", "{ground:'#7fb34e'}", '''
const br = L.bridge(); br.position.set(0, 0, -1.0); br.scale.setScalar(1.6); scene.add(br);
box(scene, '#bdb09a', [1.9, 0.14, 7], [-0.95, 0.07, 0.5]);
add(scene, new THREE.PlaneGeometry(3.2, 30), mat('#4fa6d8', { roughness: 0.2, metalness: 0.2 }), [1.3, 0.04, -3], [-Math.PI / 2, 0, 0]);
const c = stone({ scale: 1.5 }); c.position.set(-0.9, 0.14, 1.4); c.rotation.y = 0.3;
c.userData.pose({ arms: { l: [-0.4, 0.6, -0.3], r: [-0.3, 0.5, -0.3] }, legs: { l: [0.1, 0], r: [-0.1, 0] } });
const pt = new THREE.Group(); pt.position.set(1.3, 0.05, 2.4); pt.rotation.y = 0.15; scene.add(pt);
box(pt, '#8a5a32', [0.7, 0.25, 2.0], [0, 0.12, 0]); box(pt, '#8a5a32', [0.5, 0.25, 0.6], [0, 0.12, 1.2], [0, 0, 0]); cyl(pt, mat('#d9b878'), 0.025, 2.6, [0.45, 1.0, -0.4], [0.2, 0, 0.1]);
const tw = new THREE.Group(); tw.position.set(7.0, 0, -6); scene.add(tw);
box(tw, '#d9c8a0', [2.2, 7, 2.2], [0, 3.5, 0]); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { box(tw, '#cdbb92', [0.3, 0.8, 0.3], [x, 7.4, z]); add(tw, new THREE.ConeGeometry(0.22, 0.8, 8), '#cdbb92', [x, 8.2, z]); }
add(tw, new THREE.ConeGeometry(1.4, 2.4, 4), '#7a8a9a', [0, 8.4, 0], [0, Math.PI / 4, 0]);
for (const y of [2, 4.2, 6]) for (const x of [-0.5, 0.5]) box(tw, '#6a5a3a', [0.3, 0.7, 0.05], [x, y, 1.12]);
finish([0, 1.9, 7.4], [0, 1.9, 0]);''')
