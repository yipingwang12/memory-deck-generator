// Anime style kit: cel shading, ink lines from depth/normal edges, painted cumulus sky, lens flare.
// Scenes build with style-neutral materials (kit.js) and call toonify() to restyle.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FULLSCREEN_VS, gradePass, clampPass, rng, fbm, displace } from './kit.js';

const SKY_LAYER = 1; // excluded from the normal/depth pass, so the sky never gets ink lines

/** Stepped light ramp for MeshToonMaterial (values 0..255, one band each). */
export function toonRamp(levels) {
  const t = new THREE.DataTexture(new Uint8Array(levels), levels.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

const GLSL_NOISE = `
  float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm6(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

/** Painted sky dome: zenith→horizon gradient, sun glow, towering cumulus band with cel-banded light. */
function skyDome({ sunDir, zenith, horizon, sunColor, cloudLit, cloudShade, cover, seed, towerTop, puffCover }) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      sunDir: { value: sunDir }, zenith: { value: new THREE.Color(zenith) }, horizon: { value: new THREE.Color(horizon) },
      sunCol: { value: new THREE.Color(sunColor) }, cloudLit: { value: new THREE.Color(cloudLit) },
      cloudShade: { value: new THREE.Color(cloudShade) }, cover: { value: cover }, seed: { value: seed },
      towerTop: { value: towerTop }, puffCover: { value: puffCover },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 sunDir, zenith, horizon, sunCol, cloudLit, cloudShade; uniform float cover, seed, towerTop, puffCover;
      ${GLSL_NOISE}
      // Cumulus towers rising from the horizon: noise on the direction itself (no azimuth seam), thinning with height.
      float towers(vec3 d){
        vec3 q = vec3(d.x * 2.4, d.y * 5.5, d.z * 2.4);
        return fbm6(q + seed) - smoothstep(0.0, towerTop, d.y) * 0.6 + 0.06 * fbm6(q * 6.0 + seed + 7.0);
      }
      float puffs(vec2 uv){ return fbm6(vec3(uv * 0.8, seed + 11.0)) * 0.9 + 0.1 * fbm6(vec3(uv * 6.0, seed + 2.0)); }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 col = mix(horizon, zenith, pow(h, 0.42));
        float sd = max(dot(d, sunDir), 0.0);
        col = mix(col, sunCol, pow(sd, 8.0) * 0.5);
        if (d.y > -0.02) {
          float dens = towers(d);
          float shadow = towers(normalize(mix(d, sunDir, 0.025))) - dens;   // denser toward the sun → shaded side
          float c = smoothstep(cover, cover + 0.012, dens);
          float lit = 1.0 - smoothstep(-0.004, 0.018, shadow);
          vec3 cc = mix(cloudShade, cloudLit, lit);
          float edge = 1.0 - smoothstep(cover + 0.012, cover + 0.06, dens);
          cc = mix(cc, cloudLit * 1.1, edge * 0.6);                                       // glowing rims
          cc = mix(cc, mix(cloudShade, horizon, 0.5), (1.0 - smoothstep(0.0, 0.1, d.y)) * 0.55); // haze at horizon
          col = mix(col, cc, c);
          if (d.y > 0.06) {
            vec2 uv = d.xz / (d.y + 0.15) * 1.4;
            float pd = puffs(uv), ps = puffs(uv + normalize(sunDir.xz) * 0.08) - pd;
            float pc = smoothstep(puffCover, puffCover + 0.02, pd) * smoothstep(0.06, 0.25, d.y);
            vec3 pcol = mix(cloudShade, cloudLit, 1.0 - smoothstep(-0.01, 0.03, ps));
            col = mix(col, pcol, pc * (1.0 - c));
          }
        }
        col += sunCol * (smoothstep(0.99955, 0.9997, sd) * 3.0);   // the sun disc
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2500, 64, 32), mat);
  dome.layers.set(SKY_LAYER);
  dome.frustumCulled = false;
  return dome;
}

/** Ink lines where depth jumps or normals turn; multiplied over local colour so lines keep hue. */
function inkPass({ normalTarget, camera, res, width, depthThresh, normalThresh, normalStrength, strength, fadeNear, fadeFar, tint }) {
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, tNormal: { value: null }, tDepth: { value: null },
      res: { value: res }, width: { value: width }, near: { value: camera.near }, far: { value: camera.far },
      dTh: { value: depthThresh }, nTh: { value: normalThresh }, nStrength: { value: normalStrength }, strength: { value: strength },
      fadeNear: { value: fadeNear }, fadeFar: { value: fadeFar }, tint: { value: new THREE.Color(tint) },
    },
    vertexShader: FULLSCREEN_VS,
    fragmentShader: `
      #include <packing>
      uniform sampler2D tDiffuse, tNormal, tDepth; uniform vec2 res;
      uniform float width, near, far, dTh, nTh, nStrength, strength, fadeNear, fadeFar; uniform vec3 tint;
      varying vec2 vUv;
      float vz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
      vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float z0 = vz(vUv); vec3 n0 = nrm(vUv);
        float e = 0.0, zmin = z0;
        for (int i = 0; i < 8; i++){
          float a = float(i) * 0.785398;
          vec2 uv = vUv + vec2(cos(a), sin(a)) * width / res;
          float z = vz(uv); vec3 n = nrm(uv);
          float rel = abs(z - z0) / min(z, z0);
          e = max(e, smoothstep(dTh, dTh * 2.0, rel));
          e = max(e, smoothstep(nTh, nTh * 1.6, 1.0 - dot(n0, n)) * step(z0, far * 0.9) * nStrength);
          zmin = min(zmin, z);
        }
        e *= 1.0 - smoothstep(fadeNear, fadeFar, zmin);
        gl_FragColor = vec4(mix(c.rgb, c.rgb * tint, e * strength), c.a);
      }`,
  });
  // ShaderPass clones uniforms, and render-target textures do not survive cloning: bind them afterwards.
  pass.uniforms.tNormal.value = normalTarget.texture;
  pass.uniforms.tDepth.value = normalTarget.depthTexture;
  return pass;
}

/** Screen-space anime lens flare: starburst, halo ring, ghosts toward centre, anamorphic streak. */
function flarePass({ sunUV, aspect, strength }) {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, sunUV: { value: sunUV }, aspect: { value: aspect }, strength: { value: strength } },
    vertexShader: FULLSCREEN_VS,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 sunUV; uniform float aspect, strength; varying vec2 vUv;
      float disc(vec2 p, float r, float soft){ return 1.0 - smoothstep(r - soft, r, length(p)); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        vec2 p = (vUv - sunUV) * vec2(aspect, 1.0);
        float r = length(p), a = atan(p.y, p.x);
        float rays = pow(0.5 + 0.5 * sin(a * 12.0 + sin(a * 5.0) * 1.5), 10.0) * exp(-r * 3.5) * 0.55
                   + pow(0.5 + 0.5 * sin(a * 31.0 + 1.3), 16.0) * exp(-r * 6.0) * 0.35;
        float core = exp(-r * 18.0) * 0.9 + exp(-r * 5.0) * 0.25;
        float ring = smoothstep(0.012, 0.0, abs(r - 0.21)) * 0.12;
        vec3 ringCol = vec3(0.9, 0.95, 1.0) + 0.25 * vec3(sin(r * 60.0), sin(r * 60.0 + 2.1), sin(r * 60.0 + 4.2));
        float streak = exp(-abs(p.y) * 220.0) * exp(-abs(p.x) * 2.2) * 0.35;
        vec3 f = vec3(1.0, 0.95, 0.85) * (rays + core) + ringCol * ring + vec3(0.7, 0.85, 1.0) * streak;
        vec2 axis = vec2(0.5) - sunUV;
        float ts[5] = float[5](0.45, 0.8, 1.25, 1.55, 1.9);
        float rs[5] = float[5](0.035, 0.07, 0.025, 0.11, 0.05);
        vec3 cs[5] = vec3[5](vec3(0.6, 1.0, 0.8), vec3(0.5, 0.8, 1.0), vec3(1.0, 0.8, 0.5), vec3(0.6, 0.7, 1.0), vec3(1.0, 0.7, 0.9));
        for (int i = 0; i < 5; i++){
          vec2 g = (vUv - (sunUV + axis * ts[i] * 2.0)) * vec2(aspect, 1.0);
          f += cs[i] * disc(g, rs[i], rs[i] * 0.5) * 0.07;
        }
        c = 1.0 - (1.0 - c) * (1.0 - clamp(f * strength, 0.0, 1.0));   // screen blend
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

const puffGeometry = (() => displace(new THREE.IcosahedronGeometry(1, 4), (p) => 0.12 * fbm(p.x * 1.4, p.y * 1.4, p.z * 1.4, 3)))();

/**
 * Cumulus cloud: heaped puffs, wide flat base, rising tower. `at` is the base centre (world), `size` its half-width.
 * Toon-lit by the scene's sun, so the sun side is bright and the underside takes the cool ambient.
 */
export function cumulus({ at, size, height = 1, seed = 1, puffs = 60, material }) {
  const R = rng(seed), inst = new THREE.InstancedMesh(puffGeometry, material, puffs);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < puffs; i++) {
    const t = Math.pow(R(), 1.6);                      // more puffs low down
    const spread = size * (1 - 0.6 * t) * (0.8 + 0.4 * fbm(t * 3, seed, 0, 2));              // narrower as it rises
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * spread;
    const s = size * (0.1 + R() * 0.2) * (1 - 0.35 * t);
    const p = new THREE.Vector3(at.x + Math.cos(a) * r, at.y + s * 0.5 + t * size * 1.6 * height, at.z + Math.sin(a) * r * 0.6);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6.28);
    m.compose(p, q, new THREE.Vector3(s, s * (t < 0.08 ? 0.55 : 0.9), s));
    inst.setMatrixAt(i, m);
  }
  inst.frustumCulled = false;
  return inst;
}

/**
 * Anime stage. Returns { scene, camera, sunDir, toonify, finish }.
 * Characters get a 2-band ramp, the environment 3 bands; shadows are hard, ambient cool.
 */
export function createAnimeStage({
  fov = 40, sunElevation = 20, sunAzimuth = 200, exposure = 1,
  sky = {}, sunColor = '#fff1d6', sunIntensity = 2.6, ambient = { color: '#c9d2ff', intensity: 1.2 }, triBumpScale = 0.3,
  shadowSize = 3, ink = {}, flare = 0.9, grade = { warmth: 0.02, contrast: 1.05, saturation: 1.15, vignette: 0.25 },
  fog = null, rim = { color: '#fff3dc', strength: 1.4, width: 0.55 },
} = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  window.__gl = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.05, 3000);
  camera.layers.enable(SKY_LAYER);
  const sunDir = new THREE.Vector3().setFromSphericalCoords(
    1, THREE.MathUtils.degToRad(90 - sunElevation), THREE.MathUtils.degToRad(sunAzimuth));

  const skyOpts = { zenith: '#0f4fd0', horizon: '#bfe0f8', cloudLit: '#fffdf6', cloudShade: '#a3b2dc', cover: 0.5, seed: 3, towerTop: 0.5, puffCover: 0.62, ...sky };
  scene.add(skyDome({ sunDir, sunColor, ...skyOpts }));
  if (fog) scene.fog = new THREE.Fog(fog.color ?? skyOpts.horizon, fog.near, fog.far);

  const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
  sun.position.copy(sunDir).multiplyScalar(30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target, new THREE.AmbientLight(ambient.color, ambient.intensity)); // flat: cel shadows are one tone

  const rampChar = toonRamp([150, 255]), rampEnv = toonRamp([95, 175, 255]);

  // Backlit anime rim: silhouette edges facing the sun get a hard bright band (view-space sun dir set in finish()).
  const sunView = { value: new THREE.Vector3() };
  const rimColor = { value: new THREE.Color(rim.color).multiplyScalar(rim.strength) };
  function addRim(material) {
    material.onBeforeCompile = (sh) => {
      sh.uniforms.sunView = sunView; sh.uniforms.rimColor = rimColor;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 sunView, rimColor;')
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          {
            float fres = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
            float toward = dot(normal, sunView);
            reflectedLight.directDiffuse += rimColor * diffuseColor.rgb * step(${rim.width.toFixed(3)}, fres) * step(0.05, toward);
          }`);
    };
    material.customProgramCacheKey = () => 'rim';
  }

  /** Swap lit materials under `root` for toon ones; `character(mesh)` picks the 2-band ramp + rim. */
  function toonify(root, character = () => false) {
    root.traverse((o) => {
      if (!o.isMesh || o.material.isShaderMaterial || o.material.isMeshBasicMaterial) return;
      const m = o.material;
      const t = new THREE.MeshToonMaterial({
        color: m.color, map: m.map, side: m.side, vertexColors: m.vertexColors,
        gradientMap: character(o) ? rampChar : rampEnv,
      });
      if (character(o)) addRim(t);
      else if (m.userData.tri) {
        m.userData.tri.triBump.value *= triBumpScale;
        t.onBeforeCompile = m.onBeforeCompile; t.customProgramCacheKey = () => 'tri';
      }
      o.material = t;
    });
  }

  const cloudMaterial = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp([170, 255]), fog: false });
  /** Ring of cumulus around the horizon; `arcs` = [[azimuthDeg, distance, size, height], ...]. */
  function addClouds(arcs, seed = 1) {
    arcs.forEach(([az, dist, size, height], i) => {
      const a = THREE.MathUtils.degToRad(az);
      scene.add(cumulus({ at: new THREE.Vector3(Math.sin(a) * dist, -size * 0.2, Math.cos(a) * dist), size, height, seed: seed * 31 + i, puffs: 220, material: cloudMaterial }));
    });
  }

  function finish() {
    const pr = renderer.getPixelRatio(), w = window.innerWidth * pr, h = window.innerHeight * pr;
    const normalTarget = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    normalTarget.depthTexture = new THREE.DepthTexture(w, h, THREE.FloatType);
    // Normal/depth pre-pass (geometry layer only).
    const normalMat = new THREE.MeshNormalMaterial();
    const prevBg = scene.background;
    camera.layers.disable(SKY_LAYER);
    scene.overrideMaterial = normalMat;
    renderer.setRenderTarget(normalTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    renderer.setRenderTarget(null);
    camera.layers.enable(SKY_LAYER);
    scene.background = prevBg;

    camera.updateMatrixWorld();
    sunView.value.copy(sunDir).transformDirection(camera.matrixWorldInverse);
    const sunUV = sunDir.clone().multiplyScalar(1000).add(camera.position).project(camera);
    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(clampPass(20));
    composer.addPass(inkPass({
      normalTarget, camera, res: new THREE.Vector2(w, h), width: (ink.width ?? 1.2) * pr,
      depthThresh: ink.depthThresh ?? 0.06, normalThresh: ink.normalThresh ?? 0.35, normalStrength: ink.normalStrength ?? 0.55, strength: ink.strength ?? 0.85,
      fadeNear: ink.fadeNear ?? 12, fadeFar: ink.fadeFar ?? 60, tint: ink.tint ?? '#3a2a30',
    }));
    if (new URLSearchParams(location.search).has('debugNormal')) {
      const dbgPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tN: { value: null } }, vertexShader: FULLSCREEN_VS,
        fragmentShader: 'uniform sampler2D tN; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tN, vUv); }' });
      dbgPass.uniforms.tN.value = normalTarget.texture;
      composer.addPass(dbgPass);
    }
    composer.addPass(new OutputPass());
    if (flare > 0 && sunUV.z < 1) composer.addPass(flarePass({ sunUV: new THREE.Vector2(sunUV.x * 0.5 + 0.5, sunUV.y * 0.5 + 0.5), aspect: w / h, strength: flare }));
    composer.addPass(gradePass(grade));
    for (let i = 0; i < 2; i++) composer.render();
    window.__ready = true;
  }

  return { THREE, renderer, scene, camera, sun, sunDir, toonify, addClouds, finish };
}
