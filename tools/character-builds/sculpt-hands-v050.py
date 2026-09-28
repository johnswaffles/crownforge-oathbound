"""Sculpt original fitted leather hands around the existing grip frame, without touching the rig."""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
result={}
for side in ['L','R']:
 parts=[]
 def point(p):
  u,d,n=p
  if side=='R':
   a=.42;t=max(0,min(1,(d-.01)/.05));t=t*t*(3-2*t)
   u,d=u+(u*math.cos(a)-(d-.076)*math.sin(a)-u)*t,d+(.076+(d-.076)*math.cos(a)+u*math.sin(a)-d)*t
  return ((-1 if side=='R' else 1)*n*1.12,-d,u)
 def blob(p,scale):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=point(p));o=bpy.context.object
  o.scale=(scale[2]*1.12,scale[1],scale[0]);parts.append(o);return o
 def stroke(path,radii):
  # Catmull-Rom yields uninterrupted finger contours through each knuckle.
  for j in range(len(path)-1):
   a,b,c,d=[Vector(path[max(0,min(len(path)-1,k))]) for k in [j-1,j,j+1,j+2]]
   for k in range(9):
    t=k/8;p=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
    r=radii[j]+(radii[j+1]-radii[j])*t;blob(p,(r,r*.94,r))
 # Curved palm: a narrow wrist, padded heel, metacarpal arch and a scalloped knuckle row.
 rings=[(-.028,.023,.015,0),(-.008,.025,.017,-.001),(.014,.029,.019,-.001),(.033,.035,.020,-.003),(.046,.039,.019,-.005),(.057,.040,.017,-.009),(.064,.036,.014,-.011)]
 verts=[];faces=[];ns=40
 for row,(d,w,h,n) in enumerate(rings):
  for k in range(ns):
   a=k*math.tau/ns;c=math.cos(a);si=math.sin(a)
   u=w*math.copysign(abs(c)**.88,c)
   # Gentle longitudinal padding avoids the flat rectangular back of v044.
   dd=d-(.008*(1-c)*.5 if row>=4 else 0)
   nn=n+h*si-.0035*(1-c*c)*max(0,-si)
   verts.append(point((u,dd,nn)))
 for j in range(len(rings)-1):
  for k in range(ns):a=j*ns+k;b=j*ns+(k+1)%ns;faces.append((a,b,b+ns,a+ns))
 faces.extend([tuple(range(ns-1,-1,-1)),tuple((len(rings)-1)*ns+k for k in range(ns))])
 mesh=bpy.data.meshes.new('Curved palm');mesh.from_pydata(verts,[],faces);mesh.update();palm=bpy.data.objects.new('Curved palm '+side,mesh);bpy.context.collection.objects.link(palm);parts.append(palm)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 bpy.context.view_layer.objects.active=palm;palm.select_set(True)
 mod=palm.modifiers.new('Rounded metacarpals','SUBSURF');mod.levels=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 for i,u in enumerate([-.032,-.011,.011,.032]):
  shortening=[-.010,-.002,.001,0][i];r=[.0084,.0094,.0098,.0092][i]
  # Index/middle lead, ring/little settle lower; a real curl rather than four identical hooks.
  path=[(u*.88,.047+shortening,-.012),(u,.063+shortening,-.014),(u,.083+shortening,-.008),(u*.98,.094+shortening,.009),(u*.95,.089+shortening,.027),(u*.90,.076+shortening,.034)]
  stroke(path,[r*1.20,r*1.12,r*1.02,r*.96,r*.88,r*.81])
 # Thumb web, thenar pad and opposing two-segment thumb close over the grip.
 blob((.024,.031,.008),(.016,.023,.013));blob((-.020,.023,.007),(.015,.027,.013))
 stroke([(.025,.032,.011),(.035,.048,.025),(.032,.064,.037),(.021,.077,.042),(.010,.081,.041)],[.0125,.0115,.010,.0085,.007])
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=palm;bpy.ops.object.join();o=bpy.context.object
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Continuous glove surface','REMESH');mod.mode='VOXEL';mod.voxel_size=.00065;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Soft leather transitions','SMOOTH');mod.factor=.38;mod.iterations=4;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Preserve rounded finger silhouettes','DECIMATE');mod.ratio=.075;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Smooth rounded glove surface','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Final runtime surface','DECIMATE');mod.ratio=.28;bpy.ops.object.modifier_apply(modifier=mod.name)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
 for poly in o.data.polygons:poly.use_smooth=True
 o.data.update();o.name='Natural glove v050 '+side
 result[side]={'positions':[list(v.co) for v in o.data.vertices],'normals':[list(v.normal) for v in o.data.vertices],'triangles':[list(p.vertices) for p in o.data.polygons]}
 # A compact plate above the knuckles, leaving the entire finger row visible.
 outline=[(-.020,.004,-.018),(.020,.004,-.018),(.027,.030,-.028),(.021,.049,-.030),(-.020,.045,-.030),(-.026,.025,-.026)]
 vv=[point(p) for p in outline]+[point((0,.026,-.033))];ff=[(i,(i+1)%6,6) for i in range(6)]
 me=bpy.data.meshes.new('Compact dorsal plate');me.from_pydata(vv,[],ff);me.update();plate=bpy.data.objects.new('Compact dorsal plate '+side,me);bpy.context.collection.objects.link(plate)
 bpy.ops.object.select_all(action='DESELECT');plate.select_set(True);bpy.context.view_layer.objects.active=plate
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 desired=Vector((1 if side=='R' else -1,0,0))
 if me.polygons[0].normal.dot(desired)<0:
  bm=bmesh.new();bm.from_mesh(me);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 mod=plate.modifiers.new('Shaped plate','SUBSURF');mod.levels=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=plate.modifiers.new('Plate edge','SOLIDIFY');mod.thickness=.0014;bpy.ops.object.modifier_apply(modifier=mod.name)
 bm=bmesh.new();bm.from_mesh(plate.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(plate.data);bm.free()
 for p in plate.data.polygons:p.use_smooth=True
 plate.data.update()
 result[side]['plate']={'positions':[list(v.co) for v in plate.data.vertices],'normals':[list(v.normal) for v in plate.data.vertices],'triangles':[list(p.vertices) for p in plate.data.polygons]}
(ROOT/'tools/character-builds/hands-v050.json').write_text(json.dumps(result,separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'tools/character-builds/hands-v050.blend'))
print('SCULPTED_HANDS_V050',[(s,len(h['positions'])) for s,h in result.items()])
