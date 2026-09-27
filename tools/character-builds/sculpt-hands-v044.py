"""Blender: sculpt fitted gloves only. Existing rig and gear are preserved by the packer."""
import bpy, bmesh, math, json
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
  bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=point(p))
  o=bpy.context.object;o.scale=(scale[2]*1.12,scale[1],scale[0]);parts.append(o);return o
 def segment(a,b,ra,rb):
  count=max(2,int((Vector(a)-Vector(b)).length/.0035))
  for k in range(count+1):
   t=k/count;r=ra+(rb-ra)*t;blob(tuple(Vector(a).lerp(Vector(b),t)),(r,r,r))
 # Palm ends behind the knuckles so the individual digits remain readable.
 verts=[];faces=[];rings=[(-.017,.026,.018,0),(.005,.028,.019,0),(.026,.034,.017,-.003),(.047,.038,.016,-.006),(.061,.035,.014,-.006),(.067,.031,.012,-.004)]
 for d,w,h,n in rings:
  for k in range(32):
   a=k*math.tau/32;verts.append(point((w*math.cos(a),d,n+h*math.sin(a))))
 for row in range(len(rings)-1):
  for k in range(32):a=row*32+k;b=row*32+(k+1)%32;faces.append((a,b,b+32,a+32))
 faces.extend([tuple(range(31,-1,-1)),tuple((len(rings)-1)*32+k for k in range(32))])
 mesh=bpy.data.meshes.new('Tapered palm');mesh.from_pydata(verts,[],faces);mesh.update();palm=bpy.data.objects.new('Fitted palm '+side,mesh);bpy.context.collection.objects.link(palm);parts.append(palm)
 for i,u in enumerate([-.030,-.010,.011,.031]):
  shortening=[-.008,.001,.003,0][i];r=[.0072,.0081,.0085,.008][i]
  path=[(u,.055+shortening,-.007),(u,.075+shortening,-.010),(u,.088+shortening,.001),(u,.088+shortening,.021),(u,.076+shortening,.031),(u,.067+shortening,.025)]
  for j in range(len(path)-1):segment(path[j],path[j+1],r*(1-.04*j),r*(.96-.04*j))
 # A fleshy thumb base and an oblique opposing thumb, separate from the index silhouette.
 blob((.027,.030,.011),(.017,.024,.017))
 thumb=[(.031,.031,.013),(.047,.047,.026),(.045,.065,.039),(.030,.078,.039),(.017,.077,.034)]
 for j in range(len(thumb)-1):segment(thumb[j],thumb[j+1],.0115-j*.0011,.0105-j*.0011)
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=palm;bpy.ops.object.join();o=bpy.context.object
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Continuous palm and finger skin','REMESH');mod.mode='VOXEL';mod.voxel_size=.0009;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Soft glove folds','SMOOTH');mod.factor=.45;mod.iterations=3;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Runtime topology','DECIMATE');mod.ratio=.24;bpy.ops.object.modifier_apply(modifier=mod.name)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
 result[side]={'positions':[list(v.co) for v in o.data.vertices],'normals':[list(v.normal) for v in o.data.vertices],'triangles':[list(p.vertices) for p in o.data.polygons]}
 for poly in o.data.polygons:poly.use_smooth=True
 o.name='Fitted glove '+side
out=ROOT/'tools/character-builds/hands-v044.json';out.write_text(json.dumps(result,separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'tools/character-builds/hands-v044.blend'))
print('SCULPTED_HANDS',[(k,len(v['positions'])) for k,v in result.items()])
