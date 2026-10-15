(() => {
  'use strict';
  const {copy, worlds, gallery} = window.PINKOUT;
  const imageDirectory = window.PINKOUT.imageDirectory || 'assets/';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  let locale = 'ar', selectedWorld = 'passage', selectedMood = 'create';
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
  let expandedWorld = 'passage';
  const worldAnimations = new Set();
  function finishWorldAnimations() {
    for (const animation of worldAnimations) animation.cancel();
    worldAnimations.clear();
  }
  reduced.addEventListener('change', finishWorldAnimations);
  function animateWorld(element, frames, options) {
    if (!element.animate) return;
    const animation = element.animate(frames, options);
    worldAnimations.add(animation);
    const cleanup = () => worldAnimations.delete(animation);
    animation.addEventListener('finish', cleanup, {once:true});
    animation.addEventListener('cancel', cleanup, {once:true});
  }
  function setWorld(key, animate = true) {
    const shouldAnimate = animate && !reduced.matches && !motionPaused;
    const cards = $$('.world-card');
    const previousRects = shouldAnimate
      ? new Map(cards.map(element => [element, element.getBoundingClientRect()]))
      : null;
    // Continue from the visible positions when another card is chosen mid-animation.
    finishWorldAnimations();
    const previousWorld = expandedWorld;
    if (animate) expandedWorld = key;
    selectedWorld = key;
    const panel = $('#world-panel');
    const card = document.querySelector(`[data-world-card="${key}"]`);
    if (panel.parentElement !== card) card.append(panel);
    panel.hidden = !expandedWorld;
    $$('.world-card').forEach(el => el.classList.toggle('is-expanded', Boolean(expandedWorld) && el === card));
    const world = worlds.find(w => w.key === key);
    $$('.world-button').forEach(el => {
      const active = Boolean(expandedWorld) && el.dataset.world === key;
      el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active));
      el.setAttribute('aria-expanded', String(active));
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
    $('#world-detail').dataset.world = key;
    $('#save-world').setAttribute('aria-pressed', String(saved.has(key)));
    $('#save-world').setAttribute('aria-label', tr(saved.has(key) ? 'ui.saved' : 'ui.save'));
    $('#save-world').innerHTML = heartIcon();
    $('#world-position').textContent = `${String(worlds.indexOf(world)+1).padStart(2,'0')} / 07`;
    $('#world-tags').replaceChildren(...tr(`inside.${key}.highlights`).split(' · ').slice(0,3).map(label => { const chip=document.createElement('span');chip.textContent=label;return chip; }));
    if (shouldAnimate) {
      // Read final positions together before starting animations. Never scale card text.
      const movements = cards.map(element => {
        const before = previousRects.get(element);
        const after = element.getBoundingClientRect();
        return {element, x: before.left - after.left, y: before.top - after.top};
      });
      for (const {element, x, y} of movements) {
        const changedSize = element === card || element.dataset.worldCard === previousWorld;
        if (Math.abs(x) + Math.abs(y) > 1) {
          animateWorld(element, [
            {transform: `translate(${x}px, ${y}px)`, opacity: changedSize ? .35 : 1},
            {transform: 'translate(0, 0)', opacity: 1}
          ], {
            duration: 460,
            easing: 'cubic-bezier(.22, 1, .36, 1)'
          });
        }
      }
      animateWorld(panel, [{opacity: 0}, {opacity: 1}], {
        duration: 280,
        delay: 100,
        fill: 'backwards',
        easing: 'ease-out'
      });
    }
    if (animate) window.PinkOutMotion?.schedule(true);

  }
  function stepWorld(delta, control) {
    const index = worlds.findIndex(w => w.key === selectedWorld);
    const key = worlds[(index + delta + worlds.length) % worlds.length].key;
    setWorld(key);
    const selected = document.querySelector(`[data-world="${key}"]`);
    const focusTarget = control || selected;
    focusTarget.focus({preventScroll:true});
    focusTarget.scrollIntoView({behavior:reduced.matches||motionPaused?'auto':'smooth',block:'nearest',inline:'nearest'});
  }
  $('#world-prev').addEventListener('click', e => stepWorld(-1, e.currentTarget));
  $('#world-next').addEventListener('click', e => stepWorld(1, e.currentTarget));
  $$('.world-button').forEach(el => {
    el.addEventListener('click', () => {
      if (expandedWorld !== el.dataset.world) setWorld(el.dataset.world);
    });
  });
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
  // Small inline icons keep the popup artwork sharp without image downloads.
  const detailIconPaths = {
    arch: 'M5 21V10a7 7 0 0 1 14 0v11M9 21V10a3 3 0 0 1 6 0v11M3 21h18',
    sparkle: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4',
    camera: 'M8 6 10 3h4l2 3h4v14H4V6ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    flower: 'M12 12c-10-2-6-12 0-5 6-7 10 3 0 5Zm0 0c10 2 6 12 0 5-6 7-10-3 0-5ZM12 14v8m0-3 5-3',
    coffee: 'M4 8h12v7a6 6 0 0 1-12 0ZM16 9h2a3 3 0 0 1 0 6h-2M3 22h15M7 2v3m5-3v3',
    leaf: 'M20 3C8 2 2 7 5 15s17 6 15-12ZM5 20 16 9M9 16v-5m0 5h5',
    chat: 'M21 11a9 8 0 0 1-9 8H7l-5 3 2-6a8 8 0 0 1-1-5 9 8 0 0 1 18 0ZM7 10h10m-10 4h6',
    heart: 'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 3 10 8 15 5-5 13-10 8-15Z',
    perfume: 'M8 3h8v4H8ZM10 7v3m4-3v3M6 10h12l2 11H4ZM9 14h6v4H9Z',
    palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4c-2-1 0-3 2-3h3c5 0 3-11-6-11ZM7 8h.01M12 6h.01M17 9h.01M6 13h.01',
    brush: 'm14 4 6-2-2 6-8 8-4-4ZM6 12c-4 0-2 7-5 9 7 1 10-3 9-5',
    scissors: 'M9 17 20 3M9 7l11 14M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    gem: 'M3 8 7 3h10l4 5-9 14ZM3 8h18M7 3l5 19 5-19',
    bag: 'M5 7h14l2 14H3ZM8 8V6a4 4 0 0 1 8 0v2',
    hanger: 'M10 5a2 2 0 1 1 3 2l-1 1v3L2 18v2h20v-2l-10-7',
    sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
    move: 'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 10l8-2 8 2m-8-2v7m0-2-6 8m6-8 6 8',
    music: 'M9 18V5l11-2v13M9 9l11-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM6 10v2a6 6 0 0 0 12 0v-2M12 18v4m-4 0h8',
    ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4ZM15 5v3m0 3v2m0 3v3'
  };
  const detailThemes = {
    passage: ['arch', 'sparkle', 'gem', 'camera', 'flower'],
    hub: ['coffee', 'leaf', 'chat', 'sparkle', 'heart'],
    beauty: ['sparkle', 'perfume', 'palette', 'gem', 'flower'],
    make: ['brush', 'gem', 'scissors', 'palette', 'heart'],
    market: ['bag', 'hanger', 'gem', 'heart', 'sparkle'],
    move: ['move', 'flower', 'music', 'heart', 'leaf'],
    live: ['mic', 'music', 'chat', 'sparkle', 'ticket']
  };
  const detailIcon = name => `<svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${detailIconPaths[name]}"/></svg>`;
  const worldDetails = $('#world-details');
  let worldDetailsReturnFocus = null;
  let worldDetailsKey = 'passage';
  function scatterDetailIcons(width, height, card, size, count, random = Math.random) {
    const edge = width <= 600 ? 3 : 14;
    const sideRoom = Math.min(card.left, width - card.right);
    const gap = Math.max(2, Math.min(16, sideRoom - size - edge - 8));
    const minY = Math.max(edge + 10, card.top + 18);
    const maxY = Math.min(height - size - edge - 20, card.top + (card.bottom - card.top) * .74);
    const zones = [
      {left: Math.max(edge, card.left - gap - size - 28), right: card.left - gap - size - 4},
      {left: card.right + gap + 1, right: Math.min(width - size - edge - 4, card.right + gap + 25)}
    ];
    const positions = [];
    const rows = Math.ceil(count / 2);
    const band = (maxY - minY) / rows;
    const firstSide = random() < .5 ? 0 : 1;
    for (let index = 0; index < count; index++) {
      const zone = zones[(index + firstSide) % 2];
      if (zone.right < zone.left || band <= 0) break;
      const row = Math.floor(index / 2);
      const x = zone.left + random() * (zone.right - zone.left);
      // One icon per vertical band on each side guarantees clear, balanced spacing.
      const y = minY + band * (row + .15 + random() * .2);
      positions.push({x, y});
    }
    return positions;
  }
  function positionDetailIcons() {
    if (!worldDetails.open) return;
    const icons = [...$('#world-details-orbits').children];
    const positions = scatterDetailIcons(window.innerWidth, window.innerHeight,
      worldDetails.getBoundingClientRect(), window.innerWidth <= 600 ? 20 : 32, icons.length);
    icons.forEach((element, index) => {
      element.hidden = !positions[index];
      if (positions[index]) {
        element.style.left = `${positions[index].x}px`;
        element.style.top = `${positions[index].y}px`;
      }
    });
  }
  let detailResizeFrame;
  window.addEventListener('resize', () => {
    if (!worldDetails.open) return;
    cancelAnimationFrame(detailResizeFrame);
    detailResizeFrame = requestAnimationFrame(positionDetailIcons);
  }, {passive:true});
  function openWorldDetails(key, trigger = $('#world-detail')) {
    const world = worlds.find(item => item.key === key);
    if (!world) return;
    const alreadyOpen = worldDetails.open;
    worldDetailsKey = key;
    worldDetails.dataset.world = key;
    $('#world-details-emblem').innerHTML = detailIcon(detailThemes[key][0]);
    const ornaments = [...detailThemes[key], detailThemes[key][0]];
    for (let index = ornaments.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [ornaments[index], ornaments[swap]] = [ornaments[swap], ornaments[index]];
    }
    $('#world-details-orbits').innerHTML = ornaments.map((name, index) => {
      const angle = -18 + Math.random() * 36;
      const duration = 5 + Math.random() * 4;
      const delay = .3 + Math.random() * .65;
      const phase = -Math.random() * 8;
      return `<span class="detail-orbit" style="--orbit-angle:${angle.toFixed(2)}deg;--orbit-duration:${duration.toFixed(2)}s;--appear-delay:${delay.toFixed(2)}s;--orbit-delay:${phase.toFixed(2)}s">${detailIcon(name)}</span>`;
    }).join('');
    const image = $(`#inside-${key} .story-image`);
    let mood = image.querySelector('.world-details-mood');
    if (!mood) {
      mood = document.createElement('span');
      mood.className = 'world-details-mood';
      mood.setAttribute('aria-hidden', 'true');
      mood.innerHTML = detailThemes[key].slice(0, 3).map(detailIcon).join('');
      image.append(mood);
    }
    $('#world-details-position').textContent = `${String(worlds.indexOf(world) + 1).padStart(2, '0')} / ${String(worlds.length).padStart(2, '0')}`;
    $$('.world-detail-story').forEach(story => { story.hidden = story.id !== `inside-${key}`; });
    $('#world-details-title').textContent = world.name;
    if (!alreadyOpen) {
      worldDetailsReturnFocus = trigger;
      worldDetails.showModal();
    }
    document.body.classList.add('scroll-lock');
    positionDetailIcons();
    $('.world-details-body').scrollTop = 0;
    if (!alreadyOpen) $('#world-details-close').focus({preventScroll:true});
  }
  function stepWorldDetails(delta, control) {
    const index = worlds.findIndex(world => world.key === worldDetailsKey);
    openWorldDetails(worlds[(index + delta + worlds.length) % worlds.length].key);
    control?.focus({preventScroll:true});
  }
  $('#world-details-prev').addEventListener('click', e => stepWorldDetails(-1, e.currentTarget));
  $('#world-details-next').addEventListener('click', e => stepWorldDetails(1, e.currentTarget));
  worldDetails.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    stepWorldDetails(e.key === (locale === 'ar' ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1);
  });
  $('#world-detail').addEventListener('click', e => openWorldDetails(selectedWorld, e.currentTarget));
  $('#world-details-close').addEventListener('click', () => worldDetails.close());
  worldDetails.addEventListener('click', e => {
    if (e.target === worldDetails) worldDetails.close();
    if (e.target.closest('a[href="#worlds"]')) {
      e.preventDefault();
      worldDetails.close();
    }
  });
  worldDetails.addEventListener('close', () => {
    if (!$('#lightbox').open) document.body.classList.remove('scroll-lock');
    worldDetailsReturnFocus?.focus({preventScroll:true});
  });
  // Preserve links to the former detail sections, including bookmarked URLs.
  function openWorldDetailsFromHash() {
    const key = location.hash.startsWith('#inside-') ? location.hash.slice(8) : null;
    if (worlds.some(world => world.key === key)) openWorldDetails(key);
  }
  window.addEventListener('hashchange', openWorldDetailsFromHash);
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
  function renderHighlights() {
    $$('[data-highlights]').forEach(el => {
      el.replaceChildren(...tr(el.dataset.highlights).split(' · ').map((label,index) => {
        const chip=document.createElement('span'); chip.textContent=label;
        const story = el.closest('.world-detail-story');
        if (story) {
          const names = detailThemes[story.id.replace('inside-', '')];
          chip.insertAdjacentHTML('afterbegin', detailIcon(names[index % names.length]));
        }
        return chip;
      }));
    });
  }
  function updateDirectionalControls() {
    $('#world-details-prev').innerHTML = icon(locale === 'ar' ? 'arrow-right' : 'arrow-left');
    $('#world-details-next').innerHTML = icon(locale === 'ar' ? 'arrow-left' : 'arrow-right');
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
      const detail = document.createElement('button'); detail.type = 'button'; detail.className = 'route-open';
      detail.textContent = tr('ui.panel');
      detail.setAttribute('aria-label', `${tr('ui.panel')} — ${w.name}`);
      detail.addEventListener('click', () => openWorldDetails(key, detail));
      card.append(img,number,name,text,detail); container.append(card);
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
    if (motionPaused || reduced.matches) finishWorldAnimations();
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
    ['worlds','happening','gallery','entry','faq'].forEach(id => navObserver.observe(document.getElementById(id)));
  }
  applyTranslations(); syncMotion(); openWorldDetailsFromHash();
})();
