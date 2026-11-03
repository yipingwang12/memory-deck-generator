import sys,re
q=sys.argv[1]; body=open(f'{q}.body.js').read(); scene=open(f'{q}.body.js').readline().strip('/ \n')
t=open('scene.tpl').read().replace('@Q@',q).replace('@SCENE@',scene).replace('@BODY@',body)
open(f'{q}_anime.html','w').write(t)
