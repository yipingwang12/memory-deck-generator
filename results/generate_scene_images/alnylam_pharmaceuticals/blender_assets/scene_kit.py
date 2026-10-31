"""Shared Blender helpers for asset-based scene renders (pilot, 2026-10-30).

Real assets in place of primitives: Objaverse scans for the anchor animal, Poly Haven HDRIs
for photographed sky + light, Poly Haven PBR textures for ground and stone.
Run inside Blender: blender -b --python <scene>.py -- [--final]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

ASSETS = '/Users/yipingwa/Documents/Projects/memory-deck-generator/cache/scene_assets'
HERE = os.path.dirname(os.path.abspath(__file__))
LAMB_GLB = f'{ASSETS}/objaverse/glbs/8c42ea688b5f45e3885c43bfb82ba1bf.glb'


def final_render() -> bool:
    return '--final' in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def rot_z(v: Vector, deg: float) -> Vector:
    a = math.radians(deg)
    return Vector((v.x * math.cos(a) - v.y * math.sin(a), v.x * math.sin(a) + v.y * math.cos(a), v.z))


def hdri_world(sc, path: str, strength: float = 1.0, rotation_deg: float = 0.0):
    w = bpy.data.worlds.new('world'); sc.world = w; w.use_nodes = True
    nt = w.node_tree
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(path)
    if rotation_deg:
        mapping = nt.nodes.new('ShaderNodeMapping'); coord = nt.nodes.new('ShaderNodeTexCoord')
        mapping.inputs['Rotation'].default_value[2] = math.radians(rotation_deg)
        nt.links.new(coord.outputs['Generated'], mapping.inputs['Vector'])
        nt.links.new(mapping.outputs['Vector'], env.inputs['Vector'])
    bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = strength
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])


def hdri_sun_dir(u: float, elev_deg: float, rotation_deg: float = 0.0) -> Vector:
    """World direction towards the brightest HDRI pixel (measured)."""
    az = (u - 0.5) * 2 * math.pi + math.radians(rotation_deg)
    e = math.radians(elev_deg)
    # Signs measured, not derived: a camera aimed along this vector centres the HDRI's sun.
    return Vector((math.cos(az) * math.cos(e), -math.sin(az) * math.cos(e), math.sin(e)))


def sun_lamp(sc, direction: Vector, strength: float = 4.0, angle_deg: float = 0.6):
    """Sun lamp along the HDRI's own sun direction: the HDRI sun is a few pixels, too small to
    cast crisp shadows by itself."""
    d = bpy.data.lights.new('sun', 'SUN'); d.energy = strength; d.angle = math.radians(angle_deg)
    d.color = (1.0, 0.95, 0.88)
    o = bpy.data.objects.new('sun', d); sc.collection.objects.link(o)
    o.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    return o


def shadow_catcher(size: float = 60.0):
    bpy.ops.mesh.primitive_plane_add(size=size)
    p = bpy.context.object; p.name = 'ground'; p.is_shadow_catcher = True
    return p


def bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)])
    hi = Vector([max(p[i] for p in pts) for i in range(3)])
    return lo, hi


def import_glb(path: str, height: float, name: str, fit: str = 'height', flat: bool = False):
    """Import a GLB, join its meshes, scale so its height (or, with fit='width', its largest
    horizontal extent) is `height`; base on z=0, centred at the origin."""
    before = {o.name for o in bpy.data.objects}
    bpy.ops.import_scene.gltf(filepath=path)
    new_names = [o.name for o in bpy.data.objects if o.name not in before]
    meshes = [bpy.data.objects[n] for n in new_names if bpy.data.objects[n].type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    for n in new_names:
        if n != obj.name and n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.rotation_mode = 'XYZ'  # glTF import sets QUATERNION; rotation_euler would be ignored
    if flat:  # a plate or a sheet: thinnest dimension vertical
        lo, hi = bounds([obj]); d = hi - lo
        if d.x < d.z and d.x <= d.y:
            obj.rotation_euler.y = math.pi / 2
        elif d.y < d.z:
            obj.rotation_euler.x = math.pi / 2
        bpy.ops.object.transform_apply(rotation=True)
    lo, hi = bounds([obj])
    span = (hi.z - lo.z) if fit == 'height' else max(hi.x - lo.x, hi.y - lo.y)
    s = height / span
    obj.scale = (s, s, s); bpy.ops.object.transform_apply(scale=True)
    lo, hi = bounds([obj])
    obj.location -= Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    bpy.ops.object.transform_apply(location=True)
    obj.rotation_mode = 'XYZ'  # glTF import sets QUATERNION; rotation_euler would be ignored
    obj.name = name
    return obj


def head_direction(obj) -> Vector:
    """Unit horizontal vector from body centre to head: the centroid of the highest 10% of
    the model (a lamb's head is above its back), from the centroid of the body band."""
    vs = [obj.matrix_world @ v.co for v in obj.data.vertices]
    lo, hi = bounds([obj])
    h = hi.z - lo.z
    top = [v for v in vs if v.z > lo.z + 0.9 * h]
    body = [v for v in vs if lo.z + 0.45 * h < v.z < lo.z + 0.7 * h]
    c = lambda pts: sum(pts, Vector()) / len(pts)
    d = c(top) - c(body); d.z = 0
    return d.normalized()


def muzzle_point(obj, facing: Vector) -> Vector:
    """The most forward vertex in the top third — the nose."""
    vs = [obj.matrix_world @ v.co for v in obj.data.vertices]
    lo, hi = bounds([obj])
    upper = [v for v in vs if v.z > lo.z + (hi.z - lo.z) * 0.6]
    return max(upper, key=lambda v: v.dot(facing))


def soften_material(obj, roughness: float = 0.85, sheen: float = 0.4):
    """Scans often import glossy; wool is matte with a soft sheen."""
    for slot in obj.material_slots:
        m = slot.material
        if not (m and m.use_nodes):
            continue
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                if not n.inputs['Roughness'].is_linked:
                    n.inputs['Roughness'].default_value = roughness
                for key in ('Specular IOR Level', 'Specular'):
                    if key in n.inputs and not n.inputs[key].is_linked:
                        n.inputs[key].default_value = 0.2
                if 'Sheen Weight' in n.inputs:
                    n.inputs['Sheen Weight'].default_value = sheen


def mask_dark_texels(obj, above_z: float, wool=(0.80, 0.76, 0.66), threshold: float = 0.12):
    """Scans of toys carry a dark underside where the turntable hid them. Repaint texels
    darker than `threshold` with wool colour, but only above `above_z` (world) so the
    hooves stay dark."""
    for slot in obj.material_slots:
        m = slot.material
        if not (m and m.use_nodes):
            continue
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not (bsdf and bsdf.inputs['Base Color'].is_linked):
            continue
        src = bsdf.inputs['Base Color'].links[0].from_socket
        bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(src, bw.inputs[0])
        dark = nt.nodes.new('ShaderNodeMath'); dark.operation = 'LESS_THAN'
        dark.inputs[1].default_value = threshold; nt.links.new(bw.outputs[0], dark.inputs[0])
        geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(geo.outputs['Position'], sep.inputs[0])
        high = nt.nodes.new('ShaderNodeMath'); high.operation = 'GREATER_THAN'
        high.inputs[1].default_value = above_z; nt.links.new(sep.outputs['Z'], high.inputs[0])
        both = nt.nodes.new('ShaderNodeMath'); both.operation = 'MULTIPLY'
        nt.links.new(dark.outputs[0], both.inputs[0]); nt.links.new(high.outputs[0], both.inputs[1])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        mix.inputs['B'].default_value = (*wool, 1)
        nt.links.new(both.outputs[0], mix.inputs['Factor'])
        nt.links.new(src, mix.inputs['A'])
        nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])


def wool_material(obj, colour=(0.84, 0.79, 0.68), curl_scale: float = 260.0):
    """Replace a figurine-like finish with wool: matte, soft sheen, fine curl bump, a little
    subsurface so backlight glows through the fleece edge."""
    m = bpy.data.materials.new('wool'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*colour, 1)
    b.inputs['Roughness'].default_value = 0.95
    b.inputs['Sheen Weight'].default_value = 1.0
    b.inputs['Sheen Roughness'].default_value = 0.6
    b.inputs['Subsurface Weight'].default_value = 0.15
    b.inputs['Subsurface Radius'].default_value = (0.02, 0.015, 0.01)
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = curl_scale
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = curl_scale / 6
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    nt.links.new(vor.outputs['Distance'], add.inputs[0]); nt.links.new(noise.outputs['Fac'], add.inputs[1])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.6
    bump.inputs['Distance'].default_value = 0.004
    nt.links.new(add.outputs[0], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    obj.data.materials.clear(); obj.data.materials.append(m)


def add_wool_bump(obj, curl_scale: float = 260.0, strength: float = 0.5):
    """Keep the scan's own colours (face, eyes) but give the surface a fleece: curl bump."""
    for slot in obj.material_slots:
        m = slot.material
        if not (m and m.use_nodes):
            continue
        nt = m.node_tree
        b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b is None or b.inputs['Normal'].is_linked:
            continue
        vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = curl_scale
        bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = strength
        bump.inputs['Distance'].default_value = 0.003
        nt.links.new(vor.outputs['Distance'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])


def pbr_material(name: str, folder: str, prefix: str, box_blend: float = 0.25, scale: float = 1.0):
    """Poly Haven texture set (diff / nor_gl / arm) on box projection — no UVs needed."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    coord = nt.nodes.new('ShaderNodeTexCoord'); mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (scale, scale, scale)
    nt.links.new(coord.outputs['Object'], mapping.inputs['Vector'])

    def tex(suffix, colour):
        t = nt.nodes.new('ShaderNodeTexImage'); t.projection = 'BOX'; t.projection_blend = box_blend
        t.image = bpy.data.images.load(f'{folder}/{prefix}_{suffix}_2k.jpg')
        if not colour:
            t.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(mapping.outputs['Vector'], t.inputs['Vector'])
        return t
    nt.links.new(tex('diff', True).outputs['Color'], bsdf.inputs['Base Color'])
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(tex('arm', False).outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(tex('nor_gl', False).outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def image_material(name: str, path: str, roughness: float = 0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path)
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = roughness
    return m


def solid_material(name: str, rgb, roughness: float = 0.5, metallic: float = 0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = roughness
    b.inputs['Metallic'].default_value = metallic
    return m


def cylinder_between(a: Vector, b: Vector, radius: float, mat, name: str):
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=d.length, vertices=32,
                                        location=(a + b) / 2)
    o = bpy.context.object; o.name = name
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o


def fountain_pen(tip: Vector, direction: Vector, length: float = 0.15, scale: float = 1.0):
    """Black lacquer body, gold band, gold nib; `tip` touches the page."""
    u = direction.normalized(); length *= scale
    gold = solid_material('gold', (0.83, 0.62, 0.25), 0.25, 1.0)
    black = solid_material('lacquer', (0.01, 0.01, 0.012), 0.15)
    nib_end = tip + u * 0.025 * scale
    bpy.ops.mesh.primitive_cone_add(radius1=0.0012 * scale, radius2=0.0065 * scale, depth=0.025 * scale, vertices=32,
                                    location=(tip + nib_end) / 2)
    nib = bpy.context.object; nib.rotation_euler = u.to_track_quat('Z', 'Y').to_euler()
    nib.data.materials.append(gold); bpy.ops.object.shade_smooth()
    body_end = nib_end + u * (length - 0.025 * scale)
    cylinder_between(nib_end, nib_end + u * 0.012 * scale, 0.0072 * scale, gold, 'grip_band')
    cylinder_between(nib_end + u * 0.012 * scale, body_end, 0.0078 * scale, black, 'pen_body')
    cylinder_between(body_end - u * 0.02 * scale, body_end - u * 0.012 * scale, 0.0081 * scale, gold, 'cap_band')


def camera_look(sc, location: Vector, target: Vector, lens_mm: float, extra_pitch_deg: float = 0.0):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.location = location; cam.data.lens = lens_mm; cam.data.clip_end = 2000
    q = (target - location).to_track_quat('-Z', 'Y')
    cam.rotation_euler = q.to_euler()
    if extra_pitch_deg:
        cam.rotation_euler.rotate_axis('X', math.radians(extra_pitch_deg))
    sc.camera = cam
    return cam


def fill_light(sc, at: Vector, target: Vector, watts: float, size: float = 2.0, warm=(1.0, 0.93, 0.82)):
    """Large soft area light — a photographer's reflector on the shadow side of a backlit subject."""
    d = bpy.data.lights.new('fill', 'AREA'); d.energy = watts; d.size = size; d.color = warm
    o = bpy.data.objects.new('fill', d); sc.collection.objects.link(o)
    o.location = at; o.rotation_euler = (target - at).to_track_quat('-Z', 'Y').to_euler()
    return o


def lens_glare(sc, strength: float = 0.6, threshold: float = 8.0, size: float = 0.8):
    """Camera-lens bloom so a real HDRI sun (a few pixels wide) reads as a blazing sun.
    Blender 5: the compositor is a node group with an Image output socket."""
    ng = bpy.data.node_groups.new('comp', 'CompositorNodeTree')
    ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new('CompositorNodeRLayers')
    g = ng.nodes.new('CompositorNodeGlare')
    g.inputs['Type'].default_value = 'Bloom'
    g.inputs['Threshold'].default_value = threshold
    g.inputs['Strength'].default_value = strength
    g.inputs['Size'].default_value = size
    out = ng.nodes.new('NodeGroupOutput')
    ng.links.new(rl.outputs['Image'], g.inputs['Image'])
    ng.links.new(g.outputs['Image'], out.inputs[0])
    sc.compositing_node_group = ng


def render(sc, out: str, final: bool, res=(1536, 864), exposure: float = 0.0):
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        sc.cycles.device = 'CPU'
    sc.cycles.samples = 256 if final else 48
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res if final else (res[0] // 2, res[1] // 2)
    sc.view_settings.exposure = exposure
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
