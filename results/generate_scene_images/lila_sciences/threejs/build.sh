#!/bin/bash
# usage: build.sh qNN  (assembles qNN_anime.html from src/head.part + helpers + src/qNN.body)
for q in "$@"; do { cat src/head.part src/helpers.part; echo "guard(() => {"; cat src/$q.body; echo "});</script></body></html>"; } > ${q}_anime.html; done
