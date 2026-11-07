/* Dewlune theme core: cart, drawers, search, product form, filters, builder. Vanilla JS. */
(() => {
  const D = window.Dewlune || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const formatMoney = (cents, format = D.moneyFormat || '${{amount}}') => {
    const value = Number(cents) / 100;
    const withDelim = (n, dp, t = ',', d = '.') => {
      const [i, f] = n.toFixed(dp).split('.');
      return i.replace(/\B(?=(\d{3})+(?!\d))/g, t) + (f ? d + f : '');
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals': return withDelim(value, 0);
        case 'amount_with_comma_separator': return withDelim(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return withDelim(value, 0, '.', ',');
        default: return withDelim(value, 2);
      }
    });
  };
  D.formatMoney = formatMoney;

  /* Toast */
  let toastTimer;
  const toast = (msg) => {
    const el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  };

  /* Focus trap helpers */
  const focusables = (root) => $$('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((el) => el.offsetParent !== null);
  let lastFocus = null;
  const trap = (e, root) => {
    if (e.key !== 'Tab') return;
    const items = focusables(root);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* Drawers */
  const openDrawer = (drawer) => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    $$(`[aria-controls="${drawer.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
    const panel = $('.drawer__panel', drawer);
    setTimeout(() => (focusables(panel)[0] || panel).focus(), 60);
  };
  const closeDrawer = (drawer) => {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    $$(`[aria-controls="${drawer.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (lastFocus) lastFocus.focus();
  };
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-drawer-open]');
    if (opener) { e.preventDefault(); openDrawer(document.getElementById(opener.dataset.drawerOpen)); return; }
    const closer = e.target.closest('[data-drawer-close]');
    if (closer) closeDrawer(closer.closest('[data-drawer]'));
  });
  document.addEventListener('keydown', (e) => {
    const open = $('[data-drawer].is-open');
    if (open) {
      if (e.key === 'Escape') closeDrawer(open);
      trap(e, $('.drawer__panel', open));
    }
    const search = $('[data-search-modal].is-open');
    if (search) {
      if (e.key === 'Escape') closeSearch();
      trap(e, $('.search-modal__panel', search));
    }
  });

  /* Header: solid after the hero, glass pill after scrolling (GlassSurface), hide on scroll down */
  const header = $('[data-header]');
  const headerSection = header && header.closest('.section-header');
  if (header) {
    const ua = navigator.userAgent;
    const chromium = /Chrome\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
    if (chromium && window.CSS && CSS.supports('backdrop-filter', 'url(#dw-glass)')) header.classList.add('supports-glass');
    const shell = $('.header__shell', header);
    const mapEl = document.querySelector('[data-glass-map]');
    let mapKey = '';
    const buildMap = () => {
      if (!mapEl || !header.classList.contains('supports-glass') || !header.classList.contains('is-scrolled')) return;
      const w = Math.round(shell.offsetWidth), h = Math.round(shell.offsetHeight);
      const r = parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 30;
      const key = `${w}x${h}x${r}`;
      if (key === mapKey || !w || !h) return;
      mapKey = key;
      const edge = Math.min(w, h) * 0.07;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${w}" height="${h}" fill="black"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#r)"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:difference"/><rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${r}" fill="hsl(0 0% 50% / .93)" style="filter:blur(11px)"/></svg>`;
      mapEl.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`);
    };
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const overlay = header.classList.contains('header--overlay');
      header.classList.toggle('is-solid', !overlay || y > 40);
      header.classList.toggle('is-scrolled', y > 80);
      if (headerSection) headerSection.classList.toggle('is-stuck', y > 36);
      const goingDown = y > lastY + 4 && y > 500;
      const goingUp = y < lastY - 4;
      const drawerOpen = !!$('[data-drawer].is-open, [data-search-modal].is-open');
      if (goingDown && !drawerOpen) header.classList.add('is-hidden');
      if (goingUp || y < 500) header.classList.remove('is-hidden');
      lastY = y;
      requestAnimationFrame(buildMap);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { mapKey = ''; buildMap(); });
    shell && shell.addEventListener('transitionend', () => buildMap());
    onScroll();

    /* Mega menu (CardNav) */
    const mega = $('[data-mega]', header);
    const triggers = $$('[data-mega-trigger]', header);
    if (mega && triggers.length) {
      let closeTimer, openTimer;
      const setOpen = (open) => {
        header.classList.toggle('is-mega-open', open);
        mega.setAttribute('aria-hidden', String(!open));
        triggers.forEach((t) => t.setAttribute('aria-expanded', String(open)));
        $$('a', mega).forEach((a) => { a.tabIndex = open ? 0 : -1; });
      };
      setOpen(false);
      const wide = () => window.matchMedia('(min-width: 1200px)').matches;
      const scheduleOpen = () => { clearTimeout(closeTimer); clearTimeout(openTimer); openTimer = setTimeout(() => setOpen(true), 90); };
      const scheduleClose = () => { clearTimeout(openTimer); clearTimeout(closeTimer); closeTimer = setTimeout(() => setOpen(false), 180); };
      triggers.forEach((t) => {
        t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && wide()) scheduleOpen(); });
        t.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') scheduleClose(); });
        t.addEventListener('click', (e) => {
          if (!header.classList.contains('is-mega-open')) { e.preventDefault(); setOpen(true); }
        });
        t.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setTimeout(() => { const first = $('a', mega); first && first.focus(); }, 120); }
        });
      });
      mega.addEventListener('pointerenter', () => clearTimeout(closeTimer));
      mega.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') scheduleClose(); });
      const scrim = $('[data-mega-scrim]', header);
      scrim && scrim.addEventListener('click', () => setOpen(false));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-mega-open')) { setOpen(false); triggers[0].focus(); } });
      header.addEventListener('focusout', (e) => { if (!header.contains(e.relatedTarget)) setOpen(false); });
      let openY = 0;
      new MutationObserver(() => { if (header.classList.contains('is-mega-open')) openY = window.scrollY; }).observe(header, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('scroll', () => { if (header.classList.contains('is-mega-open') && Math.abs(window.scrollY - openY) > 60) setOpen(false); }, { passive: true });
    }
  }

  /* Localization: filter long country lists, close other popovers */
  $$('[data-loc-filter]').forEach((input) => {
    const items = $$('[data-loc-item]', input.closest('.loc__panel'));
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      items.forEach((li) => li.classList.toggle('is-filtered', !!q && !li.dataset.locItem.includes(q)));
    });
  });
  document.addEventListener('click', (e) => {
    $$('.loc__pop[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });

  /* Footer newsletter: busy state and focus the confirmation */
  $$('[data-news-form]').forEach((form) => {
    form.addEventListener('submit', () => { const b = $('button[type=submit]', form); if (b) b.classList.add('is-busy'); });
    const ok = $('[data-news-success]', form);
    if (ok) { ok.scrollIntoView({ block: 'center' }); ok.focus({ preventScroll: true }); }
  });

  /* Announcement rotation */
  $$('[data-announcement]').forEach((bar) => {
    const items = $$('.announcement__item', bar);
    if (items.length < 2) return;
    let i = 0;
    setInterval(() => {
      const cur = items[i];
      i = (i + 1) % items.length;
      cur.classList.add('is-leaving');
      cur.classList.remove('is-active');
      items[i].classList.remove('is-leaving');
      items[i].classList.add('is-active');
      setTimeout(() => cur.classList.remove('is-leaving'), 800);
    }, Number(bar.dataset.interval) || 5000);
  });

  /* Predictive search */
  const searchModal = $('[data-search-modal]');
  const searchInput = $('[data-predictive-input]');
  const searchResults = $('[data-predictive-results]');
  const openSearch = () => {
    if (!searchModal) return;
    lastFocus = document.activeElement;
    searchModal.classList.add('is-open');
    searchModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setTimeout(() => searchInput && searchInput.focus(), 80);
  };
  const closeSearch = () => {
    if (!searchModal) return;
    searchModal.classList.remove('is-open');
    searchModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-search-open]')) { e.preventDefault(); openSearch(); }
    if (e.target.closest('[data-search-close]')) closeSearch();
  });
  const searchSuggest = $('[data-search-suggest]');
  document.addEventListener('click', (e) => {
    const term = e.target.closest('[data-search-term]');
    if (!term || !searchInput) return;
    searchInput.value = term.dataset.searchTerm;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
  });
  if (searchInput && searchResults) {
    let ctrl, t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      const q = searchInput.value.trim();
      if (searchSuggest) searchSuggest.hidden = !!q;
      if (!q) { searchResults.innerHTML = ''; return; }
      t = setTimeout(async () => {
        ctrl && ctrl.abort();
        ctrl = new AbortController();
        try {
          const url = `${D.routes.predictiveSearch}?q=${encodeURIComponent(q)}&resources[type]=product,page&resources[limit]=6&section_id=predictive-search`;
          const res = await fetch(url, { signal: ctrl.signal });
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const found = doc.querySelector('#predictive-search-results');
          searchResults.innerHTML = found ? found.outerHTML : '';
        } catch (err) { if (err.name !== 'AbortError') searchResults.innerHTML = ''; }
      }, 220);
    });
  }

  /* Cart */
  const cartDrawer = () => $('[data-cart-drawer]');
  const updateCount = (count) => {
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-empty', Number(count) === 0);
      if (el.classList.contains('cart-count')) {
        el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
      }
    });
  };
  const renderDrawer = (html) => {
    const current = cartDrawer();
    if (!current || !html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-cart-drawer]');
    if (!fresh) return;
    const wasOpen = current.classList.contains('is-open');
    const body = $('.drawer__panel', current);
    const newBody = $('.drawer__panel', fresh);
    body.innerHTML = newBody.innerHTML;
    if (wasOpen) current.classList.add('is-open');
  };
  const refreshCart = async () => {
    const res = await fetch(`${D.routes.root}?sections=cart-drawer`);
    const data = await res.json();
    renderDrawer(data['cart-drawer']);
    const cart = await (await fetch(`${D.routes.cart}.js`)).json();
    updateCount(cart.item_count);
    return cart;
  };
  D.refreshCart = refreshCart;

  const addItems = async (items) => {
    const res = await fetch(`${D.routes.cartAdd}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items, sections: 'cart-drawer' })
    });
    const data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || D.strings.error);
    if (data.sections) renderDrawer(data.sections['cart-drawer']);
    const cart = await (await fetch(`${D.routes.cart}.js`)).json();
    updateCount(cart.item_count);
    if (D.cartType === 'drawer' && cartDrawer()) openDrawer(cartDrawer());
    else toast(D.strings.added);
    return data;
  };
  D.addItems = addItems;

  const busy = (btn, on) => { if (!btn) return; btn.classList.toggle('is-busy', on); btn.disabled = on; };

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const fd = new FormData(form);
    const item = { id: Number(fd.get('id')), quantity: Number(fd.get('quantity') || 1) };
    const plan = fd.get('selling_plan');
    if (plan) item.selling_plan = Number(plan);
    busy(btn, true);
    try { await addItems([item]); }
    catch (err) { toast(err.message); }
    finally { busy(btn, false); }
  });

  document.addEventListener('click', async (e) => {
    const cartLink = e.target.closest('[data-cart-open]');
    if (cartLink && D.cartType === 'drawer' && cartDrawer()) { e.preventDefault(); openDrawer(cartDrawer()); return; }
    const change = e.target.closest('[data-qty-change]');
    if (change) {
      const line = Number(change.dataset.lineIndex);
      const quantity = Number(change.dataset.qtyChange);
      const item = change.closest('.cart-item');
      if (item) item.style.opacity = '.4';
      try {
        const res = await fetch(`${D.routes.cartChange}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ line, quantity, sections: 'cart-drawer' })
        });
        const data = await res.json();
        if (data.sections) renderDrawer(data.sections['cart-drawer']);
        updateCount(data.item_count);
      } catch (err) { toast(D.strings.error); if (item) item.style.opacity = ''; }
    }
  });

  /* Quantity input on product page */
  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-qty-input] [data-step]');
    if (!step) return;
    const input = step.parentElement.querySelector('input');
    input.value = Math.max(1, (Number(input.value) || 1) + Number(step.dataset.step));
  });

  /* Product page: variant picker, gallery, sticky bar */
  $$('[data-product-section]').forEach((section) => {
    const json = $('[data-product-json]', section);
    const form = $('[data-product-form]', section);
    if (!json || !form) return;
    const { variants } = JSON.parse(json.textContent);
    const idInput = $('[data-variant-id]', form);
    const addBtn = $('[data-add-button]', form);
    const addLabel = $('[data-add-label]', form);
    const priceBox = $('[data-product-price]', section);
    const stickyPrice = $('[data-sticky-price]');
    const track = $('[data-gallery-track]', section);

    const selected = () => $$('fieldset[data-option-index]', form).map((fs) => ($('input:checked', fs) || {}).value);

    const markUnavailable = () => {
      const current = selected();
      $$('fieldset[data-option-index]', form).forEach((fs) => {
        const idx = Number(fs.dataset.optionIndex);
        $$('input', fs).forEach((input) => {
          const probe = current.slice(); probe[idx] = input.value;
          const match = variants.find((v) => v.options.every((o, i) => o === probe[i]));
          input.classList.toggle('is-unavailable', !match || !match.available);
        });
      });
    };

    const update = () => {
      const opts = selected();
      const v = variants.find((x) => x.options.every((o, i) => o === opts[i]));
      $$('fieldset[data-option-index]', form).forEach((fs, i) => { const out = $('[data-option-value]', fs); if (out) out.textContent = opts[i] || ''; });
      markUnavailable();
      if (!v) {
        addBtn.disabled = true; addLabel.textContent = D.strings.unavailable; return;
      }
      idInput.value = v.id;
      addBtn.disabled = !v.available;
      addLabel.textContent = v.available ? D.strings.addToCart : D.strings.soldOut;
      const current = priceBox.querySelector('.price__current');
      if (current) {
        current.textContent = v.price;
        current.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      const cmp = priceBox.querySelector('.price__compare');
      if (cmp) cmp.textContent = v.compare || '';
      if (stickyPrice) stickyPrice.textContent = v.price;
      const url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url);
      if (v.media && track) {
        const fig = track.querySelector(`[data-media-id="${v.media}"]`);
        if (fig) {
          if (window.matchMedia('(max-width: 989px)').matches) track.scrollTo({ left: fig.offsetLeft - 16, behavior: 'smooth' });
          else if (fig !== track.firstElementChild) { track.prepend(fig); $$('.product__media', track).forEach((f, i) => f.classList.toggle('product__media--lead', i === 0)); }
        }
      }
    };
    form.addEventListener('change', (e) => { if (e.target.matches('[data-option-input]')) update(); });
    markUnavailable();

    /* Mobile gallery dots */
    const dots = $$('.product__dots span', section);
    if (track && dots.length) {
      track.addEventListener('scroll', () => {
        const idx = Math.round(track.scrollLeft / (track.firstElementChild.offsetWidth + 8));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      }, { passive: true });
    }

    /* Sticky add to bag */
    const sticky = $('[data-sticky-buy]');
    if (sticky && 'IntersectionObserver' in window) {
      let pastButton = false, footerVisible = false;
      const sync = () => {
        const show = pastButton && !footerVisible;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', String(!show));
        $('[data-sticky-add]', sticky).tabIndex = show ? 0 : -1;
      };
      new IntersectionObserver(([entry]) => { pastButton = !entry.isIntersecting && entry.boundingClientRect.top < 0; sync(); }).observe(addBtn);
      const footer = $('.footer');
      if (footer) new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; sync(); }).observe(footer);
      $('[data-sticky-add]', sticky).addEventListener('click', () => form.requestSubmit ? form.requestSubmit(addBtn) : addBtn.click());
    }
  });

  /* Recommendations */
  $$('[data-recommendations]').forEach(async (el) => {
    try {
      const html = await (await fetch(el.dataset.url)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-recommendations]');
      if (fresh && fresh.innerHTML.trim()) { el.innerHTML = fresh.innerHTML; document.dispatchEvent(new CustomEvent('dewlune:content', { detail: el })); }
    } catch (err) { /* recommendations are optional */ }
  });

  /* Concern chips (client side, reads ?concern=) */
  $$('[data-filter-scope]').forEach((scope) => {
    const chips = $$('[data-concern-filter]', scope);
    if (!chips.length) return;
    const apply = (value) => {
      chips.forEach((c) => { const on = c.dataset.concernFilter === value; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
      let shown = 0;
      $$('[data-product-card]', scope).forEach((card) => {
        const item = card.closest('.product-grid__item');
        const match = value === 'all' || (card.dataset.concerns || '').split(' ').includes(value);
        item.classList.toggle('is-filtered', !match);
        if (match) {
          shown++;
          item.classList.remove('is-in');
          requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('is-in')));
        }
      });
      return shown;
    };
    scope.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-concern-filter]');
      if (!chip) return;
      apply(chip.dataset.concernFilter);
      if (scope.hasAttribute('data-collection')) {
        const url = new URL(window.location.href);
        if (chip.dataset.concernFilter === 'all') url.searchParams.delete('concern'); else url.searchParams.set('concern', chip.dataset.concernFilter);
        window.history.replaceState({}, '', url);
      }
    });
    const initial = new URLSearchParams(window.location.search).get('concern');
    if (initial && chips.some((c) => c.dataset.concernFilter === initial)) apply(initial);
  });

  /* Collection filters via Section Rendering API */
  $$('[data-collection]').forEach((section) => {
    const form = $('[data-filter-form]', section);
    if (!form) return;
    const render = async (url) => {
      const results = $('[data-collection-results]', section);
      results.classList.add('is-loading');
      const u = new URL(url, window.location.origin);
      u.searchParams.set('section_id', section.dataset.sectionId);
      try {
        const html = await (await fetch(u)).text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('[data-collection-results]');
        const freshForm = doc.querySelector('[data-filter-form]');
        if (fresh) results.innerHTML = fresh.innerHTML;
        if (freshForm) {
          const openIdx = $$('.filter-pop', form).map((d) => d.open);
          $('.toolbar__right', form).innerHTML = $('.toolbar__right', freshForm).innerHTML;
          $$('.filter-pop', form).forEach((d, i) => { d.open = !!openIdx[i]; });
        }
        u.searchParams.delete('section_id');
        window.history.replaceState({}, '', u);
        document.dispatchEvent(new CustomEvent('dewlune:content', { detail: results }));
        const concern = new URLSearchParams(window.location.search).get('concern');
        const chip = concern && section.querySelector(`[data-concern-filter="${concern}"]`);
        if (chip) chip.click();
      } finally { results.classList.remove('is-loading'); }
    };
    let t;
    form.addEventListener('change', (e) => {
      if (!e.target.matches('[data-filter-input]')) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const params = new URLSearchParams(new FormData(form));
        const concern = new URLSearchParams(window.location.search).get('concern');
        if (concern) params.set('concern', concern);
        render(`${form.action}?${params.toString()}`);
      }, 250);
    });
    section.addEventListener('click', (e) => {
      const clear = e.target.closest('[data-filter-clear]');
      if (clear) { e.preventDefault(); render(clear.href); }
    });
    document.addEventListener('click', (e) => {
      $$('.filter-pop[open]', form).forEach((d) => { if (!d.contains(e.target)) d.open = false; });
    });
    /* keep filter panels inside the viewport */
    form.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d.matches || !d.matches('.filter-pop') || !d.open) return;
      const panel = $('.filter-pop__panel', d);
      panel.style.transform = '';
      const vw = document.documentElement.clientWidth;
      const r = panel.getBoundingClientRect();
      let shift = 0;
      if (r.right > vw - 12) shift = vw - 12 - r.right;
      if (r.left + shift < 12) shift = 12 - r.left;
      if (shift) panel.style.transform = `translateX(${Math.round(shift)}px)`;
    }, true);
  });

  /* AM / PM routine */
  $$('[data-routine]').forEach((section) => {
    const toggle = $('[data-routine-toggle]', section);
    const rows = $$('.checklist__row', section);
    const setMode = (mode) => {
      section.dataset.mode = mode;
      rows.forEach((row) => {
        const t = row.dataset.time;
        row.classList.toggle('is-hidden', !(t === 'both' || t === mode));
        const box = $('input', row); if (box) box.checked = false;
      });
    };
    toggle.addEventListener('change', () => setMode(toggle.checked ? 'pm' : 'am'));
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 5) { toggle.checked = true; setMode('pm'); } else setMode('am');
    const btn = $('[data-add-routine]', section);
    btn && btn.addEventListener('click', async () => {
      const ids = (btn.dataset[section.dataset.mode] || '').split(',').filter(Boolean);
      if (!ids.length) return;
      busy(btn, true);
      try { await addItems(ids.map((id) => ({ id: Number(id), quantity: 1 }))); }
      catch (err) { toast(err.message); }
      finally { busy(btn, false); }
    });
  });

  /* Build your ritual */
  $$('[data-builder]').forEach((section) => {
    const need = Number(section.dataset.need) || 3;
    const pct = Number(section.dataset.discount) || 0;
    const inputs = $$('.tile__input', section);
    const slots = $$('[data-slot]', section);
    const count = $('[data-builder-count]', section);
    const meter = $('[data-builder-meter]', section);
    const value = $('[data-builder-value]', section);
    const save = $('[data-builder-save]', section);
    const btn = $('[data-builder-add]', section);
    const cta = $('[data-builder-cta]', section);
    const strings = JSON.parse($('[data-builder-strings]', section).innerHTML);
    $('.builder__slots', section).style.setProperty('--slots', need);
    const picked = [];
    const render = () => {
      count.textContent = picked.length;
      meter.style.width = `${(picked.length / need) * 100}%`;
      slots.forEach((slot, i) => {
        const p = picked[i];
        slot.classList.toggle('is-filled', !!p);
        slot.innerHTML = p && p.dataset.image ? `<img src="${p.dataset.image}" alt="${p.dataset.title}">` : `<span>${i + 1}</span>`;
      });
      const total = picked.reduce((s, p) => s + Number(p.dataset.price), 0);
      const saving = picked.length === need ? Math.round(total * pct / 100) : 0;
      value.textContent = formatMoney(total - saving);
      save.textContent = formatMoney(saving);
      const ready = picked.length === need;
      btn.disabled = !ready;
      cta.textContent = ready ? strings.ready : strings.locked;
      inputs.forEach((inp) => { const lock = !inp.checked && ready; inp.closest('.tile').classList.toggle('is-locked', lock); });
    };
    inputs.forEach((inp) => inp.addEventListener('change', () => {
      if (inp.checked) {
        if (picked.length >= need) { inp.checked = false; toast(strings.ready); return; }
        picked.push(inp);
      } else {
        const i = picked.indexOf(inp); if (i > -1) picked.splice(i, 1);
      }
      render();
    }));
    btn.addEventListener('click', async () => {
      busy(btn, true);
      try {
        await addItems(picked.map((p) => ({ id: Number(p.value), quantity: 1, properties: { _ritual: 'Build your ritual' } })));
        picked.splice(0).forEach((p) => { p.checked = false; });
        render();
      } catch (err) { toast(err.message); }
      finally { busy(btn, false); render(); }
    });
    render();
  });

  /* Glossary and FAQ search */
  const liveFilter = (input, items, getText, empty, counter) => {
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((item) => {
        const hit = !q || getText(item).includes(q);
        item.classList.toggle('is-filtered', !hit);
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (counter) counter.textContent = shown;
    });
  };
  $$('[data-glossary]').forEach((g) => {
    const input = $('[data-glossary-search]', g);
    if (input) liveFilter(input, $$('.glossary__item', g), (el) => el.textContent.toLowerCase(), $('[data-glossary-empty]', g), $('[data-glossary-count]', g));
  });
  $$('[data-faq]').forEach((f) => {
    const input = $('[data-faq-search]', f);
    if (input) liveFilter(input, $$('[data-faq-item]', f), (el) => el.textContent.toLowerCase(), $('[data-faq-empty]', f));
  });
})();
