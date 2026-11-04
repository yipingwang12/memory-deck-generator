import sys
from PIL import Image
qs=sys.argv[2:]; ims=[Image.open(f'out/{q}_v1.png').resize((640,360)) for q in qs]
rows=(len(ims)+1)//2; W=Image.new('RGB',(1280,360*rows))
for i,im in enumerate(ims): W.paste(im,((i%2)*640,(i//2)*360))
W.save(sys.argv[1])
