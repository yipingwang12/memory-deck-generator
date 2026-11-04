#!/bin/sh
# usage: q_test.sh qNN [w h out]
cd "$(dirname "$0")" && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs $1_anime.html ${4:-out/$1_v1.png} --w ${2:-640} --h ${3:-360} --ss 1
