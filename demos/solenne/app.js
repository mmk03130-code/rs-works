// Maison Solenne — all site behaviour lives in this external file
// (plus data.js). No inline scripts or inline styles in the pages.
// Header and footer markup is static and identical on every page;
// this file only wires behaviour to it.
(function () {
  function loadData() {
    try {
      var o = localStorage.getItem('solenne-data');
      if (o) return JSON.parse(o);
    } catch (e) {}
    return window.SOLENNE_DEFAULT;
  }
  var D = loadData();
  window.SOLENNE = D;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---- responsive images: every content photo ships as WebP (primary)
  // + JPG (fallback) in two widths, with intrinsic dimensions (no CLS).
  var DIMS = {
    'hero.jpg': [1920, 1280], 'rings-wide.jpg': [1400, 933],
    'r1.jpg': [1100, 733], 'r2.jpg': [1100, 1648], 'r3.jpg': [1100, 733], 'r4.jpg': [1100, 1467],
    'w1.jpg': [1100, 736], 'w2.jpg': [1100, 1650], 'w3.jpg': [1100, 733], 'w4.jpg': [1100, 1650],
    's1.jpg': [1100, 1650], 's2.jpg': [1100, 733], 's3.jpg': [1100, 687], 's4.jpg': [1100, 1650],
    'craft1.jpg': [1100, 733], 'craft2.jpg': [1100, 1650], 'craft3.jpg': [1100, 734],
    'about2.jpg': [1100, 733]
  };
  function variants(path) {
    var base = path.replace(/\.jpg$/, '');
    var d = DIMS[path] || [1100, 733];
    return {
      webp: base + '-800.webp 800w, ' + base + '.webp ' + d[0] + 'w',
      jpg: base + '-800.jpg 800w, ' + path + ' ' + d[0] + 'w',
      w: d[0], h: d[1], webpFull: base + '.webp'
    };
  }
  function picture(path, alt, sizes, lazy) {
    var v = variants(path);
    return '<picture><source type="image/webp" srcset="' + v.webp + '" sizes="' + sizes + '">' +
      '<img src="' + path + '" srcset="' + v.jpg + '" sizes="' + sizes + '" width="' + v.w + '" height="' + v.h + '"' +
      ' alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy"' : '') + '></picture>';
  }

  // ---- owner-editable text fields (header/footer brand spans, page copy)
  document.querySelectorAll('[data-set]').forEach(function (el) {
    var k = el.getAttribute('data-set');
    if (D.settings[k] != null) el.textContent = D.settings[k];
  });

  // ---- header behaviour: sticky state + mobile menu
  var hd = document.querySelector('header');
  function onScroll() { if (hd) hd.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll); onScroll();
  var burger = document.getElementById('burger');
  var mainnav = document.getElementById('mainnav');
  if (burger && mainnav) burger.addEventListener('click', function () { mainnav.classList.toggle('open'); });

  // ---- product cards
  window.buyUrlFor = function (p) { return (p && p.buy) || D.settings.buyUrl || '#'; };
  window.renderCards = function (lineId, mountId) {
    var m = document.getElementById(mountId);
    if (!m) return;
    var items = D.products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.line === lineId; });
    m.innerHTML = items.map(function (x) {
      return '<article class="card" data-idx="' + x.i + '"><div class="card__media">' +
        picture(x.p.img, x.p.name + ' — ' + x.p.material, '(min-width: 961px) 290px, (min-width: 561px) 45vw, 92vw', true) +
        '</div><h3 class="card__title">' + esc(x.p.name) + '</h3><div class="card__meta">' + esc(x.p.material) + '</div>' +
        '<a class="card__buy" href="' + esc(window.buyUrlFor(x.p)) + '" target="_blank" rel="noopener">Buy Now</a></article>';
    }).join('');
    m.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('click', function () { openLb(parseInt(c.getAttribute('data-idx'), 10)); });
    });
    m.querySelectorAll('.card__buy').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  };

  // ---- lightbox
  var lb = document.getElementById('lb');
  var cur = 0;
  function showLb() {
    var p = D.products[cur];
    if (!lb || !p) return;
    var v = variants(p.img);
    var src = document.getElementById('lb-source');
    var img = document.getElementById('lb-img');
    if (src) src.srcset = v.webpFull;
    if (img) { img.src = p.img; img.alt = p.name + ' — ' + p.material; img.classList.remove('zoom'); }
    lb.querySelector('.lb__name').textContent = p.name;
    lb.querySelector('.lb__meta').textContent = p.material;
    var b = lb.querySelector('.lb__buy');
    if (b) b.href = window.buyUrlFor(p);
  }
  function openLb(i) { cur = i; if (lb) { lb.classList.add('open'); showLb(); document.body.style.overflow = 'hidden'; } }
  function closeLb() { if (lb) { lb.classList.remove('open'); document.body.style.overflow = ''; } }
  if (lb) {
    lb.querySelector('.x').addEventListener('click', closeLb);
    lb.querySelector('.prev').addEventListener('click', function () { cur = (cur + D.products.length - 1) % D.products.length; showLb(); });
    lb.querySelector('.next').addEventListener('click', function () { cur = (cur + 1) % D.products.length; showLb(); });
    var lbImg = document.getElementById('lb-img');
    if (lbImg) lbImg.addEventListener('click', function () { this.classList.toggle('zoom'); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  // ---- chapter sections (home + gallery share the pattern)
  function chapterHtml(L, compact, gridId) {
    return '<section class="chapter wrap rv' + (compact ? ' chapter--compact' : '') + '"' + (compact ? ' id="' + L.id + '"' : '') + '>' +
      '<div class="chapter__no">Chapter ' + L.no + ' — ' + L.name + '</div>' +
      '<h2>' + L.title + '</h2><p class="chapter__intro">' + L.intro + '</p>' +
      '<div class="wide">' + picture(L.wide, L.name + ' at Maison Solenne', '100vw', true) + '</div>' +
      '<div class="grid" id="' + gridId + '"></div>' +
      (compact ? '' : '<a class="link-arrow link-arrow--dark" href="gallery.html#' + L.id + '">View the ' + L.name.toLowerCase() + ' gallery</a>') +
      '</section>';
  }

  // ---- home page
  var chapters = document.getElementById('chapters');
  if (chapters) {
    chapters.innerHTML = D.lines.map(function (L) { return chapterHtml(L, false, 'grid-' + L.id); }).join('');
    D.lines.forEach(function (L) { window.renderCards(L.id, 'grid-' + L.id); });
    var steps = document.getElementById('steps');
    if (steps) {
      steps.innerHTML = D.steps.map(function (s) {
        return '<div class="step rv"><div class="step__no">' + s.n + '.</div><h3>' + s.t + '</h3><p>' + s.d + '</p></div>';
      }).join('');
    }
  }

  // ---- gallery page
  var gmain = document.getElementById('gallery-main');
  if (gmain) {
    var gnav = document.querySelector('.gnav');
    if (gnav) gnav.innerHTML = D.lines.map(function (L) { return '<a href="#' + L.id + '">' + L.no + ' · ' + L.name + '</a>'; }).join('');
    gmain.innerHTML = D.lines.map(function (L) { return chapterHtml(L, true, 'g-' + L.id); }).join('');
    D.lines.forEach(function (L) { window.renderCards(L.id, 'g-' + L.id); });
  }

  // ---- contact page
  var appt = document.getElementById('appt');
  if (appt) {
    var c2 = document.querySelector('[data-set="city2"]');
    if (c2) c2.textContent = D.settings.city;
    document.querySelectorAll('[data-set="email"]').forEach(function (a) { a.href = 'mailto:' + D.settings.email; });
    document.querySelectorAll('[data-set="phone"]').forEach(function (a) { a.href = 'tel:' + D.settings.phone.replace(/[^+\d]/g, ''); });
    appt.addEventListener('submit', function (e) {
      e.preventDefault();
      var list = [];
      try { list = JSON.parse(localStorage.getItem('solenne-enquiries') || '[]'); } catch (err) {}
      list.push({ name: document.getElementById('nm').value, email: document.getElementById('em').value, topic: document.getElementById('tp').value, msg: document.getElementById('ms').value, at: new Date().toISOString() });
      try { localStorage.setItem('solenne-enquiries', JSON.stringify(list)); } catch (err) {}
      document.getElementById('ok').classList.add('show');
      var btn = appt.querySelector('button');
      btn.textContent = 'Request sent ✓';
      btn.disabled = true;
    });
  }

  // ---- hero film
  var slides = document.querySelectorAll('.hero .slide');
  function playIn(slide) { var v = slide && slide.querySelector('video'); if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
  if (slides.length) playIn(slides[0]);
  if (slides.length > 1) {
    var si = 0;
    setInterval(function () {
      slides[si].classList.remove('on');
      si = (si + 1) % slides.length;
      slides[si].classList.add('on');
      playIn(slides[si]);
    }, 7000);
  }

  // ---- gentle scroll drift on the full bleed chapter photos
  var wides = document.querySelectorAll('.wide img');
  if (wides.length) {
    var ticking = false;
    function drift() {
      ticking = false;
      var vh = window.innerHeight;
      wides.forEach(function (img) {
        var r = img.parentElement.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var prog = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.objectPosition = '50% ' + Math.max(22, Math.min(78, 50 + prog * 52)) + '%';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  // ---- pinned scroll scene
  var pin = document.getElementById('pin');
  if (pin) {
    var pinImg = document.getElementById('pin-img');
    var pinLines = pin.querySelectorAll('.pl');
    var pinHint = pin.querySelector('.pin-hint');
    var pinTick = false;
    function pinUpdate() {
      pinTick = false;
      var vh = window.innerHeight;
      var total = pin.offsetHeight - vh;
      var p = Math.max(0, Math.min(1, -pin.getBoundingClientRect().top / Math.max(1, total)));
      if (pinImg) pinImg.style.transform = 'scale(' + (1 + p * 0.22) + ')';
      function cl(v) { return Math.max(0, Math.min(1, v)); }
      pinLines.forEach(function (el, i) {
        var start = i * 0.27;
        var oIn = cl((p - start) / 0.12);
        var oOut = 1;
        if (i < pinLines.length - 1) oOut = 1 - cl((p - (start + 0.25)) / 0.1);
        else if (p > 0.94) oOut = 1 - cl((p - 0.94) / 0.06);
        el.style.opacity = String(oIn * oOut);
        el.style.transform = 'translateY(' + ((1 - oIn) * 30 - (1 - oOut) * 18) + 'px)';
      });
      if (pinHint) pinHint.style.opacity = String(Math.max(0, 1 - p * 6));
    }
    window.addEventListener('scroll', function () { if (!pinTick) { pinTick = true; requestAnimationFrame(pinUpdate); } }, { passive: true });
    pinUpdate();
  }

  // ---- reveal on scroll (initialized last, after page blocks render)
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
})();
