"""Alnylam q08 — "The LAMB serves six plates of SUSHI, one plate for each approved medicine." (peg SUSHI = 06)"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scene_kit as K  # noqa: E402

HDRI = f'{K.ASSETS}/polyhaven/hdri/hayloft/hayloft_4k.hdr'
HDRI_ROT = 0                          # turns the barn behind the table
G = f'{K.ASSETS}/objaverse/glbs'
PLATE, NIGIRI_A, NIGIRI_B = f'{G}/68e0db8178ed46319fcd407f99d833a3.glb', f'{G}/71656228538740be8a9d8779eb109c49.glb', f'{G}/5ee3c671e6014f04ba3971c243acdfb9.glb'
TABLE = f'{K.ASSETS}/polyhaven/model/dining_table/dining_table_2k.gltf'
CAM = Vector((0.45, -2.1, 1.55)); LOOK = Vector((0.40, 0.05, 0.62)); LENS = 33
TABLE_SCALE = 0.7
OUT = sys.argv[sys.argv.index('--') + 2] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 2 else 'q08_v4.png'

sc = K.reset()
K.hdri_world(sc, HDRI, rotation_deg=HDRI_ROT)
K.shadow_catcher()

# Table (real-world scale from Poly Haven), long side along X.
before = {o.name for o in bpy.data.objects}
bpy.ops.import_scene.gltf(filepath=TABLE)
table = [o for o in bpy.data.objects if o.name not in before]
for o in table:
    if o.parent is None:
        o.scale = [s * TABLE_SCALE for s in o.scale]
bpy.context.view_layer.update()
lo, hi = K.bounds([o for o in table if o.type == 'MESH'])
if (hi.y - lo.y) > (hi.x - lo.x):
    for o in table:
        if o.parent is None:
            o.rotation_mode = 'XYZ'; o.rotation_euler.z += math.pi / 2
    bpy.context.view_layer.update(); lo, hi = K.bounds([o for o in table if o.type == 'MESH'])
top_z = hi.z
print('table', tuple(round(x, 2) for x in hi - lo))

# Six plates in a row along the table, each with two nigiri.
plate = K.import_glb(PLATE, 0.19, 'plate', fit='width', flat=True)
pl_lo, pl_hi = K.bounds([plate]); plate_h = pl_hi.z - pl_lo.z
na = K.import_glb(NIGIRI_A, 0.075, 'nigiri_a', fit='width')
nb = K.import_glb(NIGIRI_B, 0.075, 'nigiri_b', fit='width')
span = min(hi.x - lo.x - 0.12, 6 * 0.22)
xs = [lo.x + (hi.x - lo.x - span) / 2 + span * (i + 0.5) / 6 for i in range(6)]
yc = (lo.y + hi.y) / 2 - 0.16
for i, x in enumerate(xs):
    p = plate if i == 0 else plate.copy()
    if i:
        sc.collection.objects.link(p)
    p.location = (x, yc, top_z)
    for src, dx, rot in ((na, -0.035, 15), (nb, 0.04, -20)):
        s = src if i == 0 else src.copy()
        if i:
            sc.collection.objects.link(s)
        s.rotation_mode = 'XYZ'; s.rotation_euler.z = math.radians(rot + 7 * i)
        s.location = (x + dx, yc + (0.01 if dx > 0 else -0.012), top_z + plate_h * 0.55)

# Lamb at the far end of the table, facing along the row of plates: the server.
lamb = K.import_glb(K.LAMB_GLB, height=0.80, name='LAMB')
K.soften_material(lamb); K.mask_dark_texels(lamb, above_z=0.10)
facing = Vector((-1, 0.35, 0)).normalized()
lamb.rotation_euler.z = -K.head_direction(lamb).to_2d().angle_signed(facing.to_2d())
lamb.location = (hi.x + 0.22, yc + 0.30, 0)

K.camera_look(sc, CAM, LOOK, LENS)
K.fill_light(sc, CAM + Vector((0.6, -0.8, 0.8)), LOOK, 60, size=1.5)
K.render(sc, f'{K.HERE}/{OUT}', K.final_render(), exposure=0.3)
