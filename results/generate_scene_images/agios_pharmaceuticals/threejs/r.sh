#!/bin/sh
# usage: r.sh qNN [v] [extra]  -> preview out/qNN_vV.png
cd "$(dirname "$0")" && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs $1_anime.html out/$1_v$2.png --w 640 --h 360 --ss 1 2>&1 | grep -v "^rendered" ; true
