"""Versioned hands and compact hand plates. Preserve every original vertex buffer and all other triangles."""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
src=ROOT/'assets/oathguard-natural-v039.glb';b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=bytearray(b[28+n:])
hands=json.loads((ROOT/'tools/character-builds/hands-v050.json').read_text())
def read(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size=struct.calcsize(fmt)*k
 return [struct.unpack_from('<'+fmt*k,data,v.get('byteOffset',0)+a.get('byteOffset',0)+j*v.get('byteStride',size)) for j in range(a['count'])]
def accessor(values,kind,fmt,ctype):
 while len(data)%4:data.append(0)
 off=len(data);flat=[v for row in values for v in row];data.extend(struct.pack('<'+fmt*len(flat),*flat));view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(data)-off})
 a={'bufferView':view,'componentType':ctype,'count':len(values),'type':kind}
 if kind=='VEC3':a.update(min=[min(v[k] for v in values) for k in range(3)],max=[max(v[k] for v in values) for k in range(3)])
 i=len(g['accessors']);g['accessors'].append(a);return i
old=next(i for i,m in enumerate(g['materials']) if m['name']=='V11 glove leather')
steel=next(i for i,m in enumerate(g['materials']) if m['name']=='V4 tempered steel')
joints=g['skins'][0]['joints'];inverse=read(g['skins'][0]['inverseBindMatrices']);his={s:next(i for i,j in enumerate(joints) if g['nodes'][j]['name']=='hand_'+s) for s in ['L','R']}
removed={s:0 for s in his}
for m in g['meshes']:
 m['primitives']=[p for p in m['primitives'] if p['material']!=old]
 for p in m['primitives']:
  if p['material']!=steel or 'JOINTS_0' not in p['attributes']:continue
  pos=read(p['attributes']['POSITION']);js=read(p['attributes']['JOINTS_0']);ws=read(p['attributes']['WEIGHTS_0']);inds=[v[0] for v in read(p['indices'])]
  selected={}
  for side,hi in his.items():
   selected[side]=set()
   for i,point in enumerate(pos):
    v=[point[a]+inverse[hi][12+a] for a in range(3)]
    if js[i][0]==hi and ws[i][0]>.99 and ((v[0]>.018) if side=='R' else (v[0]<-.018)) and -.108<v[1]<.002 and -.060<v[2]<.065:selected[side].add(i)
  keep=[]
  for offset in range(0,len(inds),3):
   tri=inds[offset:offset+3];side=next((s for s in his if all(i in selected[s] for i in tri)),None)
   if side:removed[side]+=1
   else:keep.extend((i,) for i in tri)
  p['indices']=accessor(keep,'SCALAR','I',5125)
assert removed=={'L':336,'R':336},'Hand-plate selector drifted: '+str(removed)
mat=len(g['materials'])
# Reuse the loader's established glove material tag, retaining its soft leather shading.
g['materials'].append({'name':'V44 fitted glove leather','pbrMetallicRoughness':{'baseColorFactor':[.46,.37,.29,1],'metallicFactor':0,'roughnessFactor':.9}})
for side,h in hands.items():
 for name,mesh,material in [('Natural glove v050',h,mat),('Compact hand plate v050',h['plate'],steel)]:
  mi=len(g['meshes']);g['meshes'].append({'name':'Anatomical closed grip '+name+' '+side,'primitives':[{'attributes':{'POSITION':accessor(mesh['positions'],'VEC3','f',5126),'NORMAL':accessor(mesh['normals'],'VEC3','f',5126)},'indices':accessor([(v,) for tri in mesh['triangles'] for v in tri],'SCALAR','I',5125),'material':material}]})
  ni=len(g['nodes']);g['nodes'].append({'name':name+' '+side,'mesh':mi});g['nodes'][joints[his[side]]].setdefault('children',[]).append(ni)
g.setdefault('extras',{})['handBuild']={'name':'Natural gloves v050','source':src.name,'fingers':4,'opposedThumb':True,'replacedPlateTriangles':removed,'unchanged':'skeleton, weapon geometry, all armor except the two dorsal hand plates'}
g['buffers'][0]['byteLength']=len(data);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\0'*((-len(data))%4)
out=ROOT/'assets/oathguard-natural-hands-v050.glb';out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data)
print(out, 'bytes',out.stat().st_size,'hand-plate triangles replaced',removed)
