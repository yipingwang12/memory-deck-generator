import sys
from PIL import Image
qs=sys.argv[2:]; ims=[Image.open(f'out/{q}_v1.png').convert('RGB') for q in qs]
W=2; H=(len(ims)+1)//2; s=Image.new('RGB',(640*W,360*H))
for i,im in enumerate(ims): s.paste(im.resize((640,360)),((i%W)*640,(i//W)*360))
s.save(sys.argv[1])
