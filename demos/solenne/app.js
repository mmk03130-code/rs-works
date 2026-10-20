// Maison Solenne — shared behaviour: data, header, footer, cards, lightbox, reveal.
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

  // header + footer injection
  var brand = esc(D.settings.brand);
  var hd = document.querySelector('header');
  if (hd) {
    hd.innerHTML = '<div class="hd"><a class="wordmark" href="index.html">' + brand + '</a>' +
      '<button class="burger" aria-label="Menu" onclick="document.querySelector(\'nav.main\').classList.toggle(\'open\')">☰</button>' +
      '<nav class="main"><a href="index.html">Home</a><a href="gallery.html">Gallery</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>' +
      '<a class="appt" href="contact.html">Book an appointment</a></div>';
  }
  var ft = document.querySelector('footer');
  if (ft) {
    ft.innerHTML = '<div class="wrap"><div class="cols">' +
      '<div><div class="wm">' + brand + '</div><p style="margin-top:14px;max-width:26em;font-size:14.5px">' + esc(D.settings.tagline) + '. Made one at a time in ' + esc(D.settings.city) + ', by appointment.</p></div>' +
      '<div><h4>Explore</h4><a href="gallery.html#rings">Rings</a><a href="gallery.html#watches">Bespoke Watches</a><a href="gallery.html#straps">Leather Straps</a><a href="about.html">Our Story</a></div>' +
      '<div><h4>Atelier</h4><a href="contact.html">Book an appointment</a><a href="mailto:' + esc(D.settings.email) + '">' + esc(D.settings.email) + '</a><a href="tel:' + esc(D.settings.phone.replace(/[^+\d]/g, '')) + '">' + esc(D.settings.phone) + '</a></div>' +
      '</div><div class="fine"><span>© ' + new Date().getFullYear() + ' ' + brand + '. Demonstration website — photography from Pexels.</span><span>Instagram · Pinterest</span></div></div>';
  }

  // sticky header state
  function onScroll() { if (hd) hd.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll); onScroll();

  // reveal on scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // product cards
  window.buyUrlFor = function (p) { return (p && p.buy) || D.settings.buyUrl || '#'; };
  window.renderCards = function (lineId, mountId) {
    var m = document.getElementById(mountId);
    if (!m) return;
    var items = D.products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.line === lineId; });
    m.innerHTML = items.map(function (x) {
      return '<article class="card" data-idx="' + x.i + '"><div class="ph"><img loading="lazy" src="' + esc(x.p.img) + '" alt="' + esc(x.p.name) + ' — ' + esc(x.p.material) + '"></div>' +
        '<h3>' + esc(x.p.name) + '</h3><div class="mat">' + esc(x.p.material) + '</div>' +
        '<a class="buybtn" href="' + esc(window.buyUrlFor(x.p)) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Buy Now</a></article>';
    }).join('');
    m.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('click', function () { openLb(parseInt(c.getAttribute('data-idx'), 10)); });
    });
  };

  // lightbox
  var lb = document.getElementById('lb');
  var cur = 0;
  function showLb() {
    var p = D.products[cur];
    if (!lb || !p) return;
    lb.querySelector('img').src = p.img;
    lb.querySelector('img').classList.remove('zoom');
    lb.querySelector('.nm').textContent = p.name;
    lb.querySelector('.mt').textContent = p.material;
    var b = lb.querySelector('.lbuy');
    if (b) b.href = window.buyUrlFor(p);
  }
  function openLb(i) { cur = i; if (lb) { lb.classList.add('open'); showLb(); document.body.style.overflow = 'hidden'; } }
  function closeLb() { if (lb) { lb.classList.remove('open'); document.body.style.overflow = ''; } }
  if (lb) {
    lb.querySelector('.x').addEventListener('click', closeLb);
    lb.querySelector('.prev').addEventListener('click', function () { cur = (cur + D.products.length - 1) % D.products.length; showLb(); });
    lb.querySelector('.next').addEventListener('click', function () { cur = (cur + 1) % D.products.length; showLb(); });
    lb.querySelector('img').addEventListener('click', function () { this.classList.toggle('zoom'); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  // hero — play the film (and rotate scenes if a build ever has more than one)
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

  // gentle scroll drift on the full bleed chapter photos
  var wides = document.querySelectorAll('.chapter .wide img');
  if (wides.length) {
    var ticking = false;
    function drift() {
      ticking = false;
      var vh = window.innerHeight;
      wides.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var prog = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 .. 0.5ish
        img.style.objectPosition = '50% ' + Math.max(22, Math.min(78, 50 + prog * 52)) + '%';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  // pinned scroll scene — the photograph grows, the lines surface one by one
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
})();
