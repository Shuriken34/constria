/* Constria – interacțiuni */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const csrf = ($('meta[name="csrf-token"]') || {}).content || ($('input[name="_csrf"]') || {}).value || '';

  function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 2, 'aria-hidden': 'true' } }); }
  icons();

  /* ---------- Header ---------- */
  const header = $('#site-header');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    const megaOpen = $('#mega') && $('#mega').classList.contains('is-open');
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !megaOpen && !document.activeElement.closest('#site-header'));
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- Mega-meniu ---------- */
  const megaBtn = $('#mega-toggle');
  const mega = $('#mega');
  if (megaBtn && mega) {
    const set = (open) => { mega.classList.toggle('is-open', open); megaBtn.setAttribute('aria-expanded', String(open)); };
    megaBtn.addEventListener('click', () => set(!mega.classList.contains('is-open')));
    document.addEventListener('click', (e) => { if (!e.target.closest('#mega, #mega-toggle')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mega.classList.contains('is-open')) { set(false); megaBtn.focus(); } });
  }

  /* ---------- Overlay-uri (căutare, meniu mobil) ---------- */
  let lastTrigger = null;
  function openOverlay(el, trigger) {
    lastTrigger = trigger;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    const f = $('input, a, button', el);
    setTimeout(() => (el.id === 'search-overlay' ? $('#overlay-q') : f).focus(), 60);
  }
  function closeOverlay(el) {
    el.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { el.hidden = true; }, 420);
    if (lastTrigger) lastTrigger.focus();
  }
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openOverlay(document.getElementById(b.dataset.open), b)));
  $$('.overlay').forEach((o) => {
    $$('[data-close]', o).forEach((b) => b.addEventListener('click', () => closeOverlay(o)));
    o.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay(o);
      if (e.key === 'Tab') {
        const items = $$('a[href], button:not([disabled]), input, select, textarea', o).filter((x) => x.offsetParent !== null);
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
      const o = $('#search-overlay');
      if (o) { e.preventDefault(); openOverlay(o, null); }
    }
  });

  /* ---------- Video hero: clipuri rulate pe rând, cu tranziție ---------- */
  const vids = $$('.hero-video');
  const listEl = $('#hero-videos');
  if (vids.length === 2 && listEl) {
    const clips = JSON.parse(listEl.textContent);
    const toggle = $('[data-video-toggle]');
    const caption = $('[data-video-caption]');
    const CLIP_MAX = 8; // secunde per clip
    let idx = 0, front = 0, paused = reduce, switching = false;
    const setToggle = () => {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Pornește videoclipul' : 'Oprește videoclipul');
      toggle.innerHTML = '<i data-lucide="' + (paused ? 'play' : 'pause') + '"></i>';
      icons();
    };
    const playFront = () => { const p = vids[front].play(); if (p) p.catch(() => {}); };
    const next = () => {
      if (switching || paused) return;
      switching = true;
      idx = (idx + 1) % clips.length;
      const back = 1 - front;
      const v = vids[back];
      v.src = clips[idx].src;
      v.preload = 'auto';
      const go = () => {
        v.removeEventListener('canplay', go);
        v.currentTime = 0;
        const p = v.play(); if (p) p.catch(() => {});
        v.classList.add('is-active');
        vids[front].classList.remove('is-active');
        const old = vids[front];
        setTimeout(() => old.pause(), 1300);
        front = back;
        if (caption) caption.textContent = clips[idx].label;
        switching = false;
      };
      v.addEventListener('canplay', go);
      v.addEventListener('error', () => { switching = false; }, { once: true });
      v.load();
    };
    vids.forEach((v) => {
      v.addEventListener('timeupdate', () => { if (v === vids[front] && (v.currentTime > CLIP_MAX || (v.duration && v.duration - v.currentTime < 0.6))) next(); });
      v.addEventListener('ended', () => { if (v === vids[front]) next(); });
      v.addEventListener('error', () => { if (v === vids[front]) next(); });
    });
    toggle.addEventListener('click', () => {
      paused = !paused;
      if (paused) vids.forEach((v) => v.pause()); else playFront();
      setToggle();
    });
    // Pornește doar când hero-ul este vizibil, oprește când iese din ecran
    const scene = $('[data-hero-scene]');
    if ('IntersectionObserver' in window && scene) {
      new IntersectionObserver(([en]) => {
        if (paused) return;
        if (en.isIntersecting) playFront(); else vids.forEach((v) => v.pause());
      }).observe(scene);
    } else if (!paused) playFront();
    setToggle();
  }

  /* ---------- Notificări ---------- */
  function dismiss(t) { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 260); }
  $$('.toast').forEach((t) => {
    $('[data-dismiss]', t).addEventListener('click', () => dismiss(t));
    if (!t.classList.contains('toast--error')) setTimeout(() => dismiss(t), 5000);
  });
  function toast(text, type = 'info') {
    const box = $('.toasts');
    const t = document.createElement('div');
    t.className = 'toast toast--' + type;
    t.innerHTML = '<i data-lucide="' + (type === 'error' ? 'alert-circle' : 'check-circle-2') + '"></i><p></p><button type="button" aria-label="Închide notificarea"><i data-lucide="x"></i></button>';
    $('p', t).textContent = text;
    $('button', t).addEventListener('click', () => dismiss(t));
    box.appendChild(t);
    icons();
    setTimeout(() => dismiss(t), 4000);
  }

  /* ---------- Favorite ---------- */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    const was = b.getAttribute('aria-pressed') === 'true';
    b.setAttribute('aria-pressed', String(!was));
    try {
      const r = await fetch('/favorite/' + b.dataset.fav, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-Token': csrf } });
      if (r.status === 401) { location.href = '/autentificare?next=' + encodeURIComponent(location.pathname + location.search); return; }
      if (!r.ok) throw new Error();
      const d = await r.json();
      $$('[data-fav="' + b.dataset.fav + '"]').forEach((x) => {
        x.setAttribute('aria-pressed', String(d.fav));
        x.setAttribute('aria-label', (d.fav ? 'Șterge din favorite' : 'Salvează la favorite'));
      });
      toast(d.fav ? 'Anunț salvat la favorite.' : 'Anunț șters din favorite.', 'success');
    } catch {
      b.setAttribute('aria-pressed', String(was));
      toast('Nu am putut salva. Încearcă din nou.', 'error');
    }
  });

  /* ---------- Afișare telefon ---------- */
  $$('[data-phone]').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.revealed) { location.href = 'tel:' + b.dataset.revealed.replace(/\s/g, ''); return; }
    b.classList.add('is-loading');
    try {
      const r = await fetch('/api/anunt/' + b.dataset.phone + '/telefon');
      const d = await r.json();
      if (!d.phone) throw new Error();
      $$('[data-phone="' + b.dataset.phone + '"]').forEach((x) => { x.dataset.revealed = d.phone; $('span', x).textContent = d.phone; });
    } catch { toast('Telefonul nu este disponibil.', 'error'); }
    b.classList.remove('is-loading');
  }));

  /* ---------- Galerie ---------- */
  const gal = $('[data-gallery]');
  if (gal) {
    const thumbs = $$('[data-gallery-thumb]', gal);
    const main = $('[data-gallery-main]', gal);
    const idx = $('[data-gallery-index]', gal);
    let i = 0;
    const show = (n) => {
      if (!thumbs.length) return;
      i = (n + thumbs.length) % thumbs.length;
      main.src = thumbs[i].dataset.src;
      main.alt = main.alt.replace(/\d+$/, String(i + 1));
      thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === i)));
      if (idx) idx.textContent = i + 1;
    };
    thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
    const p = $('[data-gallery-prev]', gal), n = $('[data-gallery-next]', gal);
    if (p) p.addEventListener('click', () => show(i - 1));
    if (n) n.addEventListener('click', () => show(i + 1));
    gal.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    let sx = null;
    main.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- Dialoguri și confirmări ---------- */
  $$('[data-open-dialog]').forEach((b) => b.addEventListener('click', () => document.getElementById(b.dataset.openDialog).showModal()));
  $$('dialog').forEach((d) => {
    $$('[data-close-dialog]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  $$('form[data-confirm]').forEach((f) => f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); }));

  /* ---------- Stare de încărcare la trimitere ---------- */
  $$('form[data-loading]').forEach((f) => f.addEventListener('submit', () => {
    const b = $('button[type="submit"], button:not([type])', f);
    if (b) setTimeout(() => b.classList.add('is-loading'), 0);
  }));

  /* ---------- Rezumat erori ---------- */
  const sum = $('[data-error-summary]');
  if (sum) sum.focus();

  /* ---------- Arată / ascunde parola ---------- */
  $$('[data-pw-toggle]').forEach((b) => b.addEventListener('click', () => {
    const inp = document.getElementById(b.dataset.pwToggle);
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Ascunde parola' : 'Arată parola');
    b.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '"></i>';
    icons();
  }));

  /* ---------- Câmpuri firmă ---------- */
  const comp = $('[data-company-fields]');
  $$('[data-account-type]').forEach((r) => r.addEventListener('change', () => { if (comp) comp.hidden = r.value !== 'firma' || !r.checked; }));

  /* ---------- Tip preț ---------- */
  const priceField = $('[data-price-field]');
  const syncPrice = () => {
    const sel = $('[data-price-type]:checked');
    if (priceField && sel) { priceField.hidden = sel.value === 'gratuit' || sel.value === 'cerere'; }
  };
  $$('[data-price-type]').forEach((r) => r.addEventListener('change', syncPrice));
  syncPrice();

  /* ---------- Câmpuri pentru utilaje + închiriere ---------- */
  const catSel = $('[data-category-select]');
  const machineBox = $('[data-machine-fields]');
  if (catSel && machineBox) {
    const hoursField = $('[data-hours-field]');
    const syncCat = () => {
      const g = (catSel.selectedOptions[0] || {}).dataset ? catSel.selectedOptions[0].dataset.group : '';
      machineBox.hidden = !(g === 'utilaje' || g === 'scule');
      if (hoursField) hoursField.hidden = g !== 'utilaje';
    };
    catSel.addEventListener('change', syncCat); syncCat();
    const unit = $('#f-unit');
    const timeUnits = ['ora', 'zi', 'saptamana', 'luna'];
    $$('[data-listing-type]').forEach((r) => r.addEventListener('change', () => {
      if (!r.checked || !unit) return;
      if (r.value === 'inchiriere' && !timeUnits.includes(unit.value)) unit.value = 'zi';
      if (r.value === 'vanzare' && timeUnits.includes(unit.value)) unit.value = 'buc';
    }));
  }

  /* ---------- Contoare caractere ---------- */
  $$('[data-counter]').forEach((inp) => {
    const out = $('[data-count-for="' + inp.id + '"]');
    const upd = () => { if (out) out.textContent = inp.value.length; };
    inp.addEventListener('input', upd); upd();
  });

  /* ---------- Încărcare imagini cu previzualizare ---------- */
  const dz = $('[data-dropzone]');
  if (dz) {
    const input = $('input[type="file"]', dz);
    const prev = $('[data-previews]');
    const max = Number(input.dataset.max) || 8;
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.add('is-over')));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('is-over')));
    input.addEventListener('change', () => {
      prev.innerHTML = '';
      const files = Array.from(input.files);
      if (files.length > max) toast('Poți adăuga maximum ' + max + ' fotografii. Doar primele ' + max + ' vor fi păstrate.', 'error');
      files.slice(0, max).forEach((f, k) => {
        if (f.size > 6 * 1024 * 1024) { toast('„' + f.name + '” depășește 6 MB.', 'error'); return; }
        const d = document.createElement('div');
        d.className = 'thumb';
        const img = document.createElement('img');
        img.alt = 'Previzualizare ' + (k + 1);
        img.src = URL.createObjectURL(f);
        d.appendChild(img);
        prev.appendChild(d);
      });
      if (files.length > max) {
        const dt = new DataTransfer();
        files.slice(0, max).forEach((f) => dt.items.add(f));
        input.files = dt.files;
      }
    });
  }
  $$('[data-remove-img]').forEach((c) => c.addEventListener('change', () => c.closest('[data-thumb]').classList.toggle('is-removed', c.checked)));

  /* ---------- Ciornă automată pentru anunț nou ---------- */
  const draftForm = $('form[data-autosave]:not([data-autosave=""])');
  if (draftForm) {
    const key = draftForm.dataset.autosave;
    const fields = $$('input:not([type=file]):not([type=hidden]), textarea, select', draftForm);
    const hasErrors = !!$('[data-error-summary]');
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && !hasErrors) {
        fields.forEach((f) => {
          if (!(f.name in saved)) return;
          if (f.type === 'radio') f.checked = saved[f.name] === f.value;
          else f.value = saved[f.name];
        });
        syncPrice();
        $$('[data-counter]').forEach((i) => i.dispatchEvent(new Event('input')));
      }
    } catch { /* ignorat */ }
    let tmr;
    draftForm.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        const o = {};
        fields.forEach((f) => { if (f.type === 'radio') { if (f.checked) o[f.name] = f.value; } else o[f.name] = f.value; });
        try { localStorage.setItem(key, JSON.stringify(o)); } catch { /* ignorat */ }
      }, 400);
    });
    draftForm.addEventListener('submit', () => { try { localStorage.removeItem(key); } catch { /* ignorat */ } });
  }

  /* ---------- Mesaje rapide ---------- */
  $$('[data-quick]').forEach((b) => b.addEventListener('click', () => {
    const t = $('#msg-body'); t.value = b.dataset.quick; t.focus();
  }));

  /* ---------- Filtre mobil + sortare ---------- */
  const filters = $('#filters');
  $$('[data-open-filters]').forEach((b) => b.addEventListener('click', () => { filters.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('input, select', filters).focus(); }));
  $$('[data-close-filters]').forEach((b) => b.addEventListener('click', () => { filters.classList.remove('is-open'); document.body.style.overflow = ''; }));
  const sort = $('[data-sort]');
  if (sort) sort.addEventListener('change', () => { location.href = sort.value; });

  /* ---------- Taburi ---------- */
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    const activate = (t) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      t.focus();
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => activate(t));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') activate(tabs[(k + 1) % tabs.length]);
        if (e.key === 'ArrowLeft') activate(tabs[(k - 1 + tabs.length) % tabs.length]);
      });
    });
  });

  /* ---------- Conversație: trimitere și actualizare ---------- */
  const thread = $('[data-thread]');
  if (thread) {
    const me = Number(thread.dataset.me);
    const conv = thread.dataset.conv;
    let last = Number(thread.dataset.last) || 0;
    const scrollDown = () => { thread.scrollTop = thread.scrollHeight; };
    scrollDown();
    const fmt = (s) => new Date(s).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    const add = (m) => {
      if (m.id <= last) return;
      last = m.id;
      const d = document.createElement('div');
      d.className = 'msg ' + (m.sender_id === me ? 'msg--out' : 'msg--in');
      d.textContent = m.body;
      const t = document.createElement('time'); t.textContent = fmt(m.created_at); d.appendChild(t);
      thread.appendChild(d);
      scrollDown();
    };
    const form = $('[data-composer]');
    const ta = $('textarea', form);
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = ta.value.trim();
      if (!body) return;
      const btn = $('button', form);
      btn.classList.add('is-loading');
      try {
        const r = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ body }) });
        if (!r.ok) throw new Error();
        const d = await r.json();
        add(d.message);
        ta.value = ''; ta.style.height = '';
      } catch { toast('Mesajul nu a putut fi trimis. Încearcă din nou.', 'error'); }
      btn.classList.remove('is-loading');
      ta.focus();
    });
    const poll = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch('/cont/mesaje/' + conv + '/noi?dupa=' + last, { headers: { Accept: 'application/json' } });
        if (r.ok) (await r.json()).messages.forEach(add);
      } catch { /* rețea indisponibilă */ }
    };
    setInterval(poll, 8000);
  }

  /* ---------- Animații ---------- */
  // Apariții la derulare
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;
  $$('.reveal').forEach((el, k) => {
    if (!io || reduce) { el.classList.add('is-in'); return; }
    el.style.transitionDelay = (k % 4) * 60 + 'ms';
    io.observe(el);
  });

  // Text manifest: cuvintele se colorează pe rând
  const fill = $('[data-fill]');
  if (fill && !reduce) {
    fill.innerHTML = fill.textContent.trim().split(/\s+/).map((w) => '<span class="w">' + w.replace(/[&<>]/g, '') + '</span>').join(' ');
  }

  // Cifre animate
  const counters = $$('[data-count]');

  (function animate() {
    const gsap = window.gsap;
    addEventListener('load', () => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
    if (!gsap || reduce) {
      $$('.fill-text .w').forEach((w) => w.classList.add('is-on'));
      return;
    }
    gsap.registerPlugin(window.ScrollTrigger);

    // Rândurile uriașe din hero alunecă din lateral
    $$('[data-hero-line]').forEach((line) => {
      const dir = Number(line.dataset.heroLine);
      gsap.from(line, { yPercent: 25, duration: 1, ease: 'power4.out', delay: dir > 0 ? 0.1 : 0 });
      gsap.to(line, { xPercent: -dir * 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });

    // Scena hero cu straturi (paralaxă)
    const scene = $('[data-hero-scene]');
    if (scene) {
      $$('[data-depth]', scene).forEach((l) => {
        gsap.to(l, { yPercent: -Number(l.dataset.depth) * 30, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      if ($('.float-card')) gsap.from('.float-card', { y: 80, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.3 });
    }

    // Paralaxă imagini
    $$('[data-parallax]').forEach((img) => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('[data-parallax-small]').forEach((img) => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    // Manifest
    const words = $$('.fill-text .w');
    if (words.length) {
      window.ScrollTrigger.create({
        trigger: '[data-fill]', start: 'top 80%', end: 'bottom 45%', scrub: true,
        onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, k) => w.classList.toggle('is-on', k < n)); },
      });
    }

    // Cifre
    counters.forEach((el) => {
      const target = Number(el.dataset.count);
      if (!target) return;
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('ro-RO'); } });
    });
  }());
}());
