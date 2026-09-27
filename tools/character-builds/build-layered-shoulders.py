import json,struct,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
b=(ROOT/'assets/oathguard-v022.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=b[28+n:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];f={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size=struct.calcsize(f)*k;off=v.get('byteOffset',0)+a.get('byteOffset',0);return [struct.unpack_from('<'+f*k,data,off+j*v.get('byteStride',size)) for j in range(a['count'])]
original=data
data=bytearray(data)
removed_count=0
def append_accessor(values,kind,fmt,ctype):
 while len(data)%4:data.append(0)
 offset=len(data);flat=[v for row in values for v in row];data.extend(struct.pack('<'+fmt*len(flat),*flat));view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data)-offset});a={'bufferView':view,'componentType':ctype,'count':len(values),'type':kind}
 if kind=='VEC3':a.update(min=[min(v[k] for v in values) for k in range(3)],max=[max(v[k] for v in values) for k in range(3)])
 idx=len(g['accessors']);g['accessors'].append(a);return idx
for p in g['meshes'][0]['primitives']:
 if p['material'] not in [2,3,5]:continue
 pos=acc(p['attributes']['POSITION']);ids=[x[0] for x in acc(p['indices'])];parents=list(range(len(pos)));seen={}
 def root(i):
  while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
  return i
 def join(a,b):parents[root(a)]=root(b)
 for i,v in enumerate(pos):
  key=tuple(round(x,5) for x in v)
  if key in seen:join(i,seen[key])
  else:seen[key]=i
 for i in range(0,len(ids),3):join(ids[i],ids[i+1]);join(ids[i],ids[i+2])
 groups={}
 for i in set(ids):groups.setdefault(root(i),[]).append(i)
 removed=set()
 for verts in groups.values():
  mn=[min(pos[i][k] for i in verts) for k in range(3)];mx=[max(pos[i][k] for i in verts) for k in range(3)];c=[(a+b)/2 for a,b in zip(mn,mx)]
  if abs(c[0])>.3 and 1.44<c[1]<1.63 and max(abs(mn[2]),abs(mx[2]))<.18:removed.update(verts)

 kept=[]
 for i in range(0,len(ids),3):
  tri=ids[i:i+3]
  if any(v in removed for v in tri):removed_count+=1
  else:kept.extend((v,) for v in tri)
 p['indices']=append_accessor(kept,'SCALAR','I',5125)

def geometry(vertices,triangles,material):
 normals=[[0.,0.,0.] for _ in vertices]
 for a,b,c in triangles:
  u=[vertices[b][k]-vertices[a][k] for k in range(3)];v=[vertices[c][k]-vertices[a][k] for k in range(3)];n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
  for i in [a,b,c]:
   for k in range(3):normals[i][k]+=n[k]
 for n in normals:
  d=math.sqrt(sum(x*x for x in n)) or 1
  for k in range(3):n[k]/=d
 return {'attributes':{'POSITION':append_accessor(vertices,'VEC3','f',5126),'NORMAL':append_accessor(normals,'VEC3','f',5126)},'indices':append_accessor([(i,) for t in triangles for i in t],'SCALAR','I',5125),'material':material}

def shell(side,layer,start=0,end=1,trim=False):
 verts=[];tris=[];cols=32;rows=8 if not trim else 2
 for inner in [False,True]:
  for row in range(rows+1):
   v=start+(end-start)*row/rows
   for col in range(cols+1):
    theta=-math.pi*.56+math.pi*1.12*col/cols
    rx=.155-layer*.018-(.006 if inner else 0);rz=.155-layer*.013-(.006 if inner else 0)
    x=side*(.014+rx*math.cos(theta)*(1-.12*v))
    y=.025-layer*.069-v*.105+.008*math.cos(theta)+(0.002 if trim else 0)
    z=rz*math.sin(theta)
    verts.append((x,y,z))
 stride=cols+1;count=(rows+1)*stride
 def quad(a,b,c,d,reverse=False):
  if (side<0)^reverse:tris.extend([(a,c,b),(a,d,c)])
  else:tris.extend([(a,b,c),(a,c,d)])
 for row in range(rows):
  for col in range(cols):
   a=row*stride+col;quad(a,a+1,a+stride+1,a+stride)
   a+=count;quad(a,a+1,a+stride+1,a+stride,True)
 for col in range(cols):
  quad(col,col+count,col+count+1,col+1)
  a=rows*stride+col;quad(a,a+1,a+count+1,a+count)
 for row in range(rows):
  a=row*stride;quad(a,a+stride,a+stride+count,a+count)
  a=row*stride+cols;quad(a,a+count,a+stride+count,a+stride)
 return geometry(verts,tris,3 if trim else 2)

for side,joint in [(-1,7),(1,10)]:
 primitives=[]
 for layer in range(4):
  primitives.append(shell(side,layer));primitives.append(shell(side,layer,.88,1,True))
 # Small domed crown bridges the upper shoulder and first overlapping plate.
 verts=[];tris=[];rows=10;cols=40
 for j in range(rows+1):
  phi=(math.pi*.52)*j/rows
  for i in range(cols+1):
   theta=2*math.pi*i/cols;verts.append((.173*math.sin(phi)*math.cos(theta),.017+.074*math.cos(phi),.160*math.sin(phi)*math.sin(theta)))
 for j in range(rows):
  for i in range(cols):
   a=j*(cols+1)+i;tris.extend([(a,a+1,a+cols+1),(a+1,a+cols+2,a+cols+1)])
 primitives.append(geometry(verts,tris,2))
 mi=len(g['meshes']);g['meshes'].append({'name':'Layered articulated steel pauldrons '+str(side),'primitives':primitives})
 ni=len(g['nodes']);g['nodes'].append({'name':'Concept layered shoulder '+('L' if side<0 else 'R'),'mesh':mi});g['nodes'][joint].setdefault('children',[]).append(ni)
g['buffers'][0]['byteLength']=len(data)
js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\x00'*((-len(data))%4)
result=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data
out=ROOT/'assets/oathguard-layered-shoulders-v038.glb';out.write_bytes(result)
print('Wrote',out,'; replaced shoulder triangles:',removed_count)
