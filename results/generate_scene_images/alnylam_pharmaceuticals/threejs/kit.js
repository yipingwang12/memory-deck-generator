// Shared scene kit: renderer + sky/sun + post, seeded noise, procedural textures and props.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const simplex = new SimplexNoise({ random: rng(7) });

/** Fractal simplex noise in roughly [-1, 1]. */
export function fbm(x, y, z, octaves = 4) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * simplex.noise3d(x * f, y * f, z * f);
    norm += amp; amp *= 0.5; f *= 2.03;
  }
  return sum / norm;
}

/** Canvas texture drawn by `draw(ctx, size)`; sRGB unless `data` (bump/roughness). */
export function canvasTexture(size, draw, { repeat = 1, data = false } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (!data) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fill a canvas pixel-by-pixel from `fn(u, v) -> [r, g, b]` (0..255), tileable via 4D-ish torus wrap. */
export function noiseFill(ctx, size, fn) {
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, g, b] = fn(x / size, y / size);
    const i = (y * size + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Tileable noise on the unit square: sample a torus in 3D. */
export function tileNoise(u, v, scale, octaves = 4) {
  const a = u * Math.PI * 2, b = v * Math.PI * 2, r = scale / (Math.PI * 2);
  return fbm(Math.cos(a) * r, Math.sin(a) * r + Math.cos(b) * r, Math.sin(b) * r, octaves);
}

/**
 * Stage: renderer, camera, physical sky (also used as IBL), sun light with soft shadows,
 * GTAO + bloom post. Returns { THREE, renderer, scene, camera, sun, finish }.
 */
export function createStage({
  fov = 35, sunElevation = 55, sunAzimuth = 200, exposure = 0.55, turbidity = 6,
  rayleigh = 1.2, shadowSize = 4, sunIntensity = 3.2, envIntensity = 0.7,
  bloom = { strength: 0.3, radius: 0.5, threshold: 1.2 }, fog = null,
  grade = { warmth: 0.06, contrast: 1.08, saturation: 1.08, vignette: 0.35 }, mie = 0.004, mieG = 0.9,
} = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  window.__gl = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.05, 3000);

  const sunDir = new THREE.Vector3().setFromSphericalCoords(
    1, THREE.MathUtils.degToRad(90 - sunElevation), THREE.MathUtils.degToRad(sunAzimuth));
  const makeSky = (scale) => {
    const sky = new Sky();
    sky.scale.setScalar(scale);
    const u = sky.material.uniforms;
    u.turbidity.value = turbidity; u.rayleigh.value = rayleigh;
    u.mieCoefficient.value = mie; u.mieDirectionalG.value = mieG;
    u.sunPosition.value.copy(sunDir);
    return sky;
  };
  scene.add(makeSky(2000));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(makeSky(50));
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  scene.environmentIntensity = envIntensity;
  if (fog) scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);

  const sun = new THREE.DirectionalLight(0xfff1dc, sunIntensity);
  sun.position.copy(sunDir).multiplyScalar(30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 80 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.015;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  /** Build the post chain and render once; signals window.__ready for the headless renderer. */
  function finish({ ao = true } = {}) {
    const w = window.innerWidth, h = window.innerHeight;
    const target = new THREE.WebGLRenderTarget(w * renderer.getPixelRatio(), h * renderer.getPixelRatio(),
      { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    if (ao) {
      const gtao = new GTAOPass(scene, camera, w, h);
      gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.2 });
      gtao.blendIntensity = 0.85;
      composer.addPass(gtao);
    }
    composer.addPass(clampPass());
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), bloom.strength, bloom.radius, bloom.threshold));
    composer.addPass(new OutputPass());
    composer.addPass(gradePass(grade));
    for (let i = 0; i < 3; i++) composer.render();
    window.__ready = true;
  }

  return { THREE, renderer, scene, camera, sun, sunDir, finish };
}

export const FULLSCREEN_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

/** Clamp HDR colour: the sky sun disc can overflow half floats, and Inf/NaN smears across a bloom blur. */
export function clampPass(max = 200) {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: FULLSCREEN_VS,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb = clamp(c.rgb, 0.0, ${max.toFixed(1)}); if (any(isnan(c.rgb))) c.rgb = vec3(${max.toFixed(1)}); gl_FragColor = c; }`,
  });
}

/** Display-space grade: warmth, saturation, contrast, vignette. */
export function gradePass(grade) {
  return new ShaderPass({
      uniforms: { tDiffuse: { value: null }, warmth: { value: grade.warmth }, contrast: { value: grade.contrast },
        saturation: { value: grade.saturation }, vignette: { value: grade.vignette } },
      vertexShader: FULLSCREEN_VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float warmth, contrast, saturation, vignette; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c *= vec3(1.0 + warmth, 1.0 + warmth * 0.3, 1.0 - warmth);
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(vec3(l), c, saturation);
          c = (c - 0.5) * contrast + 0.5;
          vec2 d = vUv - 0.5; c *= 1.0 - vignette * dot(d, d) * 1.6;
          gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
        }`,
    });
}

/** Report page errors to the headless renderer instead of hanging. */
export function guard(fn) {
  try { fn(); } catch (e) { window.__error = `${e.message}\n${e.stack}`; throw e; }
}

/** Displace a geometry's vertices along their normals by `fn(p) -> offset`. */
export function displace(geo, fn) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  geo = mergeVerticesSafe(geo);
  geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, v = new THREE.Vector3(), nv = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); nv.fromBufferAttribute(n, i);
    v.addScaledVector(nv, fn(v));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function mergeVerticesSafe(geo) {
  // Weld seams so displacement does not crack the surface.
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  return mergeGeometriesWeld(geo);
}

function mergeGeometriesWeld(geo) {
  const map = new Map(), pos = geo.attributes.position, idx = [], out = [];
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!map.has(key)) { map.set(key, out.length / 3); out.push(pos.getX(i), pos.getY(i), pos.getZ(i)); }
    idx.push(map.get(key));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  g.setIndex(idx);
  return g;
}

/** Add planar-projected UVs (xz) so tiled textures work on displaced props. */
export function boxUV(geo, scale = 1) {
  const p = geo.attributes.position, uv = [];
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [a, b] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    uv.push(a * scale, b * scale);
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

/** Seamless texturing: sample `map` by object-space position on three axes, blended by normal. */
export function triplanar(material, scale = 1, bump = 4) {
  // Scale/bump are uniforms: three.js caches programs by onBeforeCompile source, so baked constants would leak between materials.
  // Kept on userData so a restyle (toonify) can share or retune them.
  const tri = material.userData.tri = { triScale: { value: scale }, triBump: { value: bump } };
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, tri);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float triScale; varying vec3 vTriPos; varying vec3 vTriN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriPos = position * triScale; vTriN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float triBump; varying vec3 vTriPos; varying vec3 vTriN;')
      .replace('#include <map_fragment>', `
        vec3 tw = pow(abs(normalize(vTriN)), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
        vec4 tri = texture2D(map, vTriPos.yz) * tw.x + texture2D(map, vTriPos.xz) * tw.y + texture2D(map, vTriPos.xy) * tw.z;
        diffuseColor *= tri;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float th = dot(tri.rgb, vec3(0.333));
          vec2 dH = vec2(dFdx(th), dFdy(th)) * triBump;
          vec3 sx = normalize(dFdx(-vViewPosition)), sy = normalize(dFdy(-vViewPosition));
          vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
          float det = dot(sx, r1) * faceDirection;
          normal = normalize(abs(det) * normal - sign(det) * (dH.x * r1 + dH.y * r2));
        }`);
  };
  return material;
}

/** Spherical UVs (for blobs whose UVs were lost to displacement). */
export function sphereUV(geo, tiles = 1) {
  const p = geo.attributes.position, uv = [], v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    uv.push((Math.atan2(v.z, v.x) / (Math.PI * 2) + 0.5) * tiles, (Math.asin(v.y) / Math.PI + 0.5) * tiles * 0.5);
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

/** Cylindrical UVs scaled so texels stay roughly square (u around, v up). */
export function cylUV(geo, radius) {
  const p = geo.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i)) / (Math.PI * 2) + 0.5;
    uv.push(a * Math.max(1, Math.round(radius * 2 * Math.PI / 1.2)), p.getY(i) / 1.2);
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

/** Weathered stone texture set (color + bump): mottled grain, faint horizontal bedding, tileable. */
export function stoneTextures({ base = [176, 132, 92], seed = 0, repeat = 1 } = {}) {
  const draw = (bump) => (ctx, s) => noiseFill(ctx, s, (u, v) => {
    const grain = tileNoise(u + seed, v, 48, 3), mid = tileNoise(u, v + seed, 12, 4), blotch = tileNoise(u + 2 * seed, v, 4, 4);
    const bed = 1;
    const pit = Math.max(0, -tileNoise(u, v, 30 + seed, 2) - 0.55) * 2;
    if (bump) { const h = 128 + grain * 55 + mid * 45 - pit * 60 - (1 - bed) * 12; return [h, h, h]; }
    const k = 1 + blotch * 0.22 + mid * 0.16 + grain * 0.14 - pit * 0.35 - (1 - bed) * 0.06;
    const tint = [1 + blotch * 0.05, 1, 1 - blotch * 0.06];
    return base.map((c, i) => Math.max(0, Math.min(255, c * k * tint[i])));
  });
  return {
    map: canvasTexture(512, draw(false), { repeat }),
    bumpMap: canvasTexture(512, draw(true), { repeat, data: true }),
  };
}

/** A weathered rock: noisy icosphere, optionally flattened top/bottom. */
export function rock({ radius = 1, seed = 1, squash = [1, 0.7, 1], flatTop = null, flatBottom = 0, rough = 0.35, textures, detail = 5 }) {
  let geo = new THREE.IcosahedronGeometry(radius, detail);
  geo = displace(geo, (p) => radius * (rough * fbm(p.x * 0.9 / radius + seed, p.y * 0.9 / radius, p.z * 0.9 / radius, 5)
    + 0.08 * fbm(p.x * 4 / radius, p.y * 4 / radius + seed, p.z * 4 / radius, 3)
    + 0.025 * fbm(p.x * 14 / radius, p.y * 14 / radius, p.z * 14 / radius + seed, 2)));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) * squash[0], y = pos.getY(i) * squash[1], z = pos.getZ(i) * squash[2];
    if (flatTop !== null && y > flatTop) y = flatTop + (y - flatTop) * 0.06;
    if (y < flatBottom) y = flatBottom;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  cylUV(geo, radius);
  const mat = triplanar(new THREE.MeshStandardMaterial({ map: textures.map, roughness: 0.92 }), 2.2 / Math.max(0.3, radius));
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/**
 * Heightfield terrain centred on origin. `height(x, z)` gives y.
 * Vertex colours let distant dunes fade and patches vary.
 */
export function terrain({ size = 400, seg = 400, height, material }) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return m;
}

/** Sand material: warm grain colour + ripple bump, tiled `repeat` times over the terrain. */
export function sandMaterial({ base = [214, 170, 118], repeat = 60 } = {}) {
  const draw = (bump) => (ctx, s) => noiseFill(ctx, s, (u, v) => {
    const ripple = Math.sin((u * 6 + v * 2 + tileNoise(u, v, 4, 3) * 1.2) * Math.PI * 2) * 0.5 + 0.5;
    const grain = tileNoise(u, v, 90, 2), patch = tileNoise(u, v, 3, 4);
    if (bump) { const h = 128 + ripple * 50 + grain * 50; return [h, h, h]; }
    const k = 1 + patch * 0.12 + grain * 0.1 + (ripple - 0.5) * 0.06;
    return base.map((c) => Math.max(0, Math.min(255, c * k)));
  });
  return new THREE.MeshStandardMaterial({
    map: canvasTexture(512, draw(false), { repeat }),
    bumpMap: canvasTexture(512, draw(true), { repeat, data: true }),
    bumpScale: 1.4, roughness: 0.97,
  });
}

/** Scatter `count` instances of `mesh` geometry within an annulus, sitting on `height`. */
export function scatter({ geometry, material, count, rMin, rMax, height, seed = 3, scale = [0.5, 1.5], center = [0, 0], avoid = () => false }) {
  const inst = new THREE.InstancedMesh(geometry, material, count);
  const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 20; tries++) {
    const a = r() * Math.PI * 2, d = rMin + Math.sqrt(r()) * (rMax - rMin);
    const x = center[0] + Math.cos(a) * d, z = center[1] + Math.sin(a) * d;
    if (avoid(x, z)) continue;
    const s = scale[0] + r() * (scale[1] - scale[0]);
    q.setFromEuler(e.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4));
    m.compose(new THREE.Vector3(x, height(x, z) - 0.15 * s * 0.3, z), q, new THREE.Vector3(s, s * (0.6 + r() * 0.5), s));
    inst.setMatrixAt(n++, m);
  }
  inst.count = n;
  inst.castShadow = inst.receiveShadow = true;
  return inst;
}

/** Dry grass tuft: a fan of thin bent blades merged into one geometry. */
export function grassTuftGeometry({ blades = 18, height = 0.35, seed = 5 } = {}) {
  const r = rng(seed), parts = [];
  for (let i = 0; i < blades; i++) {
    const h = height * (0.5 + r() * 0.7);
    const g = new THREE.ConeGeometry(0.012, h, 3, 4, true);
    g.translate(0, h / 2, 0);
    const p = g.attributes.position, lean = 0.35 + r() * 0.6;
    for (let k = 0; k < p.count; k++) {
      const t = p.getY(k) / h;
      p.setX(k, p.getX(k) + lean * h * t * t);
    }
    g.rotateY(r() * Math.PI * 2);
    g.translate((r() - 0.5) * 0.08, 0, (r() - 0.5) * 0.08);
    parts.push(g);
  }
  const merged = mergeGeometries(parts);
  merged.computeVertexNormals();
  return merged;
}
