page() { cat > $1_anime.html <<EOT
<!doctype html>
<html><head><meta charset="utf-8"><title>Ultima $1</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
import { THREE, guard, mat, add, blob, sign, wafer, coin, palm, flask, dna, solarPanel, sun, build, cam, reachW, climber } from './props.js';
guard(() => {
$2
});
</script></body></html>
EOT
}
