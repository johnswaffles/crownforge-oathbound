import * as T from '../vendor/three.module.js';
// Cache the actual rendered path/stone triangles in a small spatial grid.
// Terrain remains the fallback; decoration above the ground is deliberately excluded.
export function buildWalkSurface(meshes,terrainHeight,cellSize=.5){
 const grid=new Map(),matrix=new T.Matrix4(),instance=new T.Matrix4(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(const mesh of meshes){
  const position=mesh.geometry.attributes.position,index=mesh.geometry.index,count=index?index.count:position.count;
  for(let item=0;item<(mesh.isInstancedMesh?mesh.count:1);item++){
   if(mesh.isInstancedMesh){mesh.getMatrixAt(item,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);}else matrix.copy(mesh.matrixWorld);
   for(let i=0;i<count;i+=3){
    a.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(matrix);
    b.fromBufferAttribute(position,index?index.getX(i+1):i+1).applyMatrix4(matrix);
    c.fromBufferAttribute(position,index?index.getX(i+2):i+2).applyMatrix4(matrix);
    const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
    if(Math.abs(den)<1e-9)continue;
    const tri=[a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,den];
    for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cellSize);x<=Math.floor(Math.max(a.x,b.x,c.x)/cellSize);x++)
     for(let z=Math.floor(Math.min(a.z,b.z,c.z)/cellSize);z<=Math.floor(Math.max(a.z,b.z,c.z)/cellSize);z++){
      const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(tri);
     }
   }
  }
 }
 return (x,z)=>{
  let y=terrainHeight(x,z);
  for(const t of grid.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||[]){
   const u=((t[5]-t[8])*(x-t[6])+(t[6]-t[3])*(z-t[8]))/t[9];
   const v=((t[8]-t[2])*(x-t[6])+(t[0]-t[6])*(z-t[8]))/t[9],w=1-u-v;
   if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7)y=Math.max(y,u*t[1]+v*t[4]+w*t[7]);
  }
  return y;
 };
}
