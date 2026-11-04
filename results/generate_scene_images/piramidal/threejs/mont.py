import sys
from PIL import Image
qs=sys.argv[2:]; v=sys.argv[1]
im=Image.new('RGB',(1280,360*((len(qs)+1)//2)))
for i,q in enumerate(qs): im.paste(Image.open(f'out/{q}_{v}.png').resize((640,360)),((i%2)*640,(i//2)*360))
im.save(f'out/mont_{v}.png')
