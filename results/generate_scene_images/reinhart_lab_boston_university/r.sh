cd /Users/yipingwa/Documents/Projects/memory-deck-generator/results/generate_scene_images/reinhart_lab_boston_university/threejs
for q in "$@"; do NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs ${q}_anime.html out/${q}_v1.png --w 640 --h 360 --ss 1 2>&1 | tail -3; done
