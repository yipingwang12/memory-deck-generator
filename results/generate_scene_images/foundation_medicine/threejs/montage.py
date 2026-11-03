import sys
from PIL import Image
fs=sys.argv[2:]; W,H=640,360
im=Image.new('RGB',(W*2,H*((len(fs)+1)//2)))
for i,f in enumerate(fs): im.paste(Image.open(f).resize((W,H)),((i%2)*W,(i//2)*H))
im.save(sys.argv[1])
