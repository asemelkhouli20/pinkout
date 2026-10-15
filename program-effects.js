(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.program-card[data-program]')];
  if (!cards.length) return;
  const themes = {
    kpop: ['🎤', '🎵', '⭐', '💜', '🎧'],
    movie: ['🎬', '🍿', '🎟️', '✨', '⭐'],
    henna: ['☕', '🌿', '🌸', '✨', '🤎'],
    princess: ['👑', '💎', '🎀', '✨', '🌸'],
    horror: ['👻', '🦇', '🎃', '✨', '🌙'],
    pajama: ['🌙', '☁️', '🎲', '⭐', '🍪'],
    japan: ['🌸', '🪭', '🎋', '✨', '🍵'],
    camping: ['🏕️', '🏮', '🌿', '⭐', '☕']
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const running = new Set();
  const lastBurst = new WeakMap();
  let layer;
  function discard(particle) {
    running.delete(particle);
    particle.animation?.cancel();
    particle.node.remove();
  }
  function clear() { [...running].forEach(discard); }
  function allowed() {
    return !reduced.matches && !document.hidden && !document.body.classList.contains('motion-paused');
  }
  function burst(card, touch = false) {
    if (!allowed() || card.hidden) return;
    const now = performance.now();
    if (now - (lastBurst.get(card) ?? -Infinity) < 1400) return;
    lastBurst.set(card, now);
    const icons = themes[card.dataset.program];
    if (!icons) return;
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'program-celebration';
      layer.setAttribute('aria-hidden', 'true');
      document.body.append(layer);
    }
    const rect = card.getBoundingClientRect();
    const originX = Math.max(24, Math.min(innerWidth - 24, rect.left + rect.width / 2));
    const originY = Math.max(36, Math.min(innerHeight - 36, rect.top + rect.height * .5));
    const count = touch ? 10 : 16;
    for (let index = 0; index < count; index++) {
      while (running.size >= 32) discard(running.values().next().value);
      const node = document.createElement('span');
      node.className = 'program-particle';
      node.textContent = icons[index % icons.length];
      node.style.left = `${originX - 16}px`;
      node.style.top = `${originY - 16}px`;
      layer.append(node);
      if (typeof node.animate !== 'function') { node.remove(); continue; }
      const angle = (index + Math.random() * .35) / count * Math.PI * 2;
      const distance = (touch ? 85 : 135) + Math.random() * 90;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rotation = (Math.random() - .5) * 100;
      const particle = {node, animation: null};
      particle.animation = node.animate([
        {transform: 'translate(0, 0) scale(.35) rotate(0deg)', opacity: 0, offset: 0},
        {transform: `translate(${x * .4}px, ${y * .7}px) scale(1) rotate(${rotation * .4}deg)`, opacity: 1, offset: .22},
        {transform: `translate(${x * .8}px, ${y}px) scale(1) rotate(${rotation}deg)`, opacity: 1, offset: .55},
        {transform: `translate(${x}px, ${y + 70}px) scale(.75) rotate(${rotation * 1.5}deg)`, opacity: 0, offset: 1}
      ], {duration: 1250 + Math.random() * 350, delay: index * 18, easing: 'ease-out', fill: 'both'});
      running.add(particle);
      particle.animation.onfinish = () => discard(particle);
    }
  }
  cards.forEach(card => {
    card.addEventListener('pointerenter', event => {
      if (hover.matches && event.pointerType === 'mouse') burst(card);
    });
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) burst(card); });
    let touchStart;
    card.addEventListener('pointerdown', event => {
      touchStart = event.pointerType === 'touch' ? {x:event.clientX, y:event.clientY} : null;
    }, {passive:true});
    card.addEventListener('pointerup', event => {
      if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) < 8) burst(card, true);
      touchStart = null;
    }, {passive:true});
    card.addEventListener('pointercancel', () => { touchStart = null; });
  });
  reduced.addEventListener('change', clear);
  document.addEventListener('visibilitychange', clear);
  addEventListener('scroll', clear, {passive:true});
  new MutationObserver(() => { if (!allowed()) clear(); }).observe(document.body, {attributes:true, attributeFilter:['class']});
  const grid = document.querySelector('.program-grid');
  if (grid) new MutationObserver(clear).observe(grid, {subtree:true, attributes:true, attributeFilter:['hidden']});
})();
