(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whatsapp = '254718361716';
  const email = 'heartmaragreen@gmail.com';

  // Navigation: the same polished experience on desktop and mobile.
  const header = $('#siteHeader');
  const menu = $('.menu-toggle');
  const mobile = $('#mobileMenu');
  const progress = $('#scrollProgress');
  const setMenu = (open) => {
    if (!menu || !mobile) return;
    mobile.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) mobile.querySelector('a')?.focus();
  };
  menu?.addEventListener('click', () => setMenu(!mobile.classList.contains('open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth > 920) setMenu(false); });
  $('#year') && ($('#year').textContent = String(new Date().getFullYear()));

  // Scroll progress, header color and restrained parallax.
  const parallax = $$('[data-parallax]');
  let scrollFramePending = false;
  function onScroll() {
    if (scrollFramePending) return;
    scrollFramePending = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle('is-scrolled', y > 45);
      const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (progress) progress.style.width = `${Math.min(100, (y / available) * 100)}%`;
      if (!reducedMotion) {
        for (const img of parallax) {
          const wrap = img.parentElement;
          const rect = wrap.getBoundingClientRect();
          if (rect.bottom < -120 || rect.top > innerHeight + 120) continue;
          const speed = Number(img.dataset.parallax) || 0.15;
          const offset = Math.max(-70, Math.min(70, (rect.top + rect.height/2 - innerHeight/2) * -speed));
          img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
        }
      }
      scrollFramePending = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll);
  onScroll();

  // Reveal content as it enters the viewport; keep reduced-motion accessible.
  const reveals = $$('[data-reveal]');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        target.classList.add('visible');
        observer.unobserve(target);
      });
    }, {threshold: 0.10, rootMargin: '0px 0px -20px 0px'});
    reveals.forEach((el, i) => {el.style.transitionDelay = `${Math.min(i % 3, 2) * 75}ms`; observer.observe(el);});
  } else reveals.forEach(el => el.classList.add('visible'));

  // Hero: looping image scenes with manual controls and pause on hover/focus.
  const slides = $$('#heroSlides .hero-slide');
  if (slides.length) {
    let active = 0, timer;
    const counter = $('#heroCurrent');
    function showSlide(i) {
      active = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === active));
      if (counter) counter.textContent = String(active + 1).padStart(2, '0');
    }
    function autoplay() {
      window.clearInterval(timer);
      if (!reducedMotion) timer = window.setInterval(() => showSlide(active + 1), 7000);
    }
    $('#heroPrev')?.addEventListener('click', () => {showSlide(active - 1); autoplay();});
    $('#heroNext')?.addEventListener('click', () => {showSlide(active + 1); autoplay();});
    const hero = $('.hero');
    hero?.addEventListener('mouseenter', () => window.clearInterval(timer));
    hero?.addEventListener('mouseleave', autoplay);
    hero?.addEventListener('focusin', () => window.clearInterval(timer));
    hero?.addEventListener('focusout', e => {if (!hero.contains(e.relatedTarget)) autoplay();});
    document.addEventListener('visibilitychange', () => document.hidden ? window.clearInterval(timer) : autoplay());
    autoplay();
  }

  // Dates can only be proposed in the future; nothing is 'booked' by submitting.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  ['#quickDate', '#arrivalDate'].forEach(id => {const d=$(id); if(d)d.min=today;});
  $('#quickEnquiry')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    const params = new URLSearchParams();
    for (const key of ['date','guests','interest']) {
      const value = form.elements.namedItem(key)?.value;
      if (value) params.set(key, value);
    }
    window.location.href = `contact.html?${params.toString()}#contactForm`;
  });

  // FAQs: real keyboard-friendly accordions.
  $$('.faq-question').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const expanded = item.classList.toggle('open');
    button.setAttribute('aria-expanded', String(expanded));
  }));

  // Filterable photo gallery and accessible arrow-key lightbox.
  const cards = $$('.gallery-card');
  const lightbox = $('#lightbox');
  if (cards.length && lightbox) {
    const lbImage = $('#lightboxImage');
    const lbCaption = $('#lightboxCaption');
    let visibleCards = cards;
    let current = 0;
    let previousFocus = null;
    const show = (index) => {
      current = (index + visibleCards.length) % visibleCards.length;
      const item = visibleCards[current];
      lbImage.src = item.dataset.src;
      lbImage.alt = item.dataset.caption || '';
      lbCaption.textContent = `${item.dataset.caption || ''} · ${current + 1} / ${visibleCards.length}`;
    };
    const open = card => {
      previousFocus = document.activeElement;
      visibleCards = cards.filter(c => !c.classList.contains('hidden'));
      current = visibleCards.indexOf(card);
      show(Math.max(0, current));
      lightbox.classList.add('open');
      document.body.classList.add('lightbox-open');
      $('#lightboxClose')?.focus();
    };
    const close = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('lightbox-open');
      if (previousFocus?.focus) previousFocus.focus();
    };
    cards.forEach(card => card.addEventListener('click', () => open(card)));
    $('#lightboxClose')?.addEventListener('click', close);
    $('#lightboxPrev')?.addEventListener('click', () => show(current - 1));
    $('#lightboxNext')?.addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'Tab') {
        const controls = $$('#lightbox button');
        const first=controls[0],last=controls[controls.length-1];
        if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
        else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      }
    });
    $$('.filter-btn').forEach(filter => filter.addEventListener('click', () => {
      const value = filter.dataset.filter;
      $$('.filter-btn').forEach(other => {other.classList.toggle('active', other === filter);other.setAttribute('aria-pressed', String(other === filter));});
      cards.forEach(card => card.classList.toggle('hidden', value !== 'All' && card.dataset.category !== value));
    }));
  }

  // Enquiry form: builds a real message in WhatsApp or a mail client.
  const contact = $('#contactForm');
  if (contact) {
    const query = new URLSearchParams(location.search);
    for (const key of ['date','guests','interest']) {
      const input = contact.elements.namedItem(key);
      const value = query.get(key);
      if (!input || !value) continue;
      if (input.tagName === 'SELECT' && ![...input.options].some(o => o.value === value)) {
        const custom = new Option(value,value,true,true);
        input.add(custom);
      }
      input.value = value;
    }
    let sendMode = 'whatsapp';
    $$('[data-send]', contact).forEach(b => b.addEventListener('click', () => {sendMode = b.dataset.send;}));
    contact.addEventListener('submit', e => {
      e.preventDefault();
      if (!contact.reportValidity()) return;
      const fields = new FormData(contact);
      const val = key => String(fields.get(key) || '').trim();
      const lines = [
        'Hello Mara Green Heart,',
        '', 'I would like to enquire about a visit to your camp.',
        '', `Name: ${val('name')}`, `Email: ${val('email')}`,
        `Phone / WhatsApp: ${val('phone') || 'Not provided'}`,
        `Preferred arrival: ${val('date') || 'Flexible / to be decided'}`,
        `Guests: ${val('guests')}`, `Interested in: ${val('interest')}`,
        '', `Message: ${val('message') || 'Please share details, availability, and rates.'}`
      ];
      const body = lines.join('\n');
      const status = $('#formStatus');
      if (sendMode === 'email') {
        const subject = `Mara Green Heart enquiry — ${val('name')}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if (status) status.textContent = 'Your email application should open with the enquiry ready to send.';
      } else {
        window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
        if (status) status.textContent = 'WhatsApp should open with your enquiry ready to send. Please press Send there.';
      }
    });
  }
})();
