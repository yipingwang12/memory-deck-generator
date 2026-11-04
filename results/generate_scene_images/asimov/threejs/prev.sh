#!/bin/bash
# usage: prev.sh tag q01 q02 ... -> previews then montage
tag=$1; shift
export NODE_PATH=/tmp/claude-502/tjs/node_modules
for q in "$@"; do ./build.sh $q; echo -n "$q "; node render.mjs ${q}_anime.html out/${q}_$tag.png --w 640 --h 360 --ss 1 2>&1 | tail -2; done
python3 - "$tag" "$@" <<'PY'
import sys
from PIL import Image
tag=sys.argv[1]; qs=sys.argv[2:]
W=Image.new('RGB',(1280,360*((len(qs)+1)//2)))
for i,q in enumerate(qs): W.paste(Image.open(f'out/{q}_{tag}.png').convert('RGB'),((i%2)*640,(i//2)*360))
W.save(f'out/mont_{tag}.png')
PY
