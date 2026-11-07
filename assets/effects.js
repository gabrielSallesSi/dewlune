/* Dewlune effects. Vanilla ports of:
   React Bits (reactbits.dev, MIT + Commons Clause): BlurText, CircularText, ScrollVelocity, ScrollReveal,
     CountUp, SpotlightCard, GlareHover, AccordionGallery, GradualBlur, Iridescence, Stepper
   21st.dev (MIT): Text Rotate (@danielpetho), Scroll media expansion hero (@arunachalam),
     Interactive Hover Button (@dillionverma)
   Uiverse.io (MIT): shine button, segmented radio, radio tiles, AM/PM switch, checklist, loader (CSS only) */
(() => {
  const D = window.Dewlune || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = D.motion !== false && !reduce;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const once = (el) => { if (el.dataset.fx) return false; el.dataset.fx = '1'; return true; };

  /* Generic reveal on view */
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  const initReveal = (root = document) => $$('[data-reveal]:not(.is-in)', root).forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('is-in')));

  /* BlurText: split by words, animate blur(10px) -> blur(5px) -> sharp, staggered */
  const initBlurText = (root = document) => {
    $$('[data-blur-text]:not([data-ready])', root).forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = words.map((w, i) => `<span class="bt-word" aria-hidden="true" style="--w:${i}">${w}</span>`).join(' ');
      el.style.setProperty('--bt-delay', `${Number(el.dataset.delay) || 90}ms`);
      el.dataset.ready = '';
      if (!motion) { el.classList.add('is-in'); return; }
      if (el.hasAttribute('data-on-view') && revealIO) {
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.3 });
        io.observe(el);
      } else requestAnimationFrame(() => el.classList.add('is-in'));
    });
  };

  /* Text Rotate: per character spring in, staggered out */
  const initTextRotate = () => {
    $$('[data-text-rotate]').forEach((el) => {
      if (!once(el)) return;
      const words = $$('.text-rotate__word', el);
      words.forEach((w) => {
        const chars = Array.from(w.textContent);
        w.innerHTML = chars.map((c, i) => `<span class="text-rotate__char" style="--c:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      });
      if (!motion || words.length < 2) return;
      let i = 0;
      const interval = Number(el.dataset.interval) || 3000;
      let timer = setInterval(next, interval);
      function next() {
        const cur = words[i];
        i = (i + 1) % words.length;
        cur.classList.remove('is-active');
        cur.classList.add('is-leaving');
        setTimeout(() => cur.classList.remove('is-leaving'), 500);
        words[i].classList.add('is-active');
      }
      document.addEventListener('visibilitychange', () => { clearInterval(timer); if (!document.hidden) timer = setInterval(next, interval); });
    });
  };

  /* CircularText: letters placed around a circle, spins; speeds up on hover */
  const initCircularText = () => {
    $$('[data-circular-text]').forEach((el) => {
      if (!once(el)) return;
      const ring = $('.circular-text__ring', el);
      const text = ring.textContent;
      const chars = Array.from(text);
      ring.innerHTML = chars.map((c, i) => `<span class="ct-char" style="transform: rotate(${(360 / chars.length) * i}deg)">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      const base = Number(el.dataset.speed) || 20;
      ring.style.setProperty('--spin', `${base}s`);
      if (!motion) return;
      const anim = ring.getAnimations ? ring.getAnimations()[0] : null;
      el.addEventListener('pointerenter', () => anim && anim.updatePlaybackRate(4));
      el.addEventListener('pointerleave', () => anim && anim.updatePlaybackRate(1));
    });
  };

  /* ScrollVelocity: base drift plus a boost from smoothed scroll speed, direction flips with scroll, drag to fling */
  const initVelocity = () => {
    const rows = $$('[data-scroll-velocity]').filter(once);
    if (!rows.length) return;
    let lastY = window.scrollY, lastT = performance.now(), scrollVel = 0, smooth = 0;
    window.addEventListener('scroll', () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      scrollVel = ((window.scrollY - lastY) / dt) * 1000;
      lastY = window.scrollY; lastT = now;
    }, { passive: true });
    const state = rows.map((row) => {
      const track = $('.velocity__track', row);
      const copy = $('.velocity__copy', row);
      const s = { row, track, copy, x: 0, base: Number(row.dataset.velocity) || 60, dir: 1, width: copy.offsetWidth, visible: true, drag: null, fling: 0 };
      const ro = new ResizeObserver(() => { s.width = copy.offsetWidth; });
      ro.observe(copy);
      new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }).observe(row);
      row.addEventListener('pointerdown', (e) => { s.drag = { x: e.clientX, t: performance.now(), v: 0 }; row.setPointerCapture(e.pointerId); });
      row.addEventListener('pointermove', (e) => {
        if (!s.drag) return;
        const now = performance.now(); const dx = e.clientX - s.drag.x; const dt = Math.max(1, now - s.drag.t);
        s.x += dx; s.drag.v = (dx / dt) * 1000; s.drag.x = e.clientX; s.drag.t = now;
      });
      const end = () => { if (s.drag) { s.fling = clamp(s.drag.v, -4000, 4000); s.drag = null; } };
      row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
      return s;
    });
    if (!motion) return;
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      smooth += (scrollVel - smooth) * (1 - Math.exp(-dt * 8));
      scrollVel *= Math.exp(-dt * 6);
      const factor = clamp(Math.abs(smooth) / 1000 * 5, 0, 5);
      state.forEach((s) => {
        if (!s.visible || !s.width) return;
        if (smooth < -5) s.dir = -1; else if (smooth > 5) s.dir = 1;
        if (!s.drag) {
          let move = s.dir * s.base * dt;
          move += move * factor;
          s.x -= move;
          s.x += s.fling * dt; s.fling *= Math.exp(-dt * 3);
        }
        const w = s.width;
        s.x = ((s.x % w) - w) % w;
        s.track.style.transform = `translate3d(${s.x}px,0,0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ScrollReveal: words light up with scroll, container un-rotates */
  const initScrollReveal = () => {
    $$('[data-scroll-reveal]').forEach((el) => {
      if (!once(el)) return;
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map((w) => `<span class="sr-word">${w}</span>`).join(' ');
      el.dataset.ready = '';
      if (!motion) return;
      const pieces = $$('.sr-word', el);
      const update = () => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh * 0.9 - r.top) / (vh * 0.55 + r.height * 0.6), 0, 1);
        const lit = Math.round(p * pieces.length);
        pieces.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
        el.style.transform = `rotate(${(1 - clamp(p * 1.4, 0, 1)) * 3}deg)`;
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  };

  /* CountUp: spring-like ease from 0 to target when in view */
  const initCountUp = () => {
    $$('[data-count-up]').forEach((el) => {
      if (!once(el)) return;
      const to = Number(el.dataset.to) || 0;
      const decimals = Number(el.dataset.decimals) || 0;
      const fmt = (v) => v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (!motion) { el.textContent = fmt(to); return; }
      el.textContent = fmt(0);
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const dur = 2000, start = performance.now();
        const step = (now) => {
          const t = clamp((now - start) / dur, 0, 1);
          const eased = 1 - Math.exp(-6 * t) * Math.cos(t * 4.2);
          el.textContent = fmt(t >= 1 ? to : to * clamp(eased, 0, 1.04));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.5 });
      io.observe(el);
    });
  };

  /* SpotlightCard: radial light follows pointer */
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest('[data-spotlight]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  /* AccordionGallery: active panel grows, neighbours tilt, media drifts */
  const initAccordion = () => {
    $$('[data-accordion-gallery]').forEach((gal) => {
      if (!once(gal)) return;
      const panels = $$('.ag-panel', gal);
      if (!panels.length) return;
      let active = clamp(Number(gal.dataset.default) || 0, 0, panels.length - 1);
      const ratio = 0.52;
      const grow = panels.length > 1 ? (ratio * (panels.length - 1)) / (1 - ratio) : 1;
      gal.style.setProperty('--ag-grow', grow.toFixed(3));
      const measure = () => {
        const r = gal.getBoundingClientRect();
        const vertical = window.matchMedia('(max-width: 749px)').matches;
        const total = vertical ? r.height : r.width;
        gal.style.setProperty('--ag-media-size', `${Math.max(140, total * ratio * 1.22)}px`);
      };
      const set = (i) => {
        active = i;
        panels.forEach((p, k) => {
          p.classList.toggle('is-active', k === active);
          p.classList.toggle('is-before', k < active);
          p.classList.toggle('is-after', k > active);
          const drift = clamp(active - k, -1.5, 1.5);
          p.style.setProperty('--ag-shift', `${drift * 0.5 * 40}px`);
          if (k === active) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
        });
      };
      panels.forEach((p, i) => {
        p.addEventListener('mouseenter', () => set(i));
        p.addEventListener('focus', () => set(i));
        p.addEventListener('click', (e) => { if (i !== active) { e.preventDefault(); set(i); } });
        p.addEventListener('keydown', (e) => {
          if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); panels[(i + 1) % panels.length].focus(); }
          if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); panels[(i - 1 + panels.length) % panels.length].focus(); }
        });
      });
      new ResizeObserver(measure).observe(gal);
      set(active);
    });
  };

  /* Scroll media expansion: progress drives size, title split, background fade */
  const initScrollExpand = () => {
    $$('[data-scroll-expand]').forEach((sec) => {
      if (!once(sec)) return;
      if (!motion) { sec.style.setProperty('--p', 1); sec.style.setProperty('--reveal', 1); sec.classList.add('is-expanded'); return; }
      let target = 0, cur = 0, raf = 0;
      const read = () => {
        const r = sec.getBoundingClientRect();
        const range = Math.max(1, sec.offsetHeight - window.innerHeight);
        target = clamp(-r.top / (range * 0.75), 0, 1);
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const loop = () => {
        cur += (target - cur) * 0.14;
        if (Math.abs(target - cur) < 0.001) cur = target;
        sec.style.setProperty('--p', cur.toFixed(4));
        const reveal = clamp((cur - 0.75) / 0.25, 0, 1);
        sec.style.setProperty('--reveal', reveal.toFixed(3));
        sec.classList.toggle('is-expanded', reveal > 0.6);
        raf = cur !== target ? requestAnimationFrame(loop) : 0;
      };
      window.addEventListener('scroll', read, { passive: true });
      window.addEventListener('resize', read);
      read();
    });
  };

  /* Iridescence (WebGL2): flowing pearlescent field, pointer sheen, click swirls */
  const IRI_VERT = `#version 300 es
in vec2 aPosition; out vec2 vUv;
void main(){ vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`;
  const IRI_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution; uniform float uTime; uniform vec3 uColor; uniform vec2 uMouse;
uniform float uAmplitude; uniform float uScale; uniform int uDetail; uniform float uWarp;
uniform float uBrightness; uniform float uSaturation; uniform vec3 uPointer; uniform float uSheen; uniform vec4 uSwirls[6];
in vec2 vUv; out vec4 outColor;
float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
void main(){
  float mr = min(uResolution.x, uResolution.y);
  vec2 aspect = uResolution / mr;
  vec2 st = vUv;
  for (int k = 0; k < 6; k++) {
    vec4 s = uSwirls[k];
    if (s.w == 0.0) continue;
    vec2 d = (st - s.xy) * aspect;
    float ang = s.w * exp(-dot(d, d) / (s.z * s.z));
    float ca = cos(ang), sa = sin(ang);
    st = s.xy + vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y) / aspect;
  }
  vec2 uv = (st * 2.0 - 1.0) * aspect / uScale;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5; float a = 0.0;
  for (int i = 0; i < 24; i++) {
    if (i >= uDetail) break;
    float fi = float(i);
    a += cos(fi - d - a * uv.x * uWarp);
    d += sin(uv.y * fi + a);
  }
  d += uTime * 0.5;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  vec2 tp = (vUv - uPointer.xy) * aspect;
  col += col * uPointer.z * uSheen * 0.8 * exp(-dot(tp, tp) / 0.09);
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, uSaturation);
  col *= uBrightness;
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.02;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
  const hexToRgb = (hex) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const initIridescence = () => {
    if (D.webgl === false) return;
    $$('[data-iridescence]').forEach((host) => {
      if (!once(host)) return;
      const canvas = $('canvas', host);
      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false });
      if (!gl) return;
      const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null; };
      const vs = compile(gl.VERTEX_SHADER, IRI_VERT), fs = compile(gl.FRAGMENT_SHADER, IRI_FRAG);
      if (!vs || !fs) return;
      const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPosition'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = {}; ['uResolution', 'uTime', 'uColor', 'uMouse', 'uAmplitude', 'uScale', 'uDetail', 'uWarp', 'uBrightness', 'uSaturation', 'uPointer', 'uSheen', 'uSwirls'].forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });
      const color = hexToRgb(host.dataset.color || '#F2D2BC');
      const speed = Number(host.dataset.speed) || 0.6;
      const section = host.closest('[data-iridescence-host]') || host;
      const st = { w: 1, h: 1, phase: 0, mouse: [0.5, 0.5], target: [0.5, 0.5], presence: 0, inside: false, swirls: [], visible: true };
      const swirlData = new Float32Array(24);
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        st.w = host.clientWidth; st.h = host.clientHeight;
        canvas.width = Math.max(1, Math.round(st.w * dpr)); canvas.height = Math.max(1, Math.round(st.h * dpr));
      };
      const render = () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        swirlData.fill(0);
        st.swirls.forEach((s, k) => {
          const radius = 0.21 * (1 + 0.4 * s.age);
          const ease = Math.exp(-s.age * 1.35) - Math.exp(-s.age * 10);
          const fade = Math.min(1, (3.2 - s.age) / 0.8);
          swirlData.set([s.x, s.y, radius, 3 * ease * fade * (0.21 / radius) ** 2], k * 4);
        });
        gl.uniform2f(u.uResolution, st.w, st.h); gl.uniform1f(u.uTime, st.phase);
        gl.uniform3f(u.uColor, color[0], color[1], color[2]); gl.uniform2f(u.uMouse, st.mouse[0], st.mouse[1]);
        gl.uniform1f(u.uAmplitude, 0.1); gl.uniform1f(u.uScale, 1.1); gl.uniform1i(u.uDetail, 8); gl.uniform1f(u.uWarp, 1);
        gl.uniform1f(u.uBrightness, 1.12); gl.uniform1f(u.uSaturation, Number(host.dataset.saturation) || 0.62); gl.uniform3f(u.uPointer, st.target[0], st.target[1], st.presence); gl.uniform1f(u.uSheen, 0.35);
        gl.uniform4fv(u.uSwirls, swirlData);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      let last = 0;
      const frame = (now) => {
        if (!st.visible) { last = 0; return requestAnimationFrame(frame); }
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
        if (motion) st.phase += dt * speed;
        const f = 1 - Math.exp(-dt * 5);
        st.mouse[0] += (st.target[0] - st.mouse[0]) * f; st.mouse[1] += (st.target[1] - st.mouse[1]) * f;
        st.presence += ((st.inside ? 1 : 0) - st.presence) * (1 - Math.exp(-dt * 4));
        st.swirls = st.swirls.filter((s) => (s.age += dt) < 3.2);
        render();
        if (motion) requestAnimationFrame(frame);
      };
      const locate = (e) => { const r = host.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
      section.addEventListener('pointermove', (e) => { st.target = locate(e); st.inside = true; }, { passive: true });
      section.addEventListener('pointerleave', () => { st.inside = false; st.target = [0.5, 0.5]; });
      section.addEventListener('pointerdown', (e) => {
        if (!motion || e.target.closest('a, button, input, label')) return;
        const [x, y] = locate(e);
        if (st.swirls.length >= 6) st.swirls.shift();
        st.swirls.push({ x, y, age: 0 });
      });
      new ResizeObserver(() => { resize(); render(); }).observe(host);
      new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; }).observe(host);
      resize();
      host.classList.add('is-live');
      requestAnimationFrame(frame);
    });
  };

  /* Skin quiz: Stepper + scoring */
  const initQuiz = () => {
    $$('[data-quiz]').forEach((quiz) => {
      if (!once(quiz)) return;
      const stepper = $('[data-stepper]', quiz);
      const steps = $$('[data-step]', quiz);
      const indicators = $$('[data-indicator]', quiz);
      const viewport = $('[data-stepper-viewport]', quiz);
      const back = $('[data-stepper-back]', quiz);
      const next = $('[data-stepper-next]', quiz);
      const status = $('[data-step-status]', quiz);
      const guidance = $('[data-quiz-guidance]', quiz);
      const imageCards = $$('[data-quiz-card]', quiz);
      const products = JSON.parse($('[data-quiz-products]', quiz).textContent);
      const config = JSON.parse($('[data-quiz-config]', quiz).textContent);
      const money = (c) => (D.formatMoney ? D.formatMoney(c, config.money) : (c / 100).toFixed(2));
      const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
      let index = 0;
      let routine = [];
      const meter = $('[data-quiz-meter]', quiz);
      const profile = $('[data-quiz-profile]', quiz);
      const analyzing = $('[data-quiz-analyzing]', quiz);
      const analyzingText = $('[data-quiz-analyzing-text]', quiz);
      const confettiCanvas = $('[data-quiz-confetti]', quiz);
      const questionCount = steps.length - 1;
      const LABELS = { 'skin:dry': 'Dry skin', 'skin:oily': 'Oily skin', 'skin:combination': 'Combination', 'skin:normal': 'Balanced skin', 'skin:sensitive': 'Sensitive', 'concern:dryness': 'Hydration', 'concern:dullness': 'Radiance', 'concern:dark-spots': 'Even tone', 'concern:redness': 'Calm', 'concern:fine-lines': 'Smoothness', 'concern:sun-care': 'Daily SPF', 'sun:low': 'Mostly indoors', 'routine:minimal': '2 minute routine', 'routine:full': 'Full ritual' };
      const REACT = {
        'skin:dry': 'Noted. Ceramides and squalane will do the heavy lifting.',
        'skin:combination': 'Classic. We will balance light hydration with a soft finish.',
        'skin:oily': 'Got it. Weightless textures only, nothing that sits on top.',
        'skin:normal': 'Lucky you. We will keep it simple and protective.',
        'skin:sensitive': 'We hear you. Fragrance free and soothing first.',
        'concern:dullness': 'Vitamin C at 15% is about to become your favourite step.',
        'concern:dark-spots': 'Vitamin C and niacinamide, morning and night.',
        'concern:dryness': 'Hyaluronic acid on damp skin, then seal it in.',
        'concern:redness': 'Panthenol and allantoin, made for calm.',
        'concern:fine-lines': 'Bakuchiol at night, a gentle retinol alternative.',
        'sun:low': 'Indoors still counts. We will keep protection light.',
        'concern:sun-care': 'Then daily SPF stays in the routine, no exceptions.',
        'routine:minimal': 'Two minutes, three steps. Easy to keep.',
        'routine:full': 'A proper ritual. We will add a serum and an oil.'
      };
      const reactionFor = (value) => { const t = value.split(/\s+/).find((x) => REACT[x]); return t ? REACT[t] : ''; };

      const burst = (tile, x, y) => {
        if (!motion) return;
        const r = tile.getBoundingClientRect();
        const ox = x != null ? x - r.left : r.width / 2, oy = y != null ? y - r.top : r.height / 2;
        const ring = document.createElement('span'); ring.className = 'answer__ripple'; ring.style.left = `${ox}px`; ring.style.top = `${oy}px`;
        tile.appendChild(ring); setTimeout(() => ring.remove(), 700);
        for (let i = 0; i < 10; i++) {
          const d = document.createElement('span'); d.className = 'answer__drop';
          const a = (Math.PI * 2 * i) / 10 + Math.random() * .5, dist = 38 + Math.random() * 34;
          d.style.left = `${ox}px`; d.style.top = `${oy}px`;
          d.style.setProperty('--dx', `${Math.cos(a) * dist}px`); d.style.setProperty('--dy', `${Math.sin(a) * dist}px`);
          d.style.setProperty('--s', (0.5 + Math.random() * 0.8).toFixed(2));
          tile.appendChild(d); setTimeout(() => d.remove(), 800);
        }
      };

      const renderProfile = () => {
        if (!profile) return;
        const tags = [...new Set($$('input:checked', quiz).flatMap((i) => i.value.split(/\s+/)).filter((t) => LABELS[t]))];
        const existing = new Set($$('li', profile).map((li) => li.dataset.tag));
        $$('li', profile).forEach((li) => { if (!tags.includes(li.dataset.tag)) li.remove(); });
        tags.forEach((t) => {
          if (existing.has(t)) return;
          const li = document.createElement('li'); li.dataset.tag = t; li.textContent = LABELS[t];
          profile.appendChild(li);
        });
        profile.closest('.quiz__profile').classList.toggle('has-items', tags.length > 0);
      };

      const setMeter = () => {
        if (!meter) return;
        const answeredCount = steps.slice(0, questionCount).filter((st) => $('input:checked', st)).length;
        const pct = index >= questionCount ? 100 : Math.round((answeredCount / questionCount) * 100);
        meter.style.width = `${Math.max(pct, 4)}%`;
      };

      const confetti = () => {
        if (!motion || !confettiCanvas) return;
        const ctx = confettiCanvas.getContext('2d');
        const rect = quiz.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        confettiCanvas.width = rect.width * dpr; confettiCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const sr = stepper.getBoundingClientRect();
        const cx = sr.left - rect.left + sr.width / 2, cy = sr.top - rect.top + 80;
        const colors = ['#A0552A', '#F1D9C6', '#E9A774', '#8C9A83', '#FBF8F4', '#2B211C'];
        const parts = Array.from({ length: 140 }, () => {
          const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3, v = 6 + Math.random() * 9;
          return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[(Math.random() * colors.length) | 0], drop: Math.random() < .3 };
        });
        const start = performance.now();
        const tick = (now) => {
          const t = now - start;
          ctx.clearRect(0, 0, rect.width, rect.height);
          parts.forEach((p) => {
            p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
            ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 2600); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
            if (p.drop) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
            else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          });
          if (t < 2700) requestAnimationFrame(tick); else ctx.clearRect(0, 0, rect.width, rect.height);
        };
        requestAnimationFrame(tick);
      };

      const showResult = () => new Promise((resolve) => {
        if (!analyzing || !motion) { resolve(); return; }
        const msgs = config.analyzing || [];
        steps[index].classList.remove('is-active');
        analyzing.hidden = false;
        viewport.style.height = `${Math.max(analyzing.offsetHeight, 260)}px`;
        let k = 0;
        analyzingText.textContent = msgs[0] || '';
        const iv = setInterval(() => { k++; if (msgs[k]) { analyzingText.classList.remove('is-swap'); void analyzingText.offsetWidth; analyzingText.classList.add('is-swap'); analyzingText.textContent = msgs[k]; } }, 520);
        setTimeout(() => { clearInterval(iv); analyzing.hidden = true; resolve(); }, 1650);
      });

      /* 3D tilt on answer tiles */
      if (motion && window.matchMedia('(hover: hover)').matches) {
        $$('[data-tilt]', quiz).forEach((tile) => {
          tile.addEventListener('pointermove', (e) => {
            const r = tile.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
            tile.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`); tile.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
            tile.style.setProperty('--mx', `${(px + .5) * 100}%`); tile.style.setProperty('--my', `${(py + .5) * 100}%`);
          });
          tile.addEventListener('pointerleave', () => { tile.style.setProperty('--rx', '0deg'); tile.style.setProperty('--ry', '0deg'); });
        });
      }

      const setHeight = () => { const s = steps[index]; viewport.style.height = `${s.offsetHeight}px`; };
      const answered = () => !!$('input:checked', steps[index]);
      const go = (to, dir) => {
        steps[index].classList.remove('is-active', 'is-entering', 'from-left');
        index = to;
        const s = steps[index];
        s.classList.add('is-active', 'is-entering');
        s.classList.toggle('from-left', dir < 0);
        setTimeout(() => s.classList.remove('is-entering', 'from-left'), 600);
        indicators.forEach((ind, i) => {
          ind.classList.toggle('is-active', i === index);
          ind.classList.toggle('is-done', i < index);
          const jump = $('[data-step-jump]', ind);
          if (jump) jump.disabled = i >= index;
        });
        quiz.dataset.quizIndex = String(Math.min(index, imageCards.length - 1));
        imageCards.forEach((card, i) => card.classList.toggle('is-active', i === Math.min(index, imageCards.length - 1)));
        const messages = [
          'Let’s start with how your skin feels, not a list of rules.',
          'Choose the change that would feel most meaningful to you.',
          'Your time in the sun helps us shape the daytime part of your routine.',
          'Choose a routine you can see yourself enjoying.',
          'Your Dewlune routine is ready to explore.'
        ];
        if (guidance) guidance.textContent = messages[Math.min(index, messages.length - 1)];
        const last = index === steps.length - 1;
        const beforeLast = index === steps.length - 2;
        back.hidden = index === 0;
        back.textContent = last ? (D.strings.quizEditAnswers || 'Edit answers') : (D.strings.quizBack || 'Back');
        next.disabled = !last && !answered();
        next.textContent = last ? next.dataset.labelRestart : beforeLast ? next.dataset.labelLast : next.dataset.labelNext;
        stepper.classList.toggle('is-finished', last);
        if (status) status.textContent = index < steps.length - 1
          ? `${D.strings.quizQuestion || 'Question'} ${index + 1} ${D.strings.quizOf || 'of'} ${steps.length - 1}`
          : (D.strings.quizYourRoutine || 'Your routine');
        if (last) { indicators[index].classList.add('is-done'); buildResult(); }
        setMeter();
        requestAnimationFrame(setHeight);
        const focusTarget = $('legend, h2', s); if (focusTarget) { focusTarget.tabIndex = -1; focusTarget.focus({ preventScroll: true }); }
      };

      const buildResult = () => {
        const tags = $$('input:checked', quiz).flatMap((i) => i.value.split(/\s+/).filter(Boolean));
        const weights = {};
        tags.forEach((t) => { weights[t] = (weights[t] || 0) + (t.startsWith('concern:') ? 3 : t.startsWith('skin:') ? 2 : 1); });
        const full = tags.includes('routine:full');
        const sun = tags.some((t) => t === 'concern:sun-care');
        const order = config.steps.map((s) => s.trim());
        const scored = products.filter((p) => p.available && !p.tags.includes('bundle')).map((p) => ({ p, score: p.tags.reduce((s, t) => s + (weights[t] || 0), 0), step: (p.tags.find((t) => t.startsWith('step:')) || '').replace('step:', '') }));
        routine = [];
        order.forEach((step) => {
          const options = scored.filter((x) => x.step === step).sort((a, b) => b.score - a.score);
          if (!options.length) return;
          const essential = ['cleanse', 'serum', 'moisturize'].includes(step);
          if (step === 'protect' && !(sun || full)) return;
          if (!essential && step !== 'protect' && !full) return;
          if (!essential && step !== 'protect' && options[0].score === 0) return;
          routine.push(options[0]);
          if (full && step === 'serum' && options[1] && options[1].score > 0) routine.push(options[1]);
        });
        const list = $('[data-result-list]', quiz);
        const best = Math.max(1, ...routine.map((x) => x.score));
        list.innerHTML = routine.map((x, i) => {
          const pct = Math.round(78 + (x.score / best) * 21);
          return `
          <li style="--i:${i}; --pct:${pct}%">
            ${x.p.image ? `<img src="${escapeHtml(x.p.image)}" alt="" loading="lazy">` : '<span></span>'}
            <a href="${escapeHtml(x.p.url)}"><strong>${escapeHtml(x.p.title)}</strong><small>${escapeHtml(x.p.vendor)} · ${escapeHtml(x.step)}</small>
              <span class="routine-list__match"><span class="routine-list__bar"><span></span></span><em>${pct}% ${escapeHtml(config.match || 'match')}</em></span></a>
            <span>${escapeHtml(x.p.priceLabel)}</span>
          </li>`; }).join('');
        const total = routine.reduce((s, x) => s + x.p.price, 0);
        $('[data-result-total]', quiz).textContent = money(total);
        $('[data-result-summary]', quiz).textContent = (config.summary || '').replace('[count]', routine.length);
      };

      quiz.addEventListener('click', (e) => {
        const jump = e.target.closest('[data-step-jump]');
        if (!jump || jump.disabled) return;
        const target = Number(jump.dataset.stepJump);
        if (target < index) go(target, -1);
      });
      let lastPointer = null;
      quiz.addEventListener('pointerdown', (e) => { lastPointer = [e.clientX, e.clientY]; });
      quiz.addEventListener('change', (e) => {
        if (!e.target.matches('[data-answer]')) return;
        next.disabled = false;
        next.classList.remove('is-ready'); void next.offsetWidth; next.classList.add('is-ready');
        const tile = e.target.nextElementSibling;
        burst(tile, lastPointer && lastPointer[0], lastPointer && lastPointer[1]); lastPointer = null;
        const reaction = $('[data-quiz-reaction]', steps[index]);
        if (reaction) { reaction.classList.remove('is-in'); reaction.textContent = reactionFor(e.target.value); void reaction.offsetWidth; reaction.classList.add('is-in'); }
        imageCards.forEach((c) => { if (c.classList.contains('is-active')) { c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); } });
        renderProfile(); setMeter();
        requestAnimationFrame(setHeight);
      });
      /* keyboard: 1-9 picks an answer, Enter continues */
      let quizVisible = false;
      new IntersectionObserver(([en]) => { quizVisible = en.isIntersecting; }, { threshold: 0.25 }).observe(stepper);
      document.addEventListener('keydown', (e) => {
        if (!quizVisible || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.target.matches('input[type=text], input[type=search], input[type=email], textarea, select')) return;
        if (document.querySelector('[data-drawer].is-open, [data-search-modal].is-open')) return;
        const n = Number(e.key);
        if (n >= 1 && n <= 9 && index < questionCount) {
          const inputs = $$('[data-answer]', steps[index]);
          if (inputs[n - 1]) { e.preventDefault(); inputs[n - 1].checked = true; inputs[n - 1].dispatchEvent(new Event('change', { bubbles: true })); inputs[n - 1].focus(); }
        } else if (e.key === 'Enter' && !next.disabled && index < questionCount && !e.target.closest('button')) { e.preventDefault(); next.click(); }
      });
      next.addEventListener('click', () => {
        if (index === steps.length - 1) {
          $$('input:checked', quiz).forEach((i) => { i.checked = false; });
          $$('[data-quiz-reaction]', quiz).forEach((r) => { r.textContent = ''; r.classList.remove('is-in'); });
          indicators.forEach((ind) => ind.classList.remove('is-done'));
          renderProfile();
          go(0, -1);
          return;
        }
        if (!answered()) return;
        if (index + 1 === steps.length - 1) {
          next.disabled = true; back.hidden = true;
          showResult().then(() => { go(index + 1, 1); setTimeout(confetti, 120); });
          return;
        }
        go(index + 1, 1);
      });
      back.addEventListener('click', () => { if (index > 0) go(index - 1, -1); });
      const addBtn = $('[data-quiz-add]', quiz);
      addBtn.addEventListener('click', async () => {
        if (!routine.length || !D.addItems) return;
        addBtn.classList.add('is-busy'); addBtn.disabled = true;
        try { await D.addItems(routine.map((x) => ({ id: x.p.variant, quantity: 1, properties: { _quiz: 'Skin quiz routine' } }))); }
        catch (err) { /* toast handled in theme.js */ }
        finally { addBtn.classList.remove('is-busy'); addBtn.disabled = false; }
      });
      window.addEventListener('resize', setHeight);
      setMeter();
      setHeight();
    });
  };


  /* VariableProximity: letters thicken and straighten near the pointer */
  const initProximity = () => {
    $$('[data-proximity]').forEach((wrap) => {
      if (!once(wrap)) return;
      const textEl = $('.footer__wordmark-text', wrap) || wrap;
      const chars = Array.from(textEl.textContent.trim());
      textEl.innerHTML = chars.map((c) => `<span class="vp-letter">${c}</span>`).join('');
      if (!motion) return;
      const letters = $$('.vp-letter', textEl);
      const from = { wght: 300, SOFT: 100, opsz: 144 };
      const to = { wght: 900, SOFT: 0, opsz: 144 };
      const radius = Number(wrap.dataset.radius) || 260;
      const edge = Math.exp(-2);
      const current = letters.map(() => 0);
      const target = letters.map(() => 0);
      let pointer = null, visible = false, raf = 0, centers = [];
      const measure = () => { centers = letters.map((l) => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); };
      const apply = (i, t) => {
        const w = from.wght + (to.wght - from.wght) * t;
        const soft = from.SOFT + (to.SOFT - from.SOFT) * t;
        letters[i].style.fontVariationSettings = `'wght' ${w.toFixed(0)}, 'SOFT' ${soft.toFixed(0)}, 'WONK' 1, 'opsz' 144`;
      };
      const loop = () => {
        raf = 0;
        let moving = false;
        letters.forEach((l, i) => {
          let goal = 0;
          if (pointer && centers[i]) {
            const d = Math.hypot(pointer[0] - centers[i][0], pointer[1] - centers[i][1]);
            if (d < radius) goal = (Math.exp(-2 * (d / radius) ** 2) - edge) / (1 - edge);
          }
          target[i] = goal;
          current[i] += (target[i] - current[i]) * 0.18;
          if (Math.abs(target[i] - current[i]) > 0.002) moving = true; else current[i] = target[i];
          apply(i, current[i]);
        });
        if (moving && visible) raf = requestAnimationFrame(loop);
      };
      const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
      window.addEventListener('pointermove', (e) => { if (!visible) return; pointer = [e.clientX, e.clientY]; measure(); kick(); }, { passive: true });
      wrap.addEventListener('pointerleave', () => { pointer = null; kick(); });
      document.addEventListener('pointerleave', () => { pointer = null; kick(); });
      window.addEventListener('scroll', () => { if (visible && pointer) { measure(); kick(); } }, { passive: true });
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); kick(); } }).observe(wrap);
    });
  };

  const boot = () => {
    initBlurText();
    initTextRotate();
    initCircularText();
    initVelocity();
    initScrollReveal();
    initCountUp();
    initAccordion();
    initScrollExpand();
    initIridescence();
    initQuiz();
    initProximity();
    initReveal();
  };
  document.addEventListener('dewlune:content', (e) => { initReveal(e.detail); initBlurText(e.detail); });
  document.addEventListener('shopify:section:load', () => boot());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
