"""q01: Under a hot SUN, the LAMB signs its incorporation papers. Built from primitives, Cycles render."""
import math
import random
import sys

import bpy

OUT = sys.argv[sys.argv.index('--') + 1]
random.seed(1)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, rough=0.6, emission=None, strength=0.0, subsurface=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    if subsurface:
        p.inputs['Subsurface Weight'].default_value = subsurface
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = strength
    return m


def add(obj, mat):
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def sphere(loc, r, mat, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.object
    o.scale = scale
    return add(o, mat)


def box(loc, size, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = [s / 2 for s in size]
    o.data.materials.append(mat)
    bev = o.modifiers.new('bev', 'BEVEL')
    bev.width, bev.segments = 0.01, 3
    return o


def cyl(loc, r, depth, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot)
    return add(bpy.context.object, mat)


# world: physical sky with a low, very bright sun
world = bpy.data.worlds.new('sky')
scene.world = world
world.use_nodes = True
nt = world.node_tree
sky = nt.nodes.new('ShaderNodeTexSky')
sky.sun_elevation = math.radians(22)
sky.sun_rotation = math.radians(200)
sky.sun_size = math.radians(6)
sky.sun_intensity = 1.0
nt.links.new(sky.outputs['Color'], nt.nodes['Background'].inputs['Color'])
nt.nodes['Background'].inputs['Strength'].default_value = 0.35

bpy.ops.object.light_add(type='SUN', rotation=(math.radians(68), 0, math.radians(-160)))
sun_lamp = bpy.context.object.data
sun_lamp.energy, sun_lamp.angle = 5.0, math.radians(2)
sun_lamp.color = (1.0, 0.85, 0.65)

# visible SUN disc: huge emissive sphere behind the scene, plus heat haze
sun_mat = material('sun', (1, 0.8, 0.3), emission=(1.0, 0.75, 0.25), strength=40)
sphere((-14, 30, 9), 3.2, sun_mat)

# desert: displaced plane
bpy.ops.mesh.primitive_plane_add(size=120)
ground = bpy.context.object
sub = ground.modifiers.new('sub', 'SUBSURF')
sub.subdivision_type, sub.levels, sub.render_levels = 'SIMPLE', 7, 7
tex = bpy.data.textures.new('dunes', 'CLOUDS')
tex.noise_scale = 6
disp = ground.modifiers.new('disp', 'DISPLACE')
disp.texture, disp.strength = tex, 0.6
add(ground, material('sand', (0.78, 0.55, 0.3), rough=0.9))

# desk
wood = material('wood', (0.28, 0.14, 0.06), rough=0.45)
box((0.9, 0, 0.75), (1.6, 0.9, 0.06), wood)
for x in (0.2, 1.6):
    for y in (-0.38, 0.38):
        box((x, y, 0.37), (0.06, 0.06, 0.74), wood)

# incorporation papers + red wax seal + pen
paper = material('paper', (0.93, 0.9, 0.82), rough=0.8)
box((0.95, -0.02, 0.785), (0.42, 0.56, 0.004), paper, rot=(0, 0, math.radians(-8)))
box((0.98, 0.01, 0.79), (0.42, 0.56, 0.004), paper, rot=(0, 0, math.radians(4)))
ink = material('ink', (0.05, 0.08, 0.25), rough=0.4)
for i in range(4):
    box((0.98, 0.16 - i * 0.07, 0.793), (0.3 - 0.04 * i, 0.012, 0.001), ink, rot=(0, 0, math.radians(4)))
seal = material('seal', (0.55, 0.04, 0.03), rough=0.3)
cyl((1.1, -0.18, 0.795), 0.04, 0.012, seal)

# LAMB: wool body of many small spheres, dark face and legs (Suffolk-like)
wool = material('wool', (0.92, 0.89, 0.82), rough=1.0, subsurface=0.2)
skin = material('face', (0.05, 0.04, 0.035), rough=0.5)
eye = material('eye', (0.02, 0.02, 0.02), rough=0.05)
cx, cy, cz = -0.35, 0, 0.75
for _ in range(140):
    u, v = random.uniform(0, 2 * math.pi), random.uniform(-1, 1)
    s = math.sqrt(1 - v * v)
    p = (cx + 0.55 * s * math.cos(u), cy + 0.36 * s * math.sin(u), cz + 0.34 * v)
    sphere(p, random.uniform(0.09, 0.13), wool)
sphere((cx, cy, cz), 0.5, wool, scale=(1.1, 0.72, 0.68))
for x, y in ((-0.75, -0.18), (-0.75, 0.18), (0.0, 0.18)):
    cyl((x, y, 0.27), 0.05, 0.55, skin)
# raised front leg reaching to the desk, holding the pen
cyl((0.25, -0.12, 0.72), 0.05, 0.6, skin, rot=(0, math.radians(70), math.radians(-10)))
pen = material('pen', (0.02, 0.02, 0.02), rough=0.15)
gold = material('gold', (1.0, 0.75, 0.3), rough=0.2)
cyl((0.62, -0.14, 0.82), 0.012, 0.22, pen, rot=(0, math.radians(60), math.radians(30)))
cyl((0.7, -0.09, 0.79), 0.008, 0.04, gold, rot=(0, math.radians(60), math.radians(30)))
# head
hx, hz = 0.25, 1.18
sphere((hx, 0, hz), 0.2, skin, scale=(1.25, 0.85, 1.0))
sphere((hx + 0.2, 0, hz - 0.07), 0.11, skin, scale=(1.1, 0.9, 0.85))
for y in (-0.1, 0.1):
    sphere((hx + 0.12, y, hz + 0.05), 0.03, eye)
    sphere((hx - 0.08, y * 2.4, hz + 0.1), 0.11, skin, scale=(0.4, 1.4, 0.35))
for _ in range(14):
    sphere((hx - 0.1 + random.uniform(-0.06, 0.06), random.uniform(-0.1, 0.1), hz + 0.18),
           random.uniform(0.06, 0.08), wool)

# camera
bpy.ops.object.camera_add(location=(2.6, -3.6, 1.35))
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 38
target = bpy.data.objects.new('target', None)
scene.collection.objects.link(target)
target.location = (0.2, 0.6, 1.0)
c = cam.constraints.new('TRACK_TO')
c.target, c.track_axis, c.up_axis = target, 'TRACK_NEGATIVE_Z', 'UP_Y'

scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = True
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.resolution_x, scene.render.resolution_y = 1024, 576
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
