(() => {
  'use strict';
  const section=document.querySelector('.tea-about'),field=section?.querySelector('.boba-field');
  const physics=window.PinkOutTeaPhysics;
  if(!field||!physics)return;
  const elements=[...field.querySelectorAll('.boba-ball')];
  const descriptors=elements.map(element=>({x:Number(element.dataset.x)/100,y:Number(element.dataset.y)/100,size:parseFloat(element.style.getPropertyValue('--size'))||40}));
  const canvas=section.querySelector('.tea-fluid'),ctx=canvas?.getContext('2d',{alpha:true});
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView=false,state=null,bounds=null,scrollAtMeasure=0,frame=null,lastStamp=null,lastRender=null,lastLiquid=-1;
  let time=0,accumulator=0,quality=1,slowFrames=0,scale=1,gradients=[];
  const pointer={active:false,x:0,y:0,vx:0,vy:0,clientX:0,clientY:0};
  let ripples=[],lastRipple=-1,lastInteraction=-1;
  const canRun=()=>inView&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('motion-paused');
  function measure(){
    bounds=field.getBoundingClientRect();scrollAtMeasure=window.scrollY;
    if(bounds.width<1||bounds.height<1)return;
    state=physics.create(descriptors,bounds.width,bounds.height,window.innerWidth<=650);
    if(ctx){
      scale=Math.min(1,1200/bounds.width,1200/bounds.height,Math.sqrt(550000/(bounds.width*bounds.height)));
      canvas.width=Math.max(1,Math.floor(bounds.width*scale));canvas.height=Math.max(1,Math.floor(bounds.height*scale));
      ctx.setTransform(scale,0,0,scale,0,0);
      gradients=[['#febebc30','#f1ebe212'],['#febebc88','#f17dbd55'],['#f8f4eeb0','#f1ebe24d']].map(colors=>{
        const gradient=ctx.createLinearGradient(0,0,bounds.width*.3,bounds.height);
        gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);return gradient;
      });
      section.classList.add('fluid-ready');
      drawLiquid();
    }
    paintPearls();
  }
  function rippleHeight(x,y){
    let shift=0;
    for(const wave of ripples){
      const age=time-wave.time,d=Math.hypot(x-wave.x,y-wave.y),front=age*110;
      shift+=Math.exp(-(((d-front)/65)**2))*Math.sin(d*.045-age*5)*(1-age/2.6)*9;
    }
    return shift;
  }
  function curve(layer,u,lower=false){
    const h=state.height,x=u*state.width;
    const amplitude=Math.min(65,h*.06);
    const flow=physics.current(time,u,layer*.3);
    const base=[.16,.62,.73][layer];
    const y=h*base+Math.sin(u*5.1+time*.14+layer*1.7)*amplitude
      +Math.cos(u*9.3-time*.093+layer*.8)*amplitude*.42+flow.y*1.4;
    return {x,y:y+rippleHeight(x,y)+(lower?Math.min(110,h*.13)+Math.sin(u*6.7-time*.117)*amplitude*.28:0)};
  }
  function trace(points,connect=false){
    if(connect)ctx.lineTo(points[0].x,points[0].y);else ctx.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++){
      const p=points[i-1],q=points[i];
      ctx.quadraticCurveTo(p.x,p.y,(p.x+q.x)/2,(p.y+q.y)/2);
    }
    const last=points[points.length-1];ctx.lineTo(last.x,last.y);
  }
  function drawLiquid(){
    if(!ctx||!state)return;
    ctx.clearRect(0,0,state.width,state.height);
    for(let layer=0;layer<3;layer++){
      const points=[];for(let i=0;i<=16;i++)points.push(curve(layer,i/16));
      ctx.beginPath();trace(points);
      if(layer===2){
        const lower=[];for(let i=16;i>=0;i--)lower.push(curve(layer,i/16,true));trace(lower,true);
      }else{ctx.lineTo(state.width,state.height+10);ctx.lineTo(0,state.height+10);}
      ctx.closePath();ctx.fillStyle=gradients[layer];ctx.fill();
      // Thin milk highlights suggest a soft surface rather than a hard wave edge.
      ctx.beginPath();trace(points);ctx.strokeStyle=layer===2?'#f8f4ee80':'#f8f4ee35';ctx.lineWidth=1.5;ctx.stroke();
    }
    for(const wave of ripples){
      const age=time-wave.time,r=age*110;
      if(r<2)continue;
      ctx.beginPath();ctx.ellipse(wave.x,wave.y,r,r*.46,-.12,0,Math.PI*2);
      ctx.strokeStyle=`rgba(248,244,238,${((1-age/2.6)*.16).toFixed(3)})`;ctx.lineWidth=1.2;ctx.stroke();
    }
  }
  function paintPearls(){
    if(!state)return;
    state.balls.forEach((ball,i)=>{
      elements[i].style.transform=`translate3d(${(ball.x-ball.baseX).toFixed(2)}px,${(ball.y-ball.baseY).toFixed(2)}px,0) rotate(${ball.angle.toFixed(2)}rad)`;
    });
  }
  function animate(stamp){
    frame=null;
    if(!canRun())return;
    if(!state)measure();
    if(!state)return;
    if(lastStamp===null){lastStamp=stamp;lastRender=stamp;frame=requestAnimationFrame(animate);return;}
    const interval=(fine.matches&&quality===1?1000/60:1000/30);
    if(stamp-lastRender<interval-1){frame=requestAnimationFrame(animate);return;}
    const gap=stamp-lastStamp,dt=Math.min(.05,Math.max(0,gap/1000));
    lastStamp=stamp;lastRender=stamp;
    if(gap>48){if(++slowFrames>15)quality=.5;}else slowFrames=Math.max(0,slowFrames-1);
    if(pointer.active){
      pointer.x=pointer.clientX-bounds.left;pointer.y=pointer.clientY-bounds.top+window.scrollY-scrollAtMeasure;
      pointer.strength=Math.exp(-Math.max(0,time-lastInteraction-.35)*1.8);
      if(pointer.strength<.015)pointer.active=false;
    }
    accumulator+=dt;
    while(accumulator>=1/60){time+=1/60;physics.step(state,1/60,time,pointer,ripples);accumulator-=1/60;}
    pointer.vx*=Math.exp(-dt*4);pointer.vy*=Math.exp(-dt*4);
    ripples=ripples.filter(wave=>time-wave.time<2.6);
    paintPearls();
    if(time-lastLiquid>=1/(fine.matches?30:24)){drawLiquid();lastLiquid=time;}
    frame=requestAnimationFrame(animate);
  }
  function sync(){
    const run=canRun();section.classList.toggle('liquid-flowing',run);
    if(!run){if(frame!==null)cancelAnimationFrame(frame);frame=null;lastStamp=null;lastRender=null;pointer.active=false;return;}
    if(!state)measure();
    if(frame===null)frame=requestAnimationFrame(animate);
  }
  function addRipple(x,y){
    if(time-lastRipple<.14)return;
    lastRipple=time;ripples.push({x,y,time});if(ripples.length>4)ripples.shift();
  }
  section.addEventListener('pointerenter',event=>{
    if(event.pointerType!=='mouse'||!canRun()||!fine.matches)return;
    // Refresh origin once when entering; all animation frames use cached geometry.
    bounds=field.getBoundingClientRect();scrollAtMeasure=window.scrollY;
  });
  section.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!canRun()||!fine.matches||!bounds)return;
    if(pointer.active){pointer.vx=Math.max(-180,Math.min(180,(event.clientX-pointer.clientX)*8));pointer.vy=Math.max(-180,Math.min(180,(event.clientY-pointer.clientY)*8));}
    pointer.clientX=event.clientX;pointer.clientY=event.clientY;pointer.active=true;pointer.strength=1;lastInteraction=time;
    pointer.x=event.clientX-bounds.left;pointer.y=event.clientY-bounds.top+window.scrollY-scrollAtMeasure;
    if(Math.hypot(pointer.vx,pointer.vy)>18)addRipple(pointer.x,pointer.y);
  },{passive:true});
  section.addEventListener('pointerleave',()=>{pointer.active=false;pointer.vx=0;pointer.vy=0;});
  section.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&canRun()&&bounds)addRipple(event.clientX-bounds.left,event.clientY-bounds.top+window.scrollY-scrollAtMeasure);},{passive:true});
  window.addEventListener('resize',()=>{state=null;bounds=null;pointer.active=false;ripples=[];if(canRun())measure();},{passive:true});
  if('ResizeObserver' in window){new ResizeObserver(()=>{state=null;bounds=null;pointer.active=false;ripples=[];if(canRun())measure();}).observe(field);}
  window.addEventListener('blur',()=>{pointer.active=false;pointer.vx=0;pointer.vy=0;});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  fine.addEventListener('change',()=>{quality=1;slowFrames=0;pointer.active=false;});
  document.getElementById('motion')?.addEventListener('click',sync);
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting);sync();},{threshold:0}).observe(section);
  }else{inView=true;sync();}
})();
