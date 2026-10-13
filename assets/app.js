(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('no-js');
  const ar = root.lang === 'ar';
  const say = (arabic, english) => ar ? arabic : english;
  const config = window.PINKOUT_CONFIG || {};
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', say('افتحي القائمة', 'Open menu'));
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? say('أغلقي القائمة', 'Close menu') : say('افتحي القائمة', 'Open menu'));
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width:1001px)').addEventListener('change', closeMenu);

  document.querySelectorAll('[data-lang-switch]').forEach(link => {
    link.addEventListener('click', () => {
      try { localStorage.setItem('pinkout-language', ar ? 'en' : 'ar'); } catch (_) { /* Storage may be unavailable. */ }
      const url = new URL(link.getAttribute('href'), location.href);
      url.hash = location.hash;
      link.href = url.href;
    });
  });
  // A language explicitly selected through the switch is remembered on return.
  // Direct visits to /en/ always keep their requested language.
  if (ar && !location.search.includes('lang=ar')) {
    try {
      if (localStorage.getItem('pinkout-language') === 'en') {
        location.replace(new URL(`en/${location.hash}`, location.href));
        return;
      }
    } catch (_) { /* Arabic remains the default. */ }
  }

  const supportedDialog = typeof HTMLDialogElement !== 'undefined' && 'showModal' in HTMLDialogElement.prototype;
  document.querySelectorAll('[data-dialog]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.dialog);
      if (supportedDialog) {
        dialog.showModal();
        dialog.scrollTop = 0;
      } else {
        dialog.setAttribute('open', '');
        dialog.scrollIntoView({block:'center'});
      }
    });
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    const close = () => supportedDialog ? dialog.close() : dialog.removeAttribute('open');
    dialog.querySelector('[data-close]').addEventListener('click', close);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
      }
    });
    dialog.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', close));
  });

  const rail = document.querySelector('.program-rail');
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    const card = rail.querySelector('.program-card');
    const direction = Number(button.dataset.scroll) * (ar ? -1 : 1);
    rail.scrollBy({left: direction * (card.getBoundingClientRect().width + 24), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }));
  if ('IntersectionObserver' in window) {
    const navLinks = [...nav.querySelectorAll('a')];
    const activeObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      }
    }, {rootMargin:'-20% 0px -55% 0px', threshold:0});
    navLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) activeObserver.observe(section); });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduced.matches) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-enter');
            observer.unobserve(entry.target);
          }
        });
      }, {threshold:.08});
      document.querySelectorAll('.section-heading,.intro,.app-copy,.waitlist-copy,.partners-top,.faq-copy').forEach(element => observer.observe(element));
    }
  }

  const latinDigits = value => value.replace(/[٠-٩۰-۹]/g, c => String('٠١٢٣٤٥٦٧٨٩'.includes(c) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(c) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  const endpointFor = kind => config[`${kind}Endpoint`] || '';
  document.querySelectorAll('form[data-form]').forEach(form => {
    const kind = form.dataset.form;
    const status = form.querySelector('.form-status');
    const button = form.querySelector('[type=submit]');
    const originalLabel = button.textContent;
    const endpoint = endpointFor(kind);
    if (endpoint) form.querySelector('[data-form-notice]').textContent = say('قدّمي بياناتك لتتواصلي مع PinkOut.', 'Share your details to connect with PinkOut.');
    const controls = [...form.querySelectorAll('input,textarea,select')];
    const showError = (control, message) => {
      const error = document.getElementById(`${control.id}-error`);
      if (error) error.textContent = message;
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    };
    controls.forEach(control => {
      control.addEventListener('input', () => { showError(control, ''); status.textContent = ''; });
      control.addEventListener('change', () => showError(control, ''));
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      status.textContent = '';
      status.className = 'form-status';
      let firstInvalid = null;
      for (const control of controls) {
        let error = '';
        const value = control.value.trim();
        if (control.required && (control.type === 'checkbox' ? !control.checked : !value)) {
          error = control.type === 'checkbox' ? say('يرجى تحديد هذا الخيار للمتابعة.', 'Please select this option to continue.') : say('يرجى ملء هذا الحقل.', 'Please complete this field.');
        } else if (value && control.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = say('أدخلي بريداً إلكترونياً صحيحاً مثل name@example.com.', 'Enter a valid email address, such as name@example.com.');
        } else if (value && control.type === 'tel') {
          const phone = latinDigits(value);
          if (!/^\+?[\d\s().-]+$/.test(phone) || !/^[\d]{7,15}$/.test(phone.replace(/\D/g, ''))) error = say('أدخلي رقم جوال صحيحاً، مع رمز الدولة للأرقام الدولية.', 'Enter a valid phone number, including a country code for international numbers.');
        }
        showError(control, error);
        if (error && !firstInvalid) firstInvalid = control;
      }
      if (firstInvalid) { firstInvalid.focus(); return; }
      if (!endpoint) {
        status.textContent = say('النموذج جاهز، لكن التسجيل لم يُفتح بعد. لم تُرسل بياناتك ولم تُحفظ.', 'The form is ready, but registration has not opened yet. Your details have not been sent or saved.');
        status.focus();
        return;
      }
      const payload = {};
      new FormData(form).forEach((value, key) => {
        if (key === 'interests') (payload.interests ||= []).push(value);
        else payload[key] = typeof value === 'string' ? value.trim() : value;
      });
      payload.consent = true;
      payload.language = root.lang;
      payload.phone = latinDigits(payload.phone).replace(/[\s().-]/g, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      button.disabled = true;
      button.textContent = say('جارٍ الإرسال…', 'Sending…');
      form.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(endpoint, {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload), signal:controller.signal});
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('Submission not confirmed');
        status.classList.add('success');
        status.textContent = kind === 'waitlist' ? say('أصبحتِ الآن ضمن قائمة PinkOut 💗', 'You’re on the PinkOut List 💗') : say('وصل طلبك إلى PinkOut. شكراً لمشاركتنا فكرتك.', 'PinkOut received your enquiry. Thank you for sharing your idea.');
        form.reset();
      } catch (_) {
        status.classList.add('error');
        status.textContent = say('لم نستطع تأكيد إرسال طلبك. احتفظنا بالحقول في النموذج؛ حاولي مجدداً.', 'We couldn’t confirm your submission. Your details are still in the form; please try again.');
      } finally {
        clearTimeout(timeout);
        button.disabled = false;
        button.textContent = originalLabel;
        form.removeAttribute('aria-busy');
        status.focus();
      }
    });
  });
  [['ios','appStoreUrl','apps.apple.com'],['android','googlePlayUrl','play.google.com']].forEach(([platform,key,host]) => {
    if (!config[key]) return;
    let url;
    try { url = new URL(config[key]); } catch (_) { return; }
    if (url.protocol !== 'https:' || url.hostname !== host) return;
    document.querySelectorAll(`[data-store="${platform}"]`).forEach(badge => {
      const link = document.createElement('a');
      link.className = badge.className;
      link.href = url.href;
      link.innerHTML = badge.innerHTML;
      link.querySelector('small').textContent = say('حمّلي التطبيق', 'Download the app');
      badge.replaceWith(link);
    });
  });
})();
