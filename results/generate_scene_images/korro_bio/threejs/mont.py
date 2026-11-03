import sys
from PIL import Image
fs=sys.argv[2:]; im=Image.new('RGB',(1280,360*((len(fs)+1)//2)))
for i,f in enumerate(fs): im.paste(Image.open(f),((i%2)*640,(i//2)*360))
im.save(sys.argv[1])
