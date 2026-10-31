"""Alnylam q01 — "Under a hot SUN, the LAMB signs its incorporation papers." (peg SUN = 02)"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scene_kit as K  # noqa: E402

HDRI = f'{K.ASSETS}/polyhaven/hdri/goegap/goegap_4k.hdr'
SUN_U, SUN_ELEV = 0.608, 46.5        # measured by sun_dir.py
SUN_LEFT_DEG = 24                    # sun this far left of the camera axis
CAM_DIST, CAM_H, LENS, TILT = 1.50, 0.62, 14, 14
TOWARD_CAM_DEG = -35                 # lamb heading turned from pure profile towards the camera (negative = towards)
SLAB = Vector((0.26, 0.22, 0.13))    # half sizes
FILL_W = 170                         # reflector-style fill from behind the camera (lamb is backlit)
OUT = sys.argv[sys.argv.index('--') + 2] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 2 else 'q01_v7.png'

sc = K.reset()
K.hdri_world(sc, HDRI)
sun = K.hdri_sun_dir(SUN_U, SUN_ELEV)
fwd = K.rot_z(Vector((sun.x, sun.y, 0)).normalized(), -SUN_LEFT_DEG)   # camera forward
right = K.rot_z(fwd, -90)
K.shadow_catcher()
K.sun_lamp(sc, sun)

# Slab front-right of the lamb; lamb in near-profile facing it.
slab_c = right * 0.40 - fwd * 0.16 + Vector((0, 0, SLAB.z))
facing = K.rot_z(right, TOWARD_CAM_DEG)   # rotate towards -fwd (camera)
lamb = K.import_glb(K.LAMB_GLB, height=0.78, name='LAMB')
K.soften_material(lamb)
K.mask_dark_texels(lamb, above_z=0.10)
have = K.head_direction(lamb)
lamb.rotation_euler.z = -have.to_2d().angle_signed(facing.to_2d())
bpy.context.view_layer.update()

bpy.ops.mesh.primitive_cube_add(location=slab_c)
slab = bpy.context.object; slab.name = 'slab'; slab.scale = SLAB
slab.rotation_euler.z = -Vector((1, 0)).angle_signed(fwd.to_2d())
bpy.ops.object.transform_apply(scale=True)
bev = slab.modifiers.new('bevel', 'BEVEL'); bev.width = 0.05; bev.segments = 4
sub = slab.modifiers.new('sub', 'SUBSURF'); sub.levels = sub.render_levels = 4; sub.subdivision_type = 'SIMPLE'
noise = bpy.data.textures.new('rock', 'CLOUDS'); noise.noise_scale = 0.18
disp = slab.modifiers.new('disp', 'DISPLACE'); disp.texture = noise; disp.strength = 0.03
rock = f'{K.ASSETS}/polyhaven/model/namaqualand_boulder_02/textures'
slab.data.materials.append(K.pbr_material('rock', rock, 'namaqualand_boulder_02', scale=1.6))
bpy.ops.object.shade_smooth()

# Papers fanned on the slab, on the side nearest the lamb.
top = slab_c.z + SLAB.z + 0.035
paper_c = slab_c - right * 0.06 - fwd * 0.03
for i, rot in enumerate((-10, 5, -3)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(paper_c.x, paper_c.y, top + 0.003 * i))
    p = bpy.context.object; p.scale = (0.24, 0.33, 1)
    p.rotation_euler.z = -Vector((0, 1)).angle_signed(fwd.to_2d()) + math.radians(rot)
    p.data.materials.append(K.image_material(f'paper{i}', f'{K.HERE}/paper_{i}.png'))

# Pen: nib on the top sheet, body leaning up towards the lamb's muzzle.
muzzle = K.muzzle_point(lamb, facing)
tip = Vector((paper_c.x, paper_c.y, top + 0.012)) - right * 0.04
K.fountain_pen(tip, (muzzle - tip).normalized() + Vector((0, 0, 0.25)), length=0.16, scale=1.6)

target = (Vector((0, 0, 0.40)) + slab_c) / 2
target.z = 0.48
cam_pos = target - fwd * CAM_DIST; cam_pos.z = CAM_H
K.camera_look(sc, cam_pos, target, LENS, TILT)
K.fill_light(sc, cam_pos - fwd * 1.2 + Vector((0, 0, 0.9)), Vector((0, 0, 0.45)), FILL_W)
K.lens_glare(sc)
print('muzzle', tuple(round(x, 2) for x in muzzle), 'tip', tuple(round(x, 2) for x in tip))
K.render(sc, f'{K.HERE}/{OUT}', K.final_render(), exposure=-0.4)
