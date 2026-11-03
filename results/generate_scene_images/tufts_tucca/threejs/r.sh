#!/bin/zsh
# usage: r.sh q01 v3 [w h]  -> out/q01_v3.png preview
cd "$(dirname "$0")"; export NODE_PATH=/tmp/claude-502/tjs/node_modules
node render.mjs $1_anime.html out/$1_$2.png --w ${3:-640} --h ${4:-360} --ss 1 2>&1 | grep -v '^rendered'
