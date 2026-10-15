(() => {
  'use strict';
  const track = document.querySelector('.moments-scroll');
  if (!track) return;
  const stage = track.querySelector('.moments-stage');
  const cards = [...stage.querySelectorAll('.moment-card')];
  const backdrop = stage.querySelector('.moments-backdrop');
  let backdropKey = '', backdropAnimation;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 560px)');
  let frame = null, visible = true, geometry = null, needsMeasure = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const enabled = () => !reduced.matches && !short.matches && !document.body.classList.contains('motion-paused');
  function updateBackdrop(progress) {
    if (!backdrop) return;
    const locale = document.documentElement.lang === 'en' ? 'en' : 'ar';
    const index = Math.min(3, Math.floor(progress * 4)) + 1;
    const key = `moments.backdrop.${index}`;
    const identity = `${locale}:${key}`;
    if (identity === backdropKey) return;
    backdropKey = identity;
    backdropAnimation?.cancel();
    backdrop.textContent = window.PINKOUT?.copy[key]?.[locale] || backdrop.textContent;
    if (enabled() && backdrop.animate) {
      backdropAnimation = backdrop.animate([{opacity: 0}, {opacity: 1}], {duration: 200, easing: 'ease-out'});
    }
  }
  function measure() {
    const active = enabled();
    track.classList.toggle('is-scroll-deck', active);
    if (!active) {
      backdropAnimation?.cancel();
      updateBackdrop(0);
      cards.forEach(card => { card.style.transform = ''; card.style.opacity = ''; card.style.zIndex = ''; });
      geometry = null;
      return;
    }
    const rect = track.getBoundingClientRect();
    const mobile = innerWidth <= 900;
    geometry = {
      top: rect.top + scrollY,
      travel: Math.max(1, track.offsetHeight - stage.offsetHeight),
      reach: Math.max(0, (stage.clientWidth - cards[0].offsetWidth) / 2 - 4) * .9,
      stageHeight: stage.clientHeight,
      mobile,
      stickyTop: mobile ? 90 : 100
    };
    paint();
  }
  function paint() {
    if (!geometry || !visible) return;
    const progress = clamp((scrollY - geometry.top + geometry.stickyTop) / geometry.travel);
    updateBackdrop(clamp(progress / (geometry.mobile ? 1 : .55)));
    const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
    cards.forEach((card, index) => {
      let x, y, angle, opacity = 1;
      if (geometry.mobile) {
        const exit = index === cards.length - 1 ? 0 : clamp(progress * (cards.length - 1) - index);
        x = (index % 2 ? 1 : -1) * exit * 32;
        y = index * 5 - exit * (geometry.stageHeight + 40);
        angle = (index % 2 ? 1 : -1) * (1.5 + exit * 7);
        opacity = 1 - clamp((exit - .65) / .35);
      } else {
        const t = clamp(progress / .55);
        const spread = t * t * (3 - 2 * t);
        const slot = index / (cards.length - 1) * 2 - 1;
        x = direction * (slot * geometry.reach * spread + (index - 1.5) * 7 * (1 - spread));
        y = index * 6 * (1 - spread) + (index % 2 ? 6 : 0) * spread;
        angle = (index - 1.5) * 3 * (1 - spread);
      }
      card.style.transform = `translateX(-50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(cards.length - index);
    });
  }
  function schedule(measuring = false) {
    needsMeasure = needsMeasure || measuring;
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const refresh = needsMeasure;
      needsMeasure = false;
      refresh ? measure() : paint();
    });
  }
  addEventListener('scroll', () => { if (visible && geometry) schedule(); }, {passive:true});
  addEventListener('resize', () => schedule(true), {passive:true});
  addEventListener('load', () => schedule(true), {once:true});
  document.fonts?.ready.then(() => schedule(true));
  reduced.addEventListener('change', () => schedule(true));
  short.addEventListener('change', () => schedule(true));
  new MutationObserver(() => schedule(true)).observe(document.body, {attributes:true, attributeFilter:['class']});
  new MutationObserver(() => schedule(true)).observe(document.documentElement, {attributes:true, attributeFilter:['dir']});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) schedule(true);
    }, {rootMargin:'150px'}).observe(track);
  }
  // Content before the deck can resize when a world is expanded or a language changes.
  if ('ResizeObserver' in window) new ResizeObserver(() => schedule(true)).observe(document.querySelector('main'));
  measure();
})();
