#!/bin/sh
# usage: run.sh qNN [extra args]
cd "$(dirname "$0")" && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs "$1_anime.html" "out/$1_v1.png" --w 640 --h 360 --ss 1 "${@:2}"
