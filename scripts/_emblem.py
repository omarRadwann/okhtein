# Author the REAL Okhtein emblem — the horizontal double-arrow / spear ornament from the
# wordmark logo: a long central BAR terminating in DOUBLE-LOZENGE (diamond) finials at each
# end (two overlapping vertical diamonds per tip), plus a small center diamond node. Symmetric.
#
# Built procedurally with bmesh (NO booleans — the 5.1 boolean solver eats coplanar/tangent cuts
# per the project's Blender notes). Each 2D polygon is made into a face, the whole profile is
# extruded in +Z for a thin jewel relief, then a Bevel modifier facets the edges so the diamonds
# catch light. Exported export_yup=True → the flat mark's +Z silhouette-normal becomes glTF +Y
# (loads lying face-up), so R3F stands it upright with <group rotation={[PI/2,0,0]}>.
#
# Also renders an orthographic FRONT view to scripts/.emblem_preview.png for silhouette QA.
import bpy, bmesh, math, os
from mathutils import Vector

OUT_GLB = os.path.join(os.path.dirname(bpy.data.filepath) or os.getcwd(), 'okhtein_emblem.glb')
# resolve relative to this script's directory regardless of cwd
HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else os.getcwd()
OUT_GLB = os.path.normpath(os.path.join(HERE, '..', 'public', 'models', 'okhtein', 'okhtein_emblem.glb'))
OUT_PNG = os.path.join(HERE, '.emblem_preview.png')

# ── wipe scene ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)

THICK = 0.13  # Z relief depth

# 2D polygons (XY). Lozenge = vertical rhombus (diamond): wide at the bar centreline, points top/bottom.
def lozenge(cx, hw, hh):
    return [(cx - hw, 0.0), (cx, hh), (cx + hw, 0.0), (cx, -hh)]

def rect(x0, x1, hy):
    return [(x0, hy), (x1, hy), (x1, -hy), (x0, -hy)]

polys = []
# central spear bar
polys.append(rect(-0.70, 0.70, 0.072))
# small centre diamond node (a subtle bead at the very middle, as in the mark)
polys.append(lozenge(0.0, 0.055, 0.135))
# LEFT finials: outer (tip) + inner lozenge, overlapping → read as a double-diamond terminal
polys.append(lozenge(-0.905, 0.115, 0.300))   # outer tip
polys.append(lozenge(-0.715, 0.105, 0.232))   # inner
# RIGHT finials (mirror)
polys.append(lozenge(0.905, 0.115, 0.300))
polys.append(lozenge(0.715, 0.105, 0.232))

# ── build flat profile in bmesh ───────────────────────────────────────────────
bm = bmesh.new()
for poly in polys:
    vs = [bm.verts.new((x, y, 0.0)) for (x, y) in poly]
    bm.faces.new(vs)
bm.normal_update()
# extrude the whole region in +Z for thickness
geom = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
verts_ext = [e for e in geom['geom'] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, vec=Vector((0, 0, THICK)), verts=verts_ext)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

me = bpy.data.meshes.new('OkhteinEmblem')
bm.to_mesh(me)
bm.free()
obj = bpy.data.objects.new('OkhteinEmblem', me)
bpy.context.collection.objects.link(obj)

# centre it on origin (geometry is already X/Y symmetric; centre Z)
obj.location = (0.0, 0.0, -THICK / 2.0)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

# Bevel modifier → faceted jewel edges that catch the gallery light.
bev = obj.modifiers.new('bevel', 'BEVEL')
bev.width = 0.018
bev.segments = 2
bev.limit_method = 'ANGLE'
bev.angle_limit = math.radians(30)
bpy.ops.object.modifier_apply(modifier='bevel')

# shade smooth with auto-smooth so flat faces stay crisp but the bevel rounds
bpy.ops.object.shade_smooth()

# ── champagne brass PBR ───────────────────────────────────────────────────────
mat = bpy.data.materials.new('ChampagneBrass')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.62, 0.56, 0.42, 1.0)  # champagne (linear-ish)
bsdf.inputs['Metallic'].default_value = 1.0
bsdf.inputs['Roughness'].default_value = 0.26
obj.data.materials.append(mat)

# ── orthographic FRONT-view preview render (workbench = reliable headless) ─────
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x = 640
scene.render.resolution_y = 220
scene.render.film_transparent = False
try:
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'SINGLE'
    scene.display.shading.single_color = (0.78, 0.72, 0.58)
except Exception as e:
    print('shading cfg skipped', e)

cam_data = bpy.data.cameras.new('cam')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 2.4
cam = bpy.data.objects.new('cam', cam_data)
cam.location = (0, 0, 5)
cam.rotation_euler = (0, 0, 0)  # looks down -Z at the XY face
bpy.context.collection.objects.link(cam)
scene.camera = cam

scene.render.filepath = OUT_PNG
bpy.ops.render.render(write_still=True)
print('PREVIEW', OUT_PNG)

# ── export GLB (yup) ──────────────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_yup=True,
    export_apply=True,
)
print('EXPORTED', OUT_GLB, os.path.getsize(OUT_GLB), 'bytes')
