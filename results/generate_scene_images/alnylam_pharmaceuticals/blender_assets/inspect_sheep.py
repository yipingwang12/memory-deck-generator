"""Render each candidate sheep GLB from the side under a studio HDRI, one PNG each."""
import bpy, sys, math, glob, os
from mathutils import Vector
A = '/Users/yipingwa/Documents/Projects/memory-deck-generator/cache/scene_assets'
for g in sorted(glob.glob(f'{A}/objaverse/glbs/*.glb'))[1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=g)
    meshes = [o for o in sc.objects if o.type == 'MESH']
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
    ctr, size = (lo + hi) / 2, max(hi - lo)
    print(os.path.basename(g)[:8], 'dims', tuple(round(x, 2) for x in hi - lo), 'mats',
          sorted({s.material.name for o in meshes for s in o.material_slots if s.material})[:6])
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    env = w.node_tree.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(f'{A}/polyhaven/hdri/goegap/goegap_4k.hdr')
    w.node_tree.links.new(env.outputs[0], w.node_tree.nodes['Background'].inputs[0])
    for name, d in (('side', Vector((1, -1.6, 0.35))), ('front', Vector((-1.6, -0.6, 0.35)))):
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); sc.collection.objects.link(cam)
        cam.location = ctr + d.normalized() * size * 2.2
        cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.clip_end = size * 20; sc.camera = cam
        sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.device = 'CPU'
        sc.render.resolution_x, sc.render.resolution_y = 480, 320
        sc.render.filepath = f'{os.path.dirname(os.path.abspath(__file__))}/inspect_{os.path.basename(g)[:8]}_{name}.png'
        bpy.ops.render.render(write_still=True)
