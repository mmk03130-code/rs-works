(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA_NUMBER = "920000000000";
  var DELIVERY_FEE = 200;
  var FREE_DELIVERY_OVER = 2000;

  function fmt(n) { return "\u20A8" + n.toLocaleString("en-US"); }
  function $(id) { return document.getElementById(id); }

  /* ---------- Dish data for the rotating showcase caption ---------- */
  var DISHES = [
    { name: "Chicken Karahi", price: "\u20A81,450", desc: "Wok-tossed in desi ghee with ginger & green chilies." },
    { name: "Seekh Kebab Platter", price: "\u20A81,250", desc: "Char-grilled skewers over onions and lemon." },
    { name: "Chicken Biryani", price: "\u20A8380", desc: "Saffron basmati layered over tender chicken." }
  ];

  /* ---------- 3D dish ring: slow auto-rotate, pause on hover, drag-to-spin ---------- */
  (function ring() {
    var stage = $("dishStage"), ringEl = $("dishRing");
    if (!stage || !ringEl) return;
    var nameEl = $("dishName"), priceEl = $("dishPrice"), descEl = $("dishDesc");
    function showFront(angle) {
      if (!nameEl) return;
      var a = ((-angle % 360) + 360) % 360;
      var d = DISHES[Math.round(a / 120) % 3];
      if (nameEl.textContent !== d.name) {
        nameEl.textContent = d.name; priceEl.textContent = d.price; descEl.textContent = d.desc;
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
      angle += velocity; velocity *= 0.94;
      ringEl.style.transform = "rotateY(" + angle + "deg)";
      showFront(angle);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !reduceMotion) raf = requestAnimationFrame(frame); }
    stage.addEventListener("pointerenter", function () { hovering = true; });
    stage.addEventListener("pointerleave", function () { hovering = false; });
    stage.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
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

  /* ---------- Menu tabs ---------- */
  (function tabs() {
    var tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;
    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));
    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("data-panel")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); activate(tabs[j], true); }
      });
    });
  })();

  /* ---------- Cart ---------- */
  var cart = {};           // id -> {name, price, qty, img, mono, alt}
  var orderType = "Pickup";
  var drawer = $("cartDrawer"), backdrop = $("cartBackdrop");
  var itemsEl = $("cartItems"), emptyEl = $("cartEmpty"), footEl = $("cartFoot");
  var lastOpener = null;

  function cartQty() {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += cart[id].qty; });
    return n;
  }
  function cartSubtotal() {
    var s = 0;
    Object.keys(cart).forEach(function (id) { s += cart[id].price * cart[id].qty; });
    return s;
  }
  function deliveryFee(sub) {
    if (orderType !== "Delivery") return 0;
    return sub >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  }

  function updateBadge() {
    var n = cartQty();
    ["cartCount", "cartCountMobile"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.textContent = n;
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    });
  }

  function renderCart() {
    var ids = Object.keys(cart);
    emptyEl.style.display = ids.length ? "none" : "block";
    footEl.hidden = !ids.length;
    itemsEl.innerHTML = "";
    ids.forEach(function (id) {
      var it = cart[id];
      var li = document.createElement("li");
      li.className = "ci";
      var plate = document.createElement("div");
      plate.className = "plate" + (it.mono ? " mono" : "");
      if (it.img) {
        var im = document.createElement("img");
        im.src = it.img; im.alt = ""; im.loading = "lazy"; im.width = 112; im.height = 112;
        plate.appendChild(im);
      } else {
        var sp = document.createElement("span");
        sp.textContent = it.mono; sp.setAttribute("aria-hidden", "true");
        plate.appendChild(sp);
      }
      var info = document.createElement("div");
      info.className = "ci-info";
      var h = document.createElement("h4"); h.textContent = it.name;
      var u = document.createElement("div"); u.className = "unit"; u.textContent = fmt(it.price) + " each";
      info.appendChild(h); info.appendChild(u);
      var q = document.createElement("div");
      q.className = "qty";
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", "Remove one " + it.name);
      minus.addEventListener("click", function () { changeQty(id, -1); });
      var qv = document.createElement("span"); qv.textContent = it.qty;
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", "Add one " + it.name);
      plus.addEventListener("click", function () { changeQty(id, 1); });
      q.appendChild(minus); q.appendChild(qv); q.appendChild(plus);
      var line = document.createElement("div");
      line.className = "ci-line"; line.textContent = fmt(it.price * it.qty);
      li.appendChild(plate); li.appendChild(info); li.appendChild(q); li.appendChild(line);
      itemsEl.appendChild(li);
    });
    var sub = cartSubtotal(), fee = deliveryFee(sub);
    $("tSub").textContent = fmt(sub);
    $("tDel").textContent = orderType === "Pickup" ? "—" : (fee === 0 ? "Free" : fmt(fee));
    $("tGrand").textContent = fmt(sub + fee);
    buildCheckoutLink();
    updateBadge();
  }

  function changeQty(id, d) {
    if (!cart[id]) return;
    cart[id].qty += d;
    if (cart[id].qty <= 0) delete cart[id];
    renderCart();
  }

  function addToCart(article, btn) {
    var id = article.getAttribute("data-id");
    var plate = article.querySelector(".plate");
    var img = plate.querySelector("img");
    if (!cart[id]) {
      cart[id] = {
        name: article.getAttribute("data-name"),
        price: parseInt(article.getAttribute("data-price"), 10),
        qty: 0,
        img: img ? img.getAttribute("src") : null,
        mono: img ? null : (plate.textContent || "?").trim().charAt(0)
      };
    }
    cart[id].qty += 1;
    renderCart();
    btn.classList.add("added");
    var orig = btn.textContent;
    btn.textContent = "✓ Added";
    setTimeout(function () { btn.classList.remove("added"); btn.textContent = orig; }, 900);
  }

  document.querySelectorAll(".mi .add-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addToCart(btn.closest(".mi"), btn);
    });
  });

  function buildCheckoutLink() {
    var ids = Object.keys(cart);
    var a = $("waCheckout");
    if (!ids.length) { a.setAttribute("href", "#"); return; }
    var sub = cartSubtotal(), fee = deliveryFee(sub);
    var lines = ["Hello Saffron House! I would like to place an order.", ""];
    ids.forEach(function (id) {
      var it = cart[id];
      lines.push("\u2022 " + it.qty + " \u00D7 " + it.name + " \u2014 " + fmt(it.price * it.qty));
    });
    lines.push("", "Subtotal: " + fmt(sub));
    lines.push("Delivery: " + (orderType === "Pickup" ? "Pickup (free)" : (fee === 0 ? "Free" : fmt(fee))));
    lines.push("Total: " + fmt(sub + fee), "");
    var name = $("custName").value.trim();
    lines.push("Name: " + (name || "—"));
    lines.push("Order type: " + orderType);
    a.setAttribute("href", "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")));
  }
  $("custName").addEventListener("input", buildCheckoutLink);

  document.querySelectorAll(".ot-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".ot-btn").forEach(function (x) {
        x.classList.remove("active"); x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("active"); b.setAttribute("aria-pressed", "true");
      orderType = b.getAttribute("data-type");
      renderCart();
    });
  });

  function openCart(opener) {
    lastOpener = opener || null;
    drawer.hidden = false; backdrop.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("open"); backdrop.classList.add("show");
    });
    document.body.style.overflow = "hidden";
    $("cartCloseBtn").focus();
  }
  function closeCart() {
    drawer.classList.remove("open"); backdrop.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(function () { drawer.hidden = true; backdrop.hidden = true; }, 340);
    if (lastOpener) lastOpener.focus();
  }
  ["cartOpenBtn", "cartOpenBtnMobile"].forEach(function (id) {
    var b = $(id);
    if (b) b.addEventListener("click", function () { openCart(b); });
  });
  $("cartCloseBtn").addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) closeCart();
  });

  /* ---------- Reservation form -> WhatsApp ---------- */
  (function reserve() {
    var form = $("reserveForm");
    if (!form) return;
    var err = $("reserveError");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("rName").value.trim(),
          phone = $("rPhone").value.trim(),
          date = $("rDate").value,
          time = $("rTime").value,
          guests = $("rGuests").value;
      if (!name || !phone || !date || !time || !guests) {
        err.hidden = false;
        return;
      }
      err.hidden = true;
      var lines = [
        "Hello Saffron House! I would like to reserve a table.", "",
        "Name: " + name, "Phone: " + phone, "Date: " + date,
        "Time: " + time, "Guests: " + guests
      ];
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    });
  })();

  /* ---------- Scroll reveals ---------- */
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
    }, { threshold: 0.1 });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  renderCart();
})();
