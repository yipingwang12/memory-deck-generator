import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert('RGB') for f in fs]
w,h=ims[0].size; cols=2; rows=(len(ims)+1)//2
m=Image.new('RGB',(w*cols,h*rows))
for i,im in enumerate(ims): m.paste(im,((i%cols)*w,(i//cols)*h))
m.save(sys.argv[1])
