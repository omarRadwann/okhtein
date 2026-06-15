# Blender (headless): author a refined Okhtein ARROWHEAD CLASP — the two-sisters mark as a
# polished, beveled brass sculpture for the atelier workbench centerpiece. Exports a GLB.
# Run: "blender.exe" -b -P scripts/_arrowhead.py
import bpy, bmesh, os

# clean scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

def make_arrow(name, flip):
    s = -1.0 if flip else 1.0
    pts = [(-0.5 * s, 0.5), (0.55 * s, 0.0), (-0.5 * s, -0.5), (-0.12 * s, 0.0)]
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0.0)) for (x, y) in pts]
    if flip:
        vs = list(reversed(vs))  # keep winding/normal outward
    f = bm.faces.new(vs)
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    ev = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ev, vec=(0, 0, 0.22))
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    return obj

# two mirrored arrowheads meeting tip-to-tip → the Okhtein mark
a = make_arrow('ArrowL', False); a.location = (-0.42, 0, 0)
b = make_arrow('ArrowR', True);  b.location = (0.42, 0, 0)

# join
bpy.ops.object.select_all(action='DESELECT')
a.select_set(True); b.select_set(True)
bpy.context.view_layer.objects.active = a
bpy.ops.object.join()
obj = bpy.context.active_object

# polished bevel for a jewel-like brass clasp
bev = obj.modifiers.new('Bevel', 'BEVEL')
bev.width = 0.035; bev.segments = 4; bev.limit_method = 'ANGLE'; bev.angle_limit = 0.7
bpy.ops.object.modifier_apply(modifier='Bevel')
bpy.ops.object.shade_smooth()
try:
    obj.data.use_auto_smooth = True
    obj.data.auto_smooth_angle = 0.9
except Exception:
    pass

# brass PBR material
mat = bpy.data.materials.new('Brass'); mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
def setin(name, val):
    try:
        bsdf.inputs[name].default_value = val
    except Exception:
        pass
setin('Base Color', (0.85, 0.72, 0.46, 1.0))
setin('Metallic', 1.0)
setin('Roughness', 0.24)
obj.data.materials.clear()
obj.data.materials.append(mat)

# center origin at geometry, sit at world origin, face +Z
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
obj.location = (0, 0, 0)

out = os.path.join(os.path.dirname(bpy.data.filepath) or os.getcwd(), 'arrowhead_clasp.glb')
out = os.path.abspath(out)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True)
print('OKHTEIN_ARROW_EXPORTED:', out)
