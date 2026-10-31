"""Alnylam q13 — "The LAMB sleeps under a BRIDGE over the Charles River." (place image: BRIDGE)"""
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scene_kit as K  # noqa: E402

HDRI = f'{K.ASSETS}/polyhaven/hdri/under_bridge/under_bridge_4k.hdr'
SUN_U, SUN_ELEV = 0.647, 3.9          # measured by sun_dir.py
SUN_LEFT_DEG = 18
LYING = f'{K.ASSETS}/objaverse/glbs/78fabfabfbb240528f63ee7609120f70.glb'
CAM_DIST, CAM_H, LENS, TILT = 1.05, 0.34, 15, 16
FACING_DEG = 160                      # lamb heading relative to the camera's right
OUT = sys.argv[sys.argv.index('--') + 2] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 2 else 'q13_v3.png'

sc = K.reset()
K.hdri_world(sc, HDRI)
sun = K.hdri_sun_dir(SUN_U, SUN_ELEV)
fwd = K.rot_z(Vector((sun.x, sun.y, 0)).normalized(), -SUN_LEFT_DEG)
right = K.rot_z(fwd, -90)
K.shadow_catcher()
K.sun_lamp(sc, sun, strength=3.0)

lamb = K.import_glb(LYING, height=0.42, name='LAMB')
lamb.location = right * 0.12
K.soften_material(lamb, roughness=1.0, sheen=0.8)
K.add_wool_bump(lamb)
facing = K.rot_z(right, FACING_DEG)
lamb.rotation_euler.z = -K.head_direction(lamb).to_2d().angle_signed(facing.to_2d())

target = Vector((0, 0, 0.25))
cam_pos = target - fwd * CAM_DIST; cam_pos.z = CAM_H
K.camera_look(sc, cam_pos, target, LENS, TILT)
K.fill_light(sc, cam_pos - fwd * 0.8 + Vector((0, 0, 0.7)), target, 25, size=1.5)
K.lens_glare(sc, strength=0.5)
K.render(sc, f'{K.HERE}/{OUT}', K.final_render(), exposure=-0.3)
