#!/bin/sh
cd "$(dirname "$0")" && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs "$1_anime.html" "$1_anime.png" --w 1280 --h 720 --ss 1
