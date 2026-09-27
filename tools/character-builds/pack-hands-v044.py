"""Replace glove skin only; keep all original armor, gear, skinning and proportions."""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
src=ROOT/'assets/oathguard-natural-v039.glb';b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=bytearray(b[28+n:])
hands=json.loads((ROOT/'tools/character-builds/hands-v044.json').read_text())
def accessor(values,kind,fmt,ctype):
 while len(data)%4:data.append(0)
 off=len(data);flat=[v for row in values for v in row];data.extend(struct.pack('<'+fmt*len(flat),*flat));view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(data)-off})
 a={'bufferView':view,'componentType':ctype,'count':len(values),'type':kind}
 if kind=='VEC3':a.update(min=[min(v[k] for v in values) for k in range(3)],max=[max(v[k] for v in values) for k in range(3)])
 i=len(g['accessors']);g['accessors'].append(a);return i
old=next(i for i,m in enumerate(g['materials']) if m['name']=='V11 glove leather')
for m in g['meshes']:m['primitives']=[p for p in m['primitives'] if p['material']!=old]
mat=len(g['materials']);g['materials'].append({'name':'V44 fitted glove leather','pbrMetallicRoughness':{'baseColorFactor':[.46,.37,.29,1],'metallicFactor':0,'roughnessFactor':.9}})
for side,h in hands.items():
 mi=len(g['meshes']);g['meshes'].append({'name':'Anatomical closed grip '+side,'primitives':[{'attributes':{'POSITION':accessor(h['positions'],'VEC3','f',5126),'NORMAL':accessor(h['normals'],'VEC3','f',5126)},'indices':accessor([(v,) for tri in h['triangles'] for v in tri],'SCALAR','I',5125),'material':mat}]})
 ni=len(g['nodes']);g['nodes'].append({'name':'Fitted glove '+side,'mesh':mi});joint=next(i for i,node in enumerate(g['nodes']) if node.get('name')=='hand_'+side);g['nodes'][joint].setdefault('children',[]).append(ni)
g.setdefault('extras',{})['handBuild']={'name':'Fitted natural grip v044','source':src.name,'separateFingers':4,'opposedThumb':True}
g['buffers'][0]['byteLength']=len(data);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\0'*((-len(data))%4)
out=ROOT/'assets/oathguard-natural-hands-v044.glb';out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data);print(out)
