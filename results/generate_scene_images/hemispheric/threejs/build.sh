n=$1; { sed "s/SCENE/$n/" _head.txt; cat _$n.js; cat _foot.txt; } > ${n}_anime.html
