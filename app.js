/* RS Works v2 — interactions. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* 1. Headline stagger: split [data-stagger] into animated word spans.
     The h1 keeps plain text in HTML for SEO; spans are added at runtime. */
  (function stagger() {
    var el = document.querySelector("[data-stagger]");
    if (!el || reduceMotion) return;
    var nodes = Array.prototype.slice.call(el.childNodes);
    var wi = 0;
    el.innerHTML = "";
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(" ")); return; }
          var s = document.createElement("span");
          s.className = "w"; s.style.setProperty("--wi", wi++); s.textContent = part;
          el.appendChild(s);
        });
      } else if (node.nodeType === 1) { // e.g. <em>earn attention.</em> — keep markup, stagger inside
        var em = node.cloneNode(false);
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { em.appendChild(document.createTextNode(" ")); return; }
          var s = document.createElement("span");
          s.className = "w"; s.style.setProperty("--wi", wi++); s.textContent = part;
          em.appendChild(s);
        });
        el.appendChild(em);
      }
    });
  })();

  /* 2. 3D phone ring: slow auto-rotate, pause on hover, drag-to-spin. */
  (function ring() {
    var stage = document.getElementById("ringStage");
    var ringEl = document.getElementById("ring");
    if (!stage || !ringEl || reduceMotion) return;
    var angle = 0, velocity = 0, autoSpeed = 0.12, hovering = false, dragging = false, lastX = 0;
    var visible = true, lastScroll = 0; // perf: rest the GPU when hero is off-screen or user is scrolling

    function frame() {
      if (!visible) return; // observer restarts us when back in view
      if (!dragging && Date.now() - lastScroll < 120) {
        requestAnimationFrame(frame); // scrolling: skip work, keep the loop alive
        return;
      }
      if (!dragging) {
        angle += velocity;
        velocity *= 0.94; // friction after a flick
        if (!hovering && Math.abs(velocity) < autoSpeed) velocity += (autoSpeed - Math.abs(velocity)) * 0.02 * Math.sign(autoSpeed || 1);
        if (!hovering) angle += autoSpeed * (1 - Math.min(1, Math.abs(velocity) / (autoSpeed * 6)));
      }
      ringEl.style.transform = "rotateY(" + angle + "deg)";
      requestAnimationFrame(frame);
    }
    stage.addEventListener("pointerenter", function () { hovering = true; });
    stage.addEventListener("pointerleave", function () { hovering = false; });
    stage.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; velocity = 0;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      angle += dx * 0.35; velocity = dx * 0.35;
    });
    ["pointerup", "pointercancel"].forEach(function (evt) {
      stage.addEventListener(evt, function () { dragging = false; });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var v = entries[0].isIntersecting;
        if (v && !visible) { visible = true; requestAnimationFrame(frame); }
        else visible = v;
      }).observe(stage);
    }
    window.addEventListener("scroll", function () { lastScroll = Date.now(); }, { passive: true });
    requestAnimationFrame(frame);
  })();

  /* 2b. Rest CSS animations when their section is off-screen. */
  (function lazyAnims() {
    if (!("IntersectionObserver" in window)) return;
    document.querySelectorAll(".marquee, .case-phones").forEach(function (el) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle("paused", !e.isIntersecting); });
      }).observe(el);
    });
  })();

  /* 3. (retired) One fixed theme per phone now — no crossfade. */

  /* 4. Scroll-triggered reveals. */
  (function reveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  /* 5. Count-up stats when scrolled into view. */
  (function counters() {
    var nums = document.querySelectorAll("[data-count]");
    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (reduceMotion) { el.textContent = target; return; }
      var start = null, dur = 1300;
      function tick(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* 6. Magnetic CTA buttons: subtle pull toward cursor (desktop pointers only). */
  (function magnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (x * 0.14).toFixed(1) + "px," + (y * 0.22).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  })();

  /* 7. Active nav link highlighting. */
  (function navSpy() {
    var links = document.querySelectorAll("#navLinks a");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("active"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["work", "approach", "estimate", "faq", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  })();

  /* 8. Price estimator (PKR/USD, copy brief). */
  (function estimator() {
    var siteType = document.getElementById("siteType");
    var timeline = document.getElementById("timeline");
    var note = document.getElementById("projectNote");
    var total = document.getElementById("total");
    var copyButton = document.getElementById("copyBrief");
    var copyStatus = document.getElementById("copyStatus");
    if (!siteType) return;
    var buttons = document.querySelectorAll(".currency-option");
    var currency = "PKR";
    var fmt = { PKR: new Intl.NumberFormat("en-PK"), USD: new Intl.NumberFormat("en-US") };

    function amount(opt) { return Number(opt.dataset[currency.toLowerCase()]); }
    function pretty(n) { return (currency === "PKR" ? "₨" : "$") + fmt[currency].format(n); }
    function refreshLabels() {
      Array.prototype.forEach.call(siteType.options, function (o) {
        o.textContent = o.dataset.label + " — " + pretty(amount(o));
      });
      Array.prototype.forEach.call(timeline.options, function (o) {
        var a = amount(o);
        o.textContent = o.dataset.label + (a ? " — +" + pretty(a) : "");
      });
    }
    function price() {
      var n = amount(siteType.options[siteType.selectedIndex]) + amount(timeline.options[timeline.selectedIndex]);
      total.textContent = pretty(n);
      return n;
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        currency = b.dataset.currency;
        buttons.forEach(function (x) {
          var on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        refreshLabels(); price(); copyStatus.textContent = "";
      });
    });
    siteType.addEventListener("change", price);
    timeline.addEventListener("change", price);
    refreshLabels(); price();

    copyButton.addEventListener("click", function () {
      var brief = [
        "PROJECT BRIEF — RS WORKS",
        "Currency: " + currency,
        "Project: " + siteType.options[siteType.selectedIndex].text,
        "Pace: " + timeline.options[timeline.selectedIndex].text,
        "Goal: " + (note.value.trim() || "To discuss"),
        "Starting estimate: " + pretty(price())
      ].join("\n");
      function done(ok) {
        copyStatus.textContent = ok ? "Copied — email it to RS Works." : "Select and copy the details from your fields.";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(brief).then(function () { done(true); }, function () { fallback(brief, done); });
      } else { fallback(brief, done); }
    });
    function fallback(text, done) {
      var area = document.createElement("textarea");
      area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove(); done(ok);
    }
  })();
})();
