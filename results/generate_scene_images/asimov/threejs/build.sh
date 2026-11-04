#!/bin/bash
# usage: build.sh qNN  -> qNN_anime.html from src/qNN.js
for q in "$@"; do
cat > ${q}_anime.html <<HTML
<!doctype html>
<html><head><meta charset="utf-8"><title>Asimov $q anime</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
HTML
cat src/$q.js >> ${q}_anime.html
echo '</script></body></html>' >> ${q}_anime.html
done
