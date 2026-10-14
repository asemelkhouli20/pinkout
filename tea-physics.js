(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function current(t,u,v){
    return {
      x:Math.sin(t*.173+v*4.7)*12+Math.cos(t*.097+u*5.3-v*2)*8,
      y:Math.cos(t*.137+u*4.3)*7+Math.sin(t*.211-v*3.1+u)*4
    };
  }
  function create(descriptors,width,height,mobile){
    return {width,height,balls:descriptors.map((d,i)=>{
      const r=d.size*(mobile?.72:1)/2;
      const baseX=d.x*width,baseY=d.y*height;
      const x=clamp(baseX,r+4,width-r-4),y=clamp(baseY,r+4,height-r-4);
      return {x,y,homeX:x,homeY:y,baseX,baseY,r,mass:r*r,vx:Math.sin(i*2.4)*3,vy:Math.cos(i*1.7)*2,angle:0,spin:0,phase:i*2.39996};
    })};
  }
  function step(state,dt,time,pointer,ripples=[]){
    dt=clamp(dt,0,1/30);
    const {width,height,balls}=state;
    for(const b of balls){
      const flow=current(time,b.x/width,b.y/height);
      // Water drag carries each pearl; a soft equilibrium models buoyancy.
      let ax=(flow.x-b.vx)*.85+(b.homeX-b.x)*.075;
      const buoyancy=b.homeY+Math.sin(time*.47+b.phase)*5;
      let ay=(flow.y-b.vy)*.85+(buoyancy-b.y)*.14;
      if(pointer?.active){
        const dx=b.x-pointer.x,dy=b.y-pointer.y,d=Math.hypot(dx,dy),reach=150+b.r;
        if(d<reach){
          const influence=pointer.strength??1,force=(1-d/reach)**2*65*influence,normal=d||1;
          ax+=(d?dx/normal:1)*force+pointer.vx*.05*(1-d/reach)*influence;
          ay+=(d?dy/normal:0)*force+pointer.vy*.05*(1-d/reach)*influence;
        }
      }
      for(const wave of ripples){
        const age=time-wave.time;
        if(age<0||age>2.6)continue;
        const dx=b.x-wave.x,dy=b.y-wave.y,d=Math.hypot(dx,dy),front=age*110;
        const envelope=Math.exp(-(((d-front)/42)**2))*(1-age/2.6);
        if(d>1){ax+=dx/d*envelope*8;ay+=dy/d*envelope*8;}
      }
      // Soft limits keep decoration in its quiet background lanes.
      const limitX=Math.min(70,width*.13),limitY=Math.min(42,height*.045);
      const offX=b.x-b.homeX,offY=b.y-b.homeY;
      if(Math.abs(offX)>limitX)ax-=Math.sign(offX)*(Math.abs(offX)-limitX)*1.1;
      if(Math.abs(offY)>limitY)ay-=Math.sign(offY)*(Math.abs(offY)-limitY)*1.4;
      b.vx=clamp(b.vx+ax*dt,-36,36);b.vy=clamp(b.vy+ay*dt,-25,25);
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      b.spin+=((flow.x*.006+b.vy*.012)-b.spin)*dt*.8;
      b.angle+=b.spin*dt;
    }
    // Low restitution and mass-weighted separation avoid hard, rubbery bounces.
    for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
      const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y;
      const min=a.r+b.r+2,d2=dx*dx+dy*dy;
      if(d2>=min*min)continue;
      const d=Math.sqrt(d2),nx=d?dx/d:1,ny=d?dy/d:0;
      const wa=b.mass/(a.mass+b.mass),wb=1-wa;
      const correction=Math.min((min-d)*.18,1.2);
      a.x-=nx*correction*wa;a.y-=ny*correction*wa;
      b.x+=nx*correction*wb;b.y+=ny*correction*wb;
      const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(closing<0){
        const impulse=-closing*1.18;
        a.vx-=impulse*nx*wa;a.vy-=impulse*ny*wa;
        b.vx+=impulse*nx*wb;b.vy+=impulse*ny*wb;
        a.spin+=ny*.025;b.spin-=ny*.025;
      }
    }
    for(const b of balls){
      b.vx=clamp(b.vx,-36,36);b.vy=clamp(b.vy,-25,25);b.spin=clamp(b.spin,-.18,.18);
      const left=b.r+3,right=width-b.r-3,top=b.r+3,bottom=height-b.r-3;
      if(b.x<left){b.x=left;b.vx=Math.abs(b.vx)*.2;}else if(b.x>right){b.x=right;b.vx=-Math.abs(b.vx)*.2;}
      if(b.y<top){b.y=top;b.vy=Math.abs(b.vy)*.2;}else if(b.y>bottom){b.y=bottom;b.vy=-Math.abs(b.vy)*.2;}
    }
  }
  window.PinkOutTeaPhysics={create,step,current};
})();
