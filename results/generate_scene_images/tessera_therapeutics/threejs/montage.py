import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert('RGB').resize((640,360)) for f in fs]
W=Image.new('RGB',(1280,360*((len(ims)+1)//2)))
for i,im in enumerate(ims): W.paste(im,((i%2)*640,(i//2)*360))
W.save(sys.argv[1])
