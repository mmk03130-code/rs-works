(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Dish data for the rotating showcase caption */
  var DISHES = [
    { name: "Chicken Karahi", price: "\u20A81,450", desc: "Wok-tossed in desi ghee with ginger & green chilies." },
    { name: "Seekh Kebab Platter", price: "\u20A81,250", desc: "Char-grilled skewers over onions and lemon." },
    { name: "Chicken Biryani", price: "\u20A8380", desc: "Saffron basmati layered over tender chicken." }
  ];

  /* 3D dish ring: slow auto-rotate, pause on hover, drag-to-spin with momentum. */
  (function ring() {
    var stage = document.getElementById("dishStage");
    var ringEl = document.getElementById("dishRing");
    if (!stage || !ringEl) return;
    var nameEl = document.getElementById("dishName");
    var priceEl = document.getElementById("dishPrice");
    var descEl = document.getElementById("dishDesc");

    function showFront(angle) {
      if (!nameEl) return;
      var a = ((-angle % 360) + 360) % 360;
      var idx = Math.round(a / 120) % 3;
      var d = DISHES[idx];
      if (nameEl.textContent !== d.name) {
        nameEl.textContent = d.name;
        priceEl.textContent = d.price;
        descEl.textContent = d.desc;
      }
    }

    if (reduceMotion) { showFront(0); return; }

    var angle = 0, velocity = 0, autoSpeed = 0.14, hovering = false, dragging = false, lastX = 0, raf = null;

    function frame() {
      if (dragging) { raf = null; return; }
      if (!hovering && Math.abs(velocity) < autoSpeed) {
        velocity += (autoSpeed - Math.abs(velocity)) * 0.02 * Math.sign(autoSpeed || 1);
      }
      if (!hovering) angle += autoSpeed * (1 - Math.min(1, Math.abs(velocity) / (autoSpeed * 6)));
      angle += velocity;
      velocity *= 0.94;
      ringEl.style.transform = "rotateY(" + angle + "deg)";
      showFront(angle);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !reduceMotion) raf = requestAnimationFrame(frame); }

    stage.addEventListener("pointerenter", function () { hovering = true; });
    stage.addEventListener("pointerleave", function () { hovering = false; });
    stage.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX;
      stage.setPointerCapture(e.pointerId);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      angle += dx * 0.45; velocity = dx * 0.45;
      ringEl.style.transform = "rotateY(" + angle + "deg)";
      showFront(angle);
    });
    function endDrag() { dragging = false; kick(); }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    kick();
  })();

  /* Scroll-triggered reveals. */
  (function reveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  })();
})();
