"""Print each HDRI's brightest direction (the sun): azimuth and elevation in degrees."""
import bpy, glob, math
import numpy as np
for f in sorted(glob.glob('/Users/yipingwa/Documents/Projects/memory-deck-generator/cache/scene_assets/polyhaven/hdri/*/*.hdr')):
    im = bpy.data.images.load(f); w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(px)
    lum = px.reshape(h, w, 4)[..., :3].sum(-1)
    y, x = np.unravel_index(lum.argmax(), lum.shape)
    # Blender equirect: u=0.5 faces -Y... report raw u and elevation; azimuth in Blender world = (u-0.5)*360 measured from -Y? derive below
    u, v = (x + .5) / w, (y + .5) / h  # pixels stored bottom-up
    print(f.split('/')[-1], 'u', round(u, 3), 'elev', round((v - .5) * 180, 1), 'peak', round(float(lum.max())))
