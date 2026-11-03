#!/bin/sh
# usage: run.sh page out.png [w h] [--q ...]
cd "$(dirname "$0")" && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs "$@"
