(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const running=new Set();
  const links=$$('[data-reading]'),dock=$('.reading-dock');
  let queued=false,needsMeasure=true,dismissed=false,distance=1,chapters=[],lastProgress=-1,lastChapter='';
  const allowed=()=>!reduced.matches&&!document.body.classList.contains('motion-paused');
  function enter(element) {
    if(!element||element.hidden||!allowed()||typeof element.animate!=='function')return;
    const animation=element.animate([{opacity:.8},{opacity:1}],{duration:160,easing:'ease-out'});
    running.add(animation);
    animation.addEventListener('finish',()=>running.delete(animation),{once:true});
    animation.addEventListener('cancel',()=>running.delete(animation),{once:true});
  }
  function refresh(container){enter(container);schedule(true);}
  function pulse(element){enter(element);}
  function measure(){
    distance=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    chapters=links.map(link=>({id:link.dataset.reading,top:(document.getElementById(link.dataset.reading)?.getBoundingClientRect().top||0)+window.scrollY}));
    needsMeasure=false;
  }
  function update(){
    queued=false;
    if(needsMeasure)measure();
    const progress=Math.max(0,Math.min(100,window.scrollY/distance*100));
    const rounded=Math.round(progress);
    if(rounded!==lastProgress){
      lastProgress=rounded;
      $('.reading-progress').setAttribute('aria-valuenow',String(rounded));
      $('.reading-progress>span').style.transform=`scaleX(${progress/100})`;
      $('.progress').style.transform=`scaleX(${progress/100})`;
    }
    const show=window.scrollY>280&&window.scrollY<distance-120&&!dismissed&&!document.body.classList.contains('scroll-lock');
    if(dock.classList.contains('visible')!==show)dock.classList.toggle('visible',show);
    const scrolled=window.scrollY>100,header=$('.header');
    if(header.classList.contains('scrolled')!==scrolled)header.classList.toggle('scrolled',scrolled);
    let current='about';
    const marker=window.scrollY+window.innerHeight*.4;
    for(const chapter of chapters)if(chapter.top<=marker)current=chapter.id;
    if(current!==lastChapter){
      lastChapter=current;
      for(const link of links){
        const active=link.dataset.reading===current;
        link.classList.toggle('current',active);
        if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
      }
    }
  }
  function schedule(remeasure=false){
    if(remeasure===true)needsMeasure=true;
    if(!queued){queued=true;requestAnimationFrame(update);}
  }
  function sync(){
    if(!allowed())for(const animation of [...running]){try{animation.finish();}catch(_){animation.cancel();}}
    schedule();
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(!entry.isIntersecting)continue;enter(entry.target);observer.unobserve(entry.target);}
    },{threshold:.15});
    // Short text-only fades: large photos and full-page panels stay static.
    $$('.journal-kicker,.section-head,.contents-title').forEach(element=>observer.observe(element));
  }
  $('#close-reading').addEventListener('click',()=>{
    dismissed=true;dock.classList.remove('visible');
    const current=links.find(link=>link.classList.contains('current'));
    const heading=document.getElementById(current?.dataset.reading||'about')?.querySelector('h2');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  });
  window.addEventListener('scroll',()=>schedule(),{passive:true});
  window.addEventListener('resize',()=>schedule(true),{passive:true});
  window.addEventListener('load',()=>schedule(true),{once:true});
  document.addEventListener('load',event=>{if(event.target.tagName==='IMG')schedule(true);},true);
  document.fonts?.ready.then(()=>schedule(true));
  reduced.addEventListener('change',sync);
  $('#lightbox').addEventListener('close',()=>schedule(true));
  window.PinkOutMotion={enter,refresh,pulse,sync,schedule};
  update();
})();
