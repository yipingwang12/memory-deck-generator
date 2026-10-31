"""Paper texture for scene props: a formal document with unreadable text lines and a seal."""
import random
from PIL import Image, ImageDraw, ImageFilter

def paper(path, seed=1, w=1100, h=1500):
    rnd = random.Random(seed)
    im = Image.new('RGB', (w, h), (243, 236, 214)); d = ImageDraw.Draw(im)
    for _ in range(4000):  # fibre speckle
        x, y = rnd.randrange(w), rnd.randrange(h); c = rnd.randint(222, 240)
        d.point((x, y), (c, c - 6, c - 22))
    d.rectangle((60, 60, w - 60, h - 60), outline=(150, 130, 95), width=4)
    d.rectangle((300, 120, w - 300, 150), fill=(70, 60, 50))           # title bar
    y = 230
    while y < h - 420:
        for _ in range(rnd.randint(3, 6)):
            x2 = rnd.randint(int(w * .55), w - 130)
            d.rectangle((130, y, x2, y + 9), fill=(95, 88, 78)); y += 30
        y += 30
    d.line((130, h - 250, 560, h - 250), fill=(60, 55, 50), width=3)   # signature line
    d.ellipse((w - 330, h - 360, w - 150, h - 180), fill=(168, 32, 30))  # wax seal
    d.ellipse((w - 300, h - 330, w - 180, h - 210), outline=(120, 18, 18), width=6)
    im.filter(ImageFilter.GaussianBlur(0.6)).save(path)

if __name__ == '__main__':
    for i in range(3):
        paper(f'paper_{i}.png', seed=i)
