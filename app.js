(() => {
  'use strict';
  const {copy, worlds, gallery} = window.PINKOUT;
  const imageDirectory = window.PINKOUT.imageDirectory || 'assets/';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  let locale = 'ar', selectedWorld = 'passage', selectedMood = 'create', selectedFilter = 'all';
  let lightboxIndex = 0, returnFocus = null, motionPaused = false;
  const saved = new Set();
  const iconPaths = {"arrow-up-right": "M6 18 18 6M6 6h12v12", "arrow-right": "M4 12h16M13 5l7 7-7 7", "arrow-left": "M20 12H4m7-7-7 7 7 7", "arrow-up": "M12 20V4M5 11l7-7 7 7", "arrow-down": "M12 4v16m-7-7 7 7 7-7", "close": "M6 6l12 12M18 6 6 18", "plus": "M12 5v14M5 12h14", "pause": "M9 5v14M15 5v14", "play": "m8 5 11 7-11 7Z", "menu": "M4 7h16M4 17h16", "heart": "M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"};
  const icon = name => `<svg class="icon icon--${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"/></svg>`;
  const heartIcon = () => icon('heart');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tr = key => copy[key]?.[locale] || key;
  const announce = text => { $('#announcement').textContent = text; };
  function applyTranslations() {
    $$('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); });
    $$('[data-alt]').forEach(el => { el.alt = tr(el.dataset.alt); });
    $$('[data-label]').forEach(el => { el.setAttribute('aria-label', tr(el.dataset.label)); });
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.title = tr('seo.title');
    $('meta[name="description"]').content = tr('seo.description');
    $('meta[property="og:title"]').content = tr('seo.shareTitle');
    $('meta[property="og:description"]').content = tr('seo.shareDescription');
    $('#language').textContent = locale === 'ar' ? 'EN' : 'عربي';
    $('#language').lang = locale === 'ar' ? 'en' : 'ar';
    $('#language').setAttribute('aria-label', locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    $$('legend').forEach(el => { el.textContent = tr(el.closest('[data-form]').dataset.form === 'waitlist' ? 'ui.waitTitle' : 'ui.draft'); });
    $('#motion').setAttribute('aria-label', tr(motionPaused || reduced.matches ? 'ui.resume' : 'ui.motion'));
    setWorld(selectedWorld, false);
    renderRoute(false);
    renderHighlights();
    renderCollection();
    updateDirectionalControls();
    if ($('#lightbox').open) renderLightbox();
    window.PinkOutMotion?.schedule(true);
  }
  try { if (localStorage.getItem('pinkout.language') === 'en') locale = 'en'; } catch (_) {}
  $('#language').addEventListener('click', () => {
    locale = locale === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('pinkout.language', locale); } catch (_) {}
    applyTranslations();
  });
  const menu = $('#menu'), navigation = $('#navigation');
  if (menu && navigation) {
    function closeMenu(restore = false) {
      navigation.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.dataset.label = 'nav.menuOpen';
      menu.setAttribute('aria-label', tr('nav.menuOpen'));
      if (restore) menu.focus();
    }
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.dataset.label = open ? 'nav.menuClose' : 'nav.menuOpen';
      menu.setAttribute('aria-label', tr(menu.dataset.label));
      navigation.classList.toggle('open', open);
      if (open) navigation.querySelector('a')?.focus();
    });
    $$('#navigation a').forEach(el => el.addEventListener('click', () => closeMenu()));
    document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
    document.addEventListener('focusin', e => { if (!e.target.closest('.header')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && navigation.classList.contains('open')) closeMenu(true); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); }, {passive:true});
  }
  function setWorld(key, animate = true) {
    selectedWorld = key;
    const world = worlds.find(w => w.key === key);
    $$('.world-button').forEach(el => {
      const active = el.dataset.world === key;
      el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active));
    });
    const image = $('.world-picture');
    image.src = `${imageDirectory}${world.image}.webp`;
    const meta = window.PINKOUT.imageMeta[world.image];
    image.srcset = `${imageDirectory}${world.image}-small.webp ${meta.smallWidth}w, ${imageDirectory}${world.image}.webp ${meta.width}w`;
    image.style.objectPosition = meta.focus;
    image.alt = tr(`image.${world.image}`);
    image.dataset.alt = `image.${world.image}`;
    $('#world-name').textContent = world.name;
    $('.world-heading').textContent = tr(`inside.${key}.heading`);
    $('.world-heading').setAttribute('data-i18n', `inside.${key}.heading`);
    $('.world-description').textContent = tr(`world.${key}`);
    $('.world-description').setAttribute('data-i18n', `world.${key}`);
    $('#world-detail').href = `#inside-${key}`;
    $('#save-world').setAttribute('aria-pressed', String(saved.has(key)));
    $('#save-world').setAttribute('aria-label', tr(saved.has(key) ? 'ui.saved' : 'ui.save'));
    $('#save-world').innerHTML = heartIcon();
    $('#world-position').textContent = `${String(worlds.indexOf(world)+1).padStart(2,'0')} / 07`;
    $('#world-tags').replaceChildren(...tr(`inside.${key}.highlights`).split(' · ').slice(0,3).map(label => { const chip=document.createElement('span');chip.textContent=label;return chip; }));
    if (animate) {
      window.PinkOutMotion?.enter($('.world-panel-copy'),'copy');
      window.PinkOutMotion?.enter($('.world-picture'),'photo');
      window.PinkOutMotion?.schedule(true);
    }

  }
  function stepWorld(delta) {
    const index = worlds.findIndex(w => w.key === selectedWorld);
    const key = worlds[(index + delta + worlds.length) % worlds.length].key;
    setWorld(key);
    const selected = document.querySelector(`[data-world="${key}"]`);
    selected.focus({preventScroll:true});
    selected.scrollIntoView({behavior:reduced.matches||motionPaused?'auto':'smooth',block:'nearest',inline:'center'});
  }
  $('#world-prev').addEventListener('click', () => stepWorld(-1));
  $('#world-next').addEventListener('click', () => stepWorld(1));
  $$('.world-button').forEach(el => el.addEventListener('click', () => setWorld(el.dataset.world)));
  $('.world-list').addEventListener('keydown', e => {
    const buttons = $$('.world-button'); const index = buttons.indexOf(document.activeElement);
    if (index < 0 || !['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    let next = index;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else { const forward = e.key === 'ArrowDown' || e.key === (locale === 'ar' ? 'ArrowLeft' : 'ArrowRight'); next = (index + (forward ? 1 : -1) + buttons.length) % buttons.length; }
    buttons[next].focus(); buttons[next].click();
  });
  $('#save-world').addEventListener('click', e => {
    saved.has(selectedWorld) ? saved.delete(selectedWorld) : saved.add(selectedWorld);
    $('#saved-count').textContent = String(saved.size);
    renderCollection();
    setWorld(selectedWorld, false);
    announce(`${saved.size} ${tr('ui.count')}`);
    window.PinkOutMotion?.pulse($('#save-world'));
    window.PinkOutMotion?.pulse($('#saved-count'));
    window.PinkOutMotion?.refresh($('#collection-cards'));
  });
  $$('.filters button').forEach(el => el.addEventListener('click', () => {
    selectedFilter = el.dataset.filter;
    $('.program-grid').classList.toggle('filtered', selectedFilter !== 'all');
    $$('.filters button').forEach(btn => { const active = btn === el; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
    $$('.program-card').forEach(card => { card.hidden = selectedFilter !== 'all' && card.dataset.category !== selectedFilter; });
    const count = $$('.program-card:not([hidden])').length;
    $('#filter-count').textContent = String(count);
    announce(`${count} ${tr('general.exampleLabel')}`);
    window.PinkOutMotion?.refresh($('.program-grid'));
  }));
  function renderHighlights() {
    $$('[data-highlights]').forEach(el => {
      el.replaceChildren(...tr(el.dataset.highlights).split(' · ').map((label,index) => {
        const chip=document.createElement('span'); chip.textContent=label; return chip;
      }));
    });
  }
  function updateDirectionalControls() {
    $('#world-prev').innerHTML = icon(locale === 'ar' ? 'arrow-right' : 'arrow-left');
    $('#world-next').innerHTML = icon(locale === 'ar' ? 'arrow-left' : 'arrow-right');
    $('#lightbox-prev').innerHTML = icon(locale === 'ar' ? 'arrow-right' : 'arrow-left');
    $('#lightbox-next').innerHTML = icon(locale === 'ar' ? 'arrow-left' : 'arrow-right');
    $('#gallery-back').innerHTML = icon(locale === 'ar' ? 'arrow-right' : 'arrow-left');
    $('#gallery-forward').innerHTML = icon(locale === 'ar' ? 'arrow-left' : 'arrow-right');
  }
  function renderCollection() {
    const container = $('#collection-cards');container.replaceChildren();
    $('#collection-empty').hidden = saved.size > 0;
    $('#clear-collection').disabled = saved.size === 0;
    worlds.filter(w => saved.has(w.key)).forEach(w => {
      const button=document.createElement('button');button.type='button';button.className='collection-card';
      button.setAttribute('aria-label',`${w.name} — ${tr(`inside.${w.key}.heading`)}`);
      const image=document.createElement('img');image.src=`${imageDirectory}${w.image}-small.webp`;image.alt=tr(`image.${w.image}`);image.loading='lazy';image.width=650;image.height=365;image.style.objectPosition=window.PINKOUT.imageMeta[w.image].focus;image.style.objectPosition=window.PINKOUT.imageMeta[w.image].focus;
      const label=document.createElement('span'); const name=document.createElement('bdi');name.textContent=w.name;
      const heart=document.createElement('span');heart.innerHTML=heartIcon();label.append(name,heart);
      button.append(image,label);container.append(button);
      button.addEventListener('click',() => {
        setWorld(w.key);
        document.querySelector(`[data-world="${w.key}"]`).focus({preventScroll:true});
        $('#world-panel').scrollIntoView({behavior:reduced.matches || motionPaused ? 'auto' : 'smooth',block:'center'});
      });
    });
  }
  $('#open-collection').addEventListener('click', () => {
    const open=$('#collection-panel').hidden;
    $('#collection-panel').hidden=!open;
    $('#open-collection').setAttribute('aria-expanded',String(open));
    if (open) window.PinkOutMotion?.enter($('#collection-panel'),'card');
    window.PinkOutMotion?.schedule(true);
  });
  $('#clear-collection').addEventListener('click', () => {
    saved.clear();$('#saved-count').textContent='0';renderCollection();setWorld(selectedWorld,false);
    announce(`0 ${tr('ui.count')}`);
    window.PinkOutMotion?.schedule(true);
    $('#open-collection').focus();
  });
  let visibleGallery = gallery.map((_,index) => index), galleryStripIndex=0;
  function stepGalleryStrip(delta){
    if(!visibleGallery.length)return;
    const box=$('.gallery-grid').getBoundingClientRect();
    const edge=locale==='ar'?(box.right??box.left+box.width):box.left;
    let nearest=Infinity;
    visibleGallery.forEach((index,position)=>{
      const rect=document.querySelector(`[data-gallery="${index}"]`).getBoundingClientRect();
      const distance=Math.abs((locale==='ar'?(rect.right??rect.left+rect.width):rect.left)-edge);
      if(distance<nearest){nearest=distance;galleryStripIndex=position;}
    });
    galleryStripIndex=Math.max(0,Math.min(visibleGallery.length-1,galleryStripIndex+delta));
    const item=document.querySelector(`[data-gallery="${visibleGallery[galleryStripIndex]}"]`);
    item.scrollIntoView({behavior:reduced.matches||motionPaused?'auto':'smooth',block:'nearest',inline:'start'});
  }
  $('#gallery-back').addEventListener('click',()=>stepGalleryStrip(-1));
  $('#gallery-forward').addEventListener('click',()=>stepGalleryStrip(1));
  $$('[data-gallery-filter]').forEach(el => el.addEventListener('click', () => {
    const category=el.dataset.galleryFilter;
    $$('[data-gallery-filter]').forEach(button => { const active=el===button;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active)); });
    $$('.gallery-item').forEach(item => { item.hidden=category!=='all' && item.dataset.galleryCategory!==category; });
    $('.gallery-grid').classList.toggle('filtered',category!=='all');
    visibleGallery=$$('.gallery-item:not([hidden])').map(item => Number(item.dataset.gallery));
    galleryStripIndex=0;
    $('.gallery-grid').scrollLeft=0;
    $('#gallery-count').textContent=String(visibleGallery.length);
    announce(`${visibleGallery.length} ${tr('gallery.count')}`);
    window.PinkOutMotion?.refresh($('.gallery-grid'));
  }));
  const routes = {
    create:['passage','make','hub','market'], glow:['passage','beauty','hub','market'],
    move:['passage','move','hub','live'], shop:['passage','market','hub','make'], discover:['passage','hub','beauty','live']
  };
  function renderRoute(animate = true) {
    const container = $('#day-route'); container.replaceChildren();
    routes[selectedMood].forEach((key, index) => {
      const w = worlds.find(item => item.key === key); const card = document.createElement('article'); card.className = 'route-stop';
      const img = document.createElement('img'); img.src = `${imageDirectory}${w.image}-small.webp`; img.alt = tr(`image.${w.image}`); img.width = 650; img.height = 365; img.loading = 'lazy'; img.style.objectPosition = window.PINKOUT.imageMeta[w.image].focus; img.style.objectPosition = window.PINKOUT.imageMeta[w.image].focus;
      const number = document.createElement('span'); number.className = 'route-num'; number.textContent = `0${index+1}`; number.setAttribute('aria-hidden','true');
      const name = document.createElement('h4'); name.textContent = w.name; name.lang = 'en';
      const text = document.createElement('p'); text.textContent = tr(`inside.${key}.heading`);
      card.append(img,number,name,text); container.append(card);
    });
    if (animate) window.PinkOutMotion?.refresh(container);
  }
  function setMood(key) {
    selectedMood = key;
    $$('[data-mood]').forEach(el => { const active = el.dataset.mood === key; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
    renderRoute();
  }
  $$('[data-mood]').forEach(el => el.addEventListener('click', () => setMood(el.dataset.mood)));
  $('#surprise').addEventListener('click', e => {
    const options = Object.keys(routes).filter(key => key !== selectedMood);
    setMood(options[Math.floor(Math.random()*options.length)]);
  });
  function renderLightbox() {
    const [img] = gallery[lightboxIndex];
    $('#lightbox-image').src = `${imageDirectory}${img}.webp`;
    $('#lightbox-image').alt = tr(`image.${img}`);
    $('#lightbox-caption').textContent = `${tr(`image.${img}`)} · ${tr('general.conceptDisclaimer')}`;
    $('#lightbox-number').textContent = `${visibleGallery.indexOf(lightboxIndex)+1} / ${visibleGallery.length}`;
    if ($('#lightbox').open) window.PinkOutMotion?.enter($('#lightbox-image'),'photo');
  }
  $$('[data-gallery]').forEach(el => el.addEventListener('click', () => {
    returnFocus = el; lightboxIndex = Number(el.dataset.gallery); renderLightbox();
    $('#lightbox').showModal(); document.body.classList.add('scroll-lock'); $('#lightbox-close').focus();
    window.PinkOutMotion?.enter($('.lightbox-inner'),'card');
    window.PinkOutMotion?.schedule();
  }));
  function moveLightbox(direction) { const index=visibleGallery.indexOf(lightboxIndex);lightboxIndex=visibleGallery[(index+direction+visibleGallery.length)%visibleGallery.length];renderLightbox(); }
  $('#lightbox-prev').addEventListener('click', () => moveLightbox(-1));
  $('#lightbox-next').addEventListener('click', () => moveLightbox(1));
  $('#lightbox-close').addEventListener('click', () => $('#lightbox').close());
  $('#lightbox').addEventListener('close', () => { document.body.classList.remove('scroll-lock'); returnFocus?.focus(); });
  $('#lightbox').addEventListener('click', e => { if (e.target === $('#lightbox')) $('#lightbox').close(); });
  $('#lightbox').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); moveLightbox(e.key === (locale === 'ar' ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1); }
    if (e.key === 'Tab') {
      const controls = [$('#lightbox-close'),$('#lightbox-prev'),$('#lightbox-next')];
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); }
    }
  });
  function syncMotion() {
    document.body.classList.toggle('motion-paused', motionPaused || reduced.matches);
    const control = $('#motion');
    control.hidden = reduced.matches;
    control.setAttribute('aria-pressed', String(motionPaused));
    control.setAttribute('aria-label', tr(motionPaused ? 'ui.resume' : 'ui.motion'));
    control.firstElementChild.innerHTML = icon(motionPaused ? 'play' : 'pause');
    window.PinkOutMotion?.sync();
  }
  $('#motion').addEventListener('click', () => {
    motionPaused = !motionPaused;
    syncMotion();
    announce(tr(motionPaused ? 'ui.pauseStatus' : 'ui.motion'));
  });
  reduced.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) {
        $$('.nav-link').forEach(a => { const current=a.hash===`#${entry.target.id}`; a.classList.toggle('current',current); if(current) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
      }});
    },{rootMargin:'-20% 0px -55% 0px'});
    ['worlds','happening','gallery','entry','partners','faq'].forEach(id => navObserver.observe(document.getElementById(id)));
  }
  applyTranslations(); syncMotion();
})();
