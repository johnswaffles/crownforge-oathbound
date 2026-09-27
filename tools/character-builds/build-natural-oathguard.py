"""Create a separate proportioned rig; preserve all prior GLBs."""
import json,struct,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
src=ROOT/'assets/oathguard-layered-shoulders-v038.glb'
b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=bytearray(b[28+n:])
def read(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];f={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];step=v.get('byteStride',struct.calcsize(f)*k);off=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [list(struct.unpack_from('<'+f*k,data,off+j*step)) for j in range(a['count'])]
def write(i,values):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];k=len(values[0]);off=v.get('byteOffset',0)+a.get('byteOffset',0);step=v.get('byteStride',k*4)
 for j,row in enumerate(values):struct.pack_into('<'+'f'*k,data,off+j*step,*row)
 if a['type']=='VEC3':a['min']=[min(v[k] for v in values) for k in range(3)];a['max']=[max(v[k] for v in values) for k in range(3)]
def height(y):
 if y<=.13:return y
 if y<=.98:return .13+(y-.13)*1.18
 return 1.133+(y-.98)*1.06
parents={c:i for i,node in enumerate(g['nodes']) for c in node.get('children',[])}
def world(i):
 p=g['nodes'][i].get('translation',[0,0,0]);par=parents.get(i)
 return [a+b for a,b in zip(p,world(par))] if par is not None else p[:]
old={i:world(i) for i in range(len(g['nodes']))}
joints=g['skins'][0]['joints'];new={}
for i,p in old.items():
 new[i]=[p[0]*.95,height(p[1]),p[2]]
for i in joints:
 parent=parents.get(i);base=new[parent] if parent is not None else [0,0,0]
 g['nodes'][i]['translation']=[a-b for a,b in zip(new[i],base)]
ib=g['skins'][0]['inverseBindMatrices'];matrices=read(ib)
for k,i in enumerate(joints):
 for axis in range(3):matrices[k][12+axis]=-new[i][axis]
write(ib,matrices)
seen=set()
for prim in g['meshes'][0]['primitives']:
 attrs=prim['attributes'];idx=attrs['POSITION']
 if idx in seen:continue
 seen.add(idx);positions=read(idx);normals=read(attrs['NORMAL']);js=read(attrs['JOINTS_0']);ws=read(attrs['WEIGHTS_0'])
 for k,p in enumerate(positions):
  dominant=joints[js[k][max(range(4),key=lambda t:ws[k][t])]];name=g['nodes'][dominant]['name'];base=old[dominant];target=new[dominant]
  if name=='head':scale=[.87,.90,.90];p[:]=[target[a]+(p[a]-base[a])*scale[a] for a in range(3)]
  elif name.startswith('hand_'):
   scale=[1,1,1];p[:]=[target[a]+p[a]-base[a] for a in range(3)]
  else:
   y=p[1];waist=math.exp(-((y-1.12)/.22)**2);sx=.95-.09*waist;sy=1 if y<=.13 else 1.18 if y<=.98 else 1.06;scale=[sx,sy,1-.07*waist];p[:]=[p[0]*sx,height(y),p[2]*scale[2]]
  normal=[normals[k][a]/scale[a] for a in range(3)];length=math.sqrt(sum(x*x for x in normal)) or 1;normals[k]=[x/length for x in normal]
 write(idx,positions);write(attrs['NORMAL'],normals)
# Shoulder shells are rigid attachments and retain their authored local dimensions.
g.setdefault('extras',{})['studioBuild']={'name':'Natural Oathguard v039','legLength':.5015,'source':src.name}
g['buffers'][0]['byteLength']=len(data);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\0'*((-len(data))%4)
out=ROOT/'assets/oathguard-natural-v039.glb';out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data);print(out)
